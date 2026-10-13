import type { CardioSession, WorkoutSession } from "../../domain/models";
import { cardioTitle, paceLabel } from "../cardio/cardioDomain";

export type ShareFormat="story"|"feed"|"square";
export type ShareStyle="ember"|"minimal";
export type ShareExport="png"|"jpeg";
export type ShareKind="strength"|"cardio";
export type ShareSession={kind:ShareKind;id:string;date:string;sortAt:string;title:string};
export type SharePrivacy={showName:boolean;showHeartRate:boolean;showExerciseList:boolean;showNotes:boolean};
export const DEFAULT_SHARE_PRIVACY:SharePrivacy={showName:false,showHeartRate:false,showExerciseList:true,showNotes:false};
export const SHARE_SIZES:Record<ShareFormat,[number,number]>={story:[1080,1920],feed:[1080,1350],square:[1080,1080]};
export function eligibleShares(workouts:readonly WorkoutSession[],cardios:readonly CardioSession[]):ShareSession[]{
 return [
  ...workouts.filter(w=>w.status==="completed").map(w=>({
   kind:"strength" as const,id:w.id,date:w.localDate,sortAt:w.endedAt??w.startedAt,title:w.planNameSnapshot||"Musculação"
  })),
  ...cardios.map(c=>({kind:"cardio" as const,id:c.id,date:c.localDate,sortAt:c.startedAt??c.localDate,title:cardioTitle(c)}))
 ].sort((a,b)=>b.date.localeCompare(a.date)||b.sortAt.localeCompare(a.sortAt));
}
function timeLabel(seconds:number):string{
 const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60);
 return h? h+"h "+String(m).padStart(2,"0")+"min" : m+"min"+(seconds<60?" "+seconds+"s":"");
}
function calendarLabel(date:string):string{
 const [year,month,day]=date.split("-");
 return day+"/"+month+"/"+year;
}
export interface CardData{
 kind:ShareKind;title:string;date:string;
 hero:string;heroUnit:string;subtitle:string;
 metrics:{label:string;value:string}[];
 details:string[];credit:string;
}
export function cardFromWorkout(w:WorkoutSession,privacy:SharePrivacy,units:"metric"|"imperial",name?:string):CardData{
 if(w.status!=="completed")throw new Error("Só é possível compartilhar treinos concluídos.");
 const exer=w.exercises.filter(ex=>ex.sets.length>0);
 const sets=exer.flatMap(ex=>ex.sets.filter(s=>s.kind==="working"));
 const totalKg=sets.reduce((sum,s)=>sum+s.weightKg*s.reps,0);
 const converted=units==="metric"?totalKg:totalKg*2.2046226218;
 const duration=w.endedAt?(Date.parse(w.endedAt)-Date.parse(w.startedAt))/1000:undefined;
 const validDuration=duration!==undefined&&Number.isFinite(duration)&&duration>0?Math.round(duration):undefined;
 const metric=[{label:"SÉRIES EFETIVAS",value:String(sets.length)},
  {label:"EXERCÍCIOS FEITOS",value:String(exer.length)},
  {label:"VOLUME EXTERNO",value:converted.toLocaleString("pt-BR",{maximumFractionDigits:0})+" "+(units==="metric"?"kg":"lb")+"×reps"}];
 if(validDuration!==undefined)metric.unshift({label:"DURAÇÃO",value:timeLabel(validDuration)});
 const list=privacy.showExerciseList?exer.map(ex=>ex.exerciseNameSnapshot).slice(0,5):[];
 return {kind:"strength",title:w.planNameSnapshot||"Treino de musculação",date:calendarLabel(w.localDate),
  hero:String(sets.length),heroUnit:"SÉRIES",subtitle:privacy.showName&&name?.trim()?name.trim():"TREINO CONCLUÍDO",
  metrics:metric,details:list,credit:"DADOS REAIS · GYM"};
}
export function cardFromCardio(c:CardioSession,privacy:SharePrivacy,name?:string):CardData{
 const distance=c.distanceMeters!==undefined&&c.distanceMeters>0?c.distanceMeters:undefined;
 const h=distance?(distance/1000).toLocaleString("pt-BR",{maximumFractionDigits:2}):"";
 const heart=privacy.showHeartRate&&c.averageHeartRateBpm!==undefined?
  [{label:"FC MÉDIA",value:c.averageHeartRateBpm+" bpm"}]:[];
 const metrics=[
  {label:"DURAÇÃO",value:timeLabel(c.durationSeconds)},
  ...(distance?[{label:"DISTÂNCIA",value:h+" km"},{label:"RITMO",value:paceLabel(c.durationSeconds,distance)}]:[]),
  ...heart
 ];
 const details=privacy.showNotes&&c.notes?.trim()?[c.notes.trim().slice(0,140)]:[];
 return {kind:"cardio",title:cardioTitle(c),date:calendarLabel(c.localDate),
  hero:distance?h:String(Math.round(c.durationSeconds/60)),
  heroUnit:distance?"KM":"MIN",
  subtitle:privacy.showName&&name?.trim()?name.trim():"ATIVIDADE REGISTRADA",
  metrics,details,credit:"DADOS REAIS · GYM"};
}
export function buildShareData(
 selected:ShareSession,workouts:readonly WorkoutSession[],cardios:readonly CardioSession[],
 privacy:SharePrivacy,units:"metric"|"imperial",name?:string
):CardData{
 if(selected.kind==="strength"){
  const w=workouts.find(x=>x.id===selected.id&&x.status==="completed");
  if(!w)throw new Error("Este treino não está mais disponível.");
  return cardFromWorkout(w,privacy,units,name);
 }
 const c=cardios.find(x=>x.id===selected.id);
 if(!c)throw new Error("Esta atividade não está mais disponível.");
 return cardFromCardio(c,privacy,name);
}
