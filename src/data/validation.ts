import type { GymBackup, UserSettings } from "../domain/models";
import { isExerciseImageUrl } from "../features/library/exerciseImages.ts";

export const SCHEMA_VERSION = 1;
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

export const DEFAULT_SETTINGS: UserSettings = {
  units: "metric",
  defaultRestSeconds: 90,
  shareHeartRateByDefault: false,
  shareLocationByDefault: false,
  displayName: "",
  personalGoal: "",
  largeText: false,
  reducedMotion: false,
};

type JsonRecord = Record<string, unknown>;
const record = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown, max = 500): value is string =>
  typeof value === "string" && value.length <= max;
const id = (value: unknown): value is string => text(value, 120) && value.length > 0;
const count = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const iso = (value: unknown) => text(value, 40) && !Number.isNaN(Date.parse(value));
const date = (value: unknown) => text(value, 10) && /^\d{4}-\d{2}-\d{2}$/.test(value);
const optional = (value: unknown, test: (input: unknown) => boolean) => value === undefined || test(value);
const strings = (value: unknown) => Array.isArray(value) && value.every(v => text(v, 500));
const typed = (value: unknown, options: string[]) => typeof value === "string" && options.includes(value);
const weeklyPlanIdsValid = (value:unknown):boolean =>
  Array.isArray(value) && value.length === 7 && value.every(v=>v===null || id(v));
const scheduledCardioValid = (value:unknown):boolean =>
  Array.isArray(value) && value.length === 7 && value.every(v=>v===null ||
    (record(v) && text(v.label,100) && v.label.length>0 && (v.minutes===null || (count(v.minutes) && (v.minutes as number)<=600)) &&
      typeof v.optional==="boolean" && text(v.note,500)));


export function validateSettings(raw: unknown): UserSettings {
  if (!record(raw)) throw new Error("Configurações inválidas.");
  if (!typed(raw.units, ["metric", "imperial"]) || !count(raw.defaultRestSeconds) || (raw.defaultRestSeconds as number) > 3600 ||
      typeof raw.shareHeartRateByDefault !== "boolean" || typeof raw.shareLocationByDefault !== "boolean" ||
      !optional(raw.displayName, v => text(v, 100)) ||
      !optional(raw.personalGoal, v => text(v, 300)) ||
      !optional(raw.largeText, v => typeof v === "boolean") ||
      !optional(raw.reducedMotion, v => typeof v === "boolean") ||
      !optional(raw.weeklyPlanIds, weeklyPlanIdsValid) ||
      !optional(raw.weeklyCardio, scheduledCardioValid)) {
    throw new Error("As preferências no arquivo não são válidas.");
  }
  return {
    units: raw.units as UserSettings["units"],
    defaultRestSeconds: raw.defaultRestSeconds as number,
    shareHeartRateByDefault: raw.shareHeartRateByDefault as boolean,
    shareLocationByDefault: raw.shareLocationByDefault as boolean,
    displayName: typeof raw.displayName === "string" ? raw.displayName : "",
    personalGoal: typeof raw.personalGoal === "string" ? raw.personalGoal : "",
    largeText: raw.largeText === true,
    reducedMotion: raw.reducedMotion === true,
    ...(Array.isArray(raw.weeklyPlanIds)?{weeklyPlanIds:raw.weeklyPlanIds as Array<string|null>}:{ }),
    ...(Array.isArray(raw.weeklyCardio)?{weeklyCardio:raw.weeklyCardio as UserSettings["weeklyCardio"]}:{ }),
  };
}
const planned = (v: unknown) => record(v) && id(v.id) && typed(v.kind,["warmup","working"]) &&
  count(v.minReps) && count(v.maxReps) && (v.minReps as number) <= (v.maxReps as number) &&
  optional(v.targetWeightKg,number) && optional(v.targetRir,n=>number(n)&&(n as number)<=10) &&
  optional(v.targetRirMax,n=>number(n)&&(n as number)<=10 && (v.targetRir===undefined || (n as number)>=(v.targetRir as number)));
const exercise = (v: unknown) => record(v) && id(v.id) && text(v.name,200) && text(v.primaryMuscle,120) &&
  typeof v.isCustom === "boolean" && optional(v.secondaryMuscles,strings) && optional(v.equipment,n=>text(n,100)) &&
  optional(v.imageUrl,isExerciseImageUrl) && optional(v.instructions,strings);
const planExercise = (v: unknown) => record(v) && id(v.id) && id(v.exerciseId) && count(v.order) &&
  count(v.restSeconds) && Array.isArray(v.sets) && v.sets.every(planned) && optional(v.notes,n=>text(n,3000));
const plan = (v: unknown) => record(v) && id(v.id) && text(v.name,200) && iso(v.createdAt) && iso(v.updatedAt) &&
  Array.isArray(v.exercises) && v.exercises.every(planExercise);
const completedSet = (v: unknown) => record(v) && id(v.id) && typed(v.kind,["warmup","working"]) &&
  number(v.weightKg) && count(v.reps) && optional(v.rir,n=>number(n)&&(n as number)<=10) && iso(v.completedAt) && optional(v.plannedSetId,id);
const sessionExercise = (v: unknown) => record(v) && id(v.id) && id(v.exerciseId) &&
  text(v.exerciseNameSnapshot,200) && count(v.order) && Array.isArray(v.plannedSetsSnapshot) &&
  v.plannedSetsSnapshot.every(planned) && optional(v.restSecondsSnapshot,n=>count(n)&&(n as number)<=3600) && Array.isArray(v.sets) && v.sets.every(completedSet) &&
  optional(v.notes,n=>text(n,3000));
const session = (v: unknown) => record(v) && id(v.id) && date(v.localDate) && iso(v.startedAt) &&
  typed(v.status,["in_progress","completed","abandoned"]) && optional(v.endedAt,iso) &&
  optional(v.restUntil,iso) && optional(v.restPausedSeconds,n=>count(n)&&(n as number)<=3600) &&
  !(v.restUntil!==undefined && v.restPausedSeconds!==undefined) &&
  (v.status==="in_progress" || (v.restUntil===undefined && v.restPausedSeconds===undefined)) &&
  optional(v.planId,id) && optional(v.planNameSnapshot,n=>text(n,200)) &&
  Array.isArray(v.exercises) && v.exercises.every(sessionExercise) &&
  (v.endedAt === undefined || Date.parse(v.endedAt as string)>=Date.parse(v.startedAt as string));
const cardio = (v: unknown) => record(v) && id(v.id) && date(v.localDate) &&
  typed(v.kind,["treadmill","outdoor_run","walk","other"]) && optional(v.activityName,n=>text(n,100)) && count(v.durationSeconds) &&
  optional(v.startedAt,iso) && optional(v.distanceMeters,number) && optional(v.inclinePercent,number) &&
  optional(v.averageHeartRateBpm,number) && optional(v.notes,n=>text(n,3000)) &&
  typed(v.source,["manual","health_import"]) && optional(v.importBatchId,id);
const batch = (v: unknown) => record(v) && id(v.id) && iso(v.importedAt) &&
  text(v.source,200) && text(v.format,100) && Array.isArray(v.importedEntityIds) &&
  v.importedEntityIds.every(id);

function validatedList<T>(value: unknown, label: string, predicate: (v: unknown) => boolean): T[] {
  if (!Array.isArray(value) || value.length > 100000 || !value.every(predicate))
    throw new Error("Registros inválidos em: " + label + ".");
  const keys = new Set<string>();
  for (const item of value) {
    const key = (item as { id: string }).id;
    if (keys.has(key)) throw new Error("IDs duplicados em: " + label + ".");
    keys.add(key);
  }
  return value as T[];
}

export function validateGymBackup(value: unknown): GymBackup {
  if (!record(value)) throw new Error("O arquivo não contém um backup do GYM.");
  if (value.schemaVersion !== SCHEMA_VERSION)
    throw new Error("Versão do backup incompatível. Nenhum dado foi alterado.");
  if (!iso(value.exportedAt)) throw new Error("Data do backup inválida.");
  const output: GymBackup = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: value.exportedAt as string,
    exercises: validatedList(value.exercises,"exercícios",exercise),
    plans: validatedList(value.plans,"fichas",plan),
    workoutSessions: validatedList(value.workoutSessions,"sessões",session),
    cardioSessions: validatedList(value.cardioSessions,"cardio",cardio),
    importBatches: validatedList(value.importBatches,"importações",batch),
    settings: validateSettings(value.settings),
  };
  for (const item of output.workoutSessions) validateWorkoutSession(item);
  return output;
}

/** Validations for atomic writes from the mobile plan editor. */
export function validateWorkoutPlan(value: unknown): void {
  if (!plan(value)) throw new Error("Ficha inválida. Confira nome, exercícios, séries e descanso.");
  const p=value as { exercises: {id:string;sets:{id:string}[];restSeconds:number}[] };
  const seen=new Set<string>();
  for(const ex of p.exercises){
    if (seen.has(ex.id))throw new Error("Há exercícios duplicados com o mesmo identificador.");
    seen.add(ex.id);
    if(ex.restSeconds>3600) throw new Error("O descanso não pode ultrapassar 3600 segundos.");
    const series=new Set<string>();
    for(const set of ex.sets){if(series.has(set.id))throw new Error("Séries duplicadas no mesmo exercício.");series.add(set.id);}
  }
}
export function validateCustomExercise(value: unknown): void {
  if(!exercise(value)) throw new Error("Exercício inválido. Confira nome, grupo muscular e equipamento.");
}

/** Accepts old v1 sessions but validates new completed-to-planned set references. */
export function validateWorkoutSession(value:unknown):void {
  if(!session(value))throw new Error("Registro de treino inválido. Nenhuma alteração foi feita.");
  const current=value as {
    exercises:{id:string;plannedSetsSnapshot:{id:string}[];sets:{id:string;plannedSetId?:string}[]}[];
  };
  const ids=new Set<string>();
  for(const ex of current.exercises) {
    if(ids.has(ex.id))throw new Error("Exercícios duplicados no registro.");
    ids.add(ex.id);
    const planned=new Set(ex.plannedSetsSnapshot.map(s=>s.id));
    if(planned.size!==ex.plannedSetsSnapshot.length)throw new Error("Séries planejadas duplicadas.");
    const linked=new Set<string>(), setIds=new Set<string>();
    for(const set of ex.sets) {
      if(setIds.has(set.id))throw new Error("Série registrada duas vezes.");
      setIds.add(set.id);
      if(set.plannedSetId !== undefined) {
        if(!planned.has(set.plannedSetId))throw new Error("Série não pertence à ficha iniciada.");
        if(linked.has(set.plannedSetId))throw new Error("Registro duplicado da mesma série planejada.");
        linked.add(set.plannedSetId);
      }
    }
  }
}

/** Validate a single cardio record before any IndexedDB mutation. */
export function validateCardioSession(value:unknown):void {
  if(!cardio(value)) throw new Error("Registro de cardio inválido: confira os campos informados.");
  const c=value as {durationSeconds:number;distanceMeters?:number;inclinePercent?:number;averageHeartRateBpm?:number;activityName?:string;kind:string};
  if(c.durationSeconds>604800)throw new Error("A duração não pode ultrapassar sete dias.");
  if(c.distanceMeters!==undefined&&c.distanceMeters>1000000)throw new Error("A distância informada está acima do limite.");
  if(c.inclinePercent!==undefined&&c.inclinePercent>30)throw new Error("Inclinação deve estar entre 0 e 30%.");
  if(c.averageHeartRateBpm!==undefined&&(c.averageHeartRateBpm<20||c.averageHeartRateBpm>250))throw new Error("Frequência cardíaca fora do intervalo permitido.");
  if(c.kind==="other"&&!c.activityName?.trim())throw new Error("Dê um nome para a atividade personalizada.");
}
