import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
(globalThis as typeof globalThis & {window:typeof globalThis}).window=globalThis;

const {buildProgramCatalog,planId} = await import("../src/data/program1010.ts");
const {planId:v3Id} = await import("../src/data/program6.ts");
const {
  copyPlan,moveRow,dropRow,duplicatePlan,makeSet,updateSeries,makeExerciseRow
}=await import("../src/features/program/planEditor.ts");
const {validateWorkoutPlan,validateSettings,DEFAULT_SETTINGS,validateGymBackup}=await import("../src/data/validation.ts");
const {ensureProgramCatalog,listEntities,savePlanWithExercises,readSettings,writeSettings,createBackup,restoreBackup,saveEntity}=await import("../src/data/storage.ts");
const {
  configuredPlanIds,configuredCardio,defaultWeeklyPlanIds,swapAssignment,resolveSchedule
}=await import("../src/features/program/programSchedule.ts");

test("plan editor changes copies without modifying original or existing RIR",()=>{
 const p=buildProgramCatalog("2026-10-11T15:00:00Z").plans[0];
 const revised=moveRow(copyPlan(p),0,1);
 assert.equal(p.exercises[0].order,0);
 assert.equal(revised.exercises[1].exerciseId,p.exercises[0].exerciseId);
 assert.equal(revised.exercises[0].order,0);
 const amended=updateSeries(revised,1,0,{minReps:5,maxReps:8,targetRir:0,targetRirMax:2});
 assert.equal(amended.exercises[1].sets[0].minReps,5);
 assert.equal(amended.exercises[1].sets[0].targetRirMax,2);
 assert.equal(p.exercises[0].sets[0].minReps,6);
 const deleted=dropRow(amended,1);
 assert.equal(deleted.exercises.length,p.exercises.length-1);
 assert.ok(deleted.exercises.every((item,i)=>item.order===i));
});
test("duplicate plan creates independent IDs and preserves original content",()=>{
 const original=buildProgramCatalog("2026-10-11T15:00:00Z").plans[1];
 const clone=duplicatePlan(original);
 assert.ok(clone.id.startsWith("custom-"));
 assert.equal(clone.name,original.name+" (cópia)");
 assert.equal(clone.exercises.length,original.exercises.length);
 assert.notEqual(clone.exercises[0].id,original.exercises[0].id);
 assert.notEqual(clone.exercises[0].sets[0].id,original.exercises[0].sets[0].id);
 validateWorkoutPlan(clone);
});
test("new warm-up sets keep kind and do not alter effective set count",()=>{
 const original=buildProgramCatalog("2026-10-11T15:00:00Z").plans[0];
 const warmup={...makeSet(original.exercises[0].sets[0]),kind:"warmup" as const};
 const plan={...original,exercises:original.exercises.map((item,i)=>i===0?{...item,sets:[warmup,...item.sets]}:item)};
 validateWorkoutPlan(plan);
 assert.equal(plan.exercises[0].sets.length,3);
 assert.equal(plan.exercises[0].sets.filter(x=>x.kind==="working").length,2);
});
test("custom exercise and plan saved atomically with future snapshots untouched",async()=>{
 const base=buildProgramCatalog("2026-10-11T15:00:00Z");
 await ensureProgramCatalog(base);
 const ex={id:"custom-ex-test",name:"Remada especial",primaryMuscle:"Costas",equipment:"Máquina",isCustom:true};
 const previous=base.plans[0];
 const customized={...previous,
  name:"PUSH adaptado",
  exercises:[...previous.exercises,makeExerciseRow(ex,previous.exercises.length)]
 };
 await savePlanWithExercises(customized,[ex]);
 const loaded=(await listEntities("plans")).find(p=>p.id===planId("push"));
 assert.equal(loaded?.exercises.length,6);
 assert.equal((await listEntities("exercises")).filter(x=>x.id===ex.id).length,1);
 const start="2026-10-11T15:00:00.000Z";
 await saveEntity("workoutSessions",{id:"historical-test",planId:previous.id,planNameSnapshot:previous.name,
  localDate:"2026-10-11",startedAt:start,endedAt:start,status:"completed",exercises:[]});
 const reduced={...customized,exercises:[...customized.exercises].slice(0,3)};
 await savePlanWithExercises(reduced,[]);
 const history=await listEntities("workoutSessions");
 assert.equal(history.length,1);
 assert.equal(history[0].planNameSnapshot,previous.name);
 assert.equal((await listEntities("plans")).find(x=>x.id===previous.id)?.exercises.length,3);
});
test("bad plan fails validation without changing the previously saved plan",async()=>{
 const plans=await listEntities("plans");
 const original=plans.find(x=>x.id===planId("push"));
 assert.ok(original);
 const invalid={...original,exercises:[{...original.exercises[0],restSeconds:-5}]};
 await assert.rejects(()=>savePlanWithExercises(invalid,[]),/Ficha inválida/);
 assert.equal((await listEntities("plans")).find(x=>x.id===original.id)?.exercises.length,3);
});
test("weekly assignments swap without duplicating a workout",()=>{
 const start=defaultWeeklyPlanIds();
 assert.equal(start[0],v3Id("pull-a"));
 const changed=swapAssignment(start,0,v3Id("push-a"));
 assert.equal(changed[0],v3Id("push-a"));
 assert.equal(changed[1],v3Id("pull-a"));
 assert.equal(start[0],v3Id("pull-a"));
 assert.equal(changed.filter(x=>x===v3Id("push-a")).length,1);
 const rest=swapAssignment(changed,4,null);
 assert.equal(rest[4],null);
});
test("seven-day schedule and cardio survive backup and restore",async()=>{
 const settings=await readSettings();
 const changed=swapAssignment(defaultWeeklyPlanIds(),0,v3Id("push-a"));
 const cardio=defaultWeeklyPlanIds().map(()=>null) as Array<null | {label:string;minutes:number|null;optional:boolean;note:string}>;
 cardio[3]={label:"Caminhada leve",minutes:25,optional:true,note:"Recuperação"};
 const next={...settings,weeklyPlanIds:changed,weeklyCardio:cardio};
 const validated=validateSettings(next);
 assert.equal(validated.weeklyPlanIds?.[0],v3Id("push-a"));
 await writeSettings(next);
 const backup=await createBackup();
 assert.equal(backup.settings.weeklyCardio?.[3]?.minutes,25);
 validateGymBackup(backup);
 await writeSettings({...settings,weeklyPlanIds:defaultWeeklyPlanIds()});
 await restoreBackup(backup);
 assert.deepEqual(configuredPlanIds(await readSettings()),changed);
 assert.equal(configuredCardio(await readSettings())[3]?.label,"Caminhada leve");
 const days=resolveSchedule(await readSettings(),await listEntities("plans"));
 assert.equal(days[0].planId,v3Id("push-a"));
 assert.equal(days[1].planId,v3Id("pull-a"));
});
test("invalid weekly schedule is rejected",()=>{
 assert.throws(()=>validateSettings({...DEFAULT_SETTINGS,weeklyPlanIds:["x"]}),/preferências/);
 assert.throws(()=>validateSettings({...DEFAULT_SETTINGS,weeklyCardio:[{},null,null,null,null,null,null]}),/preferências/);
});
