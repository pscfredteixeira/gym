import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
(globalThis as typeof globalThis & {window:typeof globalThis}).window=globalThis;
const {buildProgramCatalog}=await import("../src/data/program1010.ts");
const {
  createSessionSnapshot,restView,beginRest,pauseRest,continueRest,adjustRest,skipRest,
  recordSetWithRest,nextPlannedSet,closeSession
}=await import("../src/features/training/sessionDomain.ts");
const {startStoredWorkout,getActiveWorkout,mutateStoredWorkout,createBackup,restoreBackup}=await import("../src/data/storage.ts");
const {validateWorkoutSession}=await import("../src/data/validation.ts");
const catalog=buildProgramCatalog("2026-10-11T10:00:00Z");
const at=(iso:string)=>new Date(iso);
const start=at("2026-10-11T14:00:00.000Z");
let n=0;
const getId=()=>String(++n)+"-sprint05";
const fresh=()=>createSessionSnapshot(catalog.plans[0],catalog.exercises,start,getId);

test("clock computes actual deadline across suspended tab and expiry",()=>{
  const s=beginRest(fresh(),90,start);
  assert.equal(s.restUntil,"2026-10-11T14:01:30.000Z");
  assert.deepEqual(restView(s,start),{status:"running",remainingSeconds:90});
  assert.deepEqual(restView(s,at("2026-10-11T14:01:09.100Z")),{status:"running",remainingSeconds:21});
  assert.deepEqual(restView(s,at("2026-10-11T14:05:00Z")),{status:"finished",remainingSeconds:0});
});
test("pause, resume, plus/minus and skip keep timer consistent",()=>{
  const init=beginRest(fresh(),90,start);
  const pause=pauseRest(init,at("2026-10-11T14:00:25Z"));
  assert.equal(pause.restUntil,undefined);
  assert.equal(pause.restPausedSeconds,65);
  assert.deepEqual(restView(pause,at("2026-10-11T15:00:00Z")),{status:"paused",remainingSeconds:65});
  const added=adjustRest(pause,15,at("2026-10-11T15:00:00Z"));
  assert.equal(added.restPausedSeconds,80);
  const resumed=continueRest(added,at("2026-10-11T15:00:00Z"));
  assert.equal(resumed.restUntil,"2026-10-11T15:01:20.000Z");
  assert.equal(resumed.restPausedSeconds,undefined);
  const shortened=adjustRest(resumed,-15,at("2026-10-11T15:00:10Z"));
  assert.equal(restView(shortened,at("2026-10-11T15:00:10Z")).remainingSeconds,55);
  assert.equal(restView(skipRest(shortened),at("2026-10-11T15:00:10Z")).status,"idle");
});
test("zero rest is idle; an adjustment to zero is finished, and can be extended",()=>{
  const zero=beginRest(fresh(),0,start);
  assert.equal(restView(zero,start).status,"idle");
  const ended=adjustRest(beginRest(fresh(),10,start),-15,start);
  assert.deepEqual(restView(ended,start),{status:"finished",remainingSeconds:0});
  const added=adjustRest(ended,15,start);
  assert.deepEqual(restView(added,start),{status:"paused",remainingSeconds:15});
  assert.equal(continueRest(added,start).restUntil,"2026-10-11T14:00:15.000Z");
});
test("new set saves rest and correction does not restart it",()=>{
  const s=fresh();const ex=s.exercises[0];
  const target={sessionExerciseId:ex.id,plannedSetId:ex.plannedSetsSnapshot[0].id};
  const saved=recordSetWithRest(s,target,{weightKg:25,reps:10},90,start,getId);
  assert.equal(saved.exercises[0].sets.length,1);
  assert.equal(restView(saved,start).remainingSeconds,90);
  const corrected=recordSetWithRest(saved,target,{weightKg:30,reps:9},90,at("2026-10-11T14:00:40Z"),getId);
  assert.equal(corrected.exercises[0].sets.length,1);
  assert.equal(corrected.restUntil,saved.restUntil);
  assert.equal(corrected.exercises[0].sets[0].weightKg,30);
  assert.deepEqual(nextPlannedSet(corrected,0,0),{exerciseIndex:0,setIndex:1});
});
test("per-exercise rest snapshot has priority over default when configured",()=>{
  const s=fresh();
  const ex=s.exercises[0],target={sessionExerciseId:ex.id,plannedSetId:ex.plannedSetsSnapshot[0].id};
  const with120={...s,exercises:s.exercises.map((e,i)=>i===0?{...e,restSecondsSnapshot:120}:e)};
  const saved=recordSetWithRest(with120,target,{weightKg:20,reps:6},90,start,getId);
  assert.equal(restView(saved,start).remainingSeconds,120);
  assert.throws(()=>beginRest(s,3601,start),/3600/);
  validateWorkoutSession(saved);
});
test("ending workout clears both running and paused timers",()=>{
  const s=fresh();const ex=s.exercises[0],target={sessionExerciseId:ex.id,plannedSetId:ex.plannedSetsSnapshot[0].id};
  const saved=recordSetWithRest(s,target,{weightKg:20,reps:8},90,start,getId);
  const completed=closeSession(saved,"completed",at("2026-10-11T14:03:00Z"));
  assert.equal(completed.restUntil,undefined);
  assert.equal(completed.restPausedSeconds,undefined);
  assert.equal(restView(completed).status,"idle");
  const abandoned=closeSession(pauseRest(beginRest(fresh(),45,start),at("2026-10-11T14:00:10Z")),"abandoned",at("2026-10-11T14:01:00Z"));
  assert.equal(abandoned.restPausedSeconds,undefined);
  validateWorkoutSession(abandoned);
});
test("deadline survives IndexedDB reload and JSON backup/restore",async()=>{
  const s=fresh();await startStoredWorkout(s);
  const target={sessionExerciseId:s.exercises[0].id,plannedSetId:s.exercises[0].plannedSetsSnapshot[0].id};
  await mutateStoredWorkout(s.id,current=>recordSetWithRest(current,target,{weightKg:45,reps:9},90,start,getId));
  let active=await getActiveWorkout();assert.ok(active);
  assert.equal(restView(active,at("2026-10-11T14:00:45Z")).remainingSeconds,45);
  const backup=await createBackup();
  assert.equal(backup.workoutSessions.find(x=>x.id===s.id)?.restUntil,"2026-10-11T14:01:30.000Z");
  await mutateStoredWorkout(s.id,current=>pauseRest(current,at("2026-10-11T14:00:20Z")));
  active=await getActiveWorkout();assert.ok(active);
  assert.equal(active.restPausedSeconds,70);
  await restoreBackup(backup);
  active=await getActiveWorkout();assert.ok(active);
  assert.equal(active.restUntil,"2026-10-11T14:01:30.000Z");
});
test("malformed timer state is rejected without losing existing sessions",async()=>{
  const original=await createBackup();
  const invalid=structuredClone(original);
  invalid.workoutSessions[0].restPausedSeconds=20;
  await assert.rejects(()=>restoreBackup(invalid),/sessões|Registro/);
  assert.deepEqual((await getActiveWorkout())?.restUntil,original.workoutSessions[0].restUntil);
  invalid.workoutSessions[0].restPausedSeconds=undefined;
  invalid.workoutSessions[0].restUntil="not-a-date";
  await assert.rejects(()=>restoreBackup(invalid),/sessões|Registro/);
});
