import { useEffect, useRef, useState } from "react";
import {
  Activity, ArrowRight, ArrowUpRight, BarChart3, BookOpen,
  CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3,
  Dumbbell, Flame, Footprints, House, Info, Minus,
  Pause, Play, Plus, RotateCcw, Share2,
  Sparkles, TrendingUp, UserRound
} from "lucide-react";
import { DemoLabel, Photo, SectionHead, BackHeader, PrimaryButton, Notice } from "./components/ui";
import { exercises, mockWeights, mockReps, photos } from "./data/demo";
import ProfilePanel, { type StorageState } from "./features/profile/ProfilePanel";
import { DEFAULT_SETTINGS } from "./data/validation";
import { readSettings, writeSettings, saveEntity, saveManualCardio, deleteManualCardio } from "./data/storage";
import type { CardioSession, Exercise, ScheduledCardio, UserSettings, WorkoutPlan, WorkoutSession } from "./domain/models";
import CardioView, { CardioHighlights } from "./features/cardio/CardioView";
import ProgressView from "./features/progress/ProgressView";
import ShareView from "./features/share/ShareView";
import type { ShareKind } from "./features/share/shareDomain";
import { ActiveWorkoutBanner, LiveWorkout, WorkoutHistoryView } from "./features/training/TrainingView";
import { ExerciseLibrary, ExerciseDetails } from "./features/library/ExerciseLibrary";
import { isExerciseImageUrl } from "./features/library/exerciseImages";
import { createSessionSnapshot, recordSetWithRest, removeRecordedSet, closeSession, pauseRest, continueRest, adjustRest, skipRest, type RecordTarget, type SetInput } from "./features/training/sessionDomain";
import { startStoredWorkout, getActiveWorkout, mutateStoredWorkout } from "./data/storage";
import { savePlanWithExercises, deleteEntity } from "./data/storage";
import PlanEditor from "./features/program/PlanEditor";
import ScheduleEditor from "./features/program/ScheduleEditor";
import { configuredPlanIds, resolveSchedule } from "./features/program/programSchedule";
import { PROGRAM_DAYS, PROGRAM_NAME, buildProgramCatalog, planId } from "./data/program1010";
import { ProgramOverview, ProgramDayDetail, type ProgramStatus } from "./features/program/ProgramView";
import { ensureProgramCatalog, listEntities } from "./data/storage";

type Tab = "home" | "workouts" | "library" | "progress" | "profile";
type Screen = Tab | "session" | "rest" | "run" | "share" | "program" | "edit-plan" | "edit-schedule" | "live" | "history" | "exercise-info";
const navItems: { screen: Tab; label: string; icon: typeof House }[] = [
  { screen:"home", label:"Hoje", icon:House },
  { screen:"workouts", label:"Treinar", icon:Dumbbell },
  { screen:"library", label:"Exercícios", icon:BookOpen },
  { screen:"progress", label:"Evolução", icon:BarChart3 },
  { screen:"profile", label:"Perfil", icon:UserRound }
];
const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const today = new Date();
const todayIndex = (today.getDay()+6)%7;
const monday = new Date(today.getFullYear(),today.getMonth(),today.getDate()-todayIndex);
const weekDates = weekdays.map((name,i)=>({name,day:new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+i).getDate()}));
const fmtTime = (seconds: number) => String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
function DemoImageFallback({label="GYM"}:{label?:string}) {
  return <div className="image-fallback"><Dumbbell size={30} aria-hidden="true"/><span>{label}</span></div>;
}
export default function App(){
  const [screen,setScreen]=useState<Screen>(()=>new URLSearchParams(window.location.search).get("tab")==="library"?"library":new URLSearchParams(window.location.search).get("tab")==="cardio"?"run":new URLSearchParams(window.location.search).get("tab")==="progress"?"progress":new URLSearchParams(window.location.search).get("tab")==="share"?"share":"home");
  const [exerciseIndex,setExerciseIndex]=useState(0);
  const [setIndex,setSetIndex]=useState(0);
  const [completed,setCompleted]=useState<Record<string,boolean>>({});
  const [weight,setWeight]=useState<Record<string,number>>({});
  const [reps,setReps]=useState<Record<string,number>>({});
  const [restLeft,setRestLeft]=useState(90);
  const [restRunning,setRestRunning]=useState(false);
  const [shareKind,setShareKind]=useState<ShareKind>("strength");
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
  const [selectedLibraryId,setSelectedLibraryId]=useState<string|null>(null);
  const [libraryReturn,setLibraryReturn]=useState<"library"|"program">("library");
  const [activeWorkout,setActiveWorkout]=useState<WorkoutSession|undefined>();
  const [workoutHistory,setWorkoutHistory]=useState<WorkoutSession[]>([]);
  const [cardioHistory,setCardioHistory]=useState<CardioSession[]>([]);
  const [cardioError,setCardioError]=useState("");
  const reloadCardio=async()=>{
    const all=await listEntities<CardioSession>("cardioSessions");
    setCardioHistory(all);
  };
  useEffect(()=>{void reloadCardio().catch(err=>setCardioError(err instanceof Error?err.message:"Erro ao abrir o histórico de cardio."));},[]);
  const saveCardio=async(record:CardioSession)=>{
    await saveManualCardio(record);
    await reloadCardio();
  };
  const removeCardio=async(id:string)=>{
    await deleteManualCardio(id);
    await reloadCardio();
  };
  const [trainingError,setTrainingError]=useState("");
  const reloadTraining=async()=>{
    const all=await listEntities<WorkoutSession>("workoutSessions");
    setWorkoutHistory(all.filter(item=>item.status!=="in_progress"));
    setActiveWorkout(all.filter(item=>item.status==="in_progress").sort((a,b)=>b.startedAt.localeCompare(a.startedAt))[0]);
  };
  useEffect(()=>{void reloadTraining().catch(error=>setTrainingError(error instanceof Error?error.message:"Erro ao abrir os treinos."));},[]);
  const beginRealWorkout=async(plan:WorkoutPlan)=>{
    setTrainingError("");
    try{
      const existing=await getActiveWorkout();
      if(existing){setActiveWorkout(existing);go("live");return;}
      const snapshot=createSessionSnapshot(plan,catalogExercises);
      const started=await startStoredWorkout(snapshot);
      setActiveWorkout(started);
      await reloadTraining();
      go("live");
    }catch(error){
      setTrainingError(error instanceof Error?error.message:"Não foi possível iniciar o treino.");
      await reloadTraining().catch(()=>{});
    }
  };
  const updateRealSet=async(target:RecordTarget,data:SetInput)=>{
    if(!activeWorkout)throw new Error("Não existe treino aberto.");
    await mutateStoredWorkout(activeWorkout.id,session=>recordSetWithRest(session,target,data,settings.defaultRestSeconds));
    await reloadTraining();
  };
  const changeRealRest=async(action:"pause"|"continue"|"plus"|"minus"|"skip")=>{
    if(!activeWorkout)throw new Error("Não existe treino aberto.");
    await mutateStoredWorkout(activeWorkout.id,session=>{
      const now=new Date();
      if(action==="pause")return pauseRest(session,now);
      if(action==="continue")return continueRest(session,now);
      if(action==="plus")return adjustRest(session,15,now);
      if(action==="minus")return adjustRest(session,-15,now);
      return skipRest(session);
    });
    await reloadTraining();
  };
  const removeRealSet=async(target:RecordTarget)=>{
    if(!activeWorkout)throw new Error("Não existe treino aberto.");
    await mutateStoredWorkout(activeWorkout.id,session=>removeRecordedSet(session,target));
    await reloadTraining();
  };
  const endRealWorkout=async(status:"completed"|"abandoned")=>{
    if(!activeWorkout)throw new Error("Não existe treino aberto.");
    await mutateStoredWorkout(activeWorkout.id,session=>closeSession(session,status));
    await reloadTraining();
    go("history");
  };

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
  const openExerciseInfo=(id:string,from:"library"|"program"="library")=>{
    setSelectedLibraryId(id);setLibraryReturn(from);go("exercise-info");
  };
  const saveExerciseImage=async(id:string,imageUrl:string|undefined,meta?:Pick<Exercise,"imageSourceUrl"|"imageAuthor"|"imageLicense">)=>{
    if(imageUrl!==undefined&&!isExerciseImageUrl(imageUrl))
      throw new Error("Imagem inválida ou maior que o limite de armazenamento.");
    const exercise=catalogExercises.find(item=>item.id===id);
    if(!exercise)throw new Error("Este exercício não foi encontrado.");
    const updated={...exercise,imageUrl,
      imageSourceUrl:meta?.imageSourceUrl,imageAuthor:meta?.imageAuthor,imageLicense:meta?.imageLicense};
    await saveEntity("exercises",updated);
    setCatalogExercises(items=>items.map(item=>item.id===id?updated:item));
  };
  const replaceExerciseInPlan=async(planId:string,rowId:string,replacement:Exercise)=>{
    const plan=savedPlans.find(p=>p.id===planId);
    if(!plan)throw new Error("Ficha não encontrada no dispositivo.");
    const row=plan.exercises.find(item=>item.id===rowId);
    if(!row)throw new Error("Exercício original não encontrado na ficha.");
    if(!catalogExercises.some(e=>e.id===replacement.id))throw new Error("Alternativa não está disponível no catálogo.");
    const changed={...plan,updatedAt:new Date().toISOString(),
      exercises:plan.exercises.map(item=>item.id===rowId?{...item,exerciseId:replacement.id}:item)};
    await savePlanWithExercises(changed,[]);
    await loadProgram(false);
  };
  const sessionEx=exercises[exerciseIndex];
  const currentKey=exerciseIndex+"-"+setIndex;
  const completedCount=Object.values(completed).filter(Boolean).length;
  const plannedTotal=exercises.reduce((n,e)=>n+e.sets,0);
  const progressPct=Math.round(completedCount/plannedTotal*100);

  const markSet=()=>{
    if(completed[currentKey]){setCompleted(previous=>({...previous,[currentKey]:false}));return;}
    setCompleted(previous=>({...previous,[currentKey]:true}));
    if(setIndex<sessionEx.sets-1)setSetIndex(v=>v+1);
    else if(exerciseIndex<exercises.length-1){setExerciseIndex(v=>v+1);setSetIndex(0);}
    setRestLeft(sessionEx.rest);setRestRunning(true);go("rest");
  };
  const resetDemo=()=>{
    if(!window.confirm("Reiniciar apenas os valores desta prévia? Nenhum dado real será apagado."))return;
    setCompleted({});setWeight({});setReps({});setExerciseIndex(0);setSetIndex(0);go("home");
  };
  const viewShare=(kind:ShareKind)=>{setShareKind(kind);go("share");};
  const increment=(kind:"weight"|"reps", delta:number)=>{
    if(kind==="weight")setWeight(prev=>({...prev,[currentKey]:Math.min(500,Math.max(0,(prev[currentKey]??mockWeights[sessionEx.id])+delta))}));
    else setReps(prev=>({...prev,[currentKey]:Math.min(100,Math.max(0,(prev[currentKey]??mockReps[sessionEx.id])+delta))}));
  };
  const tab=navItems.find(n=>n.screen===screen)?.screen??(screen==="run"||screen==="program"||screen==="edit-plan"||screen==="edit-schedule"||screen==="live"||screen==="history"?"workouts":screen==="share"?"progress":screen==="exercise-info"?"library":"workouts");
  return <div className={"gym-app"+(settings.largeText?" large-text":"")+(settings.reducedMotion?" reduced-motion":"")}>
    <div className="desktop-rail" aria-hidden="true"><span>GYM</span><i/><small>MOVE WITH PURPOSE</small></div>
    <div className="app-column">
      <header className="app-header">
        <button className="logo" type="button" disabled={screen==="edit-plan"||screen==="edit-schedule"||screen==="live"} onClick={()=>go("home")} aria-label="GYM, voltar ao início">GYM<span>.</span></button>
        <div className="header-actions">{["home","workouts","program","live","history","library","exercise-info","share"].includes(screen)?<span className="program-header-tag">10/10</span>:<DemoLabel compact/>}<button type="button" className="header-avatar" onClick={()=>go("profile")} aria-label="Abrir perfil"><UserRound size={20}/></button></div>
      </header>
      <main className="app-main" id="main-content">
        {screen==="home"&&<>
          <section className="greeting"><p className="eyebrow">SEU ESPAÇO DE MOVIMENTO</p><div className="heading-line"><h1>Vamos treinar<span className="orange">.</span></h1><span className="date-mark"><CalendarDays size={15}/> HOJE</span></div><p>Um passo de cada vez. Seu ritmo, suas conquistas.</p></section>
          <ActiveWorkoutBanner session={activeWorkout} onResume={()=>go("live")}/>
          <button className="history-link" type="button" onClick={()=>go("history")}>
            <Clock3 size={18}/> Histórico de musculação <ArrowRight size={18}/>
          </button>
          <CardioHighlights sessions={cardioHistory} onOpen={()=>go("run")}/>
          {cardioError&&<div className="editor-error" role="alert">{cardioError}</div>}
          <div className="week-strip" aria-label="Escolha um dia da semana">{weekDates.map(({name,day:calendarDay},i)=><button type="button" key={name} onClick={()=>setDay(i)} className={day===i?"day-item selected":"day-item"} aria-pressed={day===i}><span>{name.toUpperCase()}</span><strong>{calendarDay}</strong><i/></button>)}</div>
          <section className="hero-card"><Photo src={photos.hero} alt="Ambiente de academia" className="hero-photo"/><div className="hero-shade"/><div className="hero-info"><div className="topchip"><Flame size={13}/> {PROGRAM_NAME.toUpperCase()} · VERSÃO 2.0</div><div className="hero-lower"><p>{selectedDay.weekday.toUpperCase()} / {selectedPlan?"MUSCULAÇÃO":"RECUPERAÇÃO"}</p><h2>{selectedDay.title}<span>.</span></h2><div className="hero-stats">{selectedPlan?<><span><Dumbbell size={14}/>{selectedPlan.exercises.length} exercícios</span><span><CheckCircle2 size={14}/>{selectedPlan.exercises.reduce((n,ex)=>n+ex.sets.filter(set=>set.kind==="working").length,0)} séries efetivas</span></>:<span><Activity size={14}/> Descanso / recuperação</span>}{selectedDay.cardio&&<span><Footprints size={14}/>{selectedDay.cardio.label}{selectedDay.cardio.minutes?" · "+selectedDay.cardio.minutes+" min":""}</span>}</div><button type="button" className="hero-cta" onClick={()=>openProgram(day)}>Ver programação do dia <ArrowRight size={20}/></button></div></div></section>
          <SectionHead title="Seu espaço" aside="Explorar treinos" onClick={()=>go("workouts")}/>
          <div className="home-cards"><button className="feature-mini" type="button" onClick={()=>go("run")}><div className="feature-icon"><Footprints size={24}/></div><small>CARDIO</small><h3>Corrida & esteira</h3><p>Ritmo, distância e tempo</p><ArrowUpRight className="corner-arrow" size={18}/></button><button className="feature-mini" type="button" onClick={()=>go("progress")}><div className="feature-icon"><TrendingUp size={24}/></div><small>RESULTADOS</small><h3>Sua evolução</h3><p>Gráficos e recordes</p><ArrowUpRight className="corner-arrow" size={18}/></button></div>
          <div className="callout-line"><Sparkles size={18}/><span>{programStatus==="ready"?"Programa 10/10 salvo. Abra uma ficha para registrar séries e cargas reais.":programStatus==="loading"?"Preparando o Programa 10/10...":"A ficha pode ser consultada, mas ainda não foi confirmada no armazenamento local."}</span></div>
        </>}
        {screen==="workouts"&&<><ActiveWorkoutBanner session={activeWorkout} onResume={()=>go("live")}/><button className="history-link" type="button" onClick={()=>go("history")}><Clock3 size={18}/> Histórico de musculação <ArrowRight size={18}/></button><ProgramOverview status={programStatus} onOpen={openProgram} onInstall={()=>{void loadProgram(true);}}
          assigned={assignedDays} unassigned={unassignedPlans}
          onEdit={id=>editPlan(id)} onNew={()=>editPlan(null)} onEditSchedule={()=>go("edit-schedule")}/></>}
        {screen==="edit-plan"&&<PlanEditor key={editingPlanId??"new-"+editorSerial}
          initial={savedPlans.find(p=>p.id===editingPlanId)} catalog={catalogExercises} units={settings.units}
          onSave={persistPlan} onDelete={deletePlan} onCancel={()=>go("workouts")}/>}
        {screen==="edit-schedule"&&<ScheduleEditor
          settings={settings} plans={savedPlans} onSave={saveSchedule}
          onCancel={()=>go("workouts")}/>}
        {screen==="program"&&<ProgramDayDetail
          day={selectedDay}
          onBack={()=>go("workouts")}
          onStart={()=>{if(selectedPlan)void beginRealWorkout(selectedPlan);}}
          onResume={()=>go("live")}
          activeWorkout={!!activeWorkout}
          trainingError={trainingError}
          onCardio={()=>go("run")}
          plan={selectedPlan}
          catalog={catalogExercises}
          status={programStatus}
          onEdit={()=>{if(selectedPlan)editPlan(selectedPlan.id);}}
          onViewExercise={id=>openExerciseInfo(id,"program")}
          units={settings.units}
        />}
        {screen==="live"&&activeWorkout&&<LiveWorkout
          session={activeWorkout} history={workoutHistory} units={settings.units} catalog={catalogExercises} onBack={()=>go("workouts")}
          onRecord={updateRealSet} onRemove={removeRealSet}
          onFinish={()=>endRealWorkout("completed")} onAbandon={()=>endRealWorkout("abandoned")}
          onRestAction={changeRealRest}/>}
        {screen==="live"&&!activeWorkout&&<div className="empty-state"><Info/><h3>Nenhuma sessão aberta</h3><button type="button" onClick={()=>go("workouts")}>Voltar aos treinos</button></div>}
        {screen==="history"&&<WorkoutHistoryView history={workoutHistory} onBack={()=>go("workouts")}/>}
        {screen==="library"&&<ExerciseLibrary catalog={catalogExercises} plans={savedPlans}
          onOpen={id=>openExerciseInfo(id,"library")}/>}
        {screen==="exercise-info"&&<ExerciseDetails
          key={selectedLibraryId??"none"}
          exercise={catalogExercises.find(item=>item.id===selectedLibraryId)}
          catalog={catalogExercises} plans={savedPlans}
          onBack={()=>go(libraryReturn)}
          onOpen={id=>openExerciseInfo(id,libraryReturn)}
          onReplace={replaceExerciseInPlan}
          onSaveImage={saveExerciseImage}/>}
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
        {screen==="run"&&<CardioView sessions={cardioHistory}
          suggestion={selectedDay.cardio?{
            label:selectedDay.cardio.label,
            minutes:selectedDay.cardio.minutes??null,
            optional:selectedDay.cardio.optional??false,
            note:selectedDay.cardio.note??""
          }:undefined}
          onBack={()=>go("workouts")} onSave={saveCardio} onDelete={removeCardio}/>}
        {screen==="progress"&&<ProgressView
          workouts={workoutHistory} cardio={cardioHistory} units={settings.units}
          onOpenStrength={()=>go("history")} onOpenCardio={()=>go("run")}
          onOpenSharePreview={()=>viewShare("strength")}/>}
        {screen==="share"&&<ShareView
          preferredKind={shareKind} workouts={workoutHistory} cardio={cardioHistory}
          settings={settings} onBack={()=>go("progress")}
          onStartStrength={()=>go("workouts")} onStartCardio={()=>go("run")}/>}
        {screen==="profile"&&<ProfilePanel
          settings={settings}
          onChange={setSettings}
          storageState={storageState}
          storageError={storageError}
          flushSettings={flushSettings}
          onRestored={value=>{setSettings(value);setStorageError("");setStorageState("saved");void loadProgram(false);void reloadTraining();void reloadCardio();}}
          onResetDemo={resetDemo}
        />}
      </main>
      {screen!=="session"&&screen!=="rest"&&screen!=="edit-plan"&&screen!=="edit-schedule"&&screen!=="live"&&<nav className="bottom-nav" aria-label="Navegação principal">{navItems.map(item=>{const Icon=item.icon;return <button type="button" key={item.screen} className={tab===item.screen?"nav-link active":"nav-link"} aria-current={tab===item.screen?"page":undefined} onClick={()=>go(item.screen)}><Icon size={21} strokeWidth={tab===item.screen?2.5:1.8}/><span>{item.label}</span></button>})}</nav>}
    </div>
  </div>;
}
