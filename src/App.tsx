import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, ArrowDownToLine, ArrowRight, ArrowUpRight, BarChart3, BookOpen,
  CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3,
  Dumbbell, Flame, Footprints, House, Info, Minus, MoreHorizontal,
  Pause, Play, Plus, RotateCcw, Search, Share2, ShieldCheck,
  SlidersHorizontal, Sparkles, TrendingUp, UserRound, X
} from "lucide-react";
import { DemoLabel, Photo, Titlebar, SectionHead, BackHeader, PrimaryButton, Notice } from "./components/ui";
import { exercises, mockWeights, mockReps, photos } from "./data/demo";
import ProfilePanel, { type StorageState } from "./features/profile/ProfilePanel";
import { DEFAULT_SETTINGS } from "./data/validation";
import { readSettings, writeSettings } from "./data/storage";
import type { Exercise, ScheduledCardio, UserSettings, WorkoutPlan } from "./domain/models";
import { savePlanWithExercises, deleteEntity, writeSettings } from "./data/storage";
import PlanEditor from "./features/program/PlanEditor";
import ScheduleEditor from "./features/program/ScheduleEditor";
import { configuredPlanIds, resolveSchedule } from "./features/program/programSchedule";
import { PROGRAM_DAYS, PROGRAM_NAME, buildProgramCatalog, planId, seriesCount } from "./data/program1010";
import { ProgramOverview, ProgramDayDetail, ProgramLibrary, type ProgramStatus } from "./features/program/ProgramView";
import { ensureProgramCatalog, listEntities } from "./data/storage";

type Tab = "home" | "workouts" | "library" | "progress" | "profile";
type Screen = Tab | "exercise" | "session" | "rest" | "run" | "share" | "program" | "edit-plan" | "edit-schedule";
type ShareKind = "strength" | "run";
type ShareFormat = "story" | "feed" | "square";
type ShareStyle = "ember" | "minimal";
const navItems: { screen: Tab; label: string; icon: typeof House }[] = [
  { screen:"home", label:"Hoje", icon:House },
  { screen:"workouts", label:"Treinar", icon:Dumbbell },
  { screen:"library", label:"Exercícios", icon:BookOpen },
  { screen:"progress", label:"Evolução", icon:BarChart3 },
  { screen:"profile", label:"Perfil", icon:UserRound }
];
const formats: Record<ShareFormat, [number, number]> = {
  story: [1080, 1920], feed: [1080, 1350], square: [1080, 1080]
};
const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const today = new Date();
const todayIndex = (today.getDay()+6)%7;
const monday = new Date(today.getFullYear(),today.getMonth(),today.getDate()-todayIndex);
const weekDates = weekdays.map((name,i)=>({name,day:new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+i).getDate()}));
const fmtTime = (seconds: number) => String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
const fmtPace = (durationMinutes: number, distanceKm: number) => {
  if (distanceKm <= 0 || durationMinutes <= 0) return "—";
  const seconds = Math.round(durationMinutes * 60 / distanceKm);
  return Math.floor(seconds/60) + "'" + String(seconds % 60).padStart(2,"0") + "\"/km";
};
function DemoImageFallback({label="GYM"}:{label?:string}) {
  return <div className="image-fallback"><Dumbbell size={30} aria-hidden="true"/><span>{label}</span></div>;
}
function WorkoutThumbnail({exerciseIndex=0}:{exerciseIndex?:number}) {
  const exercise=exercises[exerciseIndex];
  return exercise.id==="lat"
    ? <Photo className="exercise-thumb" src={exercise.image} alt="Pessoa realizando puxada alta na polia"/>
    : <div className="exercise-thumb thumb-gradient"><Dumbbell size={22} aria-hidden="true"/></div>;
}
function downloadSampleCard(kind:ShareKind,format:ShareFormat,style:ShareStyle,duration:number,distance:number,showHr:boolean,onResult:(msg:string)=>void) {
  const [width,height] = formats[format];
  const canvas=document.createElement("canvas");
  canvas.width=width; canvas.height=height;
  const ctx=canvas.getContext("2d");
  if(!ctx){onResult("Não foi possível preparar a imagem neste navegador.");return;}
  const dark=style==="ember";
  const bg=dark?"#101113":"#e9e8e4", ink=dark?"#fbf8f4":"#181818",muted=dark?"#a8aaad":"#686868",accent="#ff6d27";
  ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
  if(dark){
    const g=ctx.createRadialGradient(width*.78,height*.3,0,width*.78,height*.3,height*.66);
    g.addColorStop(0,"#562719");g.addColorStop(.55,"#201817");g.addColorStop(1,"#101113");
    ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
  }
  ctx.fillStyle=accent;ctx.fillRect(90,108,80,11);
  ctx.fillStyle=ink;ctx.font="900 65px system-ui, sans-serif";ctx.fillText("GYM.",90,210);
  ctx.fillStyle=muted;ctx.font="500 29px system-ui, sans-serif";ctx.fillText("EXEMPLO · DADOS FICTÍCIOS",90,275);
  const isSquare=height===1080;
  const middle=height*(isSquare?.34:.46);
  ctx.fillStyle=ink;ctx.font="800 55px system-ui, sans-serif";
  ctx.fillText(kind==="strength"?"TREINO CONCLUÍDO":"CORRIDA DE HOJE",90,middle-130);
  ctx.fillStyle=accent;ctx.font="900 140px system-ui, sans-serif";
  ctx.fillText(kind==="strength"?"COSTAS":distance.toLocaleString("pt-BR",{maximumFractionDigits:2})+" KM",84,middle+10);
  ctx.fillStyle=ink;ctx.font="700 50px system-ui, sans-serif";
  ctx.fillText(kind==="strength"?"+ BÍCEPS":"NO SEU RITMO",90,middle+80);
  ctx.strokeStyle=muted;ctx.globalAlpha=.4;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(90,middle+155);ctx.lineTo(width-90,middle+155);ctx.stroke();ctx.globalAlpha=1;
  const lines=kind==="strength"?[["DURAÇÃO","55 MIN"],["EXERCÍCIOS","5"],["SÉRIES","11"]]:[["TEMPO",duration+" MIN"],["RITMO",fmtPace(duration,distance)],["TIPO","ESTEIRA"]];
  const visibleLines=isSquare?lines.slice(0,2):lines;
  visibleLines.forEach(([label,value],i)=>{const y=middle+235+i*133;ctx.fillStyle=muted;ctx.font="600 27px system-ui, sans-serif";ctx.fillText(label,92,y);ctx.fillStyle=ink;ctx.font="800 64px system-ui, sans-serif";ctx.fillText(value,90,y+68);});
  if(showHr){ctx.fillStyle=muted;ctx.font="500 26px system-ui, sans-serif";ctx.fillText("Frequência cardíaca não informada",90,height-230);}
  ctx.fillStyle=muted;ctx.font="500 28px system-ui, sans-serif";ctx.fillText("Movimento é progresso.",90,height-115);
  canvas.toBlob(blob=>{
    if(!blob){onResult("Não foi possível exportar a imagem.");return;}
    const url=URL.createObjectURL(blob),anchor=document.createElement("a");
    anchor.href=url;anchor.download="gym-previa-"+kind+"-"+format+".png";anchor.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),10000);
    onResult("Imagem de exemplo preparada para download.");
  },"image/png");
}
export default function App(){
  const [screen,setScreen]=useState<Screen>("home");
  const [exerciseIndex,setExerciseIndex]=useState(0);
  const [setIndex,setSetIndex]=useState(0);
  const [completed,setCompleted]=useState<Record<string,boolean>>({});
  const [weight,setWeight]=useState<Record<string,number>>({});
  const [reps,setReps]=useState<Record<string,number>>({});
  const [restLeft,setRestLeft]=useState(90);
  const [restRunning,setRestRunning]=useState(false);
  const [libraryFilter,setLibraryFilter]=useState("Todos");
  const [search,setSearch]=useState("");
  const [period,setPeriod]=useState("3 meses");
  const [runMode,setRunMode]=useState("Esteira");
  const [runMinutes,setRunMinutes]=useState(20);
  const [runDistance,setRunDistance]=useState(3.2);
  const [shareKind,setShareKind]=useState<ShareKind>("strength");
  const [shareFormat,setShareFormat]=useState<ShareFormat>("story");
  const [shareStyle,setShareStyle]=useState<ShareStyle>("ember");
  const [shareHeart,setShareHeart]=useState(false);
  const [exportStatus,setExportStatus]=useState("");
  const [settings,setSettings]=useState<UserSettings>(DEFAULT_SETTINGS);
  const [storageState,setStorageState]=useState<StorageState>("loading");
  const [storageError,setStorageError]=useState("");
  const [settingsReady,setSettingsReady]=useState(false);
  const writeQueue=useRef<Promise<void>>(Promise.resolve());
  const saveGeneration=useRef(0);

  useEffect(()=>{
    let active=true;
    readSettings().then(value=>{
      if(!active)return;
      setSettings(value);setStorageState("ready");setSettingsReady(true);
    }).catch(error=>{
      if(!active)return;
      setStorageError(error instanceof Error?error.message:"Falha no armazenamento.");
      setStorageState("error");
    });
    return ()=>{active=false;};
  },[]);

  useEffect(()=>{
    if(!settingsReady)return;
    const generation=++saveGeneration.current;
    setStorageState("saving");
    const timer=window.setTimeout(()=>{
      const operation=writeQueue.current.catch(()=>{}).then(()=>writeSettings(settings));
      writeQueue.current=operation;
      operation.then(()=>{
        if(generation===saveGeneration.current){setStorageState("saved");setStorageError("");}
      }).catch(error=>{
        if(generation===saveGeneration.current){
          setStorageState("error");
          setStorageError(error instanceof Error?error.message:"Não foi possível salvar.");
        }
      });
    },500);
    return ()=>window.clearTimeout(timer);
  },[settings,settingsReady]);

  const flushSettings=async()=>{
    await writeQueue.current;
    await writeSettings(settings);
  };
  const [day,setDay]=useState(todayIndex);
  const [editingPlanId,setEditingPlanId]=useState<string|null>(null);
  const [editorSerial,setEditorSerial]=useState(0);
  const [programStatus,setProgramStatus]=useState<ProgramStatus>("loading");
  const [savedPlans,setSavedPlans]=useState<WorkoutPlan[]>([]);
  const [catalogExercises,setCatalogExercises]=useState<Exercise[]>([]);

  const loadProgram=async(install:boolean)=>{
    setProgramStatus("loading");
    try {
      if(install) await ensureProgramCatalog(buildProgramCatalog(new Date().toISOString()));
      const [plans,catalog] = await Promise.all([
        listEntities<WorkoutPlan>("plans"),listEntities<Exercise>("exercises")
      ]);
      setSavedPlans(plans);
      setCatalogExercises(catalog);
      const allPresent=PROGRAM_DAYS.filter(d=>d.exercises.length>0).every(d=>plans.some(p=>p.id===planId(d.id)));
      setProgramStatus(allPresent?"ready":"not_installed");
    }catch{
      setProgramStatus("error");
    }
  };
  useEffect(()=>{void loadProgram(true);},[]);
  const openProgram=(index:number)=>{setDay(index);go("program");};
  const assignedDays=resolveSchedule(settings,savedPlans);
  const selectedDay=assignedDays[day].day;
  const selectedPlan=assignedDays[day].plan;
  const assignedIds=new Set(assignedDays.map(x=>x.planId).filter(Boolean));
  const unassignedPlans=savedPlans.filter(p=>!assignedIds.has(p.id));
  const editPlan=(id:string|null)=>{setEditingPlanId(id);setEditorSerial(v=>v+1);go("edit-plan");};
  const persistPlan=async(plan:WorkoutPlan,additions:Exercise[])=>{
    await savePlanWithExercises(plan,additions);
    await loadProgram(false);
    go("workouts");
  };
  const deletePlan=async(plan:WorkoutPlan)=>{
    if(configuredPlanIds(settings).includes(plan.id)) throw new Error("Retire esta ficha da agenda semanal antes de excluí-la.");
    if(!plan.id.startsWith("custom-")) throw new Error("A ficha original não pode ser excluída, mas pode sair da agenda.");
    await deleteEntity("plans",plan.id);
    await loadProgram(false);
    go("workouts");
  };
  const saveSchedule=async(ids:Array<string|null>,cardio:Array<ScheduledCardio|null>)=>{
    const next={...settings,weeklyPlanIds:ids,weeklyCardio:cardio};
    await flushSettings();
    await writeSettings(next);
    setSettings(next);
    go("workouts");
  };

  useEffect(()=>{
    if(screen!=="rest" || !restRunning || restLeft<=0) return;
    const interval=window.setInterval(()=>setRestLeft(v=>Math.max(0,v-1)),1000);
    return ()=>window.clearInterval(interval);
  },[screen,restRunning,restLeft]);
  useEffect(()=>{if(restLeft===0)setRestRunning(false)},[restLeft]);
  const go=(next:Screen)=>{setScreen(next);window.scrollTo({top:0,behavior:"instant"});};
  const openExercise=(index:number)=>{setExerciseIndex(index);go("exercise");};
  const sessionEx=exercises[exerciseIndex];
  const currentKey=exerciseIndex+"-"+setIndex;
  const completedCount=Object.values(completed).filter(Boolean).length;
  const plannedTotal=exercises.reduce((n,e)=>n+e.sets,0);
  const progressPct=Math.round(completedCount/plannedTotal*100);
  const filtered=useMemo(()=>exercises.filter(e=>(libraryFilter==="Todos"||e.muscle===libraryFilter)&&e.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))),[search,libraryFilter]);
  const markSet=()=>{
    if(completed[currentKey]){setCompleted(previous=>({...previous,[currentKey]:false}));return;}
    setCompleted(previous=>({...previous,[currentKey]:true}));
    if(setIndex<sessionEx.sets-1)setSetIndex(v=>v+1);
    else if(exerciseIndex<exercises.length-1){setExerciseIndex(v=>v+1);setSetIndex(0);}
    setRestLeft(sessionEx.rest);setRestRunning(true);go("rest");
  };
  const startDemo=()=>{setExerciseIndex(0);setSetIndex(0);go("session");};
  const resetDemo=()=>{
    if(!window.confirm("Reiniciar apenas os valores desta prévia? Nenhum dado real será apagado."))return;
    setCompleted({});setWeight({});setReps({});setExerciseIndex(0);setSetIndex(0);setRunDistance(3.2);setRunMinutes(20);setExportStatus("");go("home");
  };
  const viewShare=(kind:ShareKind)=>{setShareKind(kind);setExportStatus("");go("share");};
  const increment=(kind:"weight"|"reps", delta:number)=>{
    if(kind==="weight")setWeight(prev=>({...prev,[currentKey]:Math.min(500,Math.max(0,(prev[currentKey]??mockWeights[sessionEx.id])+delta))}));
    else setReps(prev=>({...prev,[currentKey]:Math.min(100,Math.max(0,(prev[currentKey]??mockReps[sessionEx.id])+delta))}));
  };
  const tab=navItems.find(n=>n.screen===screen)?.screen??(screen==="run"||screen==="program"||screen==="edit-plan"||screen==="edit-schedule"?"workouts":screen==="share"?"progress":"workouts");
  return <div className={"gym-app"+(settings.largeText?" large-text":"")+(settings.reducedMotion?" reduced-motion":"")}>
    <div className="desktop-rail" aria-hidden="true"><span>GYM</span><i/><small>MOVE WITH PURPOSE</small></div>
    <div className="app-column">
      <header className="app-header">
        <button className="logo" type="button" disabled={screen==="edit-plan"||screen==="edit-schedule"} onClick={()=>go("home")} aria-label="GYM, voltar ao início">GYM<span>.</span></button>
        <div className="header-actions">{["home","workouts","program"].includes(screen)?<span className="program-header-tag">10/10</span>:<DemoLabel compact/>}<button type="button" className="header-avatar" onClick={()=>go("profile")} aria-label="Abrir perfil"><UserRound size={20}/></button></div>
      </header>
      <main className="app-main" id="main-content">
        {screen==="home"&&<>
          <section className="greeting"><p className="eyebrow">SEU ESPAÇO DE MOVIMENTO</p><div className="heading-line"><h1>Vamos treinar<span className="orange">.</span></h1><span className="date-mark"><CalendarDays size={15}/> HOJE</span></div><p>Um passo de cada vez. Seu ritmo, suas conquistas.</p></section>
          <div className="week-strip" aria-label="Escolha um dia da semana">{weekDates.map(({name,day:calendarDay},i)=><button type="button" key={name} onClick={()=>setDay(i)} className={day===i?"day-item selected":"day-item"} aria-pressed={day===i}><span>{name.toUpperCase()}</span><strong>{calendarDay}</strong><i/></button>)}</div>
          <section className="hero-card"><Photo src={photos.hero} alt="Ambiente de academia" className="hero-photo"/><div className="hero-shade"/><div className="hero-info"><div className="topchip"><Flame size={13}/> {PROGRAM_NAME.toUpperCase()} · VERSÃO 2.0</div><div className="hero-lower"><p>{selectedDay.weekday.toUpperCase()} / {selectedDay.exercises.length?"MUSCULAÇÃO":"RECUPERAÇÃO"}</p><h2>{selectedDay.title}<span>.</span></h2><div className="hero-stats">{selectedDay.exercises.length?<><span><Dumbbell size={14}/>{selectedDay.exercises.length} exercícios</span><span><CheckCircle2 size={14}/>{seriesCount(selectedDay)} séries efetivas</span></>:<span><Activity size={14}/> Descanso / recuperação</span>}{selectedDay.cardio&&<span><Footprints size={14}/>{selectedDay.cardio.label}{selectedDay.cardio.minutes?" · "+selectedDay.cardio.minutes+" min":""}</span>}</div><button type="button" className="hero-cta" onClick={()=>openProgram(day)}>Ver programação do dia <ArrowRight size={20}/></button></div></div></section>
          <SectionHead title="Seu espaço" aside="Explorar treinos" onClick={()=>go("workouts")}/>
          <div className="home-cards"><button className="feature-mini" type="button" onClick={()=>go("run")}><div className="feature-icon"><Footprints size={24}/></div><small>CARDIO</small><h3>Corrida & esteira</h3><p>Ritmo, distância e tempo</p><ArrowUpRight className="corner-arrow" size={18}/></button><button className="feature-mini" type="button" onClick={()=>go("progress")}><div className="feature-icon"><TrendingUp size={24}/></div><small>RESULTADOS</small><h3>Sua evolução</h3><p>Gráficos e recordes</p><ArrowUpRight className="corner-arrow" size={18}/></button></div>
          <div className="callout-line"><Sparkles size={18}/><span>{programStatus==="ready"?"Programa 10/10 cadastrado no armazenamento local. O registro das séries será ativado na Sprint 04.":programStatus==="loading"?"Preparando o Programa 10/10...":"A ficha pode ser consultada, mas ainda não foi confirmada no armazenamento local."}</span></div>
        </>}
        {screen==="workouts"&&<ProgramOverview status={programStatus} onOpen={openProgram} onInstall={()=>{void loadProgram(true);}}
          assigned={assignedDays} unassigned={unassignedPlans}
          onEdit={id=>editPlan(id)} onNew={()=>editPlan(null)} onEditSchedule={()=>go("edit-schedule")}/>}
        {screen==="edit-plan"&&<PlanEditor key={editingPlanId??"new-"+editorSerial}
          initial={savedPlans.find(p=>p.id===editingPlanId)} catalog={catalogExercises}
          onSave={persistPlan} onDelete={deletePlan} onCancel={()=>go("workouts")}/>}
        {screen==="edit-schedule"&&<ScheduleEditor
          settings={settings} plans={savedPlans} onSave={saveSchedule}
          onCancel={()=>go("workouts")}/>}
        {screen==="program"&&<ProgramDayDetail
          day={selectedDay}
          onBack={()=>go("workouts")}
          onPreview={startDemo}
          onCardio={()=>go("run")}
          plan={selectedPlan}
          catalog={catalogExercises}
          status={programStatus}
          onEdit={()=>{if(selectedPlan)editPlan(selectedPlan.id);}}
        />}
        {screen==="library"&&<>
          <Titlebar eyebrow="CONHECIMENTO EM MOVIMENTO" title="Exercícios." right={<button type="button" className="round-control" onClick={()=>{setLibraryFilter("Todos");setSearch("");}} aria-label="Limpar filtros"><SlidersHorizontal size={19}/></button>}/>
          <p className="screen-lead">Consulte os exercícios do seu Programa 10/10 e seus dias de treinamento.</p>
          <ProgramLibrary onOpen={sourceIndex=>{
            const originalId=planId(PROGRAM_DAYS[sourceIndex].id);
            const scheduledIndex=assignedDays.findIndex(d=>d.planId===originalId);
            if(scheduledIndex>=0)openProgram(scheduledIndex);else editPlan(originalId);
          }}/>
          <details className="demo-library-disclosure"><summary>Biblioteca visual experimental <span>5 exemplos fictícios</span></summary>
          <label className="search-box"><Search size={20}/><input type="search" placeholder="Buscar exercício" value={search} onChange={e=>setSearch(e.target.value)} aria-label="Buscar exercício"/></label>
          <div className="filter-row" aria-label="Filtrar por grupo muscular">{["Todos","Costas","Braços"].map(item=><button type="button" key={item} className={libraryFilter===item?"filter-chip active":"filter-chip"} onClick={()=>setLibraryFilter(item)} aria-pressed={libraryFilter===item}>{item}</button>)}</div>
          <SectionHead title="Biblioteca" aside={filtered.length+" movimentos"}/>
          {filtered.length===0?<div className="empty-state"><Search size={27}/><h3>Nenhum exercício encontrado</h3><p>Tente buscar por outro nome ou limpar os filtros.</p><PrimaryButton secondary onClick={()=>{setSearch("");setLibraryFilter("Todos")}}>Limpar busca</PrimaryButton></div>:<div className="library-grid">{filtered.map(ex=>{const i=exercises.findIndex(e=>e.id===ex.id);return <button type="button" className="library-card" key={ex.id} onClick={()=>openExercise(i)}><WorkoutThumbnail exerciseIndex={i}/><div><span className="library-muscle">{ex.muscle.toUpperCase()}</span><h3>{ex.name}</h3><p>{ex.equipment}</p></div><ChevronRight size={18}/></button>})}</div>}
          <Notice>As imagens desta seção são exemplos da interface. As fotografias de execução dos exercícios reais serão preparadas na Sprint 06.</Notice>
          </details>
        </>}
        {screen==="exercise"&&<>
          <BackHeader label="EXERCÍCIO" onBack={()=>go("library")} action={<button type="button" className="round-control" onClick={()=>go("workouts")} aria-label="Ir para ficha"><Dumbbell size={19}/></button>}/>
          <div className="exercise-hero">{sessionEx.id==="lat"?<Photo src={sessionEx.image} alt="Pessoa executando puxada alta na academia"/>:<DemoImageFallback label="IMAGEM EM PREPARAÇÃO"/>}<div className="exercise-hero-label">BIBLIOTECA VISUAL · PRÉVIA</div></div>
          <div className="exercise-detail-head"><div><p className="eyebrow">{sessionEx.muscle.toUpperCase()} / {sessionEx.equipment.toUpperCase()}</p><h1>{sessionEx.name}</h1></div><span className="small-number">{String(exerciseIndex+1).padStart(2,"0")}/{String(exercises.length).padStart(2,"0")}</span></div>
          <div className="muscle-pills"><span>{sessionEx.muscle}</span><span>{sessionEx.secondary}</span></div>
          <div className="detail-meta"><div><small>SÉRIES</small><strong>{sessionEx.sets}</strong></div><div><small>REPETIÇÕES</small><strong>{sessionEx.reps}</strong></div><div><small>DESCANSO</small><strong>{sessionEx.rest}s</strong></div></div>
          <SectionHead title="Como executar" aside="Orientações gerais"/>
          <div className="steps">{sessionEx.cues.map((cue,i)=><div className="step" key={cue}><span>{String(i+1).padStart(2,"0")}</span><p>{cue}</p></div>)}</div>
          <Notice>Orientações gerais, não substituem avaliação individualizada. Imagens de execução serão ampliadas na Sprint 06.</Notice>
          <div className="bottom-actions"><PrimaryButton onClick={()=>{setSetIndex(0);go("session");}}>Ver no treino <ArrowRight size={18}/></PrimaryButton><div className="stepper"><button type="button" aria-label="Exercício anterior" onClick={()=>setExerciseIndex((exerciseIndex+exercises.length-1)%exercises.length)}><ChevronLeft/></button><span>Outro exercício</span><button type="button" aria-label="Próximo exercício" onClick={()=>setExerciseIndex((exerciseIndex+1)%exercises.length)}><ChevronRight/></button></div></div>
        </>}
        {screen==="session"&&<>
          <BackHeader label="MODO ACADEMIA · DEMONSTRAÇÃO" onBack={()=>go("workouts")} action={<span className="session-progress">{completedCount}/{plannedTotal}</span>}/>
          <div className="session-top"><p className="eyebrow">TREINO A / COSTAS & BÍCEPS</p><h1>Em movimento<span className="orange">.</span></h1><div className="progress-track"><span style={{width:progressPct+"%"}}/></div><p>{progressPct}% da ficha demonstrativa marcada</p></div>
          <div className="session-image">{sessionEx.id==="lat"?<Photo src={sessionEx.image} alt="Pessoa realizando puxada alta"/>:<DemoImageFallback label="FOTO DO EXERCÍCIO EM BREVE"/>}<span>EXERCÍCIO {exerciseIndex+1} DE {exercises.length}</span></div>
          <h2 className="session-exercise-title">{sessionEx.name}</h2>
          <div className="session-meta"><span>{sessionEx.sets} séries</span><span>{sessionEx.reps} reps</span><span>{sessionEx.rest}s de descanso</span></div>
          <div className="series-pips" aria-label="Selecionar série">{Array.from({length:sessionEx.sets},(_,i)=><button type="button" key={i} className={(setIndex===i?"current ":"")+(completed[exerciseIndex+"-"+i]?"done":"")} onClick={()=>setSetIndex(i)} aria-label={"Selecionar série "+(i+1)} aria-pressed={setIndex===i}>{completed[exerciseIndex+"-"+i]?<Check size={16}/>:i+1}</button>)}</div>
          <div className="logger-card"><div className="logger-header"><span>SÉRIE {String(setIndex+1).padStart(2,"0")}</span><span>{completed[currentKey]?"CONCLUÍDA NA PRÉVIA":"PRONTA PARA REGISTRO"}</span></div>
            <div className="logger-values"><div className="value-control"><label htmlFor="gym-weight">CARGA <span>KG</span></label><div><button type="button" onClick={()=>increment("weight",-1)} aria-label="Diminuir carga"><Minus size={20}/></button><input id="gym-weight" inputMode="decimal" type="number" min="0" max="500" step="0.5" value={weight[currentKey]??mockWeights[sessionEx.id]} onChange={e=>setWeight(prev=>({...prev,[currentKey]:Math.min(500,Math.max(0,Number(e.target.value)||0))}))}/><button type="button" onClick={()=>increment("weight",1)} aria-label="Aumentar carga"><Plus size={20}/></button></div></div>
            <div className="value-control"><label htmlFor="gym-reps">REPETIÇÕES</label><div><button type="button" onClick={()=>increment("reps",-1)} aria-label="Diminuir repetições"><Minus size={20}/></button><input id="gym-reps" inputMode="numeric" type="number" min="0" max="100" step="1" value={reps[currentKey]??mockReps[sessionEx.id]} onChange={e=>setReps(prev=>({...prev,[currentKey]:Math.min(100,Math.max(0,Math.floor(Number(e.target.value)||0)))}))}/><button type="button" onClick={()=>increment("reps",1)} aria-label="Aumentar repetições"><Plus size={20}/></button></div></div></div>
            <PrimaryButton onClick={markSet} secondary={!!completed[currentKey]}>{completed[currentKey]?"Desmarcar série":"Concluir série"} <CheckCircle2 size={19}/></PrimaryButton></div>
          <div className="inline-controls"><button type="button" onClick={()=>{setExerciseIndex((exerciseIndex+exercises.length-1)%exercises.length);setSetIndex(0)}}><ChevronLeft size={20}/>Anterior</button><button type="button" onClick={()=>{setExerciseIndex((exerciseIndex+1)%exercises.length);setSetIndex(0)}}>Próximo<ChevronRight size={20}/></button></div>
          <button type="button" className="finish-link" onClick={()=>viewShare("strength")}><Share2 size={17}/> Visualizar card de conclusão (exemplo)</button>
          <Notice>Esta sessão é uma simulação de interface. Peso e repetições ainda não são gravados; salvamento real chega nas Sprints 02–04.</Notice>
        </>}
        {screen==="rest"&&<>
          <BackHeader label="INTERVALO ENTRE SÉRIES" onBack={()=>go("session")} action={<button type="button" className="round-control" onClick={()=>{setRestLeft(sessionEx.rest);setRestRunning(true)}} aria-label="Reiniciar descanso"><RotateCcw size={18}/></button>}/>
          <div className="rest-screen"><div className="rest-kicker"><span>GYM / RECOVERY</span><span>DESCANSO</span></div><h1>{restLeft===0?"Pronto para a próxima.":"Respira. Recupera."}</h1><div className="timer-ring" style={{background:"conic-gradient(#ff712c "+((1-restLeft/Math.max(1,sessionEx.rest))*360)+"deg, #292a2e 0)"}}><div className="timer-center"><span>DESCANSO</span><strong aria-live="off">{fmtTime(restLeft)}</strong><small>{restLeft===0?"TEMPO CONCLUÍDO":restRunning?"CONTANDO...":"PAUSADO"}</small></div></div><div className="timer-actions"><button type="button" onClick={()=>setRestLeft(v=>Math.max(0,v-15))}>−15s</button><button type="button" className="timer-toggle" onClick={()=>setRestRunning(v=>!v)} aria-label={restRunning?"Pausar":"Continuar"}>{restRunning?<Pause fill="currentColor"/>:<Play fill="currentColor"/>}</button><button type="button" onClick={()=>setRestLeft(v=>Math.min(600,v+15))}>+15s</button></div><div className="next-set"><span>PRÓXIMO PASSO</span><strong>{sessionEx.name}</strong><small>Continue a simulação de séries</small></div><PrimaryButton onClick={()=>go("session")}>Voltar ao treino <ArrowRight size={18}/></PrimaryButton></div>
          <Notice>Contador demonstrativo: em segundo plano, o navegador pode suspender a contagem. Sincronização por horário real será implementada na Sprint 05.</Notice>
        </>}
        {screen==="run"&&<>
          <BackHeader label="CARDIO / CORRIDA" onBack={()=>go("workouts")}/>
          <div className="run-hero"><Photo src={photos.running} alt="Pessoa correndo em esteira na academia"/><div><span>ENCONTRE SEU RITMO</span><h1>Corre no<br/>seu tempo<span>.</span></h1></div></div>
          <SectionHead title="Sua atividade" aside="Prévia interativa"/>
          <div className="segmented">{["Esteira","Ar livre"].map(mode=><button type="button" key={mode} className={runMode===mode?"active":""} aria-pressed={runMode===mode} onClick={()=>setRunMode(mode)}>{mode==="Esteira"?<Activity size={17}/>:<Footprints size={17}/>} {mode}</button>)}</div>
          <div className="run-stats"><div className="run-input"><label htmlFor="minutes">DURAÇÃO <small>MIN</small></label><div className="run-input-row"><input id="minutes" type="number" min="0" max="999" step="1" inputMode="numeric" value={runMinutes} onChange={e=>setRunMinutes(Math.max(0,Math.min(999,Math.floor(Number(e.target.value)||0))))}/><Clock3 size={25}/></div></div><div className="run-input"><label htmlFor="distance">DISTÂNCIA <small>KM</small></label><div className="run-input-row"><input id="distance" type="number" min="0" max="500" step="0.1" inputMode="decimal" value={runDistance} onChange={e=>setRunDistance(Math.max(0,Math.min(500,Number(e.target.value)||0)))}/><Footprints size={25}/></div></div></div>
          <div className="pace-card"><div><small>RITMO MÉDIO ESTIMADO</small><strong>{fmtPace(runMinutes,runDistance)}</strong><span>{runMode==="Esteira"?"Calculado para esteira":"Calculado para corrida externa"}</span></div><Activity size={40}/></div>
          <Notice>Valores editáveis apenas para demonstração. Ainda não são registrados nem medidos por GPS ou Apple Watch.</Notice>
          <PrimaryButton onClick={()=>viewShare("run")}>Criar card desta corrida <Share2 size={18}/></PrimaryButton>
        </>}
        {screen==="progress"&&<>
          <Titlebar eyebrow="TUDO COMEÇA COM CONSTÂNCIA" title="Evolução." right={<button type="button" className="round-control" onClick={()=>viewShare("strength")} aria-label="Criar card"><Share2 size={19}/></button>}/>
          <p className="screen-lead">Um lugar para enxergar cada pequena conquista.</p>
          <div className="data-warning"><Info size={16}/> GRÁFICOS ILUSTRATIVOS — NÃO SÃO SEUS RESULTADOS</div>
          <div className="progress-summary"><div><span>SESSÕES DE EXEMPLO</span><strong>12</strong><small><TrendingUp size={14}/> em três meses</small></div><div><span>CARGA ILUSTRATIVA</span><strong>42 <em>kg</em></strong><small><TrendingUp size={14}/> puxada alta</small></div></div>
          <div className="chart-panel"><div className="chart-head"><div><span className="eyebrow">PROGRESSÃO DE CARGA</span><h2>Puxada alta</h2></div><MoreHorizontal size={23}/></div><div className="periods">{["1 mês","3 meses","6 meses"].map(item=><button type="button" key={item} className={period===item?"active":""} onClick={()=>setPeriod(item)}>{item}</button>)}</div><div className="chart-shell"><div className="chart-y"><span>50</span><span>40</span><span>30</span><span>20</span></div><svg viewBox="0 0 310 190" aria-label="Gráfico ilustrativo de aumento de cargas"><defs><linearGradient id="area-gym" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff712c" stopOpacity=".28"/><stop offset="100%" stopColor="#ff712c" stopOpacity="0"/></linearGradient></defs>{[28,70,112,154].map(n=><line key={n} x1="0" x2="310" y1={n} y2={n} stroke="#393a3f" strokeWidth="1" strokeDasharray="2 7"/>)}<polygon points={period==="1 mês"?"0,150 60,141 120,125 180,111 240,92 310,83 310,190 0,190":period==="3 meses"?"0,169 62,150 124,139 186,115 248,100 310,74 310,190 0,190":"0,180 62,170 124,150 186,126 248,98 310,66 310,190 0,190"} fill="url(#area-gym)"/><polyline points={period==="1 mês"?"0,150 60,141 120,125 180,111 240,92 310,83":period==="3 meses"?"0,169 62,150 124,139 186,115 248,100 310,74":"0,180 62,170 124,150 186,126 248,98 310,66"} fill="none" stroke="#ff712c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="310" cy={period==="1 mês"?83:period==="3 meses"?74:66} r="7" fill="#ff712c" stroke="#101113" strokeWidth="3"/></svg></div><div className="chart-x"><span>INÍCIO</span><span>PERÍODO ILUSTRATIVO</span><span>AGORA</span></div></div>
          <SectionHead title="O que você vai acompanhar"/>
          <div className="metric-grid"><div><Dumbbell/><strong>Cargas</strong><span>Progressão exercício a exercício</span></div><div><Activity/><strong>Volume</strong><span>Séries e repetições ao longo do tempo</span></div><div><Footprints/><strong>Corridas</strong><span>Ritmo, duração e distância</span></div><div><CalendarDays/><strong>Consistência</strong><span>Frequência semanal de atividade</span></div></div>
          <PrimaryButton onClick={()=>viewShare("strength")}>Testar card de progresso <Share2 size={18}/></PrimaryButton>
        </>}
        {screen==="share"&&<>
          <BackHeader label="ESTÚDIO DE CARDS" onBack={()=>go("progress")} action={<button className="round-control" type="button" aria-label="Fechar" onClick={()=>go("home")}><X size={19}/></button>}/>
          <div className="studio-heading"><span className="eyebrow">COMPARTILHE SEU MOVIMENTO</span><h1>Seu treino.<br/>Seu estilo<span className="orange">.</span></h1><p>Teste os modelos de publicação com valores fictícios.</p></div>
          <div className="share-types" aria-label="Tipo de card"><button type="button" onClick={()=>setShareKind("strength")} className={shareKind==="strength"?"active":""}><Dumbbell size={18}/> Musculação</button><button type="button" onClick={()=>setShareKind("run")} className={shareKind==="run"?"active":""}><Footprints size={18}/> Corrida</button></div>
          <div className="preview-wrap"><div className={"social-preview "+shareFormat+" "+shareStyle}><div className="social-noise"/><div className="social-top"><span>GYM<span>.</span></span><small>PRÉVIA FICTÍCIA</small></div><div className="social-middle"><small>{shareKind==="strength"?"TREINO CONCLUÍDO":"CORRIDA DE HOJE"}</small><strong>{shareKind==="strength"?"COSTAS":runDistance.toLocaleString("pt-BR",{maximumFractionDigits:2})+" KM"}</strong><span>{shareKind==="strength"?"+ BÍCEPS":"NO SEU RITMO"}</span></div><div className="social-facts">{shareKind==="strength"?<><div><small>DURAÇÃO</small><strong>55 MIN</strong></div><div><small>EXERCÍCIOS</small><strong>05</strong></div></>:<><div><small>TEMPO</small><strong>{runMinutes} MIN</strong></div><div><small>RITMO</small><strong>{fmtPace(runMinutes,runDistance)}</strong></div></>}</div><div className="social-foot">MOVIMENTO É PROGRESSO.</div></div></div>
          <div className="studio-controls"><div className="control-section"><span>FORMATO</span><div className="choice-row">{[["story","Story · 9:16"],["feed","Feed · 4:5"],["square","Quadrado"]] .map(([id,label])=><button type="button" className={shareFormat===id?"active":""} onClick={()=>setShareFormat(id as ShareFormat)} key={id}>{label}</button>)}</div></div><div className="control-section"><span>ESTILO VISUAL</span><div className="choice-row"><button type="button" className={shareStyle==="ember"?"active":""} onClick={()=>setShareStyle("ember")}>Escuro / Laranja</button><button type="button" className={shareStyle==="minimal"?"active":""} onClick={()=>setShareStyle("minimal")}>Minimalista</button></div></div><label className="privacy-toggle"><span><ShieldCheck size={19}/> Mostrar informação cardíaca não informada</span><input type="checkbox" checked={shareHeart} onChange={e=>setShareHeart(e.target.checked)}/></label></div>
          <PrimaryButton onClick={()=>downloadSampleCard(shareKind,shareFormat,shareStyle,runMinutes,runDistance,shareHeart,setExportStatus)}>Exportar exemplo em PNG <ArrowDownToLine size={18}/></PrimaryButton>
          {exportStatus&&<p className="export-status" role="status">{exportStatus}</p>}
          <Notice>A imagem contém a marca “EXEMPLO · DADOS FICTÍCIOS”. Exportação de dados reais será desenvolvida na Sprint 09.</Notice>
        </>}
        {screen==="profile"&&<ProfilePanel
          settings={settings}
          onChange={setSettings}
          storageState={storageState}
          storageError={storageError}
          flushSettings={flushSettings}
          onRestored={value=>{setSettings(value);setStorageError("");setStorageState("saved");void loadProgram(false);}}
          onResetDemo={resetDemo}
        />}
      </main>
      {screen!=="session"&&screen!=="rest"&&screen!=="edit-plan"&&screen!=="edit-schedule"&&<nav className="bottom-nav" aria-label="Navegação principal">{navItems.map(item=>{const Icon=item.icon;return <button type="button" key={item.screen} className={tab===item.screen?"nav-link active":"nav-link"} aria-current={tab===item.screen?"page":undefined} onClick={()=>go(item.screen)}><Icon size={21} strokeWidth={tab===item.screen?2.5:1.8}/><span>{item.label}</span></button>})}</nav>}
    </div>
  </div>;
}
