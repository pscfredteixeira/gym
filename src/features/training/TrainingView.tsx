import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, CirclePlay, Clock3, Dumbbell, Info, Save, Trash2, TrendingUp, X } from "lucide-react";
import type { WorkoutSession, CompletedSet, UserSettings } from "../../domain/models";
import { countCompleted, countPlanned, getPreviousPerformance, workoutDuration, type RecordTarget, type SetInput } from "./sessionDomain";
import { BackHeader, Notice, PrimaryButton, SectionHead } from "../../components/ui";

const fmtDate=(v:string)=>new Date(v).toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"});
const fmtDuration=(seconds:number)=>seconds>=3600?Math.floor(seconds/3600)+"h "+Math.floor((seconds%3600)/60)+"min":Math.floor(seconds/60)+" min";
const weightDisplay=(kg:number,units:UserSettings["units"])=>Math.round(kg*(units==="imperial"?2.2046226218:1)*10)/10;
const weightToKg=(value:number,units:UserSettings["units"])=>value/(units==="imperial"?2.2046226218:1);
const asNumber=(s:string,min:number,max:number)=>{const x=Number(s);return s.trim()!==""&&Number.isFinite(x)&&x>=min&&x<=max?x:null;};
const lastFor=(history:WorkoutSession[],exerciseId:string)=>getPreviousPerformance(history,exerciseId);

export function ActiveWorkoutBanner({session,onResume}: {session?:WorkoutSession;onResume:()=>void}){
  if(!session)return null;
  return <button className="active-training-banner" type="button" onClick={onResume}>
    <span className="active-training-icon"><CirclePlay size={25}/></span>
    <span><small>TREINO EM ANDAMENTO</small><strong>{session.planNameSnapshot??"Treino livre"}</strong>
      <em>{countCompleted(session)} de {countPlanned(session)} séries registradas · continuar</em></span>
    <ArrowRight size={21}/>
  </button>;
}

type Draft = { weight:string; reps:string; rir:string };
export function LiveWorkout({
  session,history,units,onBack,onRecord,onRemove,onFinish,onAbandon
}:{
  session:WorkoutSession;history:WorkoutSession[];units:UserSettings["units"];
  onBack:()=>void;
  onRecord:(target:RecordTarget,data:SetInput)=>Promise<void>;
  onRemove:(target:RecordTarget)=>Promise<void>;
  onFinish:()=>Promise<void>;
  onAbandon:()=>Promise<void>;
}){
  const [exerciseIndex,setExerciseIndex]=useState(0);
  const [drafts,setDrafts]=useState<Record<string,Draft>>({});
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [tick,setTick]=useState(Date.now());
  useEffect(()=>{const timer=window.setInterval(()=>setTick(Date.now()),30000);return()=>window.clearInterval(timer);},[]);
  const ex=session.exercises[exerciseIndex];
  const completed=countCompleted(session),planned=countPlanned(session);
  const bySet=new Map(ex?.sets.map(s=>[s.plannedSetId,s])??[]);
  const last=lastFor(history,ex?.exerciseId??"");
  const duration=fmtDuration(workoutDuration(session,new Date(tick)));
  const progress=planned?Math.round(completed/planned*100):0;
  const getDraft=(setId:string,saved?:CompletedSet):Draft=>
    drafts[setId]??{weight:saved?String(weightDisplay(saved.weightKg,units)):"",reps:saved?String(saved.reps):"",rir:saved?.rir===undefined?"":String(saved.rir)};
  const change=(setId:string,field:keyof Draft,value:string,saved?:CompletedSet)=>{
    const old=getDraft(setId,saved);
    setDrafts(prev=>({...prev,[setId]:{...old,[field]:value}}));
    setMessage("");
  };
  const transact=async(fn:()=>Promise<void>,success:string)=>{
    setBusy(true);setError("");setMessage("");
    try{await fn();setMessage(success);}catch(e){setError(e instanceof Error?e.message:"Erro ao salvar a série.");}
    finally{setBusy(false);}
  };
  const record=async(setId:string,saved?:CompletedSet)=>{
    const d=getDraft(setId,saved);
    const displayWeight=asNumber(d.weight,0,units==="metric"?1000:2204.6226218);
    const reps=asNumber(d.reps,0,1000);
    const rir=d.rir.trim()===""?undefined:asNumber(d.rir,0,10);
    if(displayWeight===null||reps===null||!Number.isInteger(reps)||rir===null||(rir!==undefined&&!Number.isInteger(rir))){
      setError("Preencha carga e repetições corretamente. O RIR é opcional (0 a 10).");return;
    }
    const target={sessionExerciseId:ex.id,plannedSetId:setId};
    await transact(()=>onRecord(target,{weightKg:weightToKg(displayWeight,units),reps,...(rir===undefined?{}:{rir})}),"Série salva neste dispositivo.");
  };
  const remove=async(setId:string)=>{
    if(!window.confirm("Desfazer o registro desta série? Você poderá registrá-la novamente."))return;
    const target={sessionExerciseId:ex.id,plannedSetId:setId};
    await transact(async()=>{await onRemove(target);setDrafts(old=>{const next={...old};delete next[setId];return next;});},"Registro da série removido.");
  };
  const finish=async()=>{
    if(!completed){setError("Registre pelo menos uma série para concluir o treino.");return;}
    if(!window.confirm(completed<planned?
      "Finalizar com "+completed+" de "+planned+" séries registradas? As séries restantes ficarão sem resultado.":
      "Finalizar e salvar o treino?"))return;
    await transact(onFinish,"Treino concluído.");
  };
  const abandon=async()=>{
    if(!window.confirm("Encerrar sem concluir? A sessão será mantida no histórico como interrompida, incluindo as séries já registradas."))return;
    await transact(onAbandon,"Treino encerrado como interrompido.");
  };
  if(!ex)return <div className="empty-state"><Info/><p>Esta sessão não possui exercícios.</p><button type="button" onClick={onBack}>Voltar</button></div>;
  return <div className="live-workout">
    <BackHeader label="REGISTRO DE TREINO · REAL" onBack={onBack}/>
    <div className="live-heading">
      <span className="eyebrow">TREINO EM ANDAMENTO</span>
      <h1>{session.planNameSnapshot??"Musculação"}<span className="orange">.</span></h1>
      <div className="live-summary"><span><Clock3 size={16}/> {duration}</span><span><CheckCircle2 size={16}/> {completed}/{planned} séries</span></div>
      <div className="progress-track"><span style={{width:progress+"%"}}/></div>
    </div>
    <div className="live-exercise-nav" aria-label="Selecionar exercício">
      {session.exercises.map((item,index)=>{
        const done=item.sets.length,tot=item.plannedSetsSnapshot.length;
        return <button type="button" key={item.id} aria-pressed={index===exerciseIndex}
          className={index===exerciseIndex?"active":""} onClick={()=>{setExerciseIndex(index);setError("");setMessage("");}}>
          <strong>{String(index+1).padStart(2,"0")}</strong><span>{item.exerciseNameSnapshot}</span><small>{done}/{tot}</small>
        </button>;
      })}
    </div>
    <div className="live-exercise-heading"><span className="eyebrow">EXERCÍCIO {exerciseIndex+1} / {session.exercises.length}</span>
      <h2>{ex.exerciseNameSnapshot}</h2>
      <p>{ex.plannedSetsSnapshot.length} séries planejadas · {ex.restSecondsSnapshot?"Descanso "+ex.restSecondsSnapshot+"s":"Descanso não configurado"}</p>
      {ex.notes&&<p className="live-prescription-note">{ex.notes}</p>}
    </div>
    {last.length>0?<div className="last-performance"><TrendingUp size={19}/><div><strong>Seu último treino concluído</strong>
      <span>{last.map((s,i)=>(i+1)+": "+weightDisplay(s.weightKg,units)+" "+(units==="metric"?"kg":"lb")+" × "+s.reps).join(" · ")}</span>
      <small>Somente referência; valores não são registrados automaticamente.</small></div>
    </div>:<div className="last-performance empty"><Info size={18}/><span>Primeiro registro deste exercício. Não existe carga anterior salva.</span></div>}
    <div className="live-sets">
      {ex.plannedSetsSnapshot.map((set,index)=>{
        const saved=bySet.get(set.id),d=getDraft(set.id,saved);
        return <article className={saved?"live-set completed":"live-set"} key={set.id}>
          <div className="live-set-head">
            <span className={saved?"live-set-check done":"live-set-check"}>{saved?<Check size={17}/>:String(index+1).padStart(2,"0")}</span>
            <div><strong>{set.kind==="warmup"?"Aquecimento":"Série efetiva"} {index+1}</strong>
              <small>Meta: {set.minReps}–{set.maxReps} reps
                {set.targetRir===undefined?"":", RIR "+set.targetRir+(set.targetRirMax!==undefined&&set.targetRirMax!==set.targetRir?"–"+set.targetRirMax:"")}
                {set.targetWeightKg===undefined?"":", "+weightDisplay(set.targetWeightKg,units)+(units==="metric"?" kg":" lb")}
              </small></div>
            {saved&&<span className="live-saved"><Check size={14}/> Salva</span>}
          </div>
          <div className="live-set-fields">
            <label>Carga ({units==="metric"?"kg":"lb"})<input type="number" inputMode="decimal" min="0" max={units==="metric"?"1000":"2205"} step="0.5" placeholder="0" value={d.weight}
              onChange={e=>change(set.id,"weight",e.target.value,saved)} disabled={busy}/></label>
            <label>Repetições<input type="number" inputMode="numeric" min="0" max="1000" step="1" placeholder="0" value={d.reps}
              onChange={e=>change(set.id,"reps",e.target.value,saved)} disabled={busy}/></label>
            <label>RIR (opcional)<input type="number" inputMode="numeric" min="0" max="10" step="1" placeholder="—" value={d.rir}
              onChange={e=>change(set.id,"rir",e.target.value,saved)} disabled={busy}/></label>
          </div>
          <div className="live-set-actions">
            <button type="button" disabled={busy} onClick={()=>{void record(set.id,saved);}} className="live-save-series">
              <Save size={16}/> {saved?"Atualizar registro":"Salvar série"}
            </button>
            {saved&&<button type="button" disabled={busy} className="live-remove-series" onClick={()=>{void remove(set.id);}} aria-label={"Remover registro da série "+(index+1)}><Trash2 size={17}/></button>}
          </div>
        </article>;
      })}
    </div>
    <div className="live-navigation">
      <button type="button" disabled={exerciseIndex===0} onClick={()=>{setExerciseIndex(i=>i-1);setError("");setMessage("");}}><ArrowLeft size={18}/> Anterior</button>
      <button type="button" disabled={exerciseIndex===session.exercises.length-1} onClick={()=>{setExerciseIndex(i=>i+1);setError("");setMessage("");}}>Próximo <ArrowRight size={18}/></button>
    </div>
    <p className="live-tip">Você pode passar para outro exercício sem registrar séries. Apenas séries salvas entram no histórico.</p>
    {message&&<div role="status" className="editor-saved"><Check size={17}/>{message}</div>}
    {error&&<div role="alert" className="editor-error"><Info size={17}/>{error}</div>}
    <section className="live-ending">
      <SectionHead title="Encerrar sessão"/>
      <PrimaryButton onClick={()=>{void finish();}} disabled={busy}>Finalizar treino <CheckCircle2 size={18}/></PrimaryButton>
      <button type="button" className="live-abandon" disabled={busy} onClick={()=>{void abandon();}}><X size={17}/> Encerrar como interrompido</button>
    </section>
    <Notice>Este é um registro real no armazenamento local do iPhone. A gravação é confirmada antes da indicação de sucesso. Faça backups no Perfil regularmente.</Notice>
  </div>;
}

export function WorkoutHistoryView({
  history,onBack
}:{history:WorkoutSession[];onBack:()=>void}){
  const completed=history.filter(s=>s.status!=="in_progress").sort((a,b)=>b.startedAt.localeCompare(a.startedAt));
  const [selected,setSelected]=useState<string|null>(null);
  const totals=useMemo(()=>({
    completed:completed.filter(s=>s.status==="completed").length,
    sets:completed.filter(s=>s.status==="completed").reduce((n,s)=>n+countCompleted(s),0)
  }),[completed]);
  return <>
    <BackHeader label="REGISTROS REAIS" onBack={onBack}/>
    <div className="history-heading"><span className="eyebrow">SUA EVOLUÇÃO COMEÇA AQUI</span><h1>Histórico<span className="orange">.</span></h1><p>Treinos concluídos ou interrompidos no seu aparelho.</p></div>
    <div className="history-totals"><span><strong>{totals.completed}</strong><small>Concluídos</small></span><span><strong>{totals.sets}</strong><small>Séries registradas</small></span></div>
    {completed.length===0?<div className="empty-state"><Dumbbell size={32}/><h3>Nenhum treino registrado ainda</h3><p>Inicie uma ficha em Treinar e salve pelo menos uma série para começar seu histórico.</p></div>:
      <div className="history-list">{completed.map(s=>{
        const open=selected===s.id;
        return <article className="history-item" key={s.id}>
          <button type="button" aria-expanded={open} onClick={()=>setSelected(open?null:s.id)}>
            <span className={s.status==="completed"?"history-status done":"history-status"}>{s.status==="completed"?<CheckCircle2 size={19}/>:<Info size={19}/>}</span>
            <span><strong>{s.planNameSnapshot??"Treino"}</strong>
              <small>{fmtDate(s.startedAt)} · {fmtDuration(workoutDuration(s))} · {countCompleted(s)} séries</small>
              <em>{s.status==="completed"?"Concluído":"Interrompido"}</em>
            </span><ChevronDown size={18} className={open?"rotate":""}/>
          </button>
          {open&&<div className="history-details">{s.exercises.map(ex=><div key={ex.id}>
            <strong>{ex.exerciseNameSnapshot}</strong>
            {ex.sets.length===0?<p>Sem séries registradas</p>:ex.sets.map((set,i)=><p key={set.id}>{i+1}. {set.kind==="warmup"?"Aquecimento":"Efetiva"} — {Math.round(set.weightKg*10)/10} kg × {set.reps} reps{set.rir===undefined?"":" · RIR "+set.rir}</p>)}
          </div>)}</div>}
        </article>;
      })}</div>}
    <Notice>O histórico preserva os nomes e a prescrição que estavam na ficha quando cada sessão foi iniciada. Editar uma ficha não modifica resultados anteriores.</Notice>
  </>;
}
