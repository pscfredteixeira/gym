import test from "node:test";
import assert from "node:assert/strict";
import type { CardioSession,WorkoutSession } from "../src/domain/models.ts";
import {buildShareData,cardFromCardio,cardFromWorkout,eligibleShares,DEFAULT_SHARE_PRIVACY,SHARE_SIZES} from "../src/features/share/shareDomain.ts";
import {cardFileName} from "../src/features/share/shareCanvas.ts";

const at="2026-10-12";
const completed:WorkoutSession={
 id:"real-strength-1",localDate:at,status:"completed",planNameSnapshot:"PULL — Costas e bíceps",
 startedAt:"2026-10-12T14:00:00.000Z",endedAt:"2026-10-12T14:45:00.000Z",
 exercises:[
  {id:"sx1",exerciseId:"e1",exerciseNameSnapshot:"Puxada neutra",order:0,plannedSetsSnapshot:[],sets:[
   {id:"s1",kind:"working",weightKg:50,reps:10,completedAt:"2026-10-12T14:01:00.000Z"},
   {id:"s2",kind:"warmup",weightKg:20,reps:15,completedAt:"2026-10-12T14:03:00.000Z"}
  ]},
  {id:"sx2",exerciseId:"e2",exerciseNameSnapshot:"Rosca Scott",order:1,plannedSetsSnapshot:[],sets:[
   {id:"s3",kind:"working",weightKg:20,reps:9,completedAt:"2026-10-12T14:12:00.000Z"}
  ]}
 ]
};
const abandoned:WorkoutSession={...completed,id:"abandoned",status:"abandoned"};
const cardio:CardioSession={id:"real-run-1",kind:"treadmill",source:"manual",localDate:at,
 startedAt:"2026-10-12T19:00:00.000Z",durationSeconds:1200,distanceMeters:3200,averageHeartRateBpm:140,
 notes:"Sensação ótima",inclinePercent:1};
const walk:CardioSession={id:"real-walk-1",kind:"walk",source:"manual",localDate:"2026-10-11",durationSeconds:1500};

test("sharing catalog contains completed real records only and sorts newest activity first",()=>{
 const all=eligibleShares([completed,abandoned],[cardio,walk]);
 assert.equal(all.length,3);
 assert.equal(all[0].id,cardio.id);
 assert.equal(all[1].id,completed.id);
 assert.equal(all[2].id,walk.id);
 assert.ok(!all.some(x=>x.id===abandoned.id));
});
test("strength card values come from actual working sets, not warmups or presets",()=>{
 const data=cardFromWorkout(completed,DEFAULT_SHARE_PRIVACY,"metric");
 assert.equal(data.title,"PULL — Costas e bíceps");
 assert.equal(data.date,"12/10/2026");
 assert.equal(data.hero,"2");
 assert.ok(data.metrics.some(x=>x.label==="VOLUME EXTERNO"&&x.value==="680 kg×reps"));
 assert.ok(data.metrics.some(x=>x.label==="DURAÇÃO"&&x.value==="45min"));
 assert.deepEqual(data.details,["Puxada neutra","Rosca Scott"]);
 assert.ok(!JSON.stringify(data).includes("FICTÍC"));
});
test("imperial strength does not mutate actual weight units and exercise list is optional",()=>{
 const p={...DEFAULT_SHARE_PRIVACY,showExerciseList:false};
 const data=cardFromWorkout(completed,p,"imperial");
 assert.deepEqual(data.details,[]);
 assert.ok(data.metrics.some(x=>x.value.includes("lb×reps")));
 assert.equal(completed.exercises[0].sets[0].weightKg,50);
});
test("strength never produces fictitious full-name personal data",()=>{
 const noName=cardFromWorkout(completed,DEFAULT_SHARE_PRIVACY,"metric","Meu nome");
 const yesName=cardFromWorkout(completed,{...DEFAULT_SHARE_PRIVACY,showName:true},"metric","Meu nome");
 assert.equal(noName.subtitle,"TREINO CONCLUÍDO");
 assert.equal(yesName.subtitle,"Meu nome");
 assert.throws(()=>cardFromWorkout(abandoned,DEFAULT_SHARE_PRIVACY,"metric"),/concluídos/);
});
test("cardio card displays exact recorded distance and pace, hides HR and notes by default",()=>{
 const result=cardFromCardio(cardio,DEFAULT_SHARE_PRIVACY,"Pessoa");
 assert.equal(result.hero,"3,2");
 assert.equal(result.heroUnit,"KM");
 assert.ok(result.metrics.some(x=>x.label==="RITMO"&&x.value==="6:15 /km"));
 assert.equal(result.metrics.some(x=>x.label==="FC MÉDIA"),false);
 assert.deepEqual(result.details,[]);
});
test("cardio private HR and notes appear only on explicit opt-in",()=>{
 const r=cardFromCardio(cardio,{...DEFAULT_SHARE_PRIVACY,showHeartRate:true,showNotes:true,showName:true},"Pessoa");
 assert.ok(r.metrics.some(x=>x.value==="140 bpm"));
 assert.deepEqual(r.details,["Sensação ótima"]);
 assert.equal(r.subtitle,"Pessoa");
});
test("missing walking distance never creates a distance or pace",()=>{
 const result=cardFromCardio(walk,DEFAULT_SHARE_PRIVACY);
 assert.equal(result.hero,"25");
 assert.equal(result.heroUnit,"MIN");
 assert.equal(result.metrics.length,1);
 assert.ok(!JSON.stringify(result).includes("KM"));
 assert.ok(!JSON.stringify(result).includes("RITMO"));
});
test("selected session lookup uses stable IDs and refuses stale or abandoned data",()=>{
 const chosen={kind:"strength" as const,id:"real-strength-1",date:at,title:"PULL",sortAt:at};
 assert.equal(buildShareData(chosen,[completed],[cardio],DEFAULT_SHARE_PRIVACY,"metric").hero,"2");
 assert.throws(()=>buildShareData({...chosen,id:"abandoned"},[abandoned],[cardio],DEFAULT_SHARE_PRIVACY,"metric"),/não está mais disponível/);
 assert.throws(()=>buildShareData({...chosen,kind:"cardio",id:"missing"},[],[cardio],DEFAULT_SHARE_PRIVACY,"metric"),/não está mais disponível/);
});
test("format sizes and export filenames meet social media needs",()=>{
 assert.deepEqual(SHARE_SIZES.story,[1080,1920]);
 assert.deepEqual(SHARE_SIZES.feed,[1080,1350]);
 assert.deepEqual(SHARE_SIZES.square,[1080,1080]);
 const data=cardFromCardio(cardio,DEFAULT_SHARE_PRIVACY);
 assert.equal(cardFileName(data,"story","png"),"gym-cardio-2026-10-12-story.png");
 assert.equal(cardFileName(data,"feed","jpg"),"gym-cardio-2026-10-12-feed.jpg");
});
test("empty history offers no fake share candidates",()=>{
 assert.deepEqual(eligibleShares([],[]),[]);
});
