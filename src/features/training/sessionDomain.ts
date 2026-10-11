import type { Exercise, WorkoutPlan, WorkoutSession, SessionExercise, CompletedSet } from "../../domain/models";
import { validateWorkoutPlan, validateWorkoutSession } from "../../data/validation.ts";

export type SetInput = { weightKg:number; reps:number; rir?:number };
export type RecordTarget = { sessionExerciseId:string; plannedSetId:string };
export const nowLocalDate = (date = new Date()):string =>
  [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");

export function createSessionSnapshot(
  plan:WorkoutPlan,catalog:Exercise[],date=new Date(),newId:()=>string=()=>crypto.randomUUID()
):WorkoutSession{
  validateWorkoutPlan(plan);
  if(plan.exercises.length===0)throw new Error("Adicione exercícios à ficha antes de treinar.");
  const lookup=new Map(catalog.map(x=>[x.id,x.name]));
  const items:SessionExercise[]=plan.exercises.slice().sort((a,b)=>a.order-b.order).map((item,index)=>{
    const name=lookup.get(item.exerciseId);
    if(!name)throw new Error("Exercício não encontrado na biblioteca. Edite a ficha antes de começar.");
    if(item.sets.length===0)throw new Error("Um exercício está sem séries. Corrija a ficha antes de começar.");
    return {
      id:newId(),exerciseId:item.exerciseId,exerciseNameSnapshot:name,order:index,
      plannedSetsSnapshot:item.sets.map(s=>({...s})),sets:[],
      restSecondsSnapshot:item.restSeconds, ...(item.notes?{notes:item.notes}:{})
    };
  });
  const session:WorkoutSession={
    id:newId(),planId:plan.id,planNameSnapshot:plan.name,localDate:nowLocalDate(date),
    startedAt:date.toISOString(),status:"in_progress",exercises:items
  };
  validateWorkoutSession(session);
  return session;
}

export function countCompleted(session:WorkoutSession):number{
  return session.exercises.reduce((sum,ex)=>sum+ex.sets.length,0);
}
export function countPlanned(session:WorkoutSession):number{
  return session.exercises.reduce((sum,ex)=>sum+ex.plannedSetsSnapshot.length,0);
}
export function workoutDuration(session:WorkoutSession,now=new Date()):number {
  const elapsed=(Date.parse(session.endedAt??now.toISOString())-Date.parse(session.startedAt))/1000;
  return Math.max(0,Math.round(elapsed));
}
export function validateSetInput(data:SetInput):void {
  if(!Number.isFinite(data.weightKg)||data.weightKg<0||data.weightKg>1000)throw new Error("A carga deve estar entre 0 e 1000 kg.");
  if(!Number.isSafeInteger(data.reps)||data.reps<0||data.reps>1000)throw new Error("As repetições devem ser um número inteiro de 0 a 1000.");
  if(data.rir!==undefined&&(!Number.isInteger(data.rir)||data.rir<0||data.rir>10))throw new Error("O RIR deve estar entre 0 e 10.");
}
export function recordSetInSnapshot(
  session:WorkoutSession,target:RecordTarget,input:SetInput,
  date=new Date(),newId:()=>string=()=>crypto.randomUUID()
):WorkoutSession {
  if(session.status!=="in_progress")throw new Error("Este treino já foi encerrado.");
  validateSetInput(input);
  let found=false;
  const exercises=session.exercises.map(ex=>{
    if(ex.id!==target.sessionExerciseId)return ex;
    const planned=ex.plannedSetsSnapshot.find(s=>s.id===target.plannedSetId);
    if(!planned)throw new Error("A série não pertence a este exercício.");
    found=true;
    const existing=ex.sets.find(set=>set.plannedSetId===target.plannedSetId);
    const next:CompletedSet={
      id:existing?.id??newId(),plannedSetId:planned.id,kind:planned.kind,
      weightKg:input.weightKg,reps:input.reps,
      ...(input.rir===undefined?{}:{rir:input.rir}),completedAt:date.toISOString()
    };
    const sets=existing?ex.sets.map(set=>set.id===existing.id?next:set):[...ex.sets,next];
    return {...ex,sets};
  });
  if(!found)throw new Error("Exercício não encontrado na sessão.");
  const next={...session,exercises};
  validateWorkoutSession(next);
  return next;
}
export function removeRecordedSet(session:WorkoutSession,target:RecordTarget):WorkoutSession{
  if(session.status!=="in_progress")throw new Error("Este treino já foi encerrado.");
  const ex=session.exercises.find(item=>item.id===target.sessionExerciseId);
  if(!ex||!ex.plannedSetsSnapshot.some(s=>s.id===target.plannedSetId))throw new Error("Série não encontrada.");
  return {...session,exercises:session.exercises.map(item=>item.id===ex.id?
    {...item,sets:item.sets.filter(s=>s.plannedSetId!==target.plannedSetId)}:item)};
}
export function closeSession(session:WorkoutSession,status:"completed"|"abandoned",date=new Date()):WorkoutSession{
  if(session.status!=="in_progress")throw new Error("O treino já foi encerrado.");
  if(status==="completed"&&countCompleted(session)===0)throw new Error("Registre pelo menos uma série antes de finalizar.");
  const endedAt=new Date(Math.max(date.getTime(),Date.parse(session.startedAt))).toISOString();
  const next={...session,status,endedAt};
  validateWorkoutSession(next);
  return next;
}
export function getPreviousPerformance(history:WorkoutSession[],exerciseId:string):CompletedSet[]{
  const latest=history
    .filter(s=>s.status==="completed")
    .sort((a,b)=>b.startedAt.localeCompare(a.startedAt))
    .find(session=>session.exercises.some(ex=>ex.exerciseId===exerciseId&&ex.sets.length>0));
  return latest?.exercises.find(ex=>ex.exerciseId===exerciseId)?.sets??[];
}
