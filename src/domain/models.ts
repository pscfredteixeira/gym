/** Modelo estável v1: a persistência IndexedDB é implementada na Sprint 02. */
export type Id = string;
export type LocalDate = string; // YYYY-MM-DD — não converter pelo timezone ao exibir.
export type IsoInstant = string; // instante ISO em UTC.
export type SetKind = "warmup" | "working";
export type SessionStatus = "in_progress" | "completed" | "abandoned";
export type CardioKind = "treadmill" | "outdoor_run" | "other";

export interface Exercise {
  id: Id;
  name: string;
  primaryMuscle: string;
  secondaryMuscles?: string[];
  equipment?: string;
  imageUrl?: string;
  instructions?: string[];
  isCustom: boolean;
}

export interface PlannedSet {
  id: Id;
  kind: SetKind;
  minReps: number;
  maxReps: number;
  targetWeightKg?: number;
  targetRir?: number;
  /** Inclusive upper bound for a planned RIR range; equal to targetRir for exact RIR. */
  targetRirMax?: number;
}

export interface PlanExercise {
  id: Id;
  exerciseId: Id;
  order: number;
  restSeconds: number;
  sets: PlannedSet[];
  notes?: string;
}

export interface WorkoutPlan {
  id: Id;
  name: string;
  exercises: PlanExercise[];
  createdAt: IsoInstant;
  updatedAt: IsoInstant;
}

export interface CompletedSet {
  id: Id;
  kind: SetKind;
  weightKg: number;
  reps: number;
  rir?: number;
  completedAt: IsoInstant;
  /** Stable reference to one planned set inside the session snapshot. */
  plannedSetId?: Id;
}

export interface SessionExercise {
  id: Id;
  exerciseId: Id;
  exerciseNameSnapshot: string;
  order: number;
  plannedSetsSnapshot: PlannedSet[];
  /** Rest time as prescribed when this session began, independent of later edits. */
  restSecondsSnapshot?: number;
  sets: CompletedSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: Id;
  planId?: Id;
  planNameSnapshot?: string;
  localDate: LocalDate;
  startedAt: IsoInstant;
  endedAt?: IsoInstant;
  status: SessionStatus;
  exercises: SessionExercise[];
}

export interface CardioSession {
  id: Id;
  kind: CardioKind;
  localDate: LocalDate;
  startedAt?: IsoInstant;
  durationSeconds: number;
  distanceMeters?: number;
  inclinePercent?: number;
  averageHeartRateBpm?: number;
  notes?: string;
  source: "manual" | "health_import";
  importBatchId?: Id;
}

export interface ImportBatch {
  id: Id;
  importedAt: IsoInstant;
  source: string;
  format: string;
  importedEntityIds: Id[];
}

export interface ScheduledCardio {
  label: string;
  minutes: number | null;
  optional: boolean;
  note: string;
}
export interface UserSettings {
  /** Seven Monday-to-Sunday entries; null means a rest day. */
  weeklyPlanIds?: Array<string | null>;
  /** Seven day-specific cardio prescriptions; null means no planned cardio. */
  weeklyCardio?: Array<ScheduledCardio | null>;
  units: "metric" | "imperial";
  defaultRestSeconds: number;
  shareHeartRateByDefault: boolean;
  shareLocationByDefault: boolean;
  displayName?: string;
  personalGoal?: string;
  largeText?: boolean;
  reducedMotion?: boolean;
}

export interface GymBackup {
  schemaVersion: number;
  exportedAt: IsoInstant;
  exercises: Exercise[];
  plans: WorkoutPlan[];
  workoutSessions: WorkoutSession[];
  cardioSessions: CardioSession[];
  importBatches: ImportBatch[];
  settings: UserSettings;
}
