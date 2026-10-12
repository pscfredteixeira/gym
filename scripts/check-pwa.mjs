import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
const check=(yes,msg)=>{if(!yes)throw new Error(msg);};
const manifest=JSON.parse(await readFile("dist/manifest.webmanifest","utf-8"));
const html=await readFile("dist/index.html","utf-8");
check(manifest.id==="/gym/"&&manifest.scope==="/gym/"&&manifest.start_url==="/gym/"&&manifest.display==="standalone","Manifesto da PWA inválido");
check(manifest.short_name==="GYM","Nome do aplicativo incorreto");
check(html.includes('rel="apple-touch-icon"')&&html.includes("/gym/apple-touch-icon-v2.png"),"Ícone do iPhone não aparece no HTML");
check(html.includes('rel="manifest"')&&html.includes("/gym/manifest.webmanifest"),"Manifesto não aparece no HTML");
check(html.includes('apple-mobile-web-app-capable" content="yes"'),"Configuração standalone do iPhone ausente");
const signature=Buffer.from([137,80,78,71,13,10,26,10]);
const expected=[["dist/apple-touch-icon.png",180],["dist/apple-touch-icon-v2.png",180],["dist/icons/icon-192.png",192],["dist/icons/icon-192-v2.png",192],["dist/icons/icon-512.png",512],["dist/icons/icon-512-v2.png",512]];
for(const [path,size] of expected){
 const png=await readFile(path);
 check(png.subarray(0,8).equals(signature),"PNG inválido: "+path);
 check(png.subarray(12,16).toString("ascii")==="IHDR","Cabeçalho PNG inválido: "+path);
 check(png.readUInt32BE(16)===size&&png.readUInt32BE(20)===size,"Dimensões incorretas: "+path);
 check((await stat(path)).size>3000,"Ícone vazio ou corrompido: "+path);
 console.log("OK",path,size+"x"+size,png.length+" bytes");
}
for(const icon of manifest.icons)check(expected.some(([path])=>"/gym/"+path.slice(5)===icon.src),"Ícone no manifesto não foi gerado: "+icon.src);
console.log("PASSOU: versão GYM standalone com ícones válidos para iPhone e Android.");
