import { useEffect,useMemo,useState } from "react";
import { ArrowDownToLine,ArrowRight,CheckCircle2,Dumbbell,Footprints,Image as ImageIcon,Share2,ShieldCheck } from "lucide-react";
import type { CardioSession,UserSettings,WorkoutSession } from "../../domain/models";
import { BackHeader,Notice,PrimaryButton } from "../../components/ui";
import { cardBlob,cardFileName,drawShareCard } from "./shareCanvas";
import { DEFAULT_SHARE_PRIVACY,eligibleShares,buildShareData,type ShareFormat,type ShareKind,type ShareStyle,type ShareExport,type SharePrivacy } from "./shareDomain";

type Props={workouts:WorkoutSession[];cardio:CardioSession[];settings:UserSettings;
 onBack:()=>void;onStartStrength:()=>void;onStartCardio:()=>void;preferredKind?:ShareKind};
export default function ShareView({workouts,cardio,settings,onBack,onStartStrength,onStartCardio,preferredKind}:Props){
 const [kind,setKind]=useState<ShareKind>(preferredKind??"strength");
 const [selectedId,setSelectedId]=useState("");
 const [format,setFormat]=useState<ShareFormat>("story");
 const [style,setStyle]=useState<ShareStyle>("ember");
 const [exportType,setExportType]=useState<ShareExport>("png");
 const [privacy,setPrivacy]=useState<SharePrivacy>(DEFAULT_SHARE_PRIVACY);
 const [preview,setPreview]=useState("");
 const [previewError,setPreviewError]=useState("");
 const [status,setStatus]=useState("");
 const [busy,setBusy]=useState(false);
 const all=useMemo(()=>eligibleShares(workouts,cardio),[workouts,cardio]);
 const available=useMemo(()=>all.filter(s=>s.kind===kind),[all,kind]);
 const selected=available.find(s=>s.id===selectedId)??available[0];
 const data=useMemo(()=>{
  if(!selected)return undefined;
  return buildShareData(selected,workouts,cardio,privacy,settings.units,settings.displayName);
 },[selected,workouts,cardio,privacy,settings.units,settings.displayName]);
 useEffect(()=>{
  setPreview("");setPreviewError("");
  if(!data)return;
  let alive=true,objectUrl="";
  try{
   const canvas=drawShareCard(data,format,style,.5);
   canvas.toBlob(blob=>{
    if(!alive)return;
    if(!blob){setPreviewError("Não foi possível renderizar o card.");return;}
    objectUrl=URL.createObjectURL(blob);setPreview(objectUrl);
   },"image/png");
  }catch(err){setPreviewError(err instanceof Error?err.message:"Erro ao preparar prévia.");}
  return()=>{alive=false;if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[data,format,style]);
 const updatePrivacy=(name:keyof SharePrivacy,value:boolean)=>setPrivacy(p=>({...p,[name]:value}));
 const generate=async(action:"save"|"share")=>{
  if(!data||busy)return;
  setBusy(true);setStatus("");
  try{
   const canvas=drawShareCard(data,format,style);
   const blob=await cardBlob(canvas,exportType);
   const fileName=cardFileName(data,format,exportType==="png"?"png":"jpg");
   const file=new File([blob],fileName,{type:blob.type});
   if(action==="share"&&navigator.share&&navigator.canShare?.({files:[file]})){
    try{
     await navigator.share({files:[file],title:"Meu treino no GYM"});
     setStatus("Compartilhamento concluído pelo sistema.");
    }catch(error){
     if(error instanceof DOMException&&error.name==="AbortError")setStatus("Compartilhamento cancelado.");
     else throw error;
    }
   }else{
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement("a");
    anchor.href=url;anchor.download=fileName;document.body.appendChild(anchor);anchor.click();anchor.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),15000);
    setStatus(action==="share"?"Compartilhamento direto indisponível; imagem preparada para salvar.":"Imagem preparada para salvar.");
   }
  }catch(err){setStatus(err instanceof Error?err.message:"Não foi possível criar a imagem.");}
  finally{setBusy(false);}
 };
 const noStrength=all.every(x=>x.kind!=="strength");
 const noCardio=all.every(x=>x.kind!=="cardio");
 return <div className="gym-real-share-page">
  <BackHeader label="ESTÚDIO DE CARDS · DADOS REAIS" onBack={onBack}/>
  <div className="gym-share-heading"><span className="eyebrow">SEUS RESULTADOS. SUA HISTÓRIA.</span>
    <h1>Compartilhe seu<br/><em>movimento.</em></h1>
    <p>Crie cards a partir de atividades realmente registradas. A imagem só é criada no seu iPhone, quando você solicitar.</p>
  </div>
  <div className="gym-share-kinds" aria-label="Tipo de atividade">
   <button type="button" className={kind==="strength"?"active":""} aria-pressed={kind==="strength"} onClick={()=>{setKind("strength");setStatus("");}}><Dumbbell size={19}/> Musculação</button>
   <button type="button" className={kind==="cardio"?"active":""} aria-pressed={kind==="cardio"} onClick={()=>{setKind("cardio");setStatus("");}}><Footprints size={19}/> Cardio</button>
  </div>
  {!selected?<div className="gym-share-empty"><ImageIcon size={30}/>
   <strong>{kind==="strength"?"Nenhum treino concluído":"Nenhuma atividade de cardio registrada"}</strong>
   <p>O estúdio não usa valores fictícios. {kind==="strength"?"Finalize uma sessão de musculação para criar seu primeiro card.":"Registre uma corrida ou caminhada para criar seu primeiro card."}</p>
   <button type="button" onClick={kind==="strength"?onStartStrength:onStartCardio}> {kind==="strength"?"Abrir treinos":"Registrar cardio"} <ArrowRight size={16}/></button>
   {(kind==="strength"?!noCardio:!noStrength)&&<button type="button" className="gym-share-other" onClick={()=>setKind(kind==="strength"?"cardio":"strength")}>Ver cards de {kind==="strength"?"cardio":"musculação"}</button>}
  </div>:<>
   <label className="gym-share-label">Escolha a atividade
    <select value={selected.id} onChange={e=>{setSelectedId(e.target.value);setStatus("");}}>
     {available.map(item=><option value={item.id} key={item.kind+":"+item.id}>{item.date.split("-").reverse().join("/")} · {item.title}</option>)}
    </select>
   </label>
   <div className="gym-share-preview-shell">
    <div className="gym-share-preview-info"><span>PRÉVIA DO CARD</span><span>{format==="story"?"9:16":format==="feed"?"4:5":"1:1"}</span></div>
    {preview?<img className={"gym-share-preview "+format} src={preview} alt={"Prévia real do card de "+data?.title}/>:
      <div className="gym-share-loading"><ImageIcon size={25}/>{previewError||"Preparando prévia..."}</div>}
   </div>
   <section className="gym-share-controls">
    <span className="eyebrow">PERSONALIZE SUA IMAGEM</span>
    <div className="gym-share-control-group"><strong>Formato</strong>
     <div className="gym-share-choice">
      {([["story","Story · 9:16"],["feed","Feed · 4:5"],["square","Quadrado"]] as const).map(([value,label])=><button key={value} type="button" aria-pressed={format===value} className={format===value?"active":""} onClick={()=>setFormat(value)}>{label}</button>)}
     </div>
    </div>
    <div className="gym-share-control-group"><strong>Identidade visual</strong>
     <div className="gym-share-choice">{([["ember","Grafite / laranja"],["minimal","Minimalista"]] as const).map(([value,label])=><button type="button" key={value} className={style===value?"active":""} aria-pressed={style===value} onClick={()=>setStyle(value)}>{label}</button>)}</div>
    </div>
    <div className="gym-share-control-group"><strong>Qualidade do arquivo</strong>
     <div className="gym-share-choice">{([["png","PNG"],["jpeg","JPG"]] as const).map(([value,label])=><button key={value} type="button" className={exportType===value?"active":""} aria-pressed={exportType===value} onClick={()=>setExportType(value)}>{label}</button>)}</div>
    </div>
    <div className="gym-share-privacy"><strong><ShieldCheck size={19}/> Controle de privacidade</strong>
     <p>Campos pessoais ficam ocultos por padrão. Eles só entram no arquivo se você ativá-los.</p>
     {settings.displayName?.trim()&&<label><input type="checkbox" checked={privacy.showName} onChange={e=>updatePrivacy("showName",e.target.checked)}/> Mostrar nome do perfil</label>}
     {kind==="cardio"&&<><label><input type="checkbox" checked={privacy.showHeartRate} onChange={e=>updatePrivacy("showHeartRate",e.target.checked)}/> Mostrar frequência cardíaca, se registrada</label>
      <label><input type="checkbox" checked={privacy.showNotes} onChange={e=>updatePrivacy("showNotes",e.target.checked)}/> Mostrar observações</label></>}
     {kind==="strength"&&<label><input type="checkbox" checked={privacy.showExerciseList} onChange={e=>updatePrivacy("showExerciseList",e.target.checked)}/> Mostrar nomes dos exercícios executados</label>}
    </div>
   </section>
   <div className="gym-share-actions">
    <PrimaryButton disabled={busy} onClick={()=>{void generate("save");}}>{busy?"Preparando imagem...":"Salvar imagem"} <ArrowDownToLine size={18}/></PrimaryButton>
    <button type="button" disabled={busy} className="gym-share-system" onClick={()=>{void generate("share");}}><Share2 size={19}/> Compartilhar pelo iPhone</button>
   </div>
   {status&&<p className="gym-share-status" role="status"><CheckCircle2 size={16}/>{status}</p>}
   <Notice>O card é gerado somente com registros salvos no GYM. Nenhum dado é publicado automaticamente. Se o Safari não oferecer compartilhamento direto, a imagem será preparada para download.</Notice>
  </>}
 </div>;
}
