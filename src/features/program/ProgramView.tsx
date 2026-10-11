import { Activity, ArrowRight, ChevronRight, CircleCheck, Dumbbell, Footprints, Info, RotateCcw } from "lucide-react";
import type { Exercise, WorkoutPlan } from "../../domain/models";
import {
  PROGRAM_DAYS, PROGRAM_FOCUS, PROGRAM_NAME, PROGRAM_PRIORITIES, PROGRAM_SUBTITLE,
  type ProgramDay, exerciseId, planId, repsLabel, rirLabel, seriesCount, totalWeeklySets
} from "../../data/program1010";
import { BackHeader, Notice, PrimaryButton, SectionHead } from "../../components/ui";

export type ProgramStatus = "loading" | "ready" | "error" | "not_installed";

export function ProgramOverview({
  status,onOpen,onInstall
}:{
  status:ProgramStatus;onOpen:(index:number)=>void;onInstall:()=>void
}){
  return <>
    <div className="program-intro">
      <span className="eyebrow">SEU PLANEJAMENTO SEMANAL</span>
      <h1>{PROGRAM_NAME}<span className="orange">.</span></h1>
      <p>{PROGRAM_SUBTITLE} · inspirado em Jordan Peters</p>
    </div>
    <div className="program-metrics">
      <div><strong>05</strong><span>DIAS DE MUSCULAÇÃO</span></div>
      <div><strong>{totalWeeklySets}</strong><span>SÉRIES EFETIVAS / SEMANA</span></div>
      <div><strong>02</strong><span>DIAS DE RECUPERAÇÃO</span></div>
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
    <SectionHead title="Sua semana" aside="Selecione o dia"/>
    <div className="program-week-list">
      {PROGRAM_DAYS.map((day,index)=><button type="button" key={day.id} className="program-week-day" onClick={()=>onOpen(index)}>
        <span className={day.exercises.length?"program-day-index":"program-day-index rest"}>{day.short}</span>
        <span className="program-week-copy"><strong>{day.title}</strong><small>{day.subtitle}</small>
          <em>{day.exercises.length?day.exercises.length+" exercícios · "+seriesCount(day)+" séries efetivas":"Recuperação / descanso"}
            {day.cardio?" · "+day.cardio.label:""}</em>
        </span><ChevronRight size={19}/></button>)}
    </div>
    <SectionHead title="Objetivo e prioridades"/>
    <div className="program-priorities">
      <p>{PROGRAM_FOCUS}</p>
      {PROGRAM_PRIORITIES.map((p,i)=><div key={p}><span>{String(i+1).padStart(2,"0")}</span><strong>{p}</strong></div>)}
    </div>
    <Notice>As fichas contêm apenas as séries efetivas informadas no programa. Aquecimentos, cargas e intervalos de descanso não foram inventados; você poderá personalizá-los no editor de treinos.</Notice>
  </>;
}

export function ProgramDayDetail({
  day,onBack,onPreview,onCardio,plan,catalog,status
}:{
  day:ProgramDay;
  onBack:()=>void;
  onPreview:()=>void;
  onCardio:()=>void;
  plan:WorkoutPlan|undefined;
  catalog:Exercise[];
  status:ProgramStatus;
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
        key:s.id,min:s.minReps,max:s.maxReps,rirMin:s.targetRir,rirMax:s.targetRirMax??s.targetRir,kind:s.kind
      })),
      note:item.notes,rest:item.restSeconds
    };
  })??day.exercises.map((item,index)=>({
    key:String(index),name:item.name,
    sets:item.ranges.map(([min,max],i)=>({key:String(i),min,max,rirMin:item.rir[0],rirMax:item.rir[1],kind:"working" as const})),
    note:item.note,rest:0
  }));
  const total=rows.reduce((n,r)=>n+r.sets.filter(s=>s.kind==="working").length,0);
  return <>
    <BackHeader label="PROGRAMA 10/10 · VERSÃO 2.0" onBack={onBack}/>
    <div className="program-day-head"><span className="eyebrow">{day.weekday.toUpperCase()} · {day.exercises.length?"MUSCULAÇÃO":"RECUPERAÇÃO"}</span>
      <h1>{day.title}<span className="orange">.</span></h1>
      <p>{day.subtitle}</p>
      {day.focus&&<span className="program-focus"><Dumbbell size={15}/>{day.focus}</span>}
    </div>
    {rows.length>0&&<>
      <div className="program-day-summary"><span><Dumbbell size={17}/>{rows.length} exercícios</span><span><CircleCheck size={17}/>{total} séries efetivas</span></div>
      <SectionHead title="Exercícios" aside="Séries e RIR previstos"/>
      <div className="program-exercise-list">{rows.map((row,i)=><article className="program-exercise" key={row.key}>
        <div className="program-exercise-heading"><span className="program-order">{String(i+1).padStart(2,"0")}</span><div><h2>{row.name}</h2><span>{row.sets.filter(s=>s.kind==="working").length} séries efetivas</span></div></div>
        <div className="program-sets">{row.sets.map((set,index)=><div className="program-set" key={set.key}>
          <span>SÉRIE {index+1}</span>
          <strong>{repsLabel(set.min,set.max)} <small>reps</small></strong>
          <em>RIR {set.rirMin===undefined?"não indicado":rirLabel(set.rirMin,set.rirMax??set.rirMin)}</em>
        </div>)}</div>
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
    {!day.exercises.length&&<div className="program-rest"><Activity size={32}/><h2>Dia de recuperação</h2><p>{day.note??"Recuperação priorizada. Não há séries de musculação programadas."}</p></div>}
    <Notice>
      {status==="ready"?"Ficha salva neste navegador.": "Ficha visível como referência, sem confirmação de salvamento."}
      {" "}O registro de séries reais será habilitado na Sprint 04; a tela atual é para consultar o planejamento.
    </Notice>
    {rows.length>0&&<div className="program-preview-action"><PrimaryButton secondary onClick={onPreview}>Experimentar registro fictício <ArrowRight size={17}/></PrimaryButton><small>A simulação não utiliza nem altera sua ficha real.</small></div>}
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
    <SectionHead title="No seu Programa 10/10" aside={entries.length+" exercícios"}/>
    <p>Selecione um exercício para consultar o dia da sua ficha, as repetições e o RIR.</p>
    <div className="program-library-grid">{entries.map(ex=><button key={ex.name} type="button" className="program-library-item" onClick={()=>onOpen(ex.day)}>
      <span><Dumbbell size={19}/></span><div><strong>{ex.name}</strong><small>{ex.muscle} · {ex.equipment}</small></div><ChevronRight size={17}/>
    </button>)}</div>
  </section>;
}
