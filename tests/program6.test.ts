import "fake-indexeddb/auto";
(globalThis as typeof globalThis & {window:typeof globalThis}).window=globalThis;
import test from "node:test";
import assert from "node:assert/strict";
import {
  PROGRAM_DAYS, buildProgramCatalog, totalWeeklySets, planId
} from "../src/data/program6.ts";
import { PROGRAM_DAYS as OLD_DAYS, planId as oldPlanId, buildProgramCatalog as oldCatalog } from "../src/data/program1010.ts";
import { DEFAULT_SETTINGS } from "../src/data/validation.ts";
import { defaultWeeklyPlanIds, defaultWeeklyCardio, resolveSchedule, upgradeLegacyDefaultSchedule } from "../src/features/program/programSchedule.ts";
import type { UserSettings, WorkoutSession } from "../src/domain/models.ts";
const {ensureProgramCatalog,listEntities,saveEntity,createBackup}=await import("../src/data/storage.ts");

test("six training days and 74 working sets match prescription",()=>{
  assert.deepEqual(PROGRAM_DAYS.map(d=>d.title),[
    "PULL A","PUSH A","LEGS A","PULL B","PUSH B","LEGS B","DESCANSO"
  ]);
  assert.deepEqual(PROGRAM_DAYS.map(d=>d.exercises.reduce((n,e)=>n+e.ranges.length,0)),[14,13,12,14,11,10,0]);
  assert.equal(totalWeeklySets,74);
  const catalog=buildProgramCatalog("2026-10-21T12:00:00.000Z");
  assert.deepEqual(catalog.plans.map(p=>p.exercises.length),[7,6,6,7,5,5]);
  for (const p of catalog.plans) for (const e of p.exercises) {
    assert.ok(e.sets.every(s=>s.kind==="working"&&s.targetWeightKg===undefined));
    assert.ok(e.restSeconds===120||e.restSeconds===150);
    assert.ok(e.sets.every(s=>s.targetRir!==undefined&&s.targetRirMax!==undefined));
  }
  assert.equal(catalog.plans.find(p=>p.id===planId("push-a"))?.exercises[3].sets.length,3);
  assert.equal(catalog.plans.find(p=>p.id===planId("push-b"))?.exercises[0].sets.length,3);
});
test("Monday and Thursday cardio; Sunday rests",()=>{
  assert.equal(PROGRAM_DAYS[0].cardio?.minutes,20);
  assert.equal(PROGRAM_DAYS[3].cardio?.minutes,20);
  assert.deepEqual(defaultWeeklyPlanIds().map(v=>!!v),[true,true,true,true,true,true,false]);
  assert.deepEqual(defaultWeeklyCardio().map(v=>v?.minutes??null),[20,null,null,20,null,null,null]);
  assert.deepEqual(resolveSchedule(DEFAULT_SETTINGS,buildProgramCatalog("2026-10-21T12:00:00.000Z").plans)
    .map(x=>x.plan?.name??"DESCANSO").map(s=>s.includes("PULL")), [true,false,false,true,false,false,false]);
});
test("legacy default migrates without touching customized plan or cardio",()=>{
  const oldIds=OLD_DAYS.map(d=>d.exercises.length>0?oldPlanId(d.id):null);
  const legacy:UserSettings={...DEFAULT_SETTINGS,weeklyPlanIds:oldIds};
  const updated=upgradeLegacyDefaultSchedule(legacy);
  assert.ok(updated);
  assert.deepEqual(updated.weeklyPlanIds,defaultWeeklyPlanIds());
  const customized={...legacy,weeklyPlanIds:oldIds.map((id,i)=>i===0?"custom-my-workout":id)};
  assert.equal(upgradeLegacyDefaultSchedule(customized),null);
  const customCardio={label:"Bicicleta",minutes:30,optional:false,note:"Meu cardio"};
  const preserved=upgradeLegacyDefaultSchedule({...legacy,weeklyCardio:[customCardio,null,null,null,null,null,null]});
  assert.deepEqual(preserved?.weeklyCardio?.[0],customCardio);
  assert.equal(upgradeLegacyDefaultSchedule(DEFAULT_SETTINGS),null);
});
test("adding six-day program preserves v2 user edits, historical workouts and backup",async()=>{
  const stamp="2026-10-11T12:00:00.000Z";
  await ensureProgramCatalog(oldCatalog(stamp));
  const legacyPlans=await listEntities("plans");
  const push=legacyPlans.find(p=>p.id===oldPlanId("push"));
  assert.ok(push);
  await saveEntity("plans",{...push,name:"Push antigo personalizado"});
  const historical:WorkoutSession={
    id:"past-session-v2",planId:push.id,planNameSnapshot:push.name,
    localDate:"2026-10-12",startedAt:stamp,endedAt:stamp,
    status:"completed",exercises:[]
  };
  await saveEntity("workoutSessions",historical);
  await ensureProgramCatalog(buildProgramCatalog("2026-10-21T12:00:00.000Z"));
  await ensureProgramCatalog(buildProgramCatalog("2026-10-22T12:00:00.000Z"));
  const plans=await listEntities("plans");
  assert.equal(plans.filter(p=>p.id.startsWith("treino-fred-v3-6d-")).length,6);
  assert.equal(plans.filter(p=>p.id.startsWith("programa-10-10-v2-")).length,5);
  assert.equal(plans.find(p=>p.id===push.id)?.name,"Push antigo personalizado");
  assert.equal((await listEntities("workoutSessions"))[0].planNameSnapshot,push.name);
  const backup=await createBackup();
  assert.equal(backup.plans.length,11);
  assert.equal(backup.workoutSessions.length,1);
});
