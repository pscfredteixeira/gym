import { useEffect, useState, type ChangeEvent } from "react";
import { Camera, Check, Image as ImageIcon, Link as LinkIcon, Trash2, Upload } from "lucide-react";
import type { Exercise } from "../../domain/models";
import { isExerciseImageUrl, prepareExercisePhoto } from "./exerciseImages";

export function ExercisePhoto({exercise,compact=false}:{
  exercise:Pick<Exercise,"name"|"imageUrl"|"imageAuthor"|"imageSourceUrl"|"imageLicense">;compact?:boolean
}) {
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[exercise.imageUrl]);
  const src=exercise.imageUrl;
  const show=Boolean(src)&&!failed;
  if(compact)return <span className="gym-exercise-thumbnail">
    {show?<img src={src} loading="lazy" alt={"Foto de "+exercise.name} onError={()=>setFailed(true)}/>:<ImageIcon size={22} aria-hidden="true"/>}
  </span>;
  return <div className={"gym-exercise-photo "+(show?"has-photo":"empty")}>
    {show?<img src={src} alt={"Imagem demonstrativa cadastrada para "+exercise.name} onError={()=>setFailed(true)}/>:
      <div className="gym-exercise-photo-missing"><ImageIcon size={39}/>
        <strong>{src?"Imagem não carregou":"Foto ainda não cadastrada"}</strong>
        <span>{src?"O endereço pode estar indisponível. Escolha outra imagem abaixo.":"Veja sugestões de fotos livres ou adicione uma imagem da sua galeria."}</span>
      </div>}
    {show&&<span className="gym-exercise-photo-tag">IMAGEM CADASTRADA</span>}
    {show&&exercise.imageSourceUrl&&<div className="gym-exercise-photo-attribution">
      <span>{exercise.imageLicense??"Licença na fonte"} · {exercise.imageAuthor??"Wikimedia Commons"}</span>
      <a href={exercise.imageSourceUrl} target="_blank" rel="noopener noreferrer">Fonte e licença</a>
    </div>}
  </div>;
}

export function ExercisePhotoEditor({exercise,onSave}:{
  exercise:Exercise;
  onSave:(imageUrl:string|undefined)=>Promise<void>;
}){
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const [link,setLink]=useState("");
  const commit=async(value:string|undefined)=>{
    setBusy(true);setError("");setSuccess("");
    try{
      await onSave(value);
      setSuccess(value?"Imagem salva. Ela aparecerá na biblioteca e na ficha.":"Imagem retirada deste exercício.");
      setLink("");
    }catch(err){setError(err instanceof Error?err.message:"Não foi possível salvar a imagem no iPhone.");}
    finally{setBusy(false);}
  };
  const choose=async(event:ChangeEvent<HTMLInputElement>)=>{
    const input=event.currentTarget,file=input.files?.[0];
    input.value="";
    if(!file)return;
    setBusy(true);setError("");setSuccess("");
    try{
      const converted=await prepareExercisePhoto(file);
      await onSave(converted);
      setSuccess("Foto reduzida e salva no dispositivo. Já aparece no exercício.");
      setLink("");
    }catch(err){setError(err instanceof Error?err.message:"Não foi possível processar a foto.");}
    finally{setBusy(false);}
  };
  const paste=async()=>{
    const url=link.trim();
    if(!isExerciseImageUrl(url)||!url.startsWith("https://")){
      setError("Insira o endereço HTTPS direto de uma imagem JPG, PNG ou WebP.");return;
    }
    await commit(url);
  };
  return <section className="gym-photo-editor" aria-label="Cadastrar imagem demonstrativa">
    <div className="gym-photo-editor-heading"><Camera size={20}/><div><strong>Imagem do exercício</strong>
      <p>Coloque uma foto para reconhecer o aparelho ou o movimento antes de treinar.</p></div></div>
    <label className={"gym-photo-choose "+(busy?"disabled":"")}>
      <Upload size={18}/> {busy?"Preparando foto...":exercise.imageUrl?"Trocar foto da galeria":"Adicionar foto da galeria"}
      <input type="file" accept="image/*,.heic,.heif" disabled={busy} onChange={e=>{void choose(e);}} aria-label="Escolher uma imagem demonstrativa do iPhone"/>
    </label>
    <details className="gym-photo-from-link"><summary><LinkIcon size={16}/> Usar link de uma imagem</summary>
      <label>Endereço direto da imagem (HTTPS)<input type="url" inputMode="url" autoCapitalize="off" autoCorrect="off"
        value={link} onChange={e=>setLink(e.target.value)} placeholder="https://site.com/exercicio.jpg" disabled={busy}/></label>
      <button type="button" disabled={busy||!link.trim()} onClick={()=>{void paste();}}>Salvar imagem do link</button>
      <small>Imagens externas precisam de internet e podem deixar de funcionar se o site remover o arquivo. Use apenas imagens que você tem permissão de utilizar.</small>
    </details>
    {exercise.imageUrl&&<button type="button" className="gym-photo-remove" disabled={busy}
      onClick={()=>{if(window.confirm("Retirar a imagem deste exercício? Sua ficha e seus treinos continuam salvos."))void commit(undefined);}}>
      <Trash2 size={16}/> Remover imagem
    </button>}
    {error&&<p role="alert" className="gym-photo-error">{error}</p>}
    {success&&<p role="status" className="gym-photo-success"><Check size={16}/>{success}</p>}
    <p className="gym-photo-note">Fotos da galeria são reduzidas e armazenadas somente neste navegador, inclusive no backup JSON. Não são enviadas ao GitHub.</p>
  </section>;
}
