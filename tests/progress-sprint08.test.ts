import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
(globalThis as typeof globalThis & {window:typeof globalThis}).window=globalThis;
const {periodStart,recordsInPeriod,exerciseChoices,exerciseProgress,strengthSummary,
 cardioSummary,consistencyWeeks,kgDisplay}=await import("../src/features/progress/progressAnalytics.ts");
const {buildProgramCatalog}=await import("../src/data/program1010.ts");
const {createSessionSnapshot,recordSetInSnapshot,closeSession}=await import("../src/features/training/sessionDomain.ts");
const {saveEntity,listEntities,createBackup,restoreBackup}=await import("../src/data/storage.ts");

const catalog=buildProgramCatalog("2026-01-01T09:00:00Z");
const when=(date:string)=>new Date(date+"T12:00:00Z");
const seq=(prefix:string)=>{let i=0;return()=>prefix+"-"+(++i);};
function sample(date:string,weight:number,kind:"working"|"warmup"="working",status:"completed"|"abandoned"="completed"){
 const started=createSessionSnapshot(catalog.plans[0],catalog.exercises,when(date),seq("snap-"+date));
 const ex=started.exercises[0],target={sessionExerciseId:ex.id,plannedSetId:ex.plannedSetsSnapshot[0].id};
 const written=recordSetInSnapshot(started,target,{weightKg:weight,reps:8,rir:1},new Date(date+"T12:05:00Z"),seq("set-"+date));
 const edited={...written,exercises:written.exercises.map((item,index)=>
   index===0?{...item,sets:item.sets.map(x=>({...x,kind}))}:item)};
 return closeSession(edited,status,new Date(date+"T12:40:00Z"));
}
const a=sample("2026-08-10",30),b=sample("2026-09-15",35),c=sample("2026-10-10",42),warm=sample("2026-10-09",60,"warmup"),abandoned=sample("2026-10-08",99,"working","abandoned");
const cardio=[
 {id:"run1",kind:"treadmill" as const,localDate:"2026-10-10",durationSeconds:1200,distanceMeters:3200,source:"manual" as const},
 {id:"walk1",kind:"walk" as const,localDate:"2026-10-10",durationSeconds:1500,source:"manual" as const},
 {id:"run2",kind:"outdoor_run" as const,localDate:"2026-10-11",durationSeconds:1800,distanceMeters:4000,source:"manual" as const},
 {id:"old",kind:"walk" as const,localDate:"2026-07-01",durationSeconds:900,source:"manual" as const}
];

test("period boundaries are inclusive and local; no future sessions or old records",()=>{
 const now=new Date(2026,9,11,10,0,0);
 assert.equal(periodStart(30,now),"2026-09-12");
 assert.equal(periodStart(90,now),"2026-07-14");
 assert.equal(periodStart("all",now),undefined);
 const f=recordsInPeriod([a,b,c,warm,abandoned],cardio,30,now);
 assert.deepEqual(f.workouts.map(x=>x.localDate),["2026-09-15","2026-10-10","2026-10-09"]);
 assert.equal(f.cardio.length,3);
 assert.equal(recordsInPeriod([a,b,c],cardio,"all",now).workouts.length,3);
});
test("only completed sessions with actual working sets contribute to muscle analytics",()=>{
 const summary=strengthSummary([a,b,c,warm,abandoned]);
 assert.equal(summary.sessions,4);
 assert.equal(summary.trainingDays,4);
 assert.equal(summary.workingSets,3);
 assert.equal(summary.warmupSets,1);
 assert.equal(summary.reps,24);
 assert.equal(summary.volumeKg,(30+35+42)*8);
 assert.equal(summary.durationSeconds,4*40*60);
});
test("load trend ignores warmup, abandoned sessions and unrecorded planned sets",()=>{
 const id=c.exercises[0].exerciseId;
 const pts=exerciseProgress([a,b,c,warm,abandoned],id);
 assert.deepEqual(pts.map(x=>x.maxKg),[30,35,42]);
 assert.deepEqual(pts.map(x=>x.date),["2026-08-10","2026-09-15","2026-10-10"]);
 assert.ok(pts.every(x=>x.sets===1));
});
test("a corrected set updates max without double-counting or fake gains",()=>{
 const ex=c.exercises[0];
 const corrected={...c,exercises:c.exercises.map((item,index)=>index===0?
   {...item,sets:item.sets.map(set=>({...set,weightKg:37}))}:item)};
 const old=exerciseProgress([a,b,c],ex.exerciseId);
 const next=exerciseProgress([a,b,corrected],ex.exerciseId);
 assert.equal(old[2].maxKg,42);
 assert.equal(next[2].maxKg,37);
 assert.equal(strengthSummary([a,b,corrected]).workingSets,3);
});
test("same-day multiple completed sessions aggregate sets, but show maximum load only once",()=>{
 const another=sample("2026-10-10",45);
 const id=c.exercises[0].exerciseId;
 const points=exerciseProgress([c,another],id);
 assert.equal(points.length,1);
 assert.equal(points[0].maxKg,45);
 assert.equal(points[0].sets,2);
 assert.equal(points[0].volumeKg,(42+45)*8);
 assert.equal(strengthSummary([c,another]).trainingDays,1);
 assert.equal(strengthSummary([c,another]).sessions,2);
});
test("exercise options are grounded in actual performed records, not all preset exercises",()=>{
 const options=exerciseChoices([a,b,c,warm,abandoned]);
 assert.equal(options.length,1);
 assert.equal(options[0].name,"Supino inclinado com halteres");
 assert.equal(options[0].sets,3);
 assert.deepEqual(exerciseChoices([warm,abandoned]),[]);
});
test("cardio summaries distinguish recorded distance from missing distance",()=>{
 const info=cardioSummary(cardio.slice(0,3));
 assert.deepEqual(info,{sessions:3,activityDays:2,durationSeconds:4500,distanceMeters:7200,
  knownDistanceCount:2,knownDistanceSeconds:3000});
 assert.equal(cardioSummary(cardio.slice(1,2)).knownDistanceCount,0);
 assert.equal(cardioSummary([]).sessions,0);
});
test("weekly consistency counts calendar days uniquely across overlapping strength and cardio",()=>{
 const week=consistencyWeeks([c,abandoned],cardio.slice(0,3),new Date(2026,9,11),2);
 assert.equal(week.length,2);
 assert.equal(week[1].weekStart,"2026-10-05");
 assert.equal(week[1].strengthDays,1);
 assert.equal(week[1].cardioDays,2);
 assert.equal(week[1].days,2);
 assert.equal(week[0].days,0);
});
test("known unit conversion preserves canonical kg and formats lbs",()=>{
 assert.equal(kgDisplay(40,"metric"),40);
 assert.equal(kgDisplay(40,"imperial"),88.2);
 assert.equal(kgDisplay(0,"imperial"),0);
});
test("empty datasets stay at zero rather than displaying illustrative numbers",()=>{
 assert.deepEqual(exerciseChoices([]),[]);
 assert.deepEqual(exerciseProgress([],"nope"),[]);
 assert.equal(strengthSummary([]).sessions,0);
 assert.equal(strengthSummary([]).volumeKg,0);
 assert.equal(cardioSummary([]).distanceMeters,0);
 assert.deepEqual(recordsInPeriod([],[],30,new Date()),{workouts:[],cardio:[]});
});
test("backup/restore recalculation includes saved records and excludes abandoned ones",async()=>{
 for(const s of [a,c,abandoned])await saveEntity("workoutSessions",s);
 for(const r of cardio.slice(0,2))await saveEntity("cardioSessions",r);
 const original=await createBackup();
 await restoreBackup(original);
 const savedWorkouts=await listEntities("workoutSessions"),savedCardio=await listEntities("cardioSessions");
 const selected=recordsInPeriod(savedWorkouts,savedCardio,30,new Date(2026,9,11));
 assert.equal(selected.workouts.length,1);
 assert.equal(selected.cardio.length,2);
 assert.equal(strengthSummary(selected.workouts).workingSets,1);
 assert.equal(cardioSummary(selected.cardio).knownDistanceCount,1);
});
