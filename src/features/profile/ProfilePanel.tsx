import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, CheckCircle2, FileUp, Info, RotateCcw, ShieldCheck, UserRound } from "lucide-react";
import { MAX_BACKUP_BYTES, validateGymBackup } from "../../data/validation";
import { createBackup, getDataCounts, restoreBackup } from "../../data/storage";
import type { UserSettings } from "../../domain/models";
import { Notice, SectionHead, Titlebar } from "../../components/ui";

export type StorageState = "loading" | "ready" | "saving" | "saved" | "error";

interface Props {
  settings: UserSettings;
  onChange: (settings: UserSettings) => void;
  storageState: StorageState;
  storageError: string;
  onRestored: (settings: UserSettings) => void;
  flushSettings: () => Promise<void>;
  onResetDemo: () => void;
}
function errorMessage(err:unknown):string {
  return err instanceof Error ? err.message : "Erro inesperado. Tente novamente.";
}

export default function ProfilePanel({
  settings,onChange,storageState,storageError,onRestored,flushSettings,onResetDemo
}:Props) {
  const inputRef=useRef<HTMLInputElement>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [counts,setCounts]=useState<{plans:number;strength:number;cardio:number;exercises:number}|null>(null);

  useEffect(()=>{ if(storageState==="loading" || storageState==="error") return; let alive=true; getDataCounts().then(value=>{if(alive)setCounts(value);}).catch(()=>{});return ()=>{alive=false;};},[storageState==="loading",storageState==="error"]);
  const available=storageState!=="loading" && storageState!=="error" && !busy;
  const update=(patch:Partial<UserSettings>)=>onChange({...settings,...patch});
  const refreshCounts=async()=>setCounts(await getDataCounts());

  const download=async()=>{
    setBusy(true);setMessage("");
    try{
      await flushSettings();
      const backup=await createBackup();
      const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json;charset=utf-8"});
      const url=URL.createObjectURL(blob);
      const filename="gym-backup-"+new Date().toISOString().slice(0,10)+".json";
      const a=document.createElement("a");
      a.href=url;a.download=filename;
      document.body.appendChild(a);a.click();a.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),30000);
      await refreshCounts();
      setMessage("Backup preparado. No iPhone, salve o arquivo em Arquivos e mantenha uma cópia segura.");
    }catch(err){setMessage("Não foi possível gerar backup: "+errorMessage(err));}
    finally{setBusy(false);}
  };
  const upload=async(file:File|undefined)=>{
    if(!file)return;
    setBusy(true);setMessage("");
    try{
      if(file.size===0 || file.size>MAX_BACKUP_BYTES) throw new Error("Arquivo vazio ou acima do limite de 10 MB.");
      if(!file.name.toLowerCase().endsWith(".json")) throw new Error("Escolha um backup .json do GYM.");
      const json=validateGymBackup(JSON.parse(await file.text()) as unknown);
      if(!window.confirm("Restaurar este backup? Todos os dados locais atuais do GYM serão SUBSTITUÍDOS pelo arquivo escolhido. Cancele se não tiver uma cópia de segurança.")){
        setMessage("Restauração cancelada; seus dados foram mantidos.");return;
      }
      await flushSettings();
      const restored=await restoreBackup(json);
      onRestored(restored);
      await refreshCounts();
      setMessage("Backup restaurado. Preferências e registros válidos foram recuperados.");
    }catch(err){setMessage("Restauração não realizada: "+errorMessage(err));}
    finally{setBusy(false);}
  };
  return <>
    <Titlebar eyebrow="CONFIGURAÇÕES" title="Seu espaço." right={<span className="profile-mark"><UserRound size={25}/></span>}/>
    <p className="screen-lead">Seu perfil, suas preferências e seus dados protegidos.</p>
    <div className="profile-identity"><span className="profile-logo">G<span>.</span></span><div><strong>{settings.displayName?.trim() || "GYM / MEU ESPAÇO"}</strong><small>Armazenamento neste dispositivo · Sprint 02</small></div><span className="profile-version">v0.2</span></div>

    <div className={"storage-banner "+(storageState==="error"?"has-error":"")} role="status">
      {storageState==="error"?<Info size={20}/>:<ShieldCheck size={20}/>}
      <div>
        <strong>{storageState==="loading"?"Preparando armazenamento":storageState==="saving"?"Salvando mudanças":storageState==="error"?"Não foi possível acessar os dados":"Dados locais disponíveis"}</strong>
        <span>{storageState==="error"?storageError:storageState==="loading"?"Aguarde a verificação do navegador.":storageState==="saving"?"Gravando suas preferências no dispositivo.":"Preferências salvas automaticamente neste navegador."}</span>
      </div>
    </div>

    <SectionHead title="Sobre você"/>
    <div className="profile-inputs">
      <label htmlFor="gym-profile-name">Nome de exibição</label>
      <input id="gym-profile-name" value={settings.displayName??""} maxLength={100} disabled={!available}
        onChange={e=>update({displayName:e.target.value})} placeholder="Como prefere ser chamado?"/>
      <label htmlFor="gym-profile-goal">Seu objetivo principal</label>
      <textarea id="gym-profile-goal" value={settings.personalGoal??""} maxLength={300} rows={3} disabled={!available}
        onChange={e=>update({personalGoal:e.target.value})} placeholder="Ex.: acompanhar minhas cargas e manter constância nos treinos."/>
      <span className="helper-text">Esses dados são seus e não são publicados. O salvamento é automático.</span>
    </div>

    <SectionHead title="Acessibilidade"/>
    <div className="setting-list">
      <label className="setting-row"><span><strong>Textos maiores</strong><small>Melhora a leitura durante o treino</small></span><input disabled={!available} type="checkbox" role="switch" checked={settings.largeText??false} onChange={e=>update({largeText:e.target.checked})}/></label>
      <label className="setting-row"><span><strong>Reduzir animações</strong><small>Movimentos mais discretos</small></span><input disabled={!available} type="checkbox" role="switch" checked={settings.reducedMotion??false} onChange={e=>update({reducedMotion:e.target.checked})}/></label>
    </div>

    <SectionHead title="Preferências de treino"/>
    <div className="profile-inputs">
      <label htmlFor="gym-rest">Descanso padrão</label>
      <select id="gym-rest" value={settings.defaultRestSeconds} disabled={!available} onChange={e=>update({defaultRestSeconds:Number(e.target.value)})}>
        {[30,45,60,75,90,120,150,180,240,300].map(seconds=><option value={seconds} key={seconds}>{seconds} segundos</option>)}
      </select>
      <label htmlFor="gym-units">Unidade de carga</label>
      <select id="gym-units" value={settings.units} disabled={!available} onChange={e=>update({units:e.target.value as "metric"|"imperial"})}>
        <option value="metric">Quilogramas (kg)</option><option value="imperial">Libras (lb)</option>
      </select>
      <span className="helper-text">O registro de treino utilizará estas preferências nas próximas sprints.</span>
    </div>

    <SectionHead title="Backup e restauração"/>
    <div className="backup-panel">
      <div className="backup-description">
        <ShieldCheck size={22}/>
        <div><strong>Seus dados ficam neste iPhone</strong><p>O navegador pode remover dados locais. Baixe um backup e guarde em Arquivos ou outra pasta segura.</p></div>
      </div>
      <div className="backup-counts"><span>{counts?counts.plans:"—"} fichas</span><span>{counts?counts.strength:"—"} treinos</span><span>{counts?counts.cardio:"—"} corridas</span></div>
      <button className="action-button" type="button" onClick={download} disabled={!available}><ArrowDownToLine size={18}/> {busy?"Aguarde...":"Exportar backup JSON"}</button>
      <button className="action-button secondary" type="button" disabled={!available} onClick={()=>inputRef.current?.click()}><FileUp size={18}/> Restaurar backup</button>
      <input ref={inputRef} className="visually-hidden" aria-label="Selecionar backup JSON" type="file" accept=".json,application/json"
        onChange={e=>{const file=e.target.files?.[0];e.target.value="";void upload(file);}}/>
      <button type="button" className="text-action" disabled={!available} onClick={()=>{void refreshCounts().then(()=>setMessage("Contagens atualizadas.")).catch(e=>setMessage(errorMessage(e)));}}>Atualizar contagens</button>
      {message && <p className="storage-feedback" role="status">{message}</p>}
    </div>

    <SectionHead title="Outras opções"/>
    <div className="setting-list">
      <div className="setting-row non-interactive"><span><strong>Apple Saúde</strong><small>Importação manual prevista na Sprint 10</small></span><span className="setting-soon">PLANEJADO</span></div>
      <button type="button" className="setting-row" onClick={onResetDemo}><span><strong>Reiniciar a demonstração</strong><small>Limpa apenas séries fictícias desta sessão, não seu perfil</small></span><RotateCcw size={19}/></button>
    </div>
    <Notice>Os pesos e gráficos da prévia ainda são exemplos. Apenas as informações do Perfil são persistidas nesta Sprint 02.</Notice>
    <div className="credits"><p><CheckCircle2 size={17}/> Nenhum backup é enviado automaticamente a um servidor.</p><a href="https://github.com/pscfredteixeira/gym/blob/main/docs/IMAGE_SOURCES.md" target="_blank" rel="noopener noreferrer">Créditos das imagens</a></div>
  </>;
}
