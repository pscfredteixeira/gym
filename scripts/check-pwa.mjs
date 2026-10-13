import { readFile, stat } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import { join } from "node:path";
const check=(yes,msg)=>{if(!yes)throw new Error(msg);};
const manifest=JSON.parse(await readFile("dist/manifest.webmanifest","utf-8"));
const html=await readFile("dist/index.html","utf-8");
check(manifest.id==="/gym/"&&manifest.scope==="/gym/"&&manifest.start_url==="/gym/"&&manifest.display==="standalone","Manifesto da PWA inválido");
check(manifest.short_name==="GYM","Nome do aplicativo incorreto");
check(html.includes('rel="apple-touch-icon"')&&html.includes("/gym/apple-touch-icon-v3.png"),"Ícone do iPhone não aparece no HTML");
check(html.includes('rel="manifest"')&&html.includes("/gym/manifest.webmanifest"),"Manifesto não aparece no HTML");
check(html.includes('apple-mobile-web-app-capable" content="yes"'),"Configuração standalone do iPhone ausente");
const signature=Buffer.from([137,80,78,71,13,10,26,10]);
const expected=[["dist/apple-touch-icon.png",180],["dist/apple-touch-icon-v2.png",180],["dist/apple-touch-icon-v3.png",180],["dist/icons/icon-192.png",192],["dist/icons/icon-192-v2.png",192],["dist/icons/icon-192-v3.png",192],["dist/icons/icon-512.png",512],["dist/icons/icon-512-v2.png",512],["dist/icons/icon-512-v3.png",512]];
for(const [path,size] of expected){
 const png=await readFile(path);
 check(png.subarray(0,8).equals(signature),"PNG inválido: "+path);
 check(png.subarray(12,16).toString("ascii")==="IHDR","Cabeçalho PNG inválido: "+path);
 check(png.readUInt32BE(16)===size&&png.readUInt32BE(20)===size,"Dimensões incorretas: "+path);
 check((await stat(path)).size>3000,"Ícone vazio ou corrompido: "+path);
 console.log("OK",path,size+"x"+size,png.length+" bytes");
}
for(const icon of manifest.icons)check(expected.some(([path])=>"/gym/"+path.slice(5)===icon.src),"Ícone no manifesto não foi gerado: "+icon.src);

function assertWordmark(fileBytes,size){
  const compressed=[];
  for(let off=8;off+12<=fileBytes.length;){
    const len=fileBytes.readUInt32BE(off),type=fileBytes.subarray(off+4,off+8).toString("ascii");
    if(type==="IDAT")compressed.push(fileBytes.subarray(off+8,off+8+len));
    off+=len+12;
    if(type==="IEND")break;
  }
  const data=inflateSync(Buffer.concat(compressed));
  const stride=size*4+1;
  check(data.length===stride*size,"Tamanho de raster incorreto");
  const bands=[[0.12,0.40],[0.41,0.65],[0.66,0.91]];
  for(const [left,right] of bands){
    let count=0;
    for(let y=Math.floor(size*0.37);y<Math.floor(size*0.64);y+=Math.max(1,Math.floor(size/90))){
      check(data[y*stride]===0,"Filtro PNG inesperado");
      for(let x=Math.floor(size*left);x<Math.floor(size*right);x+=Math.max(1,Math.floor(size/90))){
        const i=y*stride+1+x*4;
        const r=data[i],g=data[i+1],b=data[i+2];
        if(r>185&&r>g+65&&g>b+24)count++;
      }
    }
    check(count>8,"O arquivo não mostra a palavra GYM na região esperada: "+left+"-"+right);
  }
}
for(const [file,size] of [["dist/apple-touch-icon-v3.png",180],["dist/icons/icon-192-v3.png",192],["dist/icons/icon-512-v3.png",512]]){
 assertWordmark(await readFile(file),size);
}
console.log("PASSOU: versão GYM standalone com ícones válidos para iPhone e Android.");


const installation=await readFile("dist/instalar.html","utf-8");
check(installation.includes("apple-touch-icon-v3.png")&&installation.includes("INSTALAÇÃO IPHONE"),"Página de instalação exclusiva inválida");
const installManifest=JSON.parse(await readFile("dist/manifest-install.webmanifest","utf-8"));
check(installManifest.display==="standalone"&&installManifest.id!==manifest.id,"Instalação não tem identidade própria");
console.log("PASSOU: instalador exclusivo e ícone pronto para iPhone.");
