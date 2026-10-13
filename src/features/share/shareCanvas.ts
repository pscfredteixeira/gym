import type { CardData, ShareFormat, ShareStyle } from "./shareDomain.ts";
import { SHARE_SIZES } from "./shareDomain";

export function drawShareCard(data:CardData,format:ShareFormat,style:ShareStyle,scale=1):HTMLCanvasElement {
 const [width,height]=SHARE_SIZES[format];
 const canvas=document.createElement("canvas");
 canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);
 const ctx=canvas.getContext("2d");
 if(!ctx)throw new Error("O navegador não permitiu gerar o card.");
 ctx.scale(scale,scale);
 const dark=style==="ember";
 const bg=dark?"#101114":"#eeece7",ink=dark?"#faf8f4":"#17191b",
  muted=dark?"#a9a7a5":"#656563",accent=dark?"#ff812f":"#d95818";
 ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
 if(dark){
  const gradient=ctx.createRadialGradient(width*.85,height*.21,0,width*.85,height*.21,height*.75);
  gradient.addColorStop(0,"#51301e");gradient.addColorStop(.42,"#221a19");gradient.addColorStop(1,bg);
  ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
  ctx.fillStyle="#ffffff";ctx.globalAlpha=.04;
  for(let i=0;i<18;i++)ctx.fillRect((i*121)%width,(i*267)%height,1,1);
  ctx.globalAlpha=1;
 }
 const pad=90;
 const text=(t:string,x:number,y:number,font:string,color:string,limit=width-pad*2)=>{
  ctx.fillStyle=color;ctx.font=font;
  let value=t;
  if(ctx.measureText(value).width>limit){
   while(value.length>1&&ctx.measureText(value+"…").width>limit)value=value.slice(0,-1);
   value+="…";
  }
  ctx.fillText(value,x,y);
 };
 ctx.fillStyle=accent;ctx.fillRect(pad,100,84,10);
 text("GYM.",pad,197,"900 76px Arial, system-ui, sans-serif",ink);
 ctx.fillStyle=muted;ctx.font="700 24px Arial, sans-serif";ctx.fillText(data.date+"  /  REGISTRO REAL",pad,245);
 const compact=height<=1100;
 const baseline=compact?405:height<=1350?465:620;
 text(data.kind==="strength"?"MUSCULAÇÃO":"CARDIO",pad,baseline-75,"800 40px Arial, sans-serif",muted);
 const heroSize=data.hero.length>5?150:195;
 text(data.hero,pad-8,baseline+110,`900 ${heroSize}px Arial, sans-serif`,accent,width-pad*2-130);
 let metricsUnitX=Math.min(width-pad-145,pad+ctx.measureText(data.hero).width+12);
 text(data.heroUnit,metricsUnitX,baseline+105,"800 41px Arial, sans-serif",ink,width-metricsUnitX-pad);
 text(data.title.toLocaleUpperCase("pt-BR"),pad,baseline+190,"850 47px Arial, sans-serif",ink);
 text(data.subtitle.toLocaleUpperCase("pt-BR"),pad,baseline+239,"700 30px Arial, sans-serif",muted);
 const separator=baseline+279;
 ctx.globalAlpha=.35;ctx.strokeStyle=muted;ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(pad,separator);ctx.lineTo(width-pad,separator);ctx.stroke();ctx.globalAlpha=1;
 const visible=data.metrics.slice(0,compact?2:4);
 let start=separator+76;
 const rowSpace=compact?125:height>=1800?155:133;
 for(let i=0;i<visible.length;i++){
  const row=visible[i],y=start+i*rowSpace;
  text(row.label,pad,y,"750 26px Arial, sans-serif",muted);
  text(row.value,pad,y+61,"850 57px Arial, sans-serif",ink);
 }
 const lastY=start+visible.length*rowSpace;
 const available=height-190-lastY;
 if(data.details.length&&available>90){
  const maxLines=Math.min(data.details.length,Math.floor(available/54),format==="story"?5:3);
  const detailStart=lastY+12;
  for(let i=0;i<maxLines;i++)text("•  "+data.details[i],pad,detailStart+i*51,"600 28px Arial, sans-serif",muted);
 }
 ctx.fillStyle=accent;ctx.fillRect(pad,height-144,70,7);
 text("MOVIMENTO É PROGRESSO.",pad,height-98,"700 26px Arial, sans-serif",muted);
 ctx.textAlign="right";
 text(data.credit,width-pad,height-56,"700 19px Arial, sans-serif",muted);
 ctx.textAlign="left";
 // Right-aligned credit without allowing it to overlap the footer slogan.
 // The text fits in a separate row if it is too long.
 return canvas;
}
export function cardFileName(data:CardData,format:ShareFormat,extension:"png"|"jpg"):string{
 const day=data.date.split("/").reverse().join("-");
 return "gym-"+data.kind+"-"+day+"-"+format+"."+extension;
}
export async function cardBlob(canvas:HTMLCanvasElement,exportType:"png"|"jpeg"):Promise<Blob>{
 const mime=exportType==="png"?"image/png":"image/jpeg";
 return await new Promise<Blob>((resolve,reject)=>{
  canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Não foi possível gerar a imagem.")),mime,0.94);
 });
}
