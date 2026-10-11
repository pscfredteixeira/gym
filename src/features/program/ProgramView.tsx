import { Activity, ArrowRight, ChevronRight, CircleCheck, Dumbbell, Footprints, RotateCcw, Pencil, CalendarRange, Plus } from "lucide-react";
import type { Exercise, WorkoutPlan } from "../../domain/models";
import {
  PROGRAM_DAYS, PROGRAM_FOCUS, PROGRAM_NAME, PROGRAM_PRIORITIES, PROGRAM_SUBTITLE,
  type ProgramDay, exerciseId, repsLabel, rirLabel
} from "../../data/program1010";
import { BackHeader, Notice, PrimaryButton, SectionHead } from "../../components/ui";

export type ProgramStatus = "loading" | "ready" | "error" | "not_installed";

export function ProgramOverview({
  status,onOpen,onInstall,assigned,onEdit,onNew,onEditSchedule,unassigned
}:{
  status:ProgramStatus;onOpen:(index:number)=>void;onInstall:()=>void;
  assigned:Array<{day:ProgramDay;plan?:WorkoutPlan;planId:string|null}>;
  onEdit:(id:string)=>void;onNew:()=>void;onEditSchedule:()=>void;unassigned:WorkoutPlan[]
}){
  const daysWithWorkout=assigned.filter(item=>!!item.plan).length;
  const effectiveSets=assigned.reduce((sum,item)=>sum+(item.plan?.exercises.reduce((count,ex)=>count+ex.sets.filter(s=>s.kind==="working").length,0)??0),0);
  return <>
    <div className="program-intro">
      <span className="eyebrow">SEU PLANEJAMENTO SEMANAL</span>
      <h1>{PROGRAM_NAME}<span className="orange">.</span></h1>
      <p>{PROGRAM_SUBTITLE} · inspirado em Jordan Peters</p>
    </div>
    <div className="program-metrics">
      <div><strong>{daysWithWorkout.toString().padStart(2,"0")}</strong><span>DIAS DE MUSCULAÇÃO</span></div>
      <div><strong>{effectiveSets}</strong><span>SÉRIES EFETIVAS / SEMANA</span></div>
      <div><strong>{(7-daysWithWorkout).toString().padStart(2,"0")}</strong><span>DIAS SEM MUSCULAÇÃO</span></div>
    </div>
    <div className={"program-save-banner "+(status==="ready"?"is-saved":"")} role="status">
      <CircleCheck size={20}/>
      <span>
        {status==="ready"?"As cinco fichas estão cadastradas no armazenamento local do GYM."
        :status==="loading"?"Preparando suas fichas no armazenamento local..."
        :status==="not_installed"?"O backup restaurado não contém esta ficha. Você pode adicioná-la novamente."
        :"Não foi possível salvar a ficha neste navegador. Ela ainda está visível como referência."}
      </span>
    </div>
    {(status==="error"||status==="not_installed")&&<button className="program-retry" type="button" onClick={onInstall}><RotateCcw size={17}/> Tentar cadastrar novamente</button>}
    <div className="program-action-row"><button type="button" onClick={onEditSchedule}><CalendarRange size={18}/> Organizar semana</button><button type="button" onClick={onNew}><Plus size={18}/> Nova ficha</button></div>
    <SectionHead title="Sua semana" aside="Selecione o dia"/>
    <div className="program-week-list">
      {assigned.map(({day,plan},index)=><button type="button" key={day.id} className="program-week-day" onClick={()=>onOpen(index)}>
        <span className={plan?"program-day-index":"program-day-index rest"}>{day.short}</span>
        <span className="program-week-copy"><strong>{day.title}</strong><small>{day.subtitle}</small>
          <em>{plan?plan.exercises.length+" exercícios · "+plan.exercises.reduce((sum,ex)=>sum+ex.sets.filter(s=>s.kind==="working").length,0)+" séries efetivas":"Recuperação / descanso"}
            {day.cardio?" · "+day.cardio.label:""}</em>
        </span><ChevronRight size={19}/></button>)}
    </div>
    {unassigned.length>0&&<><SectionHead title="Fichas fora da agenda" aside={unassigned.length+" disponíveis"}/><div className="program-unassigned">{unassigned.map(plan=><button type="button" key={plan.id} onClick={()=>onEdit(plan.id)}><span><strong>{plan.name}</strong><small>{plan.exercises.length} exercícios · toque para editar</small></span><Pencil size={18}/></button>)}</div></>}
    <SectionHead title="Objetivo e prioridades"/>
    <div className="program-priorities">
      <p>{PROGRAM_FOCUS}</p>
      {PROGRAM_PRIORITIES.map((p,i)=><div key={p}><span>{String(i+1).padStart(2,"0")}</span><strong>{p}</strong></div>)}
    </div>
    <Notice>As fichas contêm apenas as séries efetivas informadas no programa. Aquecimentos, cargas e intervalos de descanso não foram inventados; você poderá personalizá-los no editor de treinos.</Notice>
  </>;
}

export function ProgramDayDetail({
  day,onBack,onStart,onResume,onCardio,plan,catalog,status,onEdit,units,activeWorkout,trainingError
}:{
  day:ProgramDay;
  onBack:()=>void;
  onStart:()=>void;
  onResume:()=>void;
  onCardio:()=>void;
  plan:WorkoutPlan|undefined;
  catalog:Exercise[];
  status:ProgramStatus;
  onEdit:()=>void;
  units:"metric"|"imperial";
  activeWorkout:boolean;
  trainingError?:string;
}) {
  const catalogMap = new Map(catalog.map(e=>[e.id,e]));
  const source = day.exercises.map(x=>[exerciseId(x.name),x] as const);
  const defaultById = new Map(source);
  const rows=plan?.exercises.slice().sort((a,b)=>a.order-b.order).map(item=>{
    const matched=defaultById.get(item.exerciseId);
    return {
      key:item.id,
      name:catalogMap.get(item.exerciseId)?.name??matched?.name??"Exercício personalizado",
      sets:item.sets.map(s=>({
        key:s.id,min:s.minReps,max:s.maxReps,rirMin:s.targetRir,rirMax:s.targetRirMax??s.targetRir,kind:s.kind,plannedWeight:s.targetWeightKg
      })),
      note:item.notes,rest:item.restSeconds
    };
  })??day.exercises.map((item,index)=>({
    key:String(index),name:item.name,
    sets:item.ranges.map(([min,max],i)=>({key:String(i),min,max,rirMin:item.rir[0],rirMax:item.rir[1],kind:"working" as const,plannedWeight:undefined as number|undefined})),
    note:item.note,rest:0
  }));
  const total=rows.reduce((n,r)=>n+r.sets.filter(s=>s.kind==="working").length,0);
  return <>
    <BackHeader label="SUA FICHA DE TREINO" onBack={onBack} action={plan?<button type="button" className="round-control" onClick={onEdit} aria-label="Editar esta ficha"><Pencil size={19}/></button>:undefined}/>
    <div className="program-day-head"><span className="eyebrow">{day.weekday.toUpperCase()} · {plan?"MUSCULAÇÃO":"RECUPERAÇÃO"}</span>
      <h1>{day.title}<span className="orange">.</span></h1>
      <p>{day.subtitle}</p>
      {day.focus&&<span className="program-focus"><Dumbbell size={15}/>{day.focus}</span>}
    </div>
    {plan&&<button type="button" className="program-edit-call" onClick={onEdit}><Pencil size={17}/> Personalizar esta ficha <ArrowRight size={17}/></button>}
    {rows.length>0&&<>
      <div className="program-day-summary"><span><Dumbbell size={17}/>{rows.length} exercícios</span><span><CircleCheck size={17}/>{total} séries efetivas</span></div>
      <SectionHead title="Exercícios" aside="Séries e RIR previstos"/>
      <div className="program-exercise-list">{rows.map((row,i)=><article className="program-exercise" key={row.key}>
        <div className="program-exercise-heading"><span className="program-order">{String(i+1).padStart(2,"0")}</span><div><h2>{row.name}</h2><span>{row.sets.filter(s=>s.kind==="working").length} séries efetivas</span></div></div>
        <div className="program-sets">{row.sets.map((set,index)=><div className="program-set" key={set.key}>
          <span>{set.kind==="warmup"?"AQUEC. ":"SÉRIE "}{index+1}</span>
          <strong>{repsLabel(set.min,set.max)} <small>reps</small></strong>
          <em>RIR {set.rirMin===undefined?"não indicado":rirLabel(set.rirMin,set.rirMax??set.rirMin)}</em>
        </div>)}<div className="program-exercise-rest">{row.rest>0?"Descanso: "+row.rest+" segundos":"Descanso não configurado"}{row.sets.some(s=>s.plannedWeight!==undefined)?" · Carga prevista: "+row.sets.map(s=>s.plannedWeight===undefined?"—":(Math.round(s.plannedWeight*(units==="imperial"?2.2046226218:1)*10)/10)+" "+(units==="imperial"?"lb":"kg")).join(" / "):""}</div></div>
        {row.note&&<p className="program-exercise-note">{row.note}</p>}
      </article>)}</div>
    </>}
    {day.cardio&&<section className="program-cardio">
      <Footprints size={23}/>
      <div><span>CARDIO {day.cardio.optional?"OPCIONAL":"PLANEJADO"}</span>
        <h2>{day.cardio.label}{day.cardio.minutes?" · "+day.cardio.minutes+" min":""}</h2>
        {day.cardio.note&&<p>{day.cardio.note}</p>}
        <button type="button" onClick={onCardio}>Ver módulo de corrida <ArrowRight size={16}/></button>
      </div>
    </section>}
    {!rows.length&&<div className="program-rest"><Activity size={32}/><h2>Dia de recuperação</h2><p>{day.note??"Recuperação priorizada. Não há séries de musculação programadas."}</p></div>}
    <Notice>
      {status==="ready"?"Ficha salva neste navegador.": "Ficha visível como referência, sem confirmação de salvamento."}
      {" "}Ao iniciar, a sessão registra uma cópia da ficha, preservada mesmo se você editar os exercícios depois.
    </Notice>
    {trainingError&&<div className="editor-error" role="alert">{trainingError}</div>}
    {rows.length>0&&<div className="program-preview-action"><PrimaryButton onClick={activeWorkout?onResume:onStart}>
      {activeWorkout?"Retomar treino em andamento":"Iniciar treino real"} <ArrowRight size={17}/>
    </PrimaryButton><small>{activeWorkout?"Há uma sessão aberta; conclua ou interrompa antes de iniciar outra.":"Suas séries, cargas e repetições serão salvas no histórico."}</small></div>}
  </>;
}

export function ProgramLibrary({
  onOpen
}:{
  onOpen:(index:number)=>void
}){
  const unique=new Map<string,{name:string;muscle:string;day:number;equipment:string}>();
  PROGRAM_DAYS.forEach((day,i)=>day.exercises.forEach(ex=>{
    const key=exerciseId(ex.name);
    if(!unique.has(key)) unique.set(key,{name:ex.name,muscle:ex.muscle,day:i,equipment:ex.equipment});
  }));
  const entries=Array.from(unique.values());
  return <section className="program-library">
    <SectionHead title="Prescrições originais 10/10" aside={entries.length+" exercícios"}/>
    <p>Selecione um exercício para consultar o dia da sua ficha, as repetições e o RIR.</p>
    <div className="program-library-grid">{entries.map(ex=><button key={ex.name} type="button" className="program-library-item" onClick={()=>onOpen(ex.day)}>
      <span><Dumbbell size={19}/></span><div><strong>{ex.name}</strong><small>{ex.muscle} · {ex.equipment}</small></div><ChevronRight size={17}/>
    </button>)}</div>
  </section>;
}
