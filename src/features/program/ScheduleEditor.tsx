import { useState } from "react";
import { CalendarRange, Check, ChevronDown, Footprints, Info, RotateCcw, Save } from "lucide-react";
import type { ScheduledCardio, UserSettings, WorkoutPlan } from "../../domain/models";
import { PROGRAM_DAYS } from "../../data/program1010";
import { configuredCardio, configuredPlanIds, swapAssignment } from "./programSchedule";
import { BackHeader, Notice, PrimaryButton } from "../../components/ui";

type Props={settings:UserSettings; plans:WorkoutPlan[]; onCancel:()=>void; onSave:(ids:Array<string|null>,cardio:Array<ScheduledCardio|null>)=>Promise<void>};
const fallbackCardio=():ScheduledCardio=>({label:"Corrida leve",minutes:20,optional:true,note:""});
const num=(v:string)=>Math.max(0,Math.min(600,Math.round(Number(v)||0)));

export default function ScheduleEditor({settings,plans,onCancel,onSave}:Props){
  const [ids,setIds]=useState(()=>configuredPlanIds(settings));
  const [cardio,setCardio]=useState(()=>configuredCardio(settings));
  const [dirty,setDirty]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [saved,setSaved]=useState("");
  const changeIds=(index:number,value:string)=>{
    setIds(old=>swapAssignment(old,index,value===""?null:value));
    setDirty(true);setSaved("");
  };
  const changeCardio=(index:number,value:ScheduledCardio|null)=>{
    setCardio(old=>old.map((item,i)=>i===index?value:item));
    setDirty(true);setSaved("");
  };
  const leave=()=>{
    if(dirty&&!window.confirm("Há alterações não salvas na sua semana. Sair sem salvar?"))return;
    onCancel();
  };
  const submit=async()=>{
    setBusy(true);setError("");setSaved("");
    try{
      await onSave(ids,cardio);
      setDirty(false);setSaved("Agenda semanal salva com sucesso.");
    }catch(err){setError(err instanceof Error?err.message:"Erro ao salvar a agenda.");}
    finally{setBusy(false);}
  };
  return <div className="schedule-editor">
    <BackHeader label="ORGANIZAR A SEMANA" onBack={leave} action={<button type="button" className="editor-top-save" onClick={()=>{void submit();}} disabled={busy}><Save size={16}/> Salvar</button>}/>
    <div className="editor-title"><span className="eyebrow">SEU CALENDÁRIO</span><h1>Minha semana<span className="orange">.</span></h1><p>Troque o treino de dia, planeje o cardio ou deixe dias livres. Alterar a agenda não altera seu histórico.</p></div>
    <div className="schedule-help"><CalendarRange size={19}/> Se você selecionar uma ficha que já está em outro dia, as duas posições serão trocadas automaticamente.</div>
    <div className="schedule-days">
      {PROGRAM_DAYS.map((day,index)=>{
        const plan=plans.find(p=>p.id===ids[index]);
        const c=cardio[index];
        return <article className="schedule-day" key={day.id}>
          <div className="schedule-day-heading"><span>{day.short}</span><strong>{day.weekday}</strong><small>{plan?plan.exercises.length+" exercícios":"Recuperação"}</small></div>
          <label className="schedule-field" htmlFor={"plan-day-"+index}>Musculação <span className="schedule-native-select"><select id={"plan-day-"+index} value={ids[index]??""} onChange={e=>changeIds(index,e.target.value)}>
            <option value="">Descanso / sem musculação</option>
            {plans.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}
          </select><ChevronDown size={16}/></span></label>
          <label className="schedule-cardio-toggle"><span><Footprints size={17}/> Cardio neste dia</span><input type="checkbox" checked={c!==null} onChange={e=>changeCardio(index,e.target.checked?fallbackCardio():null)}/></label>
          {c&&<div className="schedule-cardio-options">
            <label>Atividade<input type="text" maxLength={100} value={c.label} onChange={e=>changeCardio(index,{...c,label:e.target.value})}/></label>
            <label>Minutos (0 = livre)<input type="number" min="0" max="600" inputMode="numeric" value={c.minutes??0} onChange={e=>changeCardio(index,{...c,minutes:num(e.target.value)||null})}/></label>
            <label className="schedule-optional"><input type="checkbox" checked={c.optional} onChange={e=>changeCardio(index,{...c,optional:e.target.checked})}/> Cardio opcional</label>
            <label>Observação<textarea rows={2} maxLength={500} placeholder="Ex.: caminhar se estiver fatigado" value={c.note} onChange={e=>changeCardio(index,{...c,note:e.target.value})}/></label>
          </div>}
        </article>;
      })}
    </div>
    <div className="schedule-editor-actions">
      {dirty&&<p className="editor-unsaved">Alterações não salvas</p>}
      {error&&<div className="editor-error" role="alert"><Info size={17}/>{error}</div>}
      {saved&&<div className="editor-saved" role="status"><Check size={17}/>{saved}</div>}
      <PrimaryButton disabled={busy} onClick={()=>{void submit();}}>{busy?"Salvando...":"Salvar semana"} <Save size={18}/></PrimaryButton>
      <button type="button" className="editor-duplicate" disabled={busy} onClick={()=>{
        if(!window.confirm("Restaurar a divisão original do Programa 10/10? As alterações ainda não serão salvas."))return;
        setIds(configuredPlanIds({...settings,weeklyPlanIds:undefined}));
        setCardio(configuredCardio({...settings,weeklyCardio:undefined}));
        setDirty(true);setSaved("");
      }}><RotateCcw size={16}/> Restaurar divisão original</button>
      <Notice>Programação salva no próprio iPhone e incluída no backup. Cardio nesta tela é planejamento, não uma atividade realizada.</Notice>
    </div>
  </div>;
}
