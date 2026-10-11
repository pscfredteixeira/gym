import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, CirclePlay, Clock3, Dumbbell, Info, Save, Trash2, TrendingUp, X, Pause, Play, SkipForward, Timer, List, Minus, Plus } from "lucide-react";
import type { Exercise, WorkoutSession, CompletedSet, UserSettings } from "../../domain/models";
import { countCompleted, countPlanned, getPreviousPerformance, workoutDuration, restView, nextPlannedSet, type RecordTarget, type SetInput } from "./sessionDomain";
import { ExercisePhoto } from "../library/ExercisePhoto";
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
type RestAction = "pause"|"continue"|"plus"|"minus"|"skip";
function RestControls({
  session,now,busy,onRestAction
}:{
  session:WorkoutSession; now:number;busy:boolean;onRestAction:(action:RestAction)=>Promise<void>
}){
  const view=restView(session,new Date(now));
  if(view.status==="idle")return null;
  const time=String(Math.floor(view.remainingSeconds/60)).padStart(2,"0")+":"+String(view.remainingSeconds%60).padStart(2,"0");
  return <section className={"live-rest-panel "+(view.status==="finished"?"finished":"")} aria-label="Descanso entre séries">
    <div className="live-rest-main"><span className="live-rest-icon"><Timer size={22}/></span>
      <div className="live-rest-copy"><strong>{view.status==="finished"?"Descanso concluído":view.status==="paused"?"Descanso pausado":"Hora de recuperar"}</strong>
        <small>{view.status==="running"?"Contagem baseada no horário real":view.status==="paused"?"Continue quando estiver pronto":view.status==="finished"?"Você já pode continuar":""}</small></div>
      <span className="live-rest-clock" aria-live="off">{time}</span>
    </div>
    <div className="live-rest-actions">
      <button disabled={busy} type="button" onClick={()=>{void onRestAction("minus");}} aria-label="Reduzir 15 segundos"><Minus size={15}/> 15s</button>
      <button disabled={busy || view.status==="finished"} className="live-rest-toggle" type="button"
        onClick={()=>{void onRestAction(view.status==="running"?"pause":"continue");}}>
        {view.status==="running"?<Pause size={16}/>:<Play size={16}/>}
        {view.status==="running"?"Pausar":view.status==="paused"?"Continuar":"Concluído"}
      </button>
      <button disabled={busy} type="button" onClick={()=>{void onRestAction("plus");}} aria-label="Adicionar 15 segundos"><Plus size={15}/> 15s</button>
      <button disabled={busy} className="live-rest-skip" type="button" onClick={()=>{void onRestAction("skip");}}><SkipForward size={16}/> Pular</button>
    </div>
  </section>;
}

export function LiveWorkout({
  session,history,units,catalog,onBack,onRecord,onRemove,onFinish,onAbandon,onRestAction
}:{
  session:WorkoutSession;history:WorkoutSession[];units:UserSettings["units"];catalog:Exercise[];
  onBack:()=>void;
  onRecord:(target:RecordTarget,data:SetInput)=>Promise<void>;
  onRemove:(target:RecordTarget)=>Promise<void>;
  onFinish:()=>Promise<void>;
  onAbandon:()=>Promise<void>;
  onRestAction:(action:RestAction)=>Promise<void>;
}){
  const [exerciseIndex,setExerciseIndex]=useState(0);
  const [focusIndex,setFocusIndex]=useState(0);
  const [focusMode,setFocusMode]=useState(true);
  const [drafts,setDrafts]=useState<Record<string,Draft>>({});
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [tick,setTick]=useState(Date.now());
  useEffect(()=>{
    const update=()=>setTick(Date.now());
    const timer=window.setInterval(update,1000);
    document.addEventListener("visibilitychange",update);
    window.addEventListener("focus",update);
    return()=>{
      window.clearInterval(timer);document.removeEventListener("visibilitychange",update);
      window.removeEventListener("focus",update);
    };
  },[]);
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
    setDrafts(prev=>({...prev,[setId]:{...old,[field]:value}}));setMessage("");
  };
  const transact=async(fn:()=>Promise<void>,success:string):Promise<boolean>=>{
    setBusy(true);setError("");setMessage("");
    try{await fn();setMessage(success);return true;}
    catch(e){setError(e instanceof Error?e.message:"Não foi possível salvar.");return false;}
    finally{setBusy(false);}
  };
  const selectExercise=(index:number)=>{
    if(index<0||index>=session.exercises.length)return;
    setExerciseIndex(index);
    const entry=session.exercises[index];
    const first=entry.plannedSetsSnapshot.findIndex(s=>!entry.sets.some(x=>x.plannedSetId===s.id));
    setFocusIndex(first<0?0:first);setError("");setMessage("");
  };
  const moveFocused=(offset:number)=>{
    const positions=session.exercises.flatMap((entry,i)=>entry.plannedSetsSnapshot.map((_,j)=>({exercise:i,set:j})));
    const idx=positions.findIndex(p=>p.exercise===exerciseIndex&&p.set===focusIndex);
    const next=positions[idx+offset];
    if(next){setExerciseIndex(next.exercise);setFocusIndex(next.set);setError("");setMessage("");}
  };
  const record=async(setId:string,saved?:CompletedSet)=>{
    if(!ex)return;
    const d=getDraft(setId,saved);
    const displayWeight=asNumber(d.weight,0,units==="metric"?1000:2204.6226218);
    const reps=asNumber(d.reps,0,1000);
    const rir=d.rir.trim()===""?undefined:asNumber(d.rir,0,10);
    if(displayWeight===null||reps===null||!Number.isInteger(reps)||rir===null||(rir!==undefined&&!Number.isInteger(rir))){
      setError("Preencha carga e repetições corretamente. O RIR é opcional (0 a 10).");return;
    }
    const setIndex=ex.plannedSetsSnapshot.findIndex(s=>s.id===setId);
    const target={sessionExerciseId:ex.id,plannedSetId:setId};
    const ok=await transact(()=>onRecord(target,{weightKg:weightToKg(displayWeight,units),reps,...(rir===undefined?{}:{rir})}),
      saved?"Série atualizada no dispositivo.":"Série registrada. Descanso iniciado.");
    if(ok&&!saved){
      setDrafts(old=>{const next={...old};delete next[setId];return next;});
      const next=nextPlannedSet(session,exerciseIndex,setIndex);
      if(next){setExerciseIndex(next.exerciseIndex);setFocusIndex(next.setIndex);}
    }
  };
  const remove=async(setId:string)=>{
    if(!ex||!window.confirm("Desfazer o registro desta série? Você poderá registrá-la novamente."))return;
    const target={sessionExerciseId:ex.id,plannedSetId:setId};
    await transact(async()=>{
      await onRemove(target);setDrafts(old=>{const next={...old};delete next[setId];return next;});
    },"Registro da série removido.");
  };
  const finish=async()=>{
    if(!completed){setError("Registre pelo menos uma série antes de concluir.");return;}
    if(!window.confirm(completed<planned?
      "Finalizar com "+completed+" de "+planned+" séries? As demais ficarão sem resultado.":
      "Finalizar e salvar o treino?"))return;
    await transact(onFinish,"Treino concluído.");
  };
  const abandon=async()=>{
    if(!window.confirm("Encerrar sem concluir? Esta sessão e suas séries registradas serão mantidas no histórico."))return;
    await transact(onAbandon,"Treino registrado como interrompido.");
  };
  if(!ex)return <div className="empty-state"><Info/><p>Esta sessão não possui exercícios.</p><button type="button" onClick={onBack}>Voltar</button></div>;
  return <div className={"live-workout "+(focusMode?"live-focus-mode":"live-list-mode")}>
    <BackHeader label="MODO ACADEMIA · REGISTRO REAL" onBack={onBack}/>
    <div className="live-heading">
      <span className="eyebrow">TREINO EM ANDAMENTO</span>
      <h1>{session.planNameSnapshot??"Musculação"}<span className="orange">.</span></h1>
      <div className="live-summary"><span><Clock3 size={16}/> {duration}</span><span><CheckCircle2 size={16}/> {completed}/{planned} séries</span></div>
      <div className="progress-track"><span style={{width:progress+"%"}}/></div>
    </div>
    <div className="live-mode-switch"><button type="button" aria-pressed={focusMode} className={focusMode?"active":""} onClick={()=>setFocusMode(true)}><Dumbbell size={17}/> Uma série</button>
      <button type="button" aria-pressed={!focusMode} className={!focusMode?"active":""} onClick={()=>setFocusMode(false)}><List size={17}/> Todas as séries</button></div>
    <div className="live-exercise-nav" aria-label="Selecionar exercício">
      {session.exercises.map((item,index)=>{
        const done=item.sets.length,tot=item.plannedSetsSnapshot.length;
        return <button type="button" key={item.id} aria-pressed={index===exerciseIndex}
          className={index===exerciseIndex?"active":""} onClick={()=>selectExercise(index)}>
          <strong>{String(index+1).padStart(2,"0")}</strong><span>{item.exerciseNameSnapshot}</span><small>{done}/{tot}</small>
        </button>;
      })}
    </div>
    <div className="live-exercise-heading"><span className="eyebrow">EXERCÍCIO {exerciseIndex+1} / {session.exercises.length}</span>
      <div className="gym-live-exercise-title"><ExercisePhoto compact exercise={{name:ex.exerciseNameSnapshot,imageUrl:catalog.find(item=>item.id===ex.exerciseId)?.imageUrl}}/><h2>{ex.exerciseNameSnapshot}</h2></div>
      {catalog.find(item=>item.id===ex.exerciseId)?.imageUrl&&<details className="gym-live-full-photo"><summary>Ver foto demonstrativa do exercício</summary>
        <ExercisePhoto exercise={{name:ex.exerciseNameSnapshot,imageUrl:catalog.find(item=>item.id===ex.exerciseId)?.imageUrl}}/>
      </details>}
      <p>{ex.plannedSetsSnapshot.length} séries planejadas · {ex.restSecondsSnapshot?"Descanso "+ex.restSecondsSnapshot+"s":"Descanso padrão do Perfil"}</p>
      {ex.notes&&<p className="live-prescription-note">{ex.notes}</p>}
    </div>
    <RestControls session={session} now={tick} busy={busy}
      onRestAction={async action=>{await transact(()=>onRestAction(action),"Descanso atualizado.");}}/>
    {last.length>0?<details className="live-last-collapsible">
      <summary><TrendingUp size={18}/> Ver resultados do último treino <ChevronDown size={17}/></summary>
      <div className="last-performance"><TrendingUp size={19}/><div><strong>Seu último treino concluído</strong>
        <span>{last.map((s,i)=>(i+1)+": "+weightDisplay(s.weightKg,units)+" "+(units==="metric"?"kg":"lb")+" × "+s.reps).join(" · ")}</span>
        <small>Apenas referência; nada é preenchido automaticamente.</small></div>
      </div></details>:!focusMode&&<div className="last-performance empty"><Info size={18}/><span>Primeiro registro deste exercício. Nenhuma carga anterior salva.</span></div>}
    {focusMode&&<div className="focus-step-selector" aria-label="Escolher série">
      {ex.plannedSetsSnapshot.map((set,index)=>{
        const saved=bySet.has(set.id);
        return <button type="button" key={set.id} className={(index===focusIndex?"active ":"")+(saved?"saved":"")} aria-pressed={index===focusIndex}
          onClick={()=>{setFocusIndex(index);setError("");setMessage("");}}>
          {saved?<Check size={18}/>:index+1}
        </button>;
      })}
    </div>}
    <div className="live-sets">
      {ex.plannedSetsSnapshot.map((set,index)=>{
        if(focusMode&&index!==focusIndex)return null;
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
            <label>Carga ({units==="metric"?"kg":"lb"})<input type="number" inputMode="decimal" min="0" max={units==="metric"?"1000":"2205"} step="0.5" placeholder="—" value={d.weight}
              onChange={e=>change(set.id,"weight",e.target.value,saved)} disabled={busy}/></label>
            <label>Repetições<input type="number" inputMode="numeric" min="0" max="1000" step="1" placeholder="—" value={d.reps}
              onChange={e=>change(set.id,"reps",e.target.value,saved)} disabled={busy}/></label>
            <label>RIR (opcional)<input type="number" inputMode="numeric" min="0" max="10" step="1" placeholder="—" value={d.rir}
              onChange={e=>change(set.id,"rir",e.target.value,saved)} disabled={busy}/></label>
          </div>
          <div className="live-set-actions">
            <button type="button" disabled={busy} onClick={()=>{void record(set.id,saved);}} className="live-save-series">
              <Save size={16}/> {saved?"Atualizar registro":"Salvar série"}
            </button>
            {saved&&<button type="button" disabled={busy} className="live-remove-series" onClick={()=>{void remove(set.id);}} aria-label={"Desfazer registro da série "+(index+1)}><Trash2 size={17}/></button>}
          </div>
        </article>;
      })}
    </div>
    {focusMode?<div className="live-focus-navigation">
        <button type="button" disabled={exerciseIndex===0&&focusIndex===0} onClick={()=>moveFocused(-1)}><ArrowLeft size={19}/> Anterior</button>
        <span>Próxima série</span>
        <button type="button" disabled={exerciseIndex===session.exercises.length-1&&focusIndex===ex.plannedSetsSnapshot.length-1}
          onClick={()=>moveFocused(1)}>Próxima <ArrowRight size={19}/></button>
      </div>:<div className="live-navigation">
      <button type="button" disabled={exerciseIndex===0} onClick={()=>selectExercise(exerciseIndex-1)}><ArrowLeft size={18}/> Anterior</button>
      <button type="button" disabled={exerciseIndex===session.exercises.length-1} onClick={()=>selectExercise(exerciseIndex+1)}>Próximo <ArrowRight size={18}/></button>
    </div>}
    <p className="live-tip">Só séries confirmadas entram no histórico. Você pode pular um exercício sem inventar um resultado.</p>
    {message&&<div role="status" className="editor-saved"><Check size={17}/>{message}</div>}
    {error&&<div role="alert" className="editor-error"><Info size={17}/>{error}</div>}
    <section className="live-ending">
      <SectionHead title="Encerrar sessão"/>
      <PrimaryButton onClick={()=>{void finish();}} disabled={busy}>Finalizar treino <CheckCircle2 size={18}/></PrimaryButton>
      <button type="button" className="live-abandon" disabled={busy} onClick={()=>{void abandon();}}><X size={17}/> Encerrar como interrompido</button>
    </section>
    <Notice>O descanso segue o relógio real e é recalculado ao retornar ao GYM. O Safari não garante alarmes quando o iPhone está bloqueado ou o site fechado.</Notice>
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
