import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
(globalThis as typeof globalThis & {window:typeof globalThis}).window=globalThis;

const {buildProgramCatalog,exerciseId,planId}=await import("../src/data/program1010.ts");
const {EXERCISE_GUIDES,ORIGINAL_PROGRAM_EXERCISE_IDS,guideFor,matchingAlternatives,normalized,searchExercises,usedInPlans}=
 await import("../src/data/exerciseGuides.ts");
const {ensureProgramCatalog,listEntities,savePlanWithExercises,startStoredWorkout,createBackup,restoreBackup}=await import("../src/data/storage.ts");
const {createSessionSnapshot}=await import("../src/features/training/sessionDomain.ts");
const seed=buildProgramCatalog("2026-10-11T14:00:00.000Z");

test("every distinct original Programa 10/10 movement has an individual Portuguese technique guide",()=>{
  assert.equal(ORIGINAL_PROGRAM_EXERCISE_IDS.length,31);
  assert.equal(new Set(ORIGINAL_PROGRAM_EXERCISE_IDS).size,31);
  assert.equal(seed.exercises.length,31);
  for(const exercise of seed.exercises){
    const guide=guideFor(exercise);
    assert.ok(guide,"Missing guide: "+exercise.name);
    assert.equal(guide.execution.length,3,exercise.name);
    assert.equal(guide.avoid.length,2,exercise.name);
    assert.ok(guide.execution.every(s=>s.length>25));
    assert.ok(guide.avoid.every(s=>s.length>15));
    assert.ok(guide.focus.length>10);
    assert.ok(guide.alternatives.every(id=>id!==exercise.id));
  }
  assert.equal(Object.keys(EXERCISE_GUIDES).length,38);
});
test("search is case/accent insensitive across title, muscle and equipment",()=>{
  assert.equal(normalized("TRÍCEPS FRÂNCÊS"),"triceps frances");
  assert.equal(searchExercises(seed.exercises,"puxada","Todos","Todos").length,2);
  assert.ok(searchExercises(seed.exercises,"triceps","Todos","Todos").some(ex=>ex.name==="Tríceps corda"));
  assert.ok(searchExercises(seed.exercises,"halTERES","Todos","Todos").some(ex=>ex.name==="Supino inclinado com halteres"));
  assert.deepEqual(searchExercises(seed.exercises,"scott","Dorsais","Todos"),[]);
  assert.ok(searchExercises(seed.exercises,"","Bíceps","Banco Scott").some(ex=>ex.name==="Rosca Scott"));
});
test("alternatives point to available real exercises, never to absent records",()=>{
 const lat=seed.exercises.find(e=>e.name==="Puxada neutra");assert.ok(lat);
 const alternatives=matchingAlternatives(lat,seed.exercises);
 assert.ok(alternatives.some(e=>e.name==="Puxada unilateral no cabo"));
 assert.ok(alternatives.every(e=>e.id!==lat.id));
 assert.ok(alternatives.every(e=>seed.exercises.some(real=>real.id===e.id)));
 assert.deepEqual(matchingAlternatives({...lat,id:"custom-nonexistent",primaryMuscle:"Outro"},seed.exercises),[]);
});
test("custom exercises appear in search without fabricated editorial guidance",()=>{
 const custom={id:"custom-555",name:"Minha polia alternativa",primaryMuscle:"Dorsais",equipment:"Polia",isCustom:true};
 assert.equal(guideFor(custom),undefined);
 assert.ok(searchExercises([...seed.exercises,custom],"minha","Todos","Todos").some(e=>e.id===custom.id));
 assert.ok(matchingAlternatives(custom,[...seed.exercises,custom]).length>0);
});
test("usage lists only actual saved plans, never made-up session results",()=>{
 const id=exerciseId("Cadeira extensora");
 const usages=usedInPlans(id,seed.plans);
 assert.equal(usages.length,2);
 assert.ok(usages.some(label=>label.includes("LEGS")));
 assert.ok(usages.some(label=>label.includes("LOWER")));
});
test("substitute in a plan preserves all per-set prescriptions and existing workout snapshots",async()=>{
 await ensureProgramCatalog(seed);
 const push=(await listEntities("plans")).find(p=>p.id===planId("push"));assert.ok(push);
 const press=push.exercises[0];const alternative=seed.exercises.find(e=>e.name==="Chest press convergente");assert.ok(alternative);
 const started=createSessionSnapshot(push,seed.exercises,new Date("2026-10-11T14:30:00.000Z"));
 await startStoredWorkout(started);
 const changed={...push,updatedAt:"2026-10-11T15:00:00.000Z",
  exercises:push.exercises.map(row=>row.id===press.id?{...row,exerciseId:alternative.id}:row)};
 await savePlanWithExercises(changed,[]);
 const current=(await listEntities("plans")).find(p=>p.id===push.id);assert.ok(current);
 assert.equal(current.exercises[0].exerciseId,alternative.id);
 assert.deepEqual(current.exercises[0].sets,press.sets);
 assert.equal(current.exercises[0].restSeconds,press.restSeconds);
 const history=await listEntities("workoutSessions");
 assert.equal(history.length,1);
 assert.equal(history[0].exercises[0].exerciseNameSnapshot,"Supino inclinado com halteres");
 const backup=await createBackup();
 assert.equal(backup.plans.find(p=>p.id===push.id)?.exercises[0].exerciseId,alternative.id);
 await restoreBackup(backup);
 assert.equal((await listEntities("workoutSessions"))[0].exercises[0].exerciseNameSnapshot,"Supino inclinado com halteres");
});
