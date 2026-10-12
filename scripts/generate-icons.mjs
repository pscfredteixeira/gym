#!/usr/bin/env node
/**
 * Recreate the user-approved GYM icon in the sizes required by Safari and PWA.
 * Design source is a compact, palette-compressed raster in gym-approved-art.mjs.
 * All work happens locally during build; no fonts or external assets required.
 */
import { brotliDecompressSync, deflateSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { GYM_ICON_ART } from "./gym-approved-art.mjs";

const palette=Buffer.from(GYM_ICON_ART.palette,"hex");
const source=brotliDecompressSync(Buffer.from(GYM_ICON_ART.pixelsBrotli,"base64"));
const {width:sw,height:sh}=GYM_ICON_ART;
if(source.length!==sw*sh||palette.length%3!==0||palette.length<3*32)
  throw new Error("Imagem GYM aprovada está incompleta ou corrompida.");

function render(size) {
  const output=Buffer.alloc(size*size*4);
  const sample=(x,y,c)=>{
    const sx=Math.min(sw-1,Math.max(0,x));
    const sy=Math.min(sh-1,Math.max(0,y));
    return palette[source[sy*sw+sx]*3+c];
  };
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const fx=(x+.5)*sw/size-.5,fy=(y+.5)*sh/size-.5;
    const x0=Math.floor(fx),y0=Math.floor(fy);
    const dx=fx-x0,dy=fy-y0,base=(y*size+x)*4;
    for(let c=0;c<3;c++){
      const upper=sample(x0,y0,c)*(1-dx)+sample(x0+1,y0,c)*dx;
      const lower=sample(x0,y0+1,c)*(1-dx)+sample(x0+1,y0+1,c)*dx;
      output[base+c]=Math.round(upper*(1-dy)+lower*dy);
    }
    output[base+3]=255;
  }
  return output;
}
const crcTable=new Uint32Array(256);
for(let n=0;n<256;n++){
  let c=n;
  for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):(c>>>1);
  crcTable[n]=c>>>0;
}
function chunk(type,data){
  const name=Buffer.from(type,"ascii");
  const full=Buffer.concat([name,data]);
  let crc=0xffffffff;
  for(const b of full)crc=crcTable[(crc^b)&255]^(crc>>>8);
  const len=Buffer.alloc(4),sum=Buffer.alloc(4);
  len.writeUInt32BE(data.length);sum.writeUInt32BE((crc^0xffffffff)>>>0);
  return Buffer.concat([len,full,sum]);
}
function toPng(rgba,size){
  const rowSize=size*4,raw=Buffer.alloc((rowSize+1)*size);
  for(let y=0;y<size;y++){
    raw[y*(rowSize+1)]=0;
    rgba.copy(raw,y*(rowSize+1)+1,y*rowSize,(y+1)*rowSize);
  }
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);
  ihdr[8]=8;ihdr[9]=6; // RGBA 8 bits
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk("IHDR",ihdr),
    chunk("IDAT",deflateSync(raw,{level:9})),
    chunk("IEND",Buffer.alloc(0))
  ]);
}
const outputs=[
  [180,"public/apple-touch-icon.png"],
  [180,"public/apple-touch-icon-v2.png"],
  [180,"public/apple-touch-icon-v3.png"],
  [192,"public/icons/icon-192.png"],
  [192,"public/icons/icon-192-v2.png"],
  [192,"public/icons/icon-192-v3.png"],
  [512,"public/icons/icon-512.png"],
  [512,"public/icons/icon-512-v2.png"],
  [512,"public/icons/icon-512-v3.png"]
];
for(const [size,name] of outputs){
  const file=join(process.cwd(),name);
  await mkdir(dirname(file),{recursive:true});
  const png=toPng(render(size),size);
  await writeFile(file,png);
  console.log("Generated "+name+" ("+size+"x"+size+", "+png.length+" bytes)");
}
