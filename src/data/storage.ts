import type { GymBackup, Exercise, WorkoutPlan, WorkoutSession, CardioSession, ImportBatch, UserSettings } from "../domain/models";
import { DEFAULT_SETTINGS, SCHEMA_VERSION, validateGymBackup, validateSettings } from "./validation.ts";

const DB_NAME = "gym-local-v1";
const SETTINGS_KEY = "current";
export const DATA_STORES = ["exercises", "plans", "workoutSessions", "cardioSessions", "importBatches", "settings"] as const;
type StoreName = typeof DATA_STORES[number];
type Entity = Exercise | WorkoutPlan | WorkoutSession | CardioSession | ImportBatch;
type SettingsRow = UserSettings & { id: "current" };

let currentDb: Promise<IDBDatabase> | null = null;
function openDb(): Promise<IDBDatabase> {
  if (!("indexedDB" in window)) return Promise.reject(new Error("Este navegador não oferece armazenamento IndexedDB."));
  if (currentDb) return currentDb;
  currentDb = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, SCHEMA_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of DATA_STORES) {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store,{ keyPath:"id" });
      }
    };
    request.onerror = () => reject(request.error ?? new Error("Falha ao abrir o armazenamento."));
    request.onblocked = () => reject(new Error("Há outra janela do GYM impedindo a atualização. Feche as outras abas."));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); currentDb = null; };
      resolve(db);
    };
  }).catch((err:unknown) => { currentDb = null; throw err; });
  return currentDb!;
}

function transactionRequest<T>(store:StoreName, mode:IDBTransactionMode, command:(objectStore:IDBObjectStore)=>IDBRequest<T>):Promise<T> {
  return openDb().then(db=>new Promise<T>((resolve,reject)=>{
    let result:T;
    let tx:IDBTransaction;
    try {
      tx=db.transaction(store,mode);
      const req=command(tx.objectStore(store));
      req.onsuccess=()=>{result=req.result;};
      tx.oncomplete=()=>resolve(result);
      tx.onerror=()=>reject(tx.error??new Error("Erro ao salvar no dispositivo."));
      tx.onabort=()=>reject(tx.error??new Error("Operação cancelada pelo navegador."));
    } catch(error){reject(error);}
  }));
}
export async function listEntities<T extends Entity>(store:Exclude<StoreName,"settings">):Promise<T[]> {
  return transactionRequest<T[]>(store,"readonly",s=>s.getAll());
}
export async function saveEntity<T extends Entity>(store:Exclude<StoreName,"settings">,entity:T):Promise<void> {
  await transactionRequest(store,"readwrite",s=>s.put(entity));
}
export async function deleteEntity(store:Exclude<StoreName,"settings">,id:string):Promise<void> {
  await transactionRequest(store,"readwrite",s=>s.delete(id));
}
export async function readSettings():Promise<UserSettings> {
  const row=await transactionRequest<SettingsRow|undefined>("settings","readonly",s=>s.get(SETTINGS_KEY));
  return row ? validateSettings(row) : {...DEFAULT_SETTINGS};
}
export async function writeSettings(value:UserSettings):Promise<void> {
  const settings=validateSettings(value);
  await transactionRequest("settings","readwrite",s=>s.put({ ...settings, id: SETTINGS_KEY }));
}

type Snapshot = {
  exercises:Exercise[];
  plans:WorkoutPlan[];
  workoutSessions:WorkoutSession[];
  cardioSessions:CardioSession[];
  importBatches:ImportBatch[];
  settings:SettingsRow[];
};
function readSnapshot():Promise<Snapshot>{
  return openDb().then(db=>new Promise((resolve,reject)=>{
    const tx=db.transaction(DATA_STORES,"readonly");
    const result:Partial<Snapshot>={};
    for(const name of DATA_STORES){
      const request=tx.objectStore(name).getAll();
      request.onsuccess=()=>{ (result as Record<string,unknown>)[name]=request.result; };
    }
    tx.oncomplete=()=>resolve(result as Snapshot);
    tx.onerror=()=>reject(tx.error??new Error("Não foi possível ler o banco de dados."));
    tx.onabort=()=>reject(tx.error??new Error("Leitura interrompida."));
  }));
}
export async function createBackup():Promise<GymBackup>{
  const snapshot=await readSnapshot();
  return validateGymBackup({
    schemaVersion:SCHEMA_VERSION,
    exportedAt:new Date().toISOString(),
    exercises:snapshot.exercises,
    plans:snapshot.plans,
    workoutSessions:snapshot.workoutSessions,
    cardioSessions:snapshot.cardioSessions,
    importBatches:snapshot.importBatches,
    settings:snapshot.settings.find(x=>x.id===SETTINGS_KEY)??DEFAULT_SETTINGS,
  });
}
export async function getDataCounts():Promise<{ plans:number; strength:number; cardio:number; exercises:number }> {
  const data=await readSnapshot();
  return {plans:data.plans.length,strength:data.workoutSessions.length,cardio:data.cardioSessions.length,exercises:data.exercises.length};
}
export async function restoreBackup(raw:unknown):Promise<UserSettings>{
  // Fully validate before clearing ANY store.
  const backup=validateGymBackup(raw);
  const db=await openDb();
  await new Promise<void>((resolve,reject)=>{
    let tx:IDBTransaction;
    try{
      tx=db.transaction(DATA_STORES,"readwrite");
      for(const name of DATA_STORES) tx.objectStore(name).clear();
      for(const row of backup.exercises) tx.objectStore("exercises").put(row);
      for(const row of backup.plans) tx.objectStore("plans").put(row);
      for(const row of backup.workoutSessions) tx.objectStore("workoutSessions").put(row);
      for(const row of backup.cardioSessions) tx.objectStore("cardioSessions").put(row);
      for(const row of backup.importBatches) tx.objectStore("importBatches").put(row);
      tx.objectStore("settings").put({...backup.settings,id:SETTINGS_KEY});
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error??new Error("Erro ao restaurar backup."));
      tx.onabort=()=>reject(tx.error??new Error("Restauração cancelada. O banco foi mantido."));
    }catch(error){reject(error);}
  });
  return backup.settings;
}
