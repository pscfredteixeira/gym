import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
(globalThis as typeof globalThis & {window:typeof globalThis}).window=globalThis;
const {parseCardioDraft,blankCardioDraft,toDraft,paceLabel,paceSecondsPerKm,speedKmH,
 cardioTotals,cardioWeek,isCalendarDate,localDateOf,cardioTitle}=await import("../src/features/cardio/cardioDomain.ts");
const {saveManualCardio,deleteManualCardio,listEntities,createBackup,restoreBackup,saveEntity}=await import("../src/data/storage.ts");
const {validateCardioSession,validateGymBackup}=await import("../src/data/validation.ts");
const at=new Date("2026-10-11T12:00:00.000Z");
const base=()=>({...blankCardioDraft(at,"treadmill"),date:"2026-10-11",hours:"0",minutes:"20",seconds:"0",distanceKm:"3,2"});

test("form converts manual treadmill session without made-up metadata",()=>{
 const session=parseCardioDraft(base(),undefined,at,()=>"cardio-real-test");
 assert.deepEqual(session,{
  id:"cardio-real-test",kind:"treadmill",localDate:"2026-10-11",durationSeconds:1200,
  source:"manual",distanceMeters:3200,startedAt:"2026-10-11T12:00:00.000Z"
 });
 validateCardioSession(session);
 assert.equal(paceLabel(session.durationSeconds,session.distanceMeters),"6:15 /km");
 assert.ok(Math.abs((speedKmH(session.durationSeconds,session.distanceMeters)??0)-9.6)<0.000001);
});
test("distance, incline, heart rate and notes are explicitly optional",()=>{
 const d={...base(),kind:"walk" as const,minutes:"35",distanceKm:"",inclinePercent:"12",heartRate:"",notes:"Caminhada tranquila"};
 const s=parseCardioDraft(d);
 assert.equal(s.distanceMeters,undefined);
 assert.equal(s.inclinePercent,undefined);
 assert.equal(s.averageHeartRateBpm,undefined);
 assert.equal(s.notes,"Caminhada tranquila");
 assert.equal(paceLabel(s.durationSeconds,s.distanceMeters),"—");
 assert.equal(paceSecondsPerKm(0,3200),undefined);
 assert.equal(paceSecondsPerKm(1200,0),undefined);
});
test("reject impossible dates, zero duration, invalid distance and HR",()=>{
 assert.equal(isCalendarDate("2026-02-30"),false);
 assert.equal(isCalendarDate("2028-02-29"),true);
 assert.equal(localDateOf(new Date(2026,9,11)),"2026-10-11");
 assert.throws(()=>parseCardioDraft({...base(),date:"2026-02-30"}),/data válida/);
 assert.throws(()=>parseCardioDraft({...base(),minutes:"0",distanceKm:""}),/maior que zero/);
 assert.throws(()=>parseCardioDraft({...base(),minutes:"60"}),/minutos/);
 assert.throws(()=>parseCardioDraft({...base(),distanceKm:"-4"}),/distância/);
 assert.throws(()=>parseCardioDraft({...base(),heartRate:"300"}),/frequência/);
 assert.throws(()=>parseCardioDraft({...base(),inclinePercent:"35"}),/inclinação/);
 assert.throws(()=>parseCardioDraft({...base(),kind:"other",activityName:""}),/nome/);
});
test("edit preserves record ID, manual source and converts reverse form",()=>{
 const s=parseCardioDraft(base(),undefined,at,()=>"cardio-edit");
 const d=toDraft(s);
 assert.deepEqual([d.hours,d.minutes,d.seconds,d.distanceKm],["0","20","0","3.2"]);
 const edited=parseCardioDraft({...d,minutes:"23",distanceKm:"3,5"},s);
 assert.equal(edited.id,s.id);
 assert.equal(edited.durationSeconds,1380);
 assert.equal(edited.distanceMeters,3500);
 assert.equal(edited.startedAt,s.startedAt);
});
test("activity names and weekly aggregation use only actual saved entries",()=>{
 const treadmill=parseCardioDraft(base(),undefined,at,()=>"c1");
 const walk=parseCardioDraft({...base(),kind:"walk",date:"2026-10-15",distanceKm:"",minutes:"25"},undefined,at,()=>"c2");
 const other=parseCardioDraft({...base(),kind:"other",activityName:"Elíptico",date:"2026-10-15",distanceKm:"",minutes:"10"},undefined,at,()=>"c3");
 assert.equal(cardioTitle(other),"Elíptico");
 const sum=cardioTotals([treadmill,walk,other]);
 assert.deepEqual(sum,{seconds:3300,distanceMeters:3200,distanceKnownCount:1,count:3});
 const week=cardioWeek([treadmill,walk,other],new Date(2026,9,5));
 assert.equal(week.length,7);
 assert.equal(week[6].durationSeconds,1200);
 assert.equal(cardioWeek([treadmill,walk,other],new Date(2026,9,12))[3].count,2);
});
test("saves multiple records, updates one, and exports real cardio in JSON backup",async()=>{
 const treadmill=parseCardioDraft(base(),undefined,at,()=>"cardio-database-1");
 const walk=parseCardioDraft({...base(),kind:"walk",date:"2026-10-15",distanceKm:"",minutes:"25"},undefined,at,()=>"cardio-database-2");
 await saveManualCardio(treadmill);
 await saveManualCardio(walk);
 assert.equal((await listEntities("cardioSessions")).length,2);
 await saveManualCardio(parseCardioDraft({...toDraft(treadmill),minutes:"27"},treadmill));
 const latest=await listEntities("cardioSessions");
 assert.equal(latest.length,2);
 assert.equal(latest.find(s=>s.id===treadmill.id)?.durationSeconds,1620);
 const backup=await createBackup();
 validateGymBackup(backup);
 assert.equal(backup.cardioSessions.length,2);
 assert.equal(backup.workoutSessions.length,0);
 await restoreBackup(backup);
 assert.equal((await listEntities("cardioSessions")).length,2);
});
test("cannot mutate or delete imported cardio through manual UI",async()=>{
 const imported={id:"health-cardio-1",kind:"treadmill" as const,localDate:"2026-10-10",
  durationSeconds:1440,source:"health_import" as const,importBatchId:"batch-import-1"};
 await saveEntity("cardioSessions",imported);
 await assert.rejects(()=>saveManualCardio({...imported,source:"manual"}),/importada/);
 await assert.rejects(()=>deleteManualCardio(imported.id),/importadas/);
 assert.throws(()=>parseCardioDraft(toDraft(imported),imported),/importados/);
 assert.equal((await listEntities("cardioSessions")).find(s=>s.id===imported.id)?.source,"health_import");
});
test("deleting a manual entry preserves imports and other records",async()=>{
 await deleteManualCardio("cardio-database-2");
 const rows=await listEntities("cardioSessions");
 assert.equal(rows.length,2);
 assert.ok(rows.some(s=>s.id==="cardio-database-1"));
 assert.ok(rows.some(s=>s.id==="health-cardio-1"));
 await assert.rejects(()=>deleteManualCardio("cardio-database-2"),/não encontrada/);
});
