import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS, validateGymBackup, validateSettings } from "../src/data/validation.ts";

const empty=()=>({
  schemaVersion:1,
  exportedAt:"2026-10-11T10:00:00.000Z",
  exercises:[],plans:[],workoutSessions:[],cardioSessions:[],importBatches:[],
  settings:{...DEFAULT_SETTINGS},
});
test("empty backup is valid",()=>assert.deepEqual(validateGymBackup(empty()).settings,DEFAULT_SETTINGS));
test("rejects incompatible schema",()=>assert.throws(()=>validateGymBackup({...empty(),schemaVersion:2}),/Versão/));
test("rejects malformed plans before applying",()=>assert.throws(()=>validateGymBackup({...empty(),plans:[{id:"p"}]}),/fichas/));
test("rejects duplicate IDs within a store",()=>assert.throws(()=>validateGymBackup({...empty(),exercises:[{id:"a",name:"A",primaryMuscle:"B",isCustom:true},{id:"a",name:"B",primaryMuscle:"B",isCustom:true}]}),/duplicados/));
test("rejects invalid settings and sensitive flags",()=>assert.throws(()=>validateSettings({...DEFAULT_SETTINGS,shareLocationByDefault:"true"}),/preferências/));
test("old v1 settings with no optional fields can be restored",()=>{
 const {displayName,personalGoal,largeText,reducedMotion,...old}=DEFAULT_SETTINGS;
 assert.equal(validateSettings(old).displayName,"");
 assert.equal(validateSettings(old).largeText,false);
});
test("rejects invalid workouts with negative weights",()=>assert.throws(()=>validateGymBackup({...empty(),workoutSessions:[{
  id:"s",localDate:"2026-10-11",startedAt:"2026-10-11T12:00:00Z",status:"completed",
  exercises:[{id:"se",exerciseId:"ex",exerciseNameSnapshot:"Remada",order:0,plannedSetsSnapshot:[],
  sets:[{id:"set",kind:"working",weightKg:-5,reps:10,completedAt:"2026-10-11T12:10:00Z"}]}]
}]}),/sessões/));
test("accepts valid completed session in backup",()=>{
 const b=empty();
 b.workoutSessions=[{id:"session",localDate:"2026-10-11",startedAt:"2026-10-11T12:00:00Z",status:"completed",exercises:[]}];
 assert.equal(validateGymBackup(b).workoutSessions.length,1);
});
