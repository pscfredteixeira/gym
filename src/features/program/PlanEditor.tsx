import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, ChevronDown, Copy, Dumbbell, Info, Plus, Save, Search, Trash2, X } from "lucide-react";
import type { Exercise, PlannedSet, WorkoutPlan } from "../../domain/models";
import { validateWorkoutPlan } from "../../data/validation";
import { BackHeader, Notice, PrimaryButton } from "../../components/ui";
import {
  blankPlan, copyPlan, dropRow, duplicatePlan, insertRow, makeSet,
  moveRow, replaceExercise, updatePlanExercise, updateSeries
} from "./planEditor";

type Props = {
  initial?:WorkoutPlan;
  catalog:Exercise[];
  units:"metric" | "imperial";
  onSave:(plan:WorkoutPlan,additions:Exercise[])=>Promise<void>;
  onDelete:(plan:WorkoutPlan)=>Promise<void>;
  onCancel:()=>void;
};
const numeric=(value:string,min:number,max:number)=>Math.max(min,Math.min(max,Number.isFinite(Number(value))?Math.round(Number(value)):min));
const rir=(value:string)=>Math.max(0,Math.min(10,Number.isFinite(Number(value))?Math.round(Number(value)):0));
const localName=(text:string)=>text.trim().toLocaleLowerCase("pt-BR");

export default function PlanEditor({initial,catalog,units,onSave,onDelete,onCancel}:Props){
  const [draft,setDraft]=useState<WorkoutPlan>(()=>initial?copyPlan(initial):blankPlan());
  const [added,setAdded]=useState<Exercise[]>([]);
  const [dirty,setDirty]=useState(false);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [status,setStatus]=useState("");
  const [query,setQuery]=useState("");
  const [adding,setAdding]=useState(false);
  const [newName,setNewName]=useState("");
  const [newMuscle,setNewMuscle]=useState("Costas");
  const [newEquipment,setNewEquipment]=useState("");
  const [showCustom,setShowCustom]=useState(false);
  const allExercises=useMemo(()=>[...catalog,...added],[catalog,added]);
  const byId=useMemo(()=>new Map(allExercises.map(ex=>[ex.id,ex])),[allExercises]);
  const matches=allExercises.filter(ex=>localName(ex.name).includes(localName(query))).slice(0,80);
  const update=(plan:WorkoutPlan)=>{setDirty(true);setStatus("");setDraft(plan);};
  const workingSets=draft.exercises.reduce((sum,ex)=>sum+ex.sets.filter(set=>set.kind==="working").length,0);
  const leave=()=>{
    if(dirty&&!window.confirm("Você alterou a ficha sem salvar. Deseja sair e descartar as alterações?"))return;
    onCancel();
  };
  useEffect(()=>{
    if(!dirty)return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
    window.addEventListener("beforeunload",warn);
    return()=>window.removeEventListener("beforeunload",warn);
  },[dirty]);
  const save=async(plan:WorkoutPlan,copy=false)=>{
    setSaving(true);setError("");setStatus("");
    try{
      const ready={...plan,name:plan.name.trim(),updatedAt:new Date().toISOString()};
      if(!ready.name||ready.name.length>200)throw new Error("Informe o nome da ficha (até 200 caracteres).");
      if(ready.exercises.some(row=>row.sets.length===0))throw new Error("Cada exercício deve ter pelo menos uma série.");
      validateWorkoutPlan(ready);
      await onSave(ready,added);
      setDirty(false);
      setStatus(copy?"Ficha duplicada e salva.":"Ficha salva no dispositivo.");
    }catch(err){setError(err instanceof Error?err.message:"Não foi possível salvar esta ficha.");}
    finally{setSaving(false);}
  };
  const addCustom=()=>{
    const name=newName.trim(),equipment=newEquipment.trim();
    if(!name){setError("Digite o nome do exercício.");return;}
    if(name.length>200||equipment.length>100){setError("Nome ou equipamento muito longo.");return;}
    if(allExercises.some(ex=>localName(ex.name)===localName(name))){setError("Este exercício já existe. Use a pesquisa para adicioná-lo.");return;}
    const entity:Exercise={id:"custom-"+crypto.randomUUID(),name,primaryMuscle:newMuscle,equipment:equipment||"Não especificado",isCustom:true};
    setAdded(prev=>[...prev,entity]);
    update(insertRow(draft,entity));
    setNewName("");setNewEquipment("");setAdding(false);setShowCustom(false);setError("");
  };
  const remove=async()=>{
    if(!initial)return;
    if(!initial.id.startsWith("custom-")){setError("As cinco fichas originais do Programa 10/10 podem ser retiradas da agenda, mas não excluídas desta biblioteca.");return;}
    if(!window.confirm("Excluir esta ficha personalizada? Seu histórico de treinos concluídos será preservado. Esta ação não pode ser desfeita sem backup."))return;
    setSaving(true);setError("");
    try{await onDelete(initial);setDirty(false);}catch(err){setError(err instanceof Error?err.message:"Não foi possível excluir a ficha.");setSaving(false);}
  };
  return <div className="editor-screen">
    <BackHeader label="EDITAR FICHA" onBack={leave} action={<button className="editor-top-save" type="button" disabled={saving} onClick={()=>{void save(draft);}}><Save size={16}/> Salvar</button>}/>
    <div className="editor-title"><span className="eyebrow">PROGRAMA DE MUSCULAÇÃO</span><h1>{initial?"Personalizar treino":"Criar treino"}<span className="orange">.</span></h1><p>Edite as séries, cargas planejadas, repetições e RIR sem alterar o histórico.</p></div>

    <div className="editor-main-info">
      <label htmlFor="gym-plan-name">NOME DA FICHA</label>
      <input id="gym-plan-name" value={draft.name} maxLength={200} onChange={e=>update({...draft,name:e.target.value})} placeholder="Ex.: Terça — PULL"/>
      <div className="editor-stats"><span><Dumbbell size={17}/>{draft.exercises.length} exercícios</span><span><Check size={17}/>{workingSets} séries efetivas</span></div>
    </div>

    <div className="section-head"><h2>Seus exercícios</h2><span className="micro-muted">Arraste pela ordem dos botões</span></div>
    <div className="editor-exercises">
      {draft.exercises.length===0&&<div className="empty-state"><Dumbbell size={30}/><h3>Ficha sem exercícios</h3><p>Comece adicionando um movimento da biblioteca.</p></div>}
      {draft.exercises.map((item,index)=>{
        const ex=byId.get(item.exerciseId);
        return <article className="editor-exercise" key={item.id}>
          <div className="editor-exercise-head">
            <span className="editor-number">{String(index+1).padStart(2,"0")}</span>
            <div><strong>{ex?.name??"Exercício não encontrado"}</strong><small>{ex?.primaryMuscle??""}{ex?.equipment?" · "+ex.equipment:""}</small></div>
            <div className="editor-arrange">
              <button type="button" title="Mover para cima" aria-label={"Mover "+(ex?.name??"exercício")+" para cima"} disabled={index===0} onClick={()=>update(moveRow(draft,index,-1))}><ArrowUp size={17}/></button>
              <button type="button" title="Mover para baixo" aria-label={"Mover "+(ex?.name??"exercício")+" para baixo"} disabled={index===draft.exercises.length-1} onClick={()=>update(moveRow(draft,index,1))}><ArrowDown size={17}/></button>
            </div>
          </div>
          <div className="editor-replace"><label htmlFor={"replace-"+item.id}>Trocar exercício</label><div className="editor-select"><select id={"replace-"+item.id} value={item.exerciseId} onChange={e=>update(replaceExercise(draft,index,e.target.value))}>{!ex&&<option value={item.exerciseId}>Não encontrado</option>}{allExercises.map(option=><option key={option.id} value={option.id}>{option.name}</option>)}</select><ChevronDown size={16}/></div></div>
          <div className="editor-series-label"><span>SÉRIES</span><span>REPS / RIR</span></div>
          {item.sets.map((set,seriesIndex)=><div className="editor-set" key={set.id}>
            <div className="editor-set-top"><span className="editor-series-id">SÉRIE {seriesIndex+1}</span>
              <select aria-label={"Tipo da série "+(seriesIndex+1)} value={set.kind} onChange={e=>update(updateSeries(draft,index,seriesIndex,{kind:e.target.value as PlannedSet["kind"]}))}>
                <option value="working">Efetiva</option><option value="warmup">Aquecimento</option>
              </select>
              <button type="button" aria-label={"Remover série "+(seriesIndex+1)} disabled={item.sets.length<=1} onClick={()=>update(updatePlanExercise(draft,index,{sets:item.sets.filter((_,i)=>i!==seriesIndex)}))}><Trash2 size={16}/></button>
            </div>
            <div className="editor-set-fields">
              <label>Reps mín.<input type="number" inputMode="numeric" min="1" max="100" value={set.minReps}
                onChange={e=>{const val=numeric(e.target.value,1,100);update(updateSeries(draft,index,seriesIndex,{minReps:val,maxReps:Math.max(val,set.maxReps)}));}}/></label>
              <label>Reps máx.<input type="number" inputMode="numeric" min="1" max="100" value={set.maxReps}
                onChange={e=>{const val=numeric(e.target.value,1,100);update(updateSeries(draft,index,seriesIndex,{maxReps:val,minReps:Math.min(val,set.minReps)}));}}/></label>
              <label>RIR mín.<input type="number" inputMode="numeric" min="0" max="10" value={set.targetRir??""}
                onChange={e=>{if(e.target.value==="")update(updateSeries(draft,index,seriesIndex,{targetRir:undefined,targetRirMax:undefined}));else {const v=rir(e.target.value);update(updateSeries(draft,index,seriesIndex,{targetRir:v,targetRirMax:Math.max(v,set.targetRirMax??v)}));}}}/></label>
              <label>RIR máx.<input type="number" inputMode="numeric" min="0" max="10" value={set.targetRirMax??set.targetRir??""}
                onChange={e=>{if(e.target.value==="")update(updateSeries(draft,index,seriesIndex,{targetRir:undefined,targetRirMax:undefined}));else{const v=rir(e.target.value);update(updateSeries(draft,index,seriesIndex,{targetRir:Math.min(v,set.targetRir??v),targetRirMax:v}));}}}/></label>
              <label className="editor-planned-weight">Carga planejada ({units==="metric"?"kg":"lb"}) — opcional
                <input type="number" min="0" max="1000" inputMode="decimal" step=".5" placeholder="Sem carga definida"
                  value={set.targetWeightKg===undefined?"":units==="metric"?set.targetWeightKg:Math.round(set.targetWeightKg*2.2046226218*10)/10}
                  onChange={e=>{
                    const v=e.target.value;
                    const kg=v===""?undefined:Math.min(1000,Math.max(0,Number(v)||0))/(units==="metric"?1:2.2046226218);
                    update(updateSeries(draft,index,seriesIndex,{targetWeightKg:kg}));
                  }}/>
              </label>
            </div>
          </div>)}
          <button type="button" className="editor-subaction" onClick={()=>update(updatePlanExercise(draft,index,{sets:[...item.sets,makeSet(item.sets[item.sets.length-1])]}))}><Plus size={17}/> Adicionar série</button>
          <div className="editor-rest"><label htmlFor={"rest-"+item.id}>Descanso entre séries (segundos)</label>
            <input type="number" id={"rest-"+item.id} inputMode="numeric" min="0" max="3600" step="15" value={item.restSeconds}
              onChange={e=>update(updatePlanExercise(draft,index,{restSeconds:numeric(e.target.value,0,3600)}))}/>
            <small>0 = ainda não configurado</small>
          </div>
          <label className="editor-notes">Observações<textarea rows={2} maxLength={3000} value={item.notes??""} placeholder="Observação opcional"
              onChange={e=>update(updatePlanExercise(draft,index,{notes:e.target.value}))}/></label>
          <button type="button" className="editor-remove" onClick={()=>update(dropRow(draft,index))}><Trash2 size={15}/> Remover da ficha</button>
        </article>;
      })}
    </div>

    {!adding?<button type="button" className="editor-add-main" onClick={()=>setAdding(true)}><Plus size={20}/> Adicionar exercício</button>:<div className="editor-picker">
      <div className="editor-picker-head"><strong>Escolha um exercício</strong><button type="button" onClick={()=>{setAdding(false);setShowCustom(false);}} aria-label="Fechar seleção"><X size={19}/></button></div>
      <label className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar na biblioteca" aria-label="Buscar exercício para adicionar"/></label>
      {!showCustom?<div className="editor-picker-results">{matches.map(ex=><button type="button" key={ex.id} onClick={()=>{update(insertRow(draft,ex));setAdding(false);setQuery("");}}><span><strong>{ex.name}</strong><small>{ex.primaryMuscle}{ex.equipment?" · "+ex.equipment:""}</small></span><Plus size={18}/></button>)}
        {matches.length===0&&<p className="helper-text">Nenhum exercício encontrado. Você pode criar um novo.</p>}
        <button type="button" className="editor-create-custom" onClick={()=>{setShowCustom(true);setNewName(query);setError("");}}><Plus size={18}/> Cadastrar exercício próprio</button>
      </div>:<div className="editor-custom-form">
        <label>Nome do movimento<input value={newName} onChange={e=>setNewName(e.target.value)} maxLength={200} placeholder="Nome do exercício"/></label>
        <label>Grupo muscular<select value={newMuscle} onChange={e=>setNewMuscle(e.target.value)}>{["Costas","Costas superiores","Peito","Ombros","Trapézio","Bíceps","Tríceps","Quadríceps","Posterior de coxa","Glúteos","Panturrilhas","Abdômen","Outro"].map(v=><option key={v}>{v}</option>)}</select></label>
        <label>Equipamento<input value={newEquipment} onChange={e=>setNewEquipment(e.target.value)} maxLength={100} placeholder="Máquina, halteres, barra..."/></label>
        <button type="button" className="action-button" onClick={addCustom}>Adicionar à ficha <Plus size={17}/></button>
        <button type="button" className="editor-subaction" onClick={()=>setShowCustom(false)}>Voltar à biblioteca</button>
      </div>}
    </div>}

    <div className="editor-footer">
      {error&&<div className="editor-error" role="alert"><Info size={18}/>{error}</div>}
      {status&&<div className="editor-saved" role="status"><Check size={18}/>{status}</div>}
      {dirty&&<p className="editor-unsaved" role="status">Alterações não salvas</p>}
      <PrimaryButton disabled={saving} onClick={()=>{void save(draft);}}>{saving?"Salvando...":"Salvar alterações"} <Save size={18}/></PrimaryButton>
      {initial&&<button type="button" disabled={saving} className="editor-duplicate" onClick={()=>{void save(duplicatePlan(draft),true);}}><Copy size={18}/> Duplicar ficha</button>}
      {initial?.id.startsWith("custom-")&&<button type="button" disabled={saving} className="editor-delete-plan" onClick={()=>{void remove();}}><Trash2 size={16}/> Excluir ficha personalizada</button>}
      <Notice>As fichas são salvas no navegador. Alterações aqui não modificam séries de sessões já concluídas. Faça backups em Perfil regularmente.</Notice>
    </div>
  </div>;
}
