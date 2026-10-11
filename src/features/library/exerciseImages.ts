/** Exercise demonstration photos are kept locally as compact JPEG data URLs.
 * Nothing is sent to a server; the saved data survives refresh and JSON backup. */
export const MAX_EXERCISE_PHOTO_CHARS = 195_000;
export const MAX_SOURCE_PHOTO_BYTES = 20 * 1024 * 1024;
const MAX_EDGE = 900;

export function isExerciseImageUrl(value:unknown):value is string {
  if(typeof value!=="string")return false;
  if(/^https:\/\/[^\s"'<>]{1,1990}$/i.test(value)&&value.length<=2000)return true;
  return value.length<=MAX_EXERCISE_PHOTO_CHARS
    && /^data:image\/(?:jpeg|webp);base64,[a-z0-9+/]+={0,2}$/i.test(value);
}

export function estimateExercisePhotoSize(dataUrl:string):number {
  const comma=dataUrl.indexOf(",");
  if(comma<0)return 0;
  return Math.floor((dataUrl.length-comma-1)*3/4);
}

async function imageFromFile(file:File):Promise<HTMLImageElement> {
  const source=URL.createObjectURL(file);
  try {
    const picture=new Image();
    picture.decoding="async";
    picture.src=source;
    await new Promise<void>((resolve,reject)=>{
      picture.onload=()=>resolve();
      picture.onerror=()=>reject(new Error("O iPhone não conseguiu abrir esta imagem. Tente uma foto JPG ou PNG."));
    });
    if(!picture.naturalWidth||!picture.naturalHeight)
      throw new Error("Não foi possível ler as dimensões desta foto.");
    return picture;
  } finally {
    // Revoke after caller consumes image? decode() retains the decoded pixels on modern WebKit.
    // Source is instead revoked by the caller after drawing: see prepareExercisePhoto.
  }
}

export async function prepareExercisePhoto(file:File):Promise<string> {
  if(!file.type.startsWith("image/"))
    throw new Error("Selecione uma imagem da sua galeria (JPG, PNG ou HEIC compatível).");
  if(file.size>MAX_SOURCE_PHOTO_BYTES)
    throw new Error("A foto original é muito grande. Escolha uma imagem menor que 20 MB.");
  const url=URL.createObjectURL(file);
  try {
    const photo=new Image();
    photo.decoding="async";
    photo.src=url;
    await new Promise<void>((resolve,reject)=>{
      photo.onload=()=>resolve();
      photo.onerror=()=>reject(new Error("Não foi possível ler a foto. Tente JPG ou PNG."));
    });
    if(!photo.naturalWidth||!photo.naturalHeight)
      throw new Error("A imagem selecionada está vazia.");
    let scale=Math.min(1,MAX_EDGE/Math.max(photo.naturalWidth,photo.naturalHeight));
    for(let attempt=0;attempt<9;attempt++) {
      const canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(photo.naturalWidth*scale));
      canvas.height=Math.max(1,Math.round(photo.naturalHeight*scale));
      const ctx=canvas.getContext("2d");
      if(!ctx)throw new Error("Este navegador não consegue processar fotos.");
      ctx.fillStyle="#151719";ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(photo,0,0,canvas.width,canvas.height);
      const quality=attempt<3?.78-attempt*.11:.55;
      const result=canvas.toDataURL("image/jpeg",quality);
      canvas.width=0;canvas.height=0;
      if(isExerciseImageUrl(result))return result;
      scale*=.82;
    }
    throw new Error("Não foi possível reduzir esta foto. Tente uma imagem mais simples.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
