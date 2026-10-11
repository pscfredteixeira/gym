#!/usr/bin/env node
/**
 * Generate deterministic PNG application icons, without a third-party rasterizer.
 * The same orange "G" monogram is represented in public/icons/gym-mark.svg.
 * Apple Home Screen uses the 180px PNG; Chromium/Android use 192px/512px.
 */
import { deflateSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const commands=[
  ["M",358,166],
  ["C",329,141,295,130,255,130],
  ["C",171,130,111,185,111,256],
  ["C",111,331,174,386,256,386],
  ["C",301,386,338,372,360,354],
  ["L",360,273],
  ["L",275,273]
];

function cubic(a,b,c,d,t){
  const i=1-t;
  return i*i*i*a+3*i*i*t*b+3*i*t*t*c+t*t*t*d;
}
function buildSegments(){
  const pts=[];
  let x=0,y=0;
  for(const c of commands){
    if(c[0]==="M"){x=c[1];y=c[2];pts.push([x,y]);continue;}
    if(c[0]==="L"){x=c[1];y=c[2];pts.push([x,y]);continue;}
    const px=x,py=y;
    for(let i=1;i<=30;i++){
      const t=i/30;
      pts.push([cubic(px,c[1],c[3],c[5],t),cubic(py,c[2],c[4],c[6],t)]);
    }
    x=c[5];y=c[6];
  }
  return pts.slice(1).map((p,i)=>[...pts[i],...p]);
}
const segments=buildSegments();
function distance(x,y){
  let min=1e9;
  for(const [x1,y1,x2,y2] of segments){
    const vx=x2-x1,vy=y2-y1;
    const t=Math.max(0,Math.min(1,((x-x1)*vx+(y-y1)*vy)/(vx*vx+vy*vy)));
    const dx=x-x1-t*vx,dy=y-y1-t*vy;
    const d=dx*dx+dy*dy;
    if(d<min)min=d;
  }
  return Math.sqrt(min);
}
function clamp(n){return Math.min(255,Math.max(0,Math.round(n)));}
function render(size){
  const rgba=Buffer.alloc(size*size*4);
  const aa=512/size*0.72;
  for(let py=0;py<size;py++){
    const y=(py+0.5)*512/size;
    for(let px=0;px<size;px++){
      const x=(px+0.5)*512/size,idx=(py*size+px)*4;
      const r=Math.hypot((x-240)/480,(y-178)/480);
      const light=Math.max(0,1-r*2.1);
      let red=14+8*light,green=17+8*light,blue=21+8*light;
      if(x>75&&x<412&&y>90&&y<423){
        const dist=distance(x,y);
        const spread=Math.max(0,dist-29);
        const glow=Math.max(0,0.12*Math.exp(-spread/18));
        red=red*(1-glow)+239*glow;
        green=green*(1-glow)+111*glow;
        blue=blue*(1-glow)+40*glow;
        const coverage=Math.max(0,Math.min(1,(29+aa-dist)/(2*aa)));
        const gradient=Math.max(0,Math.min(1,(y-140)/255));
        const gr=255,gg=151-49*gradient,gb=73-35*gradient;
        red=red*(1-coverage)+gr*coverage;
        green=green*(1-coverage)+gg*coverage;
        blue=blue*(1-coverage)+gb*coverage;
      }
      rgba[idx]=clamp(red);rgba[idx+1]=clamp(green);
      rgba[idx+2]=clamp(blue);rgba[idx+3]=255;
    }
  }
  return rgba;
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
  [192,"public/icons/icon-192.png"],
  [512,"public/icons/icon-512.png"]
];
for(const [size,name] of outputs){
  const file=join(process.cwd(),name);
  await mkdir(dirname(file),{recursive:true});
  const png=toPng(render(size),size);
  await writeFile(file,png);
  console.log("Generated "+name+" ("+size+"x"+size+", "+png.length+" bytes)");
}
