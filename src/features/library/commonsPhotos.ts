import type { Exercise } from "../../domain/models";

/** English search expressions are hints only; users must verify that the photo depicts the right movement. */
const terms:Record<string,string>={
 "Supino inclinado com halteres":"incline dumbbell bench press",
 "Chest press convergente":"chest press machine gym",
 "Desenvolvimento na máquina":"shoulder press machine gym",
 "Elevação lateral no cabo":"cable lateral raise gym",
 "Tríceps acima da cabeça no cabo":"overhead cable triceps extension",
 "Puxada neutra":"lat pulldown neutral grip",
 "Remada unilateral para dorsal":"single arm cable row gym",
 "Pullover na polia":"straight arm pulldown cable",
 "Remada com apoio para upper back":"chest supported row machine",
 "Posterior de ombro na máquina":"reverse pec deck machine",
 "Encolhimento para trapézio":"dumbbell shrugs trapezius gym",
 "Rosca Scott":"preacher curl bench",
 "Hack squat":"hack squat machine",
 "Stiff / RDL":"romanian deadlift barbell",
 "Flexora":"lying leg curl machine",
 "Cadeira extensora":"leg extension machine",
 "Panturrilha":"calf raises machine",
 "Abdominal no cabo":"cable crunch abdominal",
 "Puxada unilateral no cabo":"one arm lat pulldown cable",
 "Remada baixa na máquina focada na dorsal":"seated row machine gym",
 "Supino reto na máquina":"seated chest press machine",
 "Elevação lateral":"dumbbell lateral raise exercise",
 "Tríceps corda":"triceps rope pushdown",
 "Rosca direta":"biceps barbell curl",
 "Remada para parte alta das costas":"seated cable row gym",
 "Tríceps francês no cabo":"cable overhead triceps extension",
 "Rosca inclinada com halteres":"incline dumbbell curl",
 "Rosca martelo":"hammer dumbbell curl",
 "Leg press":"leg press machine gym",
 "Flexora sentada":"seated leg curl machine",
 "Abdominal na máquina":"abdominal crunch machine gym"
};
export interface CommonsPhoto {
 url:string; source:string; author:string; license:string; title:string;
}
type Metadata={value?:unknown};
export function commonsTerm(exercise:Pick<Exercise,"name">):string {
 return terms[exercise.name]??exercise.name;
}
export function isAllowedCommonsLicense(license:string):boolean {
 return /^(?:CC0(?:\s*[\d.]+)?|CC BY(?:-SA)?(?:\s*[\d.]+)?|Public domain|PD(?:[- ].*)?)$/i.test(license.trim());
}
function textValue(meta:Record<string,Metadata>|undefined,name:string):string {
 const value=meta?.[name]?.value;
 if(typeof value!=="string")return "";
 return value.replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/gi," ")
  .replace(/&amp;/gi,"&").replace(/\s+/g," ").trim().slice(0,200);
}
export function parseCommonsPhotos(input:unknown):CommonsPhoto[]{
 if(!input||typeof input!=="object")return [];
 const q=(input as {query?:{pages?:Record<string,unknown>}}).query;
 if(!q?.pages||typeof q.pages!=="object")return [];
 const output:CommonsPhoto[]=[];
 for(const obj of Object.values(q.pages)){
  if(!obj||typeof obj!=="object")continue;
  const page=obj as {title?:unknown;imageinfo?:unknown};
  if(typeof page.title!=="string"||!page.title.startsWith("File:")||
   !Array.isArray(page.imageinfo)||page.imageinfo.length===0)continue;
  const info=page.imageinfo[0] as {thumburl?:unknown;url?:unknown;descriptionurl?:unknown;mime?:unknown;extmetadata?:Record<string,Metadata>};
  const image=info.thumburl??info.url,link=info.descriptionurl;
  const license=textValue(info.extmetadata,"LicenseShortName");
  if(!isAllowedCommonsLicense(license)||typeof image!=="string"||typeof link!=="string"||
    !image.startsWith("https://upload.wikimedia.org/")||!link.startsWith("https://commons.wikimedia.org/wiki/"))continue;
  if(!["image/jpeg","image/png","image/webp"].includes(String(info.mime??"")))continue;
  const author=textValue(info.extmetadata,"Artist")||textValue(info.extmetadata,"Attribution")||"Autor indicado na página da imagem";
  output.push({url:image,source:link,author,license,title:page.title.slice(5).replace(/_/g," ")});
 }
 return output.slice(0,8);
}
export async function findCommonsPhotos(exercise:Pick<Exercise,"name">,signal?:AbortSignal):Promise<CommonsPhoto[]>{
 const specific=commonsTerm(exercise);
 const words=specific.split(/\s+/);
 // A shorter search may find relevant photos when the exact exercise has none.
 const broad=words.length>2?words.slice(0,words.length-1).join(" "):specific;
 for(const query of [...new Set([specific,broad])]){
  const params=new URLSearchParams({
   action:"query",format:"json",origin:"*",generator:"search",gsrnamespace:"6",
   gsrsearch:query,gsrlimit:"12",prop:"imageinfo",
   iiprop:"url|mime|extmetadata",iiurlwidth:"520",
   iiextmetadatafilter:"LicenseShortName|Artist|Attribution|Copyrighted"
  });
  const response=await fetch("https://commons.wikimedia.org/w/api.php?"+params.toString(),{signal,mode:"cors"});
  if(!response.ok)throw new Error("A pesquisa de imagens livres não está disponível agora.");
  const photos=parseCommonsPhotos(await response.json());
  if(photos.length)return photos;
 }
 return [];
}
