import type { CardioSession, WorkoutSession } from "../../domain/models";

export type ProgressPeriod = 30|90|180|"all";
export const progressPeriods:readonly {days:ProgressPeriod;label:string}[]=[
 {days:30,label:"30 dias"},{days:90,label:"90 dias"},{days:180,label:"6 meses"},{days:"all",label:"Tudo"}
];
export const localDay = (date=new Date())=>
 [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");
export function periodStart(period:ProgressPeriod,now=new Date()):string|undefined {
 if(period==="all")return undefined;
 const shifted=new Date(now.getFullYear(),now.getMonth(),now.getDate()-(period-1));
 return localDay(shifted);
}
export function recordsInPeriod(
 workouts:readonly WorkoutSession[],cardio:readonly CardioSession[],period:ProgressPeriod,now=new Date()
):{workouts:WorkoutSession[];cardio:CardioSession[]} {
 const from=periodStart(period,now),until=localDay(now);
 const fits=(date:string)=>date<=until&&(from===undefined||date>=from);
 return {
  workouts:workouts.filter(s=>s.status==="completed"&&fits(s.localDate)),
  cardio:cardio.filter(s=>fits(s.localDate))
 };
}
export type ExerciseProgress={exerciseId:string;name:string;sets:number;latestDate:string};
export function exerciseChoices(workouts:readonly WorkoutSession[]):ExerciseProgress[] {
 const all=new Map<string,ExerciseProgress>();
 for(const session of workouts){
  if(session.status!=="completed")continue;
  for(const exercise of session.exercises){
   const sets=exercise.sets.filter(set=>set.kind==="working").length;
   if(!sets)continue;
   const old=all.get(exercise.exerciseId);
   if(!old)all.set(exercise.exerciseId,{
    exerciseId:exercise.exerciseId,name:exercise.exerciseNameSnapshot,sets,latestDate:session.localDate
   });
   else all.set(exercise.exerciseId,{
    exerciseId:exercise.exerciseId,
    name:session.localDate>=old.latestDate?exercise.exerciseNameSnapshot:old.name,
    sets:old.sets+sets,latestDate:session.localDate>=old.latestDate?session.localDate:old.latestDate
   });
  }
 }
 return [...all.values()].sort((a,b)=>b.latestDate.localeCompare(a.latestDate)||b.sets-a.sets||a.name.localeCompare(b.name,"pt-BR"));
}
export type StrengthPoint={date:string;maxKg:number;sets:number;reps:number;volumeKg:number};
export function exerciseProgress(workouts:readonly WorkoutSession[],id:string):StrengthPoint[] {
 const dates=new Map<string,StrengthPoint>();
 for(const s of workouts){
  if(s.status!=="completed")continue;
  for(const ex of s.exercises){
   if(ex.exerciseId!==id)continue;
   for(const set of ex.sets){
    if(set.kind!=="working")continue;
    const row=dates.get(s.localDate)??{date:s.localDate,maxKg:0,sets:0,reps:0,volumeKg:0};
    row.maxKg=Math.max(row.maxKg,set.weightKg);
    row.sets+=1;row.reps+=set.reps;row.volumeKg+=set.reps*set.weightKg;
    dates.set(s.localDate,row);
   }
  }
 }
 return [...dates.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
export function strengthSummary(workouts:readonly WorkoutSession[]) {
 const days=new Set<string>();
 let sessions=0,workingSets=0,warmupSets=0,reps=0,volumeKg=0,durationSeconds=0;
 for(const s of workouts){
  if(s.status!=="completed")continue;
  sessions++;days.add(s.localDate);
  if(s.endedAt){
   const seconds=(Date.parse(s.endedAt)-Date.parse(s.startedAt))/1000;
   if(Number.isFinite(seconds)&&seconds>0)durationSeconds+=seconds;
  }
  for(const exercise of s.exercises)for(const set of exercise.sets){
   if(set.kind==="warmup"){warmupSets++;continue;}
   workingSets++;reps+=set.reps;volumeKg+=set.weightKg*set.reps;
  }
 }
 return {sessions,trainingDays:days.size,workingSets,warmupSets,reps,volumeKg,durationSeconds};
}
export function cardioSummary(cardio:readonly CardioSession[]) {
 let durationSeconds=0,distanceMeters=0,knownDistanceCount=0,knownDistanceSeconds=0;
 const days=new Set<string>();
 for(const s of cardio){
  days.add(s.localDate);durationSeconds+=s.durationSeconds;
  if(s.distanceMeters!==undefined){
   knownDistanceCount++;distanceMeters+=s.distanceMeters;
   if(s.distanceMeters>0)knownDistanceSeconds+=s.durationSeconds;
  }
 }
 return {sessions:cardio.length,activityDays:days.size,durationSeconds,distanceMeters,
  knownDistanceCount,knownDistanceSeconds};
}
export function consistencyWeeks(
 workouts:readonly WorkoutSession[],cardio:readonly CardioSession[],
 now=new Date(),weekCount=6
):{weekStart:string;days:number;strengthDays:number;cardioDays:number}[] {
 const base=new Date(now.getFullYear(),now.getMonth(),now.getDate()-(now.getDay()+6)%7);
 const strength=new Set(workouts.filter(s=>s.status==="completed").map(s=>s.localDate));
 const runs=new Set(cardio.map(s=>s.localDate));
 const today=localDay(now);
 return Array.from({length:weekCount},(_,i)=>{
  const start=new Date(base.getFullYear(),base.getMonth(),base.getDate()-7*(weekCount-i-1));
  const days=Array.from({length:7},(_,j)=>localDay(new Date(start.getFullYear(),start.getMonth(),start.getDate()+j))).filter(d=>d<=today);
  return {weekStart:localDay(start),
   days:days.filter(d=>strength.has(d)||runs.has(d)).length,
   strengthDays:days.filter(d=>strength.has(d)).length,
   cardioDays:days.filter(d=>runs.has(d)).length};
 });
}
export function kgDisplay(kg:number,unit:"metric"|"imperial"):number {
 const converted=kg*(unit==="metric"?1:2.2046226218);
 return Math.round(converted*10)/10;
}
export function formatNumber(number:number,maximumFractionDigits=0):string {
 return number.toLocaleString("pt-BR",{maximumFractionDigits});
}
