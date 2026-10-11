import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
(globalThis as typeof globalThis & {window: typeof globalThis}).window=globalThis;
const {buildProgramCatalog}=await import("../src/data/program1010.ts");
const {
  createSessionSnapshot,countCompleted,countPlanned,recordSetInSnapshot,removeRecordedSet,
  closeSession,getPreviousPerformance,workoutDuration
}=await import("../src/features/training/sessionDomain.ts");
const {
  startStoredWorkout,getActiveWorkout,mutateStoredWorkout,listEntities,
  savePlanWithExercises,createBackup,restoreBackup
}=await import("../src/data/storage.ts");
const {validateWorkoutSession}=await import("../src/data/validation.ts");

const catalog=buildProgramCatalog("2026-10-11T13:00:00Z");
const date=new Date("2026-10-11T14:00:00.000Z");
const ids=(prefix:string)=>{let i=0;return()=>prefix+"-"+(++i);};
const full=()=>createSessionSnapshot(catalog.plans[0],catalog.exercises,date,ids("sessionA"));

test("real session starts as immutable prescribed snapshot, no made-up actual sets",()=>{
  const s=full();
  assert.equal(s.status,"in_progress");
  assert.equal(s.planNameSnapshot,catalog.plans[0].name);
  assert.equal(s.exercises.length,5);
  assert.equal(countPlanned(s),10);
  assert.equal(countCompleted(s),0);
  assert.equal(s.endedAt,undefined);
  assert.equal(s.exercises[0].exerciseNameSnapshot,"Supino inclinado com halteres");
  assert.deepEqual(s.exercises[0].plannedSetsSnapshot.map(x=>[x.minReps,x.maxReps]),[[6,9],[9,12]]);
  validateWorkoutSession(s);
});
test("cannot conclude empty session or record invalid values",()=>{
  const s=full(),ex=s.exercises[0];
  assert.throws(()=>closeSession(s,"completed"),/pelo menos uma série/);
  assert.throws(()=>recordSetInSnapshot(s,{sessionExerciseId:ex.id,plannedSetId:ex.plannedSetsSnapshot[0].id},{weightKg:-5,reps:10}),/carga/);
  assert.throws(()=>recordSetInSnapshot(s,{sessionExerciseId:ex.id,plannedSetId:ex.plannedSetsSnapshot[0].id},{weightKg:30,reps:10,rir:11}),/RIR/);
});
test("database stores one active session and prevents a second start",async()=>{
  const first=full();
  await startStoredWorkout(first);
  assert.equal((await getActiveWorkout())?.id,first.id);
  const next=createSessionSnapshot(catalog.plans[1],catalog.exercises,new Date("2026-10-11T15:00:00Z"),ids("sessionB"));
  await assert.rejects(()=>startStoredWorkout(next),/já tem um treino/);
  assert.equal((await listEntities("workoutSessions")).length,1);
});
test("set saves, updates without duplicate and can be undone",async()=>{
  const active=await getActiveWorkout();assert.ok(active);
  const ex=active.exercises[0],planned=ex.plannedSetsSnapshot[0];
  const target={sessionExerciseId:ex.id,plannedSetId:planned.id};
  await mutateStoredWorkout(active.id,s=>recordSetInSnapshot(s,target,{weightKg:30,reps:9,rir:1},new Date("2026-10-11T14:03:00Z"),ids("rep")));
  let updated=await getActiveWorkout();assert.ok(updated);
  assert.equal(updated.exercises[0].sets.length,1);
  const completedId=updated.exercises[0].sets[0].id;
  await mutateStoredWorkout(active.id,s=>recordSetInSnapshot(s,target,{weightKg:32,reps:8,rir:0},new Date("2026-10-11T14:04:00Z"),ids("not-used")));
  updated=await getActiveWorkout();assert.ok(updated);
  assert.equal(updated.exercises[0].sets.length,1);
  assert.equal(updated.exercises[0].sets[0].id,completedId);
  assert.equal(updated.exercises[0].sets[0].weightKg,32);
  await mutateStoredWorkout(active.id,s=>removeRecordedSet(s,target));
  assert.equal((await getActiveWorkout())?.exercises[0].sets.length,0);
  await mutateStoredWorkout(active.id,s=>recordSetInSnapshot(s,target,{weightKg:35,reps:7},new Date("2026-10-11T14:05:00Z"),ids("saved")));
  assert.equal((await getActiveWorkout())?.exercises[0].sets[0].reps,7);
});
test("editing the plan afterwards does not change started workout",async()=>{
  const old=await getActiveWorkout();assert.ok(old);
  await savePlanWithExercises({...catalog.plans[0],name:"Versão editada após iniciar",exercises:catalog.plans[0].exercises.slice(0,1)},[]);
  const persisted=await getActiveWorkout();assert.ok(persisted);
  assert.equal(persisted.exercises.length,5);
  assert.equal(persisted.planNameSnapshot,catalog.plans[0].name);
  assert.equal((await listEntities("plans")).find(p=>p.id===catalog.plans[0].id)?.exercises.length,1);
});
test("finishing records completed session and previous performance from real results",async()=>{
  const active=await getActiveWorkout();assert.ok(active);
  await mutateStoredWorkout(active.id,s=>closeSession(s,"completed",new Date("2026-10-11T14:35:00Z")));
  assert.equal(await getActiveWorkout(),undefined);
  const history=await listEntities("workoutSessions");
  assert.equal(history[0].status,"completed");
  assert.equal(workoutDuration(history[0]),2100);
  const prev=getPreviousPerformance(history,history[0].exercises[0].exerciseId);
  assert.equal(prev[0].weightKg,35);
  const backup=await createBackup();
  assert.equal(backup.workoutSessions.length,1);
  assert.equal(backup.workoutSessions[0].exercises[0].sets[0].plannedSetId,history[0].exercises[0].plannedSetsSnapshot[0].id);
});
test("old session cannot be edited; another workout can be abandoned with history preserved",async()=>{
  const old=(await listEntities("workoutSessions"))[0];
  await assert.rejects(()=>mutateStoredWorkout(old.id,s=>s),/encerrado/);
  const next=createSessionSnapshot(catalog.plans[1],catalog.exercises,new Date("2026-10-11T16:00:00Z"),ids("next"));
  await startStoredWorkout(next);
  await mutateStoredWorkout(next.id,s=>closeSession(s,"abandoned",new Date("2026-10-11T16:05:00Z")));
  assert.equal(await getActiveWorkout(),undefined);
  const history=await listEntities("workoutSessions");
  assert.deepEqual(history.map(s=>s.status).sort(),["abandoned","completed"]);
});
test("backup rejects inconsistent links and restores all real workouts",async()=>{
  const original=await createBackup();
  const wrong=structuredClone(original);
  wrong.workoutSessions[0].exercises[0].sets[0].plannedSetId="nonexistent-series";
  await assert.rejects(()=>restoreBackup(wrong),/Série não pertence/);
  assert.equal((await listEntities("workoutSessions")).length,2);
  await restoreBackup(original);
  const after=await listEntities("workoutSessions");
  assert.equal(after.length,2);
  assert.equal(after.find(s=>s.status==="completed")?.exercises[0].sets[0].weightKg,35);
});
