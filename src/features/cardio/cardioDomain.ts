import type { CardioKind, CardioSession } from "../../domain/models";

export const cardioNames:Record<CardioKind,string>={
 treadmill:"Esteira",outdoor_run:"Corrida ao ar livre",walk:"Caminhada",other:"Outro cardio"
};
export function localDateOf(date=new Date()):string{
 return [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");
}
export function isCalendarDate(value:string):boolean{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const [year,month,day]=value.split("-").map(Number);
 const candidate=new Date(year,month-1,day);
 return candidate.getFullYear()===year && candidate.getMonth()===month-1 && candidate.getDate()===day;
}
export type CardioDraft={
 kind:CardioKind; activityName:string;date:string;hours:string;minutes:string;seconds:string;
 distanceKm:string;inclinePercent:string;heartRate:string;notes:string;
};
export function blankCardioDraft(date=new Date(),kind:CardioKind="treadmill",suggestedMinutes?:number):CardioDraft{
 return {kind,activityName:"",date:localDateOf(date),hours:"0",minutes:suggestedMinutes===undefined?"":String(suggestedMinutes),
 seconds:"0",distanceKm:"",inclinePercent:"",heartRate:"",notes:""};
}
export function toDraft(session:CardioSession):CardioDraft{
 const total=session.durationSeconds;
 return {kind:session.kind,activityName:session.activityName??"",date:session.localDate,
   hours:String(Math.floor(total/3600)),minutes:String(Math.floor((total%3600)/60)),seconds:String(total%60),
   distanceKm:session.distanceMeters===undefined?"":String(Math.round(session.distanceMeters/1000*1000)/1000),
   inclinePercent:session.inclinePercent===undefined?"":String(session.inclinePercent),
   heartRate:session.averageHeartRateBpm===undefined?"":String(session.averageHeartRateBpm),notes:session.notes??""};
}
const boundedInt=(value:string,min:number,max:number,label:string,empty=false)=>{
 if(empty&&value.trim()==="")return undefined;
 if(!/^\d+$/.test(value.trim()))throw new Error("Informe "+label+" como número inteiro.");
 const n=Number(value);if(!Number.isSafeInteger(n)||n<min||n>max)throw new Error(label+" fora dos limites.");
 return n;
};
function optionalDecimal(value:string,min:number,max:number,label:string):number|undefined{
 const v=value.trim().replace(",",".");
 if(v==="")return undefined;
 if(!/^(?:\d+)(?:\.\d+)?$/.test(v))throw new Error("Informe "+label+" como número válido.");
 const num=Number(v);
 if(!Number.isFinite(num)||num<min||num>max)throw new Error(label+" fora dos limites.");
 return num;
}
export function parseCardioDraft(draft:CardioDraft,original?:CardioSession,at=new Date(),
  createId:()=>string=()=>crypto.randomUUID()):CardioSession{
 if(!isCalendarDate(draft.date))throw new Error("Selecione uma data válida.");
 const hours=boundedInt(draft.hours,0,167,"horas")??0;
 const minutes=boundedInt(draft.minutes,0,59,"minutos",true)??0;
 const seconds=boundedInt(draft.seconds,0,59,"segundos",true)??0;
 const duration=hours*3600+minutes*60+seconds;
 if(duration<1)throw new Error("Informe uma duração maior que zero.");
 if(duration>604800)throw new Error("A duração não pode superar sete dias.");
 const distanceKm=optionalDecimal(draft.distanceKm,0,1000,"distância");
 const incline=draft.kind==="treadmill"?optionalDecimal(draft.inclinePercent,0,30,"inclinação"):undefined;
 const heart=boundedInt(draft.heartRate,20,250,"frequência cardíaca",true);
 const name=draft.activityName.trim();
 if(draft.kind==="other"&&(!name||name.length>100))throw new Error("Dê um nome para esta atividade (até 100 caracteres).");
 if(draft.notes.length>3000)throw new Error("Observações ultrapassaram 3000 caracteres.");
 if(original?.source==="health_import")throw new Error("Registros importados não são editáveis pelo formulário manual.");
 const result:CardioSession={
  id:original?.id??createId(),kind:draft.kind,localDate:draft.date,
  durationSeconds:duration,source:"manual",
  ...(draft.kind==="other"?{activityName:name}:{}),
  ...(distanceKm===undefined?{}:{distanceMeters:Math.round(distanceKm*1000)}),
  ...(incline===undefined?{}:{inclinePercent:incline}),
  ...(heart===undefined?{}:{averageHeartRateBpm:heart}),
  ...(draft.notes.trim()?{notes:draft.notes.trim()}:{}),
  ...(original?.startedAt?{startedAt:original.startedAt}:{startedAt:at.toISOString()})
 };
 return result;
}
export function paceSecondsPerKm(durationSeconds:number,distanceMeters?:number):number|undefined{
 if(!Number.isFinite(durationSeconds)||durationSeconds<=0||!distanceMeters||!Number.isFinite(distanceMeters)||distanceMeters<=0)return undefined;
 return durationSeconds/(distanceMeters/1000);
}
export function paceLabel(durationSeconds:number,distanceMeters?:number):string{
 const pace=paceSecondsPerKm(durationSeconds,distanceMeters);
 if(pace===undefined)return "—";
 const rounded=Math.round(pace);
 return Math.floor(rounded/60)+":"+String(rounded%60).padStart(2,"0")+" /km";
}
export function speedKmH(durationSeconds:number,distanceMeters?:number):number|undefined{
 if(durationSeconds<=0||!distanceMeters||distanceMeters<=0)return undefined;
 return distanceMeters/1000/(durationSeconds/3600);
}
export function cardioTotals(sessions:CardioSession[]){
 const sum=sessions.reduce((all,s)=>{
  all.seconds+=s.durationSeconds;
  all.distanceMeters+=s.distanceMeters??0;
  if(s.distanceMeters!==undefined)all.distanceKnownCount++;
  return all;
 },{seconds:0,distanceMeters:0,distanceKnownCount:0});
 return {...sum,count:sessions.length};
}
export function cardioWeek(sessions:CardioSession[],monday:Date):{date:string;durationSeconds:number;count:number}[]{
 return Array.from({length:7},(_,i)=>{
  const day=new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+i);
  const date=localDateOf(day);
  const list=sessions.filter(s=>s.localDate===date);
  return {date,durationSeconds:list.reduce((n,s)=>n+s.durationSeconds,0),count:list.length};
 });
}
export function formatDuration(seconds:number):string{
 const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),s=seconds%60;
 return h>0?`${h}h ${String(m).padStart(2,"0")}min`:m>0?`${m}min ${String(s).padStart(2,"0")}s`:`${s}s`;
}
export function cardioTitle(session:CardioSession):string{
 return session.kind==="other"?(session.activityName?.trim()||"Outro cardio"):cardioNames[session.kind];
}
