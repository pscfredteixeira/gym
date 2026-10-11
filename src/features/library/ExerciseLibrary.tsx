import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, ChevronRight, Dumbbell, Info, ListFilter, RotateCcw, Search, ShieldCheck, X } from "lucide-react";
import type { Exercise, WorkoutPlan } from "../../domain/models";
import { BackHeader, Notice, SectionHead } from "../../components/ui";
import { guideFor, matchingAlternatives, searchExercises, usedInPlans } from "../../data/exerciseGuides";

const MUSCLES=["Todos","Dorsais","Costas superiores","Peito","Ombros","Trapézio","Bíceps","Tríceps","Quadríceps","Posterior de coxa","Panturrilhas","Abdômen"];
type Zone = "chest"|"lats"|"upper"|"shoulder"|"trap"|"biceps"|"triceps"|"quads"|"hamstrings"|"calves"|"abs";
const ZONE:Record<string,Zone> = {
  "Peito":"chest","Dorsais":"lats","Costas superiores":"upper","Ombros":"shoulder","Trapézio":"trap",
  "Bíceps":"biceps","Tríceps":"triceps","Quadríceps":"quads","Posterior de coxa":"hamstrings",
  "Panturrilhas":"calves","Abdômen":"abs"
};
function BodyFigure({back,active}:{back:boolean;active:Zone}){
  const tone=(zones:Zone[])=>zones.includes(active)?"#ff803d":"#444c55";
  const strong=(zones:Zone[])=>zones.includes(active)?"#ffac71":"#3b4249";
  return <svg className="body-map-svg" viewBox="0 0 150 270" role="img"
    aria-label={back?"Mapa muscular: vista posterior":"Mapa muscular: vista anterior"}>
    <title>{back?"Representação esquemática posterior":"Representação esquemática anterior"}</title>
    <g fill="#30363c" stroke="#5e6870" strokeWidth="1.2" strokeLinejoin="round">
      <circle cx="75" cy="22" r="15"/>
      <path d="M63 35 L87 35 89 45 61 45Z"/>
      <path d="M54 44 Q46 44 39 50 L24 78 17 125 12 151 24 157 34 126 45 93 47 133 51 157 45 200 43 250 59 253 67 208 75 165 83 208 91 253 107 250 105 200 99 157 103 133 105 93 116 126 126 157 138 151 133 125 126 78 111 50 Q105 44 96 44 Z"/>
    </g>
    <g stroke="#8a969f" strokeWidth=".65" opacity=".9">
      <path fill={tone(["shoulder"])} d="M53 45 Q41 44 38 58 L31 72 47 80 57 62Z"/>
      <path fill={tone(["shoulder"])} d="M97 45 Q109 44 112 58 L119 72 103 80 93 62Z"/>
      {back
        ?<>
          <path fill={strong(["trap","upper"])} d="M61 45 L75 54 89 45 98 64 75 79 52 64Z"/>
          <path fill={tone(["upper"])} d="M52 65 L74 80 66 105 49 89Z"/>
          <path fill={tone(["upper"])} d="M98 65 L76 80 84 105 101 89Z"/>
          <path fill={tone(["lats"])} d="M50 93 68 104 73 135 57 149 48 125Z"/>
          <path fill={tone(["lats"])} d="M100 93 82 104 77 135 93 149 102 125Z"/>
        </>
        :<>
          <path fill={tone(["chest"])} d="M55 56 73 63 73 91 49 86Z"/>
          <path fill={tone(["chest"])} d="M95 56 77 63 77 91 101 86Z"/>
          <path fill={tone(["abs"])} d="M60 93 73 93 73 143 58 140Z"/>
          <path fill={tone(["abs"])} d="M90 93 77 93 77 143 92 140Z"/>
        </>
      }
      <path fill={tone(back?["triceps"]:["biceps"])} d="M30 79 45 84 37 115 24 108Z"/>
      <path fill={tone(back?["triceps"]:["biceps"])} d="M120 79 105 84 113 115 126 108Z"/>
      <path fill={tone(back?["hamstrings"]:["quads"])} d="M52 159 73 167 65 210 46 207Z"/>
      <path fill={tone(back?["hamstrings"]:["quads"])} d="M98 159 77 167 85 210 104 207Z"/>
      <path fill={tone(["calves"])} d="M46 214 62 216 58 244 44 245Z"/>
      <path fill={tone(["calves"])} d="M104 214 88 216 92 244 106 245Z"/>
    </g>
    <path d="M67 163H83" stroke="#7d8790" strokeWidth="1" fill="none"/>
  </svg>;
}
export function MuscleMap({primaryMuscle}:{primaryMuscle:string}){
  const zone=ZONE[primaryMuscle]??"upper";
  return <div className="exercise-muscle-atlas">
    <div className="atlas-label"><span><span className="atlas-dot"/> Região em destaque</span><span>MAPA ILUSTRATIVO</span></div>
    <div className="atlas-figures">
      <figure><BodyFigure back={false} active={zone}/><figcaption>FRENTE</figcaption></figure>
      <figure><BodyFigure back active={zone}/><figcaption>COSTAS</figcaption></figure>
    </div>
    <p>{primaryMuscle}. Esquema simplificado, não um desenho anatômico de precisão nem uma demonstração do movimento.</p>
  </div>;
}
function ExerciseIcon({muscle}:{muscle:string}){
 return <span className="atlas-card-icon" aria-hidden="true"><Dumbbell size={21}/><small>{muscle.slice(0,2).toUpperCase()}</small></span>;
}
export function ExerciseLibrary({catalog,plans,onOpen}:{catalog:Exercise[];plans:WorkoutPlan[];onOpen:(id:string)=>void}){
  const [term,setTerm]=useState("");
  const [muscle,setMuscle]=useState("Todos");
  const [equipment,setEquipment]=useState("Todos");
  const [customOnly,setCustomOnly]=useState(false);
  const equipmentList=useMemo(()=>["Todos",...new Set(catalog.map(x=>x.equipment||"Não informado"))].sort((a,b)=>a==="Todos"?-1:b==="Todos"?1:a.localeCompare(b,"pt-BR")),[catalog]);
  const muscles=useMemo(()=>["Todos",...new Set(catalog.map(x=>x.primaryMuscle))].sort((a,b)=>a==="Todos"?-1:b==="Todos"?1:MUSCLES.indexOf(a)-MUSCLES.indexOf(b)),[catalog]);
  const results=useMemo(()=>searchExercises(catalog,term,muscle,equipment).filter(x=>!customOnly||x.isCustom),[catalog,term,muscle,equipment,customOnly]);
  const reset=()=>{setTerm("");setMuscle("Todos");setEquipment("Todos");setCustomOnly(false)};
  return <div className="exercise-atlas-page">
    <div className="exercise-atlas-header">
      <span className="eyebrow">BIBLIOTECA REAL / PROGRAMA 10/10</span>
      <h1>Conheça cada <span>movimento.</span></h1>
      <p>Aprenda os pontos essenciais de execução, consulte os músculos trabalhados e encontre alternativas antes de modificar sua ficha.</p>
    </div>
    <div className="atlas-search-panel">
      <label className="atlas-search"><Search size={20}/><input type="search" autoComplete="off" aria-label="Buscar exercícios" placeholder="Nome, músculo ou equipamento" value={term} onChange={e=>setTerm(e.target.value)}/>
        {term&&<button aria-label="Limpar busca" type="button" onClick={()=>setTerm("")}><X size={18}/></button>}
      </label>
      <div className="atlas-chip-scroll" aria-label="Filtrar por músculo">
        {muscles.map(label=><button type="button" key={label} aria-pressed={muscle===label}
          className={muscle===label?"active":""} onClick={()=>setMuscle(label)}>{label}</button>)}
      </div>
      <div className="atlas-refine"><label><ListFilter size={16}/> Equipamento
        <select aria-label="Filtrar por equipamento" value={equipment} onChange={e=>setEquipment(e.target.value)}>
          {equipmentList.map(label=><option key={label} value={label}>{label}</option>)}
        </select></label>
        <label className="atlas-check"><input type="checkbox" checked={customOnly} onChange={e=>setCustomOnly(e.target.checked)}/> Só meus exercícios</label>
      </div>
    </div>
    <div className="atlas-result-head"><strong>{results.length} {results.length===1?"movimento":"movimentos"}</strong>
      {(term||muscle!=="Todos"||equipment!=="Todos"||customOnly)&&<button type="button" onClick={reset}><RotateCcw size={15}/> Limpar filtros</button>}
    </div>
    {results.length===0?<div className="empty-state"><Search size={28}/><h3>Nenhum exercício encontrado</h3><p>Experimente outro nome ou limpe os filtros. Exercícios próprios aparecem depois de salvos numa ficha.</p><button type="button" className="atlas-clear" onClick={reset}>Ver todos</button></div>:
    <div className="atlas-list">{results.map(ex=>{
      const used=usedInPlans(ex.id,plans);
      const guided=!!guideFor(ex);
      return <button type="button" className="atlas-exercise-card" key={ex.id} onClick={()=>onOpen(ex.id)}>
        <ExerciseIcon muscle={ex.primaryMuscle}/>
        <span className="atlas-exercise-name"><strong>{ex.name}</strong><small>{ex.primaryMuscle} · {ex.equipment??"Equipamento não informado"}</small>
          <em>{guided?"Guia de execução e alternativas":ex.isCustom?"Exercício personalizado":"Sem guia técnico publicado"}{used.length?" · Na ficha: "+used[0]:""}</em></span>
        <ChevronRight size={19}/>
      </button>;
    })}</div>}
    <Notice>A biblioteca usa os exercícios salvos neste dispositivo. Os desenhos musculares são esquemas originais; não exibimos fotos sem direitos de uso esclarecidos.</Notice>
  </div>;
}
export function ExerciseDetails({
  exercise,catalog,plans,onBack,onOpen,onReplace
}:{
  exercise:Exercise|undefined;catalog:Exercise[];plans:WorkoutPlan[];
  onBack:()=>void;onOpen:(id:string)=>void;
  onReplace:(planId:string,rowId:string,replacement:Exercise)=>Promise<void>;
}){
  const [selectedPlan,setSelectedPlan]=useState("");
  const [selectedRow,setSelectedRow]=useState("");
  const [selectedAlternative,setSelectedAlternative]=useState("");
  const [busy,setBusy]=useState(false);
  const [feedback,setFeedback]=useState("");
  const [error,setError]=useState("");
  if(!exercise)return <><BackHeader label="BIBLIOTECA" onBack={onBack}/><div className="empty-state"><Info size={28}/><h3>Exercício indisponível</h3><p>Este movimento pode ter sido excluído da sua biblioteca.</p></div></>;
  const guide=guideFor(exercise);
  const alternatives=matchingAlternatives(exercise,catalog);
  const links=plans.flatMap(plan=>plan.exercises.filter(row=>row.exerciseId===exercise.id).map(row=>({id:row.id,planId:plan.id,planName:plan.name})));
  const target=links.find(link=>link.planId===selectedPlan&&link.id===selectedRow)??links.find(link=>link.planId===selectedPlan);
  const chosen=alternatives.find(alt=>alt.id===selectedAlternative);
  const change=async()=>{
    if(!target||!chosen)return;
    if(!window.confirm("Substituir '"+exercise.name+"' por '"+chosen.name+"' em '"+target.planName+"'? Séries planejadas, cargas e descanso serão preservados. O histórico já realizado não muda."))return;
    setBusy(true);setFeedback("");setError("");
    try{await onReplace(target.planId,target.id,chosen);setFeedback("Substituição salva na ficha. O histórico não foi alterado.");}
    catch(e){setError(e instanceof Error?e.message:"Não foi possível trocar o exercício.");}
    finally{setBusy(false);}
  };
  return <div className="exercise-detail-page">
    <BackHeader label="GUIA DE EXERCÍCIO" onBack={onBack}/>
    <div className="atlas-detail-title"><span className="eyebrow">{exercise.isCustom?"EXERCÍCIO PERSONALIZADO":"PROGRAMA 10/10 · GUIA DE EXECUÇÃO"}</span>
      <h1>{exercise.name}<span>.</span></h1>
      <div className="atlas-tags"><span>{exercise.primaryMuscle}</span><span>{exercise.equipment??"Equipamento a definir"}</span></div>
    </div>
    <MuscleMap primaryMuscle={exercise.primaryMuscle}/>
    <SectionHead title="Como executar" aside={guide?"3 etapas":"Guia indisponível"}/>
    {guide?<div className="atlas-steps">{guide.execution.map((step,i)=><div key={step}><span>{String(i+1).padStart(2,"0")}</span><p>{step}</p></div>)}</div>:
      <div className="atlas-guide-missing"><BookOpen size={21}/><div><strong>Sem instruções específicas</strong><p>Este exercício foi cadastrado manualmente ou ainda não tem um guia verificado. Não vamos inventar passos de execução para ele.</p></div></div>}
    {guide&&<><SectionHead title="Cuidados na execução"/><div className="atlas-cautions">{guide.avoid.map(tip=><div key={tip}><Info size={17}/><span>{tip}</span></div>)}</div>
      <div className="atlas-muscle-focus"><strong>Principal objetivo muscular</strong><p>{guide.focus}</p></div></>}
    <SectionHead title="Possíveis substituições" aside={alternatives.length+" opções"}/>
    <p className="atlas-section-description">Movimentos de foco semelhante podem ter trajetórias e equipamentos diferentes. Escolha conforme disponibilidade, conforto e objetivo.</p>
    {alternatives.length===0?<div className="atlas-guide-missing">Nenhuma alternativa cadastrada. Crie outra opção no editor de fichas.</div>:
    <div className="atlas-alternatives">{alternatives.map(alt=><button type="button" key={alt.id} onClick={()=>onOpen(alt.id)}>
      <ExerciseIcon muscle={alt.primaryMuscle}/><span><strong>{alt.name}</strong><small>{alt.equipment??alt.primaryMuscle}</small></span><ArrowRight size={18}/></button>)}</div>}
    {links.length>0&&alternatives.length>0&&<section className="atlas-replace-panel">
      <div className="atlas-replace-heading"><ShieldCheck size={21}/><div><strong>Substituir na sua ficha</strong><p>Troque apenas este movimento, preservando séries, faixas de repetições e descanso.</p></div></div>
      <label>Em qual ficha?
        <select value={target?.planId??""} onChange={e=>{setSelectedPlan(e.target.value);setSelectedRow("");}}>
          {[...new Map(links.map(link=>[link.planId,link])).values()].map(link=><option value={link.planId} key={link.planId}>{link.planName}</option>)}
        </select></label>
      {links.filter(link=>link.planId===(target?.planId??"")).length>1&&<label>Qual posição da ficha?
        <select value={target?.id??""} onChange={e=>setSelectedRow(e.target.value)}>
          {links.filter(link=>link.planId===target?.planId).map((link,i)=><option value={link.id} key={link.id}>Posição {i+1}</option>)}
        </select></label>}
      <label>Substituir por
        <select value={selectedAlternative} onChange={e=>setSelectedAlternative(e.target.value)}>
          <option value="">Selecione uma alternativa</option>
          {alternatives.map(alt=><option key={alt.id} value={alt.id}>{alt.name}</option>)}
        </select></label>
      <button type="button" className="atlas-confirm-swap" disabled={busy||!chosen} onClick={()=>{void change();}}>
        {busy?"Salvando...":"Confirmar substituição"} <ArrowRight size={17}/>
      </button>
      {feedback&&<div className="editor-saved" role="status">{feedback}</div>}
      {error&&<div className="editor-error" role="alert">{error}</div>}
    </section>}
    <Notice>Orientações educativas e mapa muscular ilustrativo. Adapte amplitude e carga à sua técnica, à máquina disponível e ao seu conforto; na presença de dor, interrompa e procure orientação profissional.</Notice>
  </div>;
}
