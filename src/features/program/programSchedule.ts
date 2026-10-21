import type { UserSettings, WorkoutPlan, ScheduledCardio } from "../../domain/models";
import { PROGRAM_DAYS, planId, type ProgramDay } from "../../data/program6.ts";
import { PROGRAM_DAYS as LEGACY_DAYS, planId as legacyPlanId } from "../../data/program1010.ts";

export const defaultWeeklyPlanIds = (): Array<string|null> =>
  PROGRAM_DAYS.map(d=>d.exercises.length>0?planId(d.id):null);

export const defaultWeeklyCardio = (): Array<ScheduledCardio|null> =>
  PROGRAM_DAYS.map(d=>d.cardio?{
    label:d.cardio.label,minutes:d.cardio.minutes??null,optional:d.cardio.optional??false,
    note:d.cardio.note??""
  }:null);

const legacyWeeklyPlanIds = (): Array<string|null> =>
  LEGACY_DAYS.map(d=>d.exercises.length>0?legacyPlanId(d.id):null);

const legacyWeeklyCardio = (): Array<ScheduledCardio|null> =>
  LEGACY_DAYS.map((d,i)=>d.cardio?{
    label:d.cardio.label,minutes:d.cardio.minutes??null,optional:d.cardio.optional??false,
    note:d.cardio.note??""
  }:i===6?{
    label:"Caminhada leve",minutes:null,optional:true,
    note:"Descanso completo; caminhada leve opcional."
  }:null);

/** Migra SOMENTE a agenda idêntica ao padrão antigo; mantém qualquer agenda personalizada.
 * Alterações em fichas e sessões nunca são afetadas. Cardio personalizado também é mantido. */
export function upgradeLegacyDefaultSchedule(settings: UserSettings): UserSettings | null {
  if (!settings.weeklyPlanIds ||
      JSON.stringify(settings.weeklyPlanIds)!==JSON.stringify(legacyWeeklyPlanIds())) return null;
  const defaultCardio = settings.weeklyCardio &&
    JSON.stringify(settings.weeklyCardio)===JSON.stringify(legacyWeeklyCardio());
  return {
    ...settings,weeklyPlanIds:defaultWeeklyPlanIds(),
    ...(defaultCardio?{weeklyCardio:defaultWeeklyCardio()}:{})
  };
}

export function configuredPlanIds(settings: UserSettings): Array<string|null> {
  return settings.weeklyPlanIds?.slice()??defaultWeeklyPlanIds();
}
export function configuredCardio(settings: UserSettings): Array<ScheduledCardio|null> {
  return settings.weeklyCardio?.map(v=>v?{...v}:null)??defaultWeeklyCardio();
}
export function swapAssignment(current: Array<string|null>,index:number,chosen:string|null): Array<string|null> {
  if(index<0||index>=7)throw new Error("Dia inválido.");
  const result=current.slice();
  const previous=result[index];
  const other=chosen===null?-1:result.findIndex((id,i)=>i!==index && id===chosen);
  result[index]=chosen;
  if(other>=0)result[other]=previous;
  return result;
}
export interface AssignedDay {
  day:ProgramDay;
  plan?:WorkoutPlan;
  planId:string|null;
}
export function resolveSchedule(settings:UserSettings,plans:WorkoutPlan[]):AssignedDay[] {
  const ids=configuredPlanIds(settings),cardio=configuredCardio(settings);
  return PROGRAM_DAYS.map((calendar,i)=>{
    const id=ids[i]??null;
    const plan=id?plans.find(p=>p.id===id):undefined;
    const preset=[...PROGRAM_DAYS,...LEGACY_DAYS].find(
      p=>planId(p.id)===id||legacyPlanId(p.id)===id
    );
    const title=plan?.name.replace(/^(Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo)\s*[—–-]\s*/i,"").trim()
      ??(id?"FICHA INDISPONÍVEL":"DESCANSO");
    const cardioItem=cardio[i];
    const day:ProgramDay={
      ...calendar,
      title,subtitle:id?(preset?.subtitle??"Treino personalizado"):"Recuperação e descanso",
      exercises:id?(preset?.exercises??[]):[],
      focus:id?preset?.focus:undefined,
      cardio:cardioItem?{...cardioItem,minutes:cardioItem.minutes??undefined}:undefined,
      note:id?undefined:calendar.note??"Dia sem treino de musculação"
    };
    return {day,plan,planId:id};
  });
}
