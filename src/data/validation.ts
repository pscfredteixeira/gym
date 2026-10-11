import type { GymBackup, UserSettings } from "../domain/models";

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

export function validateSettings(raw: unknown): UserSettings {
  if (!record(raw)) throw new Error("Configurações inválidas.");
  if (!typed(raw.units, ["metric", "imperial"]) || !count(raw.defaultRestSeconds) || (raw.defaultRestSeconds as number) > 3600 ||
      typeof raw.shareHeartRateByDefault !== "boolean" || typeof raw.shareLocationByDefault !== "boolean" ||
      !optional(raw.displayName, v => text(v, 100)) ||
      !optional(raw.personalGoal, v => text(v, 300)) ||
      !optional(raw.largeText, v => typeof v === "boolean") ||
      !optional(raw.reducedMotion, v => typeof v === "boolean")) {
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
  };
}
const planned = (v: unknown) => record(v) && id(v.id) && typed(v.kind,["warmup","working"]) &&
  count(v.minReps) && count(v.maxReps) && (v.minReps as number) <= (v.maxReps as number) &&
  optional(v.targetWeightKg,number) && optional(v.targetRir,n=>number(n)&&(n as number)<=10) &&
  optional(v.targetRirMax,n=>number(n)&&(n as number)<=10 && (v.targetRir===undefined || (n as number)>=(v.targetRir as number)));
const exercise = (v: unknown) => record(v) && id(v.id) && text(v.name,200) && text(v.primaryMuscle,120) &&
  typeof v.isCustom === "boolean" && optional(v.secondaryMuscles,strings) && optional(v.equipment,n=>text(n,100)) &&
  optional(v.imageUrl,n=>text(n,2000)) && optional(v.instructions,strings);
const planExercise = (v: unknown) => record(v) && id(v.id) && id(v.exerciseId) && count(v.order) &&
  count(v.restSeconds) && Array.isArray(v.sets) && v.sets.every(planned) && optional(v.notes,n=>text(n,3000));
const plan = (v: unknown) => record(v) && id(v.id) && text(v.name,200) && iso(v.createdAt) && iso(v.updatedAt) &&
  Array.isArray(v.exercises) && v.exercises.every(planExercise);
const completedSet = (v: unknown) => record(v) && id(v.id) && typed(v.kind,["warmup","working"]) &&
  number(v.weightKg) && count(v.reps) && optional(v.rir,n=>number(n)&&(n as number)<=10) && iso(v.completedAt);
const sessionExercise = (v: unknown) => record(v) && id(v.id) && id(v.exerciseId) &&
  text(v.exerciseNameSnapshot,200) && count(v.order) && Array.isArray(v.plannedSetsSnapshot) &&
  v.plannedSetsSnapshot.every(planned) && Array.isArray(v.sets) && v.sets.every(completedSet) &&
  optional(v.notes,n=>text(n,3000));
const session = (v: unknown) => record(v) && id(v.id) && date(v.localDate) && iso(v.startedAt) &&
  typed(v.status,["in_progress","completed","abandoned"]) && optional(v.endedAt,iso) &&
  optional(v.planId,id) && optional(v.planNameSnapshot,n=>text(n,200)) &&
  Array.isArray(v.exercises) && v.exercises.every(sessionExercise) &&
  (v.endedAt === undefined || Date.parse(v.endedAt as string)>=Date.parse(v.startedAt as string));
const cardio = (v: unknown) => record(v) && id(v.id) && date(v.localDate) &&
  typed(v.kind,["treadmill","outdoor_run","other"]) && count(v.durationSeconds) &&
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
  return output;
}
