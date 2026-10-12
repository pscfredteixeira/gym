/**
 * Confirma que GitHub Pages serve o HTML COMPILADO e que os assets são
 * obtidos com 200 e MIME adequado, não o index.html de desenvolvimento.
 * Usa apenas APIs nativas do Node 22.
 */
const base = "https://pscfredteixeira.github.io/gym/";
const stamp = Date.now();
function assert(condition, message) {if(!condition) throw new Error(message);}
async function retrieve(url) {
  const r = await fetch(url, {cache:"no-store", signal:AbortSignal.timeout(20000), headers:{"Cache-Control":"no-cache"}});
  const body = await r.text();
  return {status:r.status,type:r.headers.get("content-type")||"",body,url:r.url};
}
async function check() {
  const page=await retrieve(base+"?deploy_check="+stamp);
  console.log("Página:",page.status,page.url,"MIME:",page.type,"bytes:",page.body.length);
  assert(page.status===200,"Página pública não respondeu 200");
  const js=page.body.match(/<script[^>]*src="([^"]+\.js)"/);
  const css=page.body.match(/<link[^>]*href="([^"]+\.css)"/);
  assert(js && css,"HTML não contém assets compilados .js e .css. Pode estar publicando o código-fonte!");
  const sources=[js[1],css[1]];
  for(const path of sources) {
    const dest = new URL(path,base).href;
    const asset=await retrieve(dest+"?deploy_check="+stamp);
    console.log("Asset:",dest,asset.status,asset.type,"bytes:",asset.body.length);
    assert(asset.status===200,"Asset não carregou: "+dest);
    assert(asset.body.length>100,"Asset vazio: "+dest);
    assert(!asset.type.includes("text/html"),"Asset está servindo HTML (provável fallback/404): "+dest);
  }
  assert(page.body.includes('rel="apple-touch-icon"')&&page.body.includes("/gym/apple-touch-icon-v3.png"),"HTML público não anuncia o ícone iPhone");
  assert(page.body.includes('rel="manifest"')&&page.body.includes("/gym/manifest.webmanifest"),"HTML público não anuncia o manifesto PWA");
  const mr=await retrieve(base+"manifest.webmanifest?deploy_check="+stamp);
  assert(mr.status===200&&!mr.type.includes("text/html"),"Manifesto não está disponível");
  const manifest=JSON.parse(mr.body);
  assert(manifest.display==="standalone"&&manifest.scope==="/gym/"&&manifest.short_name==="GYM","Manifesto servido é inválido");
  const signature=Buffer.from([137,80,78,71,13,10,26,10]);
  for(const name of ["apple-touch-icon-v3.png","icons/icon-192-v3.png","icons/icon-512-v3.png"]){
    const result=await fetch(base+name+"?deploy_check="+stamp,{cache:"no-store",signal:AbortSignal.timeout(20000)});
    const png=Buffer.from(await result.arrayBuffer());
    console.log("Ícone público:",name,result.status,png.length+" bytes");
    assert(result.status===200&&png.subarray(0,8).equals(signature)&&png.length>3000,"Ícone PNG não foi publicado: "+name);
  }
  console.log("PASSOU: GitHub Pages está entregando a aplicação compilada e seus assets.");
}
let last;
for(let i=1;i<=6;i++){
  try{await check();process.exit(0);}
  catch(e){last=e;console.log("Tentativa "+i+"/6 falhou:",e.message);if(i<6)await new Promise(r=>setTimeout(r,10000));}
}
console.error("FALHA NA VERIFICAÇÃO DO SITE:",last?.stack||last);process.exit(1);
