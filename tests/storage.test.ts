import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";

// O adaptador simula a API do navegador, sem servidor e sem rede.
(globalThis as typeof globalThis & {window: typeof globalThis}).window=globalThis;
const { readSettings,writeSettings,saveEntity,listEntities,createBackup,restoreBackup,getDataCounts } = await import("../src/data/storage.ts");

test("preferências persistem em nova leitura do IndexedDB", async()=>{
  const base=await readSettings();
  assert.equal(base.units,"metric");
  await writeSettings({...base,displayName:"Teste local",largeText:true,personalGoal:"Três treinos semanais"});
  const found=await readSettings();
  assert.equal(found.displayName,"Teste local");
  assert.equal(found.largeText,true);
  assert.equal(found.personalGoal,"Três treinos semanais");
});
test("salva entidades reais e exporta backup com versão", async()=>{
  await saveEntity("cardioSessions",{id:"corrida-1",kind:"treadmill",localDate:"2026-10-11",durationSeconds:1200,distanceMeters:3000,source:"manual"});
  const backup=await createBackup();
  assert.equal(backup.schemaVersion,1);
  assert.equal(backup.cardioSessions.length,1);
  assert.equal(backup.cardioSessions[0].durationSeconds,1200);
  assert.equal((await getDataCounts()).cardio,1);
});
test("arquivo inválido não pode alterar o banco", async()=>{
  const original=await createBackup();
  await assert.rejects(()=>restoreBackup({...original,cardioSessions:[{id:"falso"}]}),/cardio/);
  assert.equal((await listEntities("cardioSessions")).length,1);
  assert.equal((await readSettings()).displayName,"Teste local");
});
test("restauração substitui os dados de forma atômica", async()=>{
  const old=await createBackup();
  await writeSettings({...old.settings,displayName:"Mudança temporária"});
  await saveEntity("cardioSessions",{id:"corrida-2",kind:"outdoor_run",localDate:"2026-10-11",durationSeconds:900,source:"manual"});
  await restoreBackup(old);
  assert.equal((await readSettings()).displayName,"Teste local");
  assert.deepEqual((await listEntities("cardioSessions")).map(x=>x.id),["corrida-1"]);
});
