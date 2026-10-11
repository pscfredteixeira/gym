import { useEffect, useState } from "react";
import { Check, ExternalLink, Image, LoaderCircle, RefreshCw } from "lucide-react";
import type { Exercise } from "../../domain/models";
import { findCommonsPhotos, type CommonsPhoto } from "./commonsPhotos";

export function CommonsPhotoPicker({exercise,onChoose}:{
  exercise:Pick<Exercise,"name"|"id"|"imageUrl"|"isCustom">;
  onChoose:(photo:CommonsPhoto)=>Promise<void>;
}){
 const [photos,setPhotos]=useState<CommonsPhoto[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [saving,setSaving]=useState("");
 const [notice,setNotice]=useState("");
 const [refresh,setRefresh]=useState(0);
 const [customPermission,setCustomPermission]=useState(false);
 useEffect(()=>{
  if(exercise.isCustom&&!customPermission)return;
  const controller=new AbortController();
  setLoading(true);setPhotos([]);setError("");setNotice("");
  findCommonsPhotos(exercise,controller.signal).then(found=>{
    if(!controller.signal.aborted)setPhotos(found);
  }).catch(err=>{
    if(!controller.signal.aborted)setError(err instanceof Error?err.message:"Não foi possível pesquisar agora.");
  }).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[exercise.id,exercise.name,exercise.isCustom,customPermission,refresh]);
 const choose=async(photo:CommonsPhoto)=>{
   if(!window.confirm("Esta fotografia mostra realmente o exercício '"+exercise.name+"'? Confira a máquina e a posição antes de associá-la à ficha."))return;
   setSaving(photo.url);setError("");setNotice("");
   try{await onChoose(photo);setNotice("Foto vinculada a este exercício. Os créditos foram preservados.");}
   catch(err){setError(err instanceof Error?err.message:"Falha ao salvar esta foto.");}
   finally{setSaving("");}
 };
 return <section className="gym-commons-picker" aria-label="Fotografias com licença aberta">
   <div className="gym-commons-heading"><Image size={20}/><div>
     <strong>Encontrar foto demonstrativa</strong>
     <p>O GYM pesquisa fotografias do Wikimedia Commons. Escolha somente uma imagem que realmente represente este movimento.</p>
   </div></div>
   {exercise.isCustom&&!customPermission&&<div className="gym-commons-empty"><span>Para buscar fotos deste exercício personalizado, o nome será enviado ao Wikimedia Commons.</span><button type="button" onClick={()=>setCustomPermission(true)}>Pesquisar fotos</button></div>}
   {(!exercise.isCustom||customPermission)&&loading&&<div className="gym-commons-loading" role="status"><LoaderCircle size={19}/> Procurando fotografias...</div>}
   {(!exercise.isCustom||customPermission)&&!loading&&photos.length===0&&<div className="gym-commons-empty">
      <span>{error||"Não foram encontradas fotografias abertas correspondentes nesta pesquisa."}</span>
      <button type="button" onClick={()=>setRefresh(x=>x+1)}><RefreshCw size={16}/> Tentar novamente</button>
    </div>}
   {(!exercise.isCustom||customPermission)&&!loading&&photos.length>0&&<>
     <p className="gym-commons-warning">Resultados externos: nem toda foto corresponde exatamente ao movimento. Observe a máquina e a execução antes de escolher.</p>
     <div className="gym-commons-results">{photos.map(photo=><div className="gym-commons-photo" key={photo.source}>
       <div className="gym-commons-photo-preview"><img src={photo.url} alt={"Candidata: "+photo.title} loading="lazy"/></div>
       <div className="gym-commons-photo-details"><strong>{photo.title}</strong>
         <span>{photo.license} · {photo.author}</span>
         <a href={photo.source} target="_blank" rel="noopener noreferrer">Ver fonte e licença <ExternalLink size={13}/></a>
       </div>
       <button type="button" disabled={Boolean(saving)} className="gym-commons-use" onClick={()=>{void choose(photo);}}>
         <Check size={16}/> {saving===photo.url?"Salvando...":"Usar foto"}
       </button>
     </div>)}</div>
   </>}
   {notice&&<p className="gym-photo-success" role="status">{notice}</p>}
   {error&&photos.length>0&&<p className="gym-photo-error" role="alert">{error}</p>}
   <p className="gym-commons-credit-note">Somente fotos com licença identificada como CC BY, CC BY-SA, CC0 ou domínio público entram nas sugestões. O uso de conteúdo externo exige internet. Atribuição e página de origem permanecem no backup.</p>
 </section>;
}
