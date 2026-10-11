import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
import {
  PROGRAM_DAYS, buildProgramCatalog, planId, seriesCount, totalWeeklySets, exerciseId
} from "../src/data/program1010.ts";
const {ensureProgramCatalog,listEntities,createBackup,saveEntity}=await import("../src/data/storage.ts");

test("Programa 10/10 has exact weekly split and five workdays",()=>{
  assert.deepEqual(PROGRAM_DAYS.map(day=>day.title),[
    "PUSH","PULL","LEGS + ABDÔMEN","DESCANSO","UPPER","LOWER + BÍCEPS","DESCANSO"
  ]);
  assert.deepEqual(PROGRAM_DAYS.map(seriesCount),[10,14,12,0,16,14,0]);
  assert.equal(totalWeeklySets,66);
});
test("all prescribed sets are effective and no loads are invented",()=>{
  const {plans}=buildProgramCatalog("2026-10-11T12:00:00.000Z");
  assert.equal(plans.length,5);
  assert.deepEqual(plans.map(p=>p.exercises.length),[5,7,6,8,7]);
  for(const plan of plans) for(const exercise of plan.exercises){
    assert.equal(exercise.sets.length,2);
    assert.equal(exercise.restSeconds,0);
    assert.ok(exercise.sets.every(s=>s.kind==="working" && s.targetWeightKg===undefined));
  }
});
test("incline press ranges, RIR ranges, and explicit cardio are preserved",()=>{
  const {plans}=buildProgramCatalog("2026-10-11T12:00:00.000Z");
  const push=plans.find(p=>p.id===planId("push"));
  assert.ok(push);
  assert.deepEqual(push.exercises[0].sets.map(s=>[s.minReps,s.maxReps,s.targetRir,s.targetRirMax]),[
    [6,9,1,1],[9,12,1,1]
  ]);
  const legs=plans.find(p=>p.id===planId("legs"));
  assert.deepEqual(legs?.exercises[0].sets.map(s=>[s.targetRir,s.targetRirMax]),[[1,2],[1,2]]);
  const lateral=push.exercises[3];
  assert.deepEqual(lateral.sets.map(s=>[s.targetRir,s.targetRirMax]),[[0,1],[0,1]]);
  assert.equal(PROGRAM_DAYS[0].cardio?.minutes,20);
  assert.equal(PROGRAM_DAYS[3].cardio?.optional,true);
  assert.equal(PROGRAM_DAYS[6].exercises.length,0);
});
test("exercise IDs are reused for repeated movement across two days",()=>{
 const {exercises,plans}=buildProgramCatalog("2026-10-11T12:00:00.000Z");
 assert.ok(exercises.length<33);
 assert.equal(plans.find(p=>p.id===planId("legs"))?.exercises[3].exerciseId,exerciseId("Cadeira extensora"));
 assert.equal(plans.find(p=>p.id===planId("lower"))?.exercises[4].exerciseId,exerciseId("Cadeira extensora"));
 assert.equal(exercises.filter(e=>e.name==="Panturrilha").length,1);
});
test("imports program once, preserves edits, and exports all five plans",async()=>{
 const stamp="2026-10-11T12:00:00.000Z";
 const data=buildProgramCatalog(stamp);
 await ensureProgramCatalog(data);
 await ensureProgramCatalog(buildProgramCatalog("2026-10-12T12:00:00.000Z"));
 const plans=await listEntities("plans");
 assert.equal(plans.filter(p=>p.id.startsWith("programa-10-10-v2-")).length,5);
 assert.ok(plans.every(p=>p.createdAt===stamp));
 const original=plans.find(p=>p.id===planId("push"));
 assert.ok(original);
 await saveEntity("plans",{...original,name:"Ficha editada pelo usuário"});
 await ensureProgramCatalog(data);
 const edited=(await listEntities("plans")).find(p=>p.id===original.id);
 assert.equal(edited?.name,"Ficha editada pelo usuário");
 const backup=await createBackup();
 assert.equal(backup.plans.length,5);
 assert.equal(backup.workoutSessions.length,0);
 assert.equal(backup.cardioSessions.length,0);
});
