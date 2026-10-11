import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
(globalThis as typeof globalThis & {window:typeof globalThis}).window=globalThis;
const {commonsTerm,isAllowedCommonsLicense,parseCommonsPhotos}=await import("../src/features/library/commonsPhotos.ts");
const {buildProgramCatalog,exerciseId}=await import("../src/data/program1010.ts");
const {ensureProgramCatalog,listEntities,saveEntity,createBackup,restoreBackup}=await import("../src/data/storage.ts");
const {validateGymBackup}=await import("../src/data/validation.ts");

const photo={title:"File:Lat_pulldown_at_gym.jpg",imageinfo:[{
  url:"https://upload.wikimedia.org/wikipedia/commons/2/2d/Lat_pulldown_at_gym.jpg",
  thumburl:"https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Lat_pulldown_at_gym.jpg/520px-Lat_pulldown_at_gym.jpg",
  descriptionurl:"https://commons.wikimedia.org/wiki/File:Lat_pulldown_at_gym.jpg",
  mime:"image/jpeg",extmetadata:{LicenseShortName:{value:"CC BY-SA 4.0"},Artist:{value:"<b>Fotógrafo</b>"}}}]};
const licensed={query:{pages:{"2":photo,"3":{title:"File:Private.jpg",imageinfo:[{
  url:"https://upload.wikimedia.org/wikipedia/commons/private.jpg",
  descriptionurl:"https://commons.wikimedia.org/wiki/File:Private.jpg",mime:"image/jpeg",
  extmetadata:{LicenseShortName:{value:"All rights reserved"}}}]}}}};

test("all 31 original exercise names have English search hints",()=>{
 const catalog=buildProgramCatalog("2026-10-11T10:00:00Z");
 assert.equal(catalog.exercises.length,31);
 for(const ex of catalog.exercises)assert.notEqual(commonsTerm(ex),ex.name);
});
test("only accepted open license names are admitted",()=>{
 for(const name of ["CC BY 4.0","CC BY-SA 4.0","CC0 1.0","Public domain","PD-old"])
  assert.equal(isAllowedCommonsLicense(name),true,name);
 for(const name of ["All rights reserved","Fair use","CC BY-NC 4.0","CC BY-ND 4.0","Unknown",""])
  assert.equal(isAllowedCommonsLicense(name),false,name);
});
test("parser returns only licensed hosted pictures with author and source",()=>{
 const photos=parseCommonsPhotos(licensed);
 assert.equal(photos.length,1);
 assert.equal(photos[0].title,"Lat pulldown at gym.jpg");
 assert.equal(photos[0].author,"Fotógrafo");
 assert.equal(photos[0].license,"CC BY-SA 4.0");
 assert.ok(photos[0].source.startsWith("https://commons.wikimedia.org/"));
});
test("parser rejects svg, hostile image urls and wrong source",()=>{
 const fake=(override:Record<string,unknown>)=>({query:{pages:{2:{...photo,imageinfo:[{...photo.imageinfo[0],...override}]}}}});
 assert.deepEqual(parseCommonsPhotos(fake({mime:"image/svg+xml"})),[]);
 assert.deepEqual(parseCommonsPhotos(fake({thumburl:undefined,url:"https://unknown.example/x.png"})),[]);
 assert.deepEqual(parseCommonsPhotos(fake({descriptionurl:"https://other.example/x"})),[]);
 assert.deepEqual(parseCommonsPhotos(null),[]);
});
test("credits are preserved through preset syncing, JSON backup and restoration",async()=>{
 const preset=buildProgramCatalog("2026-10-11T10:00:00Z");
 await ensureProgramCatalog(preset);
 const id=exerciseId("Puxada neutra");
 const ex=(await listEntities("exercises")).find(x=>x.id===id);
 assert.ok(ex);assert.equal(ex.imageUrl,undefined);
 const img=parseCommonsPhotos(licensed)[0];
 await saveEntity("exercises",{...ex,imageUrl:img.url,imageSourceUrl:img.source,imageAuthor:img.author,imageLicense:img.license});
 await ensureProgramCatalog(preset);
 assert.equal((await listEntities("exercises")).find(x=>x.id===id)?.imageLicense,"CC BY-SA 4.0");
 const backup=await createBackup();
 validateGymBackup(backup);
 await restoreBackup(backup);
 assert.equal((await listEntities("exercises")).find(x=>x.id===id)?.imageAuthor,"Fotógrafo");
});
test("removing photo clears attribution without changing the workout plan",async()=>{
 const ex=(await listEntities("exercises")).find(x=>x.name==="Puxada neutra");assert.ok(ex);
 const planCount=(await listEntities("plans")).length;
 await saveEntity("exercises",{...ex,imageUrl:undefined,imageSourceUrl:undefined,imageLicense:undefined,imageAuthor:undefined});
 const result=(await listEntities("exercises")).find(x=>x.id===ex.id);
 assert.equal(result?.imageUrl,undefined);assert.equal(result?.imageAuthor,undefined);
 assert.equal((await listEntities("plans")).length,planCount);
});
