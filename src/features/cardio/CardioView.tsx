import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, Check, Clock3, Footprints, Info, Pause, Play, RotateCcw, Save, Trash2, TrendingUp, X } from "lucide-react";
import type { CardioKind, CardioSession, ScheduledCardio } from "../../domain/models";
import { BackHeader, Notice, PrimaryButton, SectionHead } from "../../components/ui";
import { blankCardioDraft, cardioNames, cardioTitle, cardioTotals, cardioWeek, formatDuration, paceLabel, parseCardioDraft, toDraft, type CardioDraft } from "./cardioDomain";

type StopwatchState={ elapsedMs:number; since?:number };
const TIMER_KEY="gym-cardio-stopwatch-v1";
const weekNames=["SEG","TER","QUA","QUI","SEX","SÁB","DOM"];
const formatLocal=(value:string)=>{const [year,month,day]=value.split("-");return `${day}/${month}/${year}`;};
function stopWatchRead():StopwatchState{
  try{
    const raw=localStorage.getItem(TIMER_KEY);
    if(raw){const val=JSON.parse(raw) as StopwatchState;
      if(Number.isFinite(val.elapsedMs)&&val.elapsedMs>=0&&val.elapsedMs<=604800000
        &&(val.since===undefined||(Number.isFinite(val.since)&&val.since<=Date.now()+60000)))
        return val;
    }
  }catch{/* Safari private storage can be unavailable */}
  return {elapsedMs:0};
}
function Timer({onUse}:{onUse:(seconds:number)=>void}){
 const [state,setState]=useState<StopwatchState>(stopWatchRead);
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{
   try{localStorage.setItem(TIMER_KEY,JSON.stringify(state));}catch{/* clock still works in memory */}
 },[state]);
 useEffect(()=>{
   const tick=()=>setNow(Date.now());
   const interval=window.setInterval(tick,1000);
   document.addEventListener("visibilitychange",tick);window.addEventListener("focus",tick);
   return()=>{window.clearInterval(interval);document.removeEventListener("visibilitychange",tick);window.removeEventListener("focus",tick);};
 },[]);
 const totalMs=Math.max(0,Math.min(604800000,state.elapsedMs+(state.since===undefined?0:Math.max(0,now-state.since))));
 const seconds=Math.floor(totalMs/1000);
 const time=String(Math.floor(seconds/3600)).padStart(2,"0")+":"+
  String(Math.floor((seconds%3600)/60)).padStart(2,"0")+":"+
  String(seconds%60).padStart(2,"0");
 const toggle=()=>{
   const current=Date.now();
   if(state.since!==undefined)setState({elapsedMs:Math.min(604800000,state.elapsedMs+Math.max(0,current-state.since))});
   else setState({elapsedMs:state.elapsedMs,since:current});
   setNow(current);
 };
 const useTime=()=>{
   if(seconds<=0)return;
   onUse(seconds);
   setState({elapsedMs:seconds*1000});
 };
 return <section className="cardio-stopwatch">
   <div className="cardio-clock-label"><Clock3 size={19}/><span>CRONÔMETRO AUXILIAR</span><small>Tempo real</small></div>
   <strong className="cardio-clock" aria-label={"Tempo decorrido "+time}>{time}</strong>
   <div className="cardio-clock-actions">
     <button type="button" className="cardio-clock-primary" onClick={toggle}>
       {state.since===undefined?<Play size={18}/>:<Pause size={18}/>}
       {state.since===undefined?"Iniciar / continuar":"Pausar"}
     </button>
     <button type="button" disabled={totalMs<=0} onClick={useTime}><Check size={17}/> Usar tempo</button>
     <button type="button" aria-label="Zerar cronômetro" onClick={()=>{if(totalMs>0&&!window.confirm("Zerar o cronômetro de cardio?"))return;setState({elapsedMs:0});}}><RotateCcw size={18}/></button>
   </div>
   <p>O relógio continua pela hora real ao voltar ao Safari. Ele não mede distância ou batimentos e não salva uma atividade sozinho.</p>
 </section>;
}
export function CardioHighlights({sessions,onOpen}:{sessions:CardioSession[];onOpen:()=>void}){
 const totals=cardioTotals(sessions);
 return <div className="cardio-highlights">
   <div className="cardio-highlights-top"><span><Footprints size={18}/> CARDIO REGISTRADO</span><button type="button" onClick={onOpen}>Ver histórico <ArrowRight size={16}/></button></div>
   <div className="cardio-highlights-metrics">
     <div><strong>{totals.count}</strong><small>ATIVIDADES</small></div>
     <div><strong>{totals.seconds?Math.round(totals.seconds/60):"0"}<em> min</em></strong><small>TEMPO TOTAL</small></div>
     <div><strong>{totals.distanceKnownCount?Number((totals.distanceMeters/1000).toFixed(2)).toLocaleString("pt-BR"):"—"}<em> km</em></strong><small>DISTÂNCIA INFORMADA</small></div>
   </div>
   {totals.count===0&&<p>Nenhum cardio registrado ainda. As metas da sua ficha não são contadas como atividades realizadas.</p>}
 </div>;
}
type Props={sessions:CardioSession[];suggestion?:ScheduledCardio;onBack:()=>void;
 onSave:(record:CardioSession)=>Promise<void>;onDelete:(id:string)=>Promise<void>};
export default function CardioView({sessions,suggestion,onBack,onSave,onDelete}:Props){
 const infer=(label?:string):CardioKind=>label?.toLowerCase().includes("caminhada")?"walk":"treadmill";
 const [draft,setDraft]=useState<CardioDraft>(()=>blankCardioDraft(new Date(),infer(suggestion?.label),suggestion?.minutes??undefined));
 const [editing,setEditing]=useState<CardioSession|undefined>();
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const [showAll,setShowAll]=useState(false);
 const sorted=useMemo(()=>[...sessions].sort((a,b)=>b.localDate.localeCompare(a.localDate)||((b.startedAt??"").localeCompare(a.startedAt??""))),[sessions]);
 const totals=useMemo(()=>cardioTotals(sessions),[sessions]);
 const monday=useMemo(()=>{const now=new Date();return new Date(now.getFullYear(),now.getMonth(),now.getDate()-(now.getDay()+6)%7);},[]);
 const week=useMemo(()=>cardioWeek(sessions,monday),[sessions,monday]);
 const maxWeek=Math.max(60,...week.map(x=>x.durationSeconds));
 const update=(patch:Partial<CardioDraft>)=>{setDraft(prev=>({...prev,...patch}));setError("");setSuccess("");};
 const reset=()=>{setDraft(blankCardioDraft(new Date(),infer(suggestion?.label),suggestion?.minutes??undefined));setEditing(undefined);setError("");setSuccess("");};
 const edit=(session:CardioSession)=>{
   if(session.source!=="manual")return;
   setEditing(session);setDraft(toDraft(session));setError("");setSuccess("");
   window.scrollTo({top:0,behavior:"smooth"});
 };
 const save=async()=>{
   setBusy(true);setError("");setSuccess("");
   try{
     const record=parseCardioDraft(draft,editing);
     await onSave(record);
     setEditing(undefined);setDraft(blankCardioDraft(new Date(),infer(suggestion?.label),suggestion?.minutes??undefined));
     setSuccess("Cardio salvo no seu histórico local.");
   }catch(err){setError(err instanceof Error?err.message:"Falha ao registrar atividade.");}
   finally{setBusy(false);}
 };
 const remove=async(session:CardioSession)=>{
   if(session.source!=="manual")return;
   if(!window.confirm("Excluir este registro de "+cardioTitle(session)+"? Esta ação não poderá ser desfeita sem um backup."))return;
   setBusy(true);setError("");setSuccess("");
   try{await onDelete(session.id);if(editing?.id===session.id)reset();setSuccess("Atividade excluída.");}
   catch(err){setError(err instanceof Error?err.message:"Falha ao excluir.");}
   finally{setBusy(false);}
 };
 return <div className="cardio-real-page">
   <BackHeader label="CORRIDA E CARDIO · REGISTRO REAL" onBack={onBack}/>
   <div className="cardio-real-heading">
     <span className="eyebrow">CADA MINUTO CONTA</span>
     <h1>Seu ritmo<span>.</span></h1>
     <p>Registre o que você realmente fez na esteira, na rua ou na caminhada.</p>
   </div>
   <CardioHighlights sessions={sessions} onOpen={()=>{document.getElementById("cardio-history")?.scrollIntoView({behavior:"smooth"});}}/>
   {suggestion&&<div className="cardio-suggestion">
     <Info size={19}/><span><strong>Programação sugerida</strong>
     {suggestion.label}{suggestion.minutes?" · "+suggestion.minutes+" min":""}{suggestion.optional?" · opcional":""}
     {suggestion.note?" — "+suggestion.note:""}.
     <small>A sugestão não é uma atividade realizada. Preencha e salve somente depois do treino.</small></span>
   </div>}
   <Timer onUse={seconds=>update({hours:String(Math.floor(seconds/3600)),minutes:String(Math.floor(seconds%3600/60)),seconds:String(seconds%60)})}/>
   <section className="cardio-form" aria-label="Registrar atividade">
     <div className="cardio-form-heading"><h2>{editing?"Editar atividade":"Registrar atividade"}</h2>
       {editing&&<button type="button" onClick={reset}><X size={17}/> Cancelar edição</button>}
     </div>
     <div className="cardio-kind-options" role="group" aria-label="Tipo de cardio">
       {(["treadmill","outdoor_run","walk","other"] as const).map(kind=><button type="button" aria-pressed={draft.kind===kind}
         key={kind} className={draft.kind===kind?"active":""} onClick={()=>update({kind})}>
         {kind==="treadmill"?<Activity size={18}/>:<Footprints size={18}/>}<span>{cardioNames[kind]}</span>
       </button>)}
     </div>
     {draft.kind==="other"&&<label className="cardio-field">Qual atividade?<input type="text" maxLength={100} placeholder="Bicicleta, elíptico..." value={draft.activityName} onChange={e=>update({activityName:e.target.value})}/></label>}
     <label className="cardio-field">Data do cardio<input type="date" required value={draft.date} onChange={e=>update({date:e.target.value})}/></label>
     <div className="cardio-field-section"><span>DURAÇÃO REALIZADA</span><div className="cardio-duration-fields">
       <label>Horas<input inputMode="numeric" type="number" min="0" max="167" value={draft.hours} onChange={e=>update({hours:e.target.value})}/></label>
       <label>Min<input inputMode="numeric" type="number" min="0" max="59" value={draft.minutes} onChange={e=>update({minutes:e.target.value})}/></label>
       <label>Seg<input inputMode="numeric" type="number" min="0" max="59" value={draft.seconds} onChange={e=>update({seconds:e.target.value})}/></label>
     </div></div>
     <div className="cardio-input-pair">
       <label className="cardio-field">Distância (km) <small>opcional</small><input inputMode="decimal" type="text" placeholder="Ex.: 3,2" value={draft.distanceKm} onChange={e=>update({distanceKm:e.target.value})}/></label>
       <label className="cardio-field">Batimentos médios <small>opcional</small><input type="number" inputMode="numeric" min="20" max="250" placeholder="BPM" value={draft.heartRate} onChange={e=>update({heartRate:e.target.value})}/></label>
     </div>
     {draft.kind==="treadmill"&&<label className="cardio-field">Inclinação da esteira (%) <small>opcional</small>
       <input type="text" inputMode="decimal" placeholder="Ex.: 1,5" value={draft.inclinePercent} onChange={e=>update({inclinePercent:e.target.value})}/>
     </label>}
     <div className="cardio-pace-readout"><div><span>RITMO MÉDIO CALCULADO</span>
       <strong>{(()=>{try{const record=parseCardioDraft(draft,editing);return paceLabel(record.durationSeconds,record.distanceMeters);}catch{return "—";}})()}</strong>
       <small>Disponível somente com duração e distância</small></div><TrendingUp size={27}/></div>
     <label className="cardio-field">Observações <small>opcional</small>
       <textarea rows={3} maxLength={3000} placeholder="Como foi o treino? Ritmo, cansaço, recuperação..." value={draft.notes} onChange={e=>update({notes:e.target.value})}/>
     </label>
     {error&&<div role="alert" className="editor-error"><Info size={17}/>{error}</div>}
     {success&&<div role="status" className="editor-saved"><Check size={17}/>{success}</div>}
     <PrimaryButton disabled={busy} onClick={()=>{void save();}}>{busy?"Salvando...":editing?"Atualizar atividade":"Salvar cardio real"} <Save size={19}/></PrimaryButton>
     <p className="cardio-storage-note">Dados gravados neste iPhone. GPS, distância e frequência cardíaca não são medidos pelo GYM nesta versão.</p>
   </section>
   <section className="cardio-week-panel">
     <SectionHead title="Sua semana" aside="Minutos registrados"/>
     <div className="cardio-week-bars">{week.map((entry,i)=><div key={entry.date}>
       <strong>{Math.round(entry.durationSeconds/60)}<small> min</small></strong>
       <div className="cardio-week-track"><span style={{height:entry.durationSeconds?Math.max(8,entry.durationSeconds/maxWeek*100)+"%":"0%"}}/></div>
       <em>{weekNames[i]}</em>
     </div>)}</div>
   </section>
   <section id="cardio-history" className="cardio-history">
     <SectionHead title="Histórico real" aside={totals.count+" atividades"}/>
     {sorted.length===0?<div className="cardio-empty"><Footprints size={28}/><strong>Ainda não há atividades salvas</strong>
       <p>Depois de salvar seu primeiro cardio, ele aparecerá aqui. Nenhum dado ilustrativo será misturado ao histórico.</p></div>:
     <div className="cardio-history-list">{(showAll?sorted:sorted.slice(0,8)).map(session=><article className="cardio-history-card" key={session.id}>
       <div className="cardio-history-header"><span className="cardio-history-icon"><Footprints size={19}/></span>
         <div><strong>{cardioTitle(session)}</strong><small>{formatLocal(session.localDate)} · {session.source==="manual"?"Registro manual":"Importado"}</small></div>
       </div>
       <div className="cardio-history-stats">
         <span><strong>{formatDuration(session.durationSeconds)}</strong><small>DURAÇÃO</small></span>
         <span><strong>{session.distanceMeters===undefined?"—":(session.distanceMeters/1000).toLocaleString("pt-BR",{maximumFractionDigits:2})+" km"}</strong><small>DISTÂNCIA</small></span>
         <span><strong>{paceLabel(session.durationSeconds,session.distanceMeters)}</strong><small>RITMO</small></span>
       </div>
       {(session.inclinePercent!==undefined||session.averageHeartRateBpm!==undefined)&&<p className="cardio-history-secondary">{session.inclinePercent===undefined?"":"Inclinação "+session.inclinePercent+"%"}{session.inclinePercent!==undefined&&session.averageHeartRateBpm!==undefined?" · ":""}{session.averageHeartRateBpm===undefined?"":"FC média "+session.averageHeartRateBpm+" bpm"}</p>}
       {session.notes&&<p className="cardio-history-note">{session.notes}</p>}
       {session.source==="manual"&&<div className="cardio-history-actions"><button type="button" disabled={busy} onClick={()=>edit(session)}>Editar</button>
         <button type="button" disabled={busy} onClick={()=>{void remove(session);}}><Trash2 size={14}/> Excluir</button></div>}
     </article>)}</div>}
     {sorted.length>8&&<button className="cardio-show-more" type="button" onClick={()=>setShowAll(x=>!x)}>{showAll?"Mostrar menos":"Mostrar todas as "+sorted.length+" atividades"}</button>}
   </section>
   <Notice>Atividades inseridas manualmente são registros informados por você, não medições automáticas. O histórico e os backups permanecem no navegador até você exportá-los.</Notice>
 </div>;
}
