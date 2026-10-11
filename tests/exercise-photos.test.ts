import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
(globalThis as typeof globalThis & {window:typeof globalThis}).window=globalThis;

const {buildProgramCatalog,exerciseId,planId}=await import("../src/data/program1010.ts");
const {isExerciseImageUrl,MAX_EXERCISE_PHOTO_CHARS,estimateExercisePhotoSize}=await import("../src/features/library/exerciseImages.ts");
const {ensureProgramCatalog,listEntities,saveEntity,createBackup,restoreBackup}=await import("../src/data/storage.ts");
const {validateGymBackup,MAX_BACKUP_BYTES}=await import("../src/data/validation.ts");
const stamp="2026-10-11T16:00:00Z";
const data=buildProgramCatalog(stamp);
const demo="data:image/jpeg;base64,"+"AQIDBA==";

test("recognizes compact JPEG data and HTTPS images; rejects unsafe formats",()=>{
 assert.equal(isExerciseImageUrl(demo),true);
 assert.equal(estimateExercisePhotoSize(demo),Math.floor(("AQIDBA==".length)*3/4));
 assert.equal(isExerciseImageUrl("https://example.com/exercises/puxada.webp"),true);
 assert.equal(isExerciseImageUrl("http://example.com/exercise.jpg"),false);
 assert.equal(isExerciseImageUrl("data:image/svg+xml;base64,PHN2Zz48c2NyaXB0Pg=="),false);
 assert.equal(isExerciseImageUrl("javascript:alert(1)"),false);
 assert.equal(isExerciseImageUrl("data:image/jpeg;base64,"+"A".repeat(MAX_EXERCISE_PHOTO_CHARS)),false);
});
test("saving a photo updates exactly one exercise and does not alter the user's training plan",async()=>{
 await ensureProgramCatalog(data);
 const before=await listEntities("plans");
 const id=exerciseId("Puxada neutra");
 const original=(await listEntities("exercises")).find(e=>e.id===id);
 assert.ok(original);
 await saveEntity("exercises",{...original,imageUrl:demo});
 const found=(await listEntities("exercises")).find(e=>e.id===id);
 assert.equal(found?.imageUrl,demo);
 assert.equal((await listEntities("exercises")).filter(e=>e.imageUrl===demo).length,1);
 assert.deepEqual(await listEntities("plans"),before);
 await ensureProgramCatalog(buildProgramCatalog("2026-10-12T16:00:00Z"));
 assert.equal((await listEntities("exercises")).find(e=>e.id===id)?.imageUrl,demo);
});
test("photo remains in exported backup and after restoring",async()=>{
 const backup=await createBackup();
 assert.ok(MAX_BACKUP_BYTES>=10_000_000);
 validateGymBackup(backup);
 assert.equal(backup.exercises.find(e=>e.name==="Puxada neutra")?.imageUrl,demo);
 await restoreBackup(backup);
 assert.equal((await listEntities("exercises")).find(e=>e.name==="Puxada neutra")?.imageUrl,demo);
 const pull=(await listEntities("plans")).find(p=>p.id===planId("pull"));
 assert.ok(pull);
 assert.equal(pull.exercises.length,7);
});
test("removing an image preserves the exercise and all its assignments",async()=>{
 const id=exerciseId("Puxada neutra");
 const current=(await listEntities("exercises")).find(e=>e.id===id);
 assert.ok(current);
 await saveEntity("exercises",{...current,imageUrl:undefined});
 const after=(await listEntities("exercises")).find(e=>e.id===id);
 assert.equal(after?.imageUrl,undefined);
 assert.equal(after?.name,"Puxada neutra");
 assert.ok((await listEntities("plans")).some(p=>p.exercises.some(row=>row.exerciseId===id)));
});
test("backup refuses image payloads exceeding the agreed per-exercise maximum",async()=>{
 const snapshot=await createBackup();
 const invalid=structuredClone(snapshot);
 const old=invalid.exercises[0];
 invalid.exercises[0]={...old,imageUrl:"data:image/jpeg;base64,"+"A".repeat(MAX_EXERCISE_PHOTO_CHARS)};
 assert.throws(()=>validateGymBackup(invalid),/exerc|imagem|backup|válid/i);
 assert.equal((await listEntities("exercises"))[0].imageUrl,undefined);
});
