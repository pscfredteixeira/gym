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
  console.log("PASSOU: GitHub Pages está entregando a aplicação compilada e seus assets.");
}
let last;
for(let i=1;i<=6;i++){
  try{await check();process.exit(0);}
  catch(e){last=e;console.log("Tentativa "+i+"/6 falhou:",e.message);if(i<6)await new Promise(r=>setTimeout(r,10000));}
}
console.error("FALHA NA VERIFICAÇÃO DO SITE:",last?.stack||last);process.exit(1);
