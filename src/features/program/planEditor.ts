import type { Exercise, PlannedSet, PlanExercise, WorkoutPlan } from "../../domain/models";

const uid=():string=>crypto.randomUUID();
const stamp=():string=>new Date().toISOString();

export function blankPlan():WorkoutPlan{
  const now=stamp();
  return {id:"custom-"+uid(),name:"Novo treino",createdAt:now,updatedAt:now,exercises:[]};
}
export function copyPlan(plan:WorkoutPlan):WorkoutPlan{
  return {
    ...plan,exercises:plan.exercises.map(ex=>({...ex,sets:ex.sets.map(s=>({...s}))}))
  };
}
export function makeExerciseRow(exercise:Exercise,order:number):PlanExercise {
  return {
    id:uid(),exerciseId:exercise.id,order,restSeconds:0,
    sets:[makeSet(),makeSet()]
  };
}
export function makeSet(source?:PlannedSet):PlannedSet{
  return source?{...source,id:uid()}:{id:uid(),kind:"working",minReps:8,maxReps:12,targetRir:1,targetRirMax:1};
}
export function normalizeOrder(plan:WorkoutPlan):WorkoutPlan{
  return {...plan,exercises:plan.exercises.map((ex,index)=>({...ex,order:index}))};
}
export function insertRow(plan:WorkoutPlan,exercise:Exercise):WorkoutPlan{
  return normalizeOrder({...plan,exercises:[...plan.exercises,makeExerciseRow(exercise,plan.exercises.length)]});
}
export function moveRow(plan:WorkoutPlan,index:number,offset:number):WorkoutPlan{
  const to=index+offset;
  if(to<0||to>=plan.exercises.length)return plan;
  const updated=[...plan.exercises];
  const [entry]=updated.splice(index,1);
  updated.splice(to,0,entry);
  return normalizeOrder({...plan,exercises:updated});
}
export function dropRow(plan:WorkoutPlan,index:number):WorkoutPlan {
  return normalizeOrder({...plan,exercises:plan.exercises.filter((_,i)=>i!==index)});
}
export function replaceExercise(plan:WorkoutPlan,index:number,id:string):WorkoutPlan{
  return {...plan,exercises:plan.exercises.map((entry,i)=>i===index?{...entry,exerciseId:id}:entry)};
}
export function updatePlanExercise(plan:WorkoutPlan,index:number,patch:Partial<PlanExercise>):WorkoutPlan{
  return {...plan,exercises:plan.exercises.map((entry,i)=>i===index?{...entry,...patch}:entry)};
}
export function updateSeries(plan:WorkoutPlan,exerciseIndex:number,seriesIndex:number,patch:Partial<PlannedSet>):WorkoutPlan{
  return {...plan,exercises:plan.exercises.map((entry,i)=>i===exerciseIndex?{...entry,
    sets:entry.sets.map((s,j)=>j===seriesIndex?{...s,...patch}:s)}:entry)};
}
export function duplicatePlan(plan:WorkoutPlan):WorkoutPlan{
  const now=stamp();
  return {
    ...copyPlan(plan),
    id:"custom-"+uid(),name:plan.name+" (cópia)",createdAt:now,updatedAt:now,
    exercises:plan.exercises.map(ex=>({...ex,id:uid(),sets:ex.sets.map(set=>({...set,id:uid()}))}))
  };
}
