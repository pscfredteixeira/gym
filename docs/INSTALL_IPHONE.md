# GYM na Tela de Início do iPhone

O GYM pode ser instalado como um **atalho de aplicativo web** a partir do Safari. Ele recebe ícone próprio laranja e grafite, nome curto **GYM** e interface **standalone**, sem a barra de endereços. Isso não é um aplicativo da App Store e não habilita, por si só, sincronização nativa com Apple Saúde, notificações em segundo plano ou funcionamento totalmente offline.

## Instalar pelo Safari

1. Abra o Safari do iPhone e acesse **https://pscfredteixeira.github.io/gym/**.
2. Toque em **Compartilhar** (quadrado com seta para cima).
3. Selecione **Adicionar à Tela de Início**. Dependendo da versão do iOS, talvez seja necessário rolar a lista de opções.
4. Confira o nome **GYM**, mantenha **Abrir como App Web** ativado se essa opção aparecer e toque em **Adicionar**.
5. Abra o ícone **GYM** na Tela de Início. Ele deve abrir sem a barra normal de endereços do Safari.

Os arquivos de ícones são `apple-touch-icon.png` (180 × 180), `icons/icon-192.png` e `icons/icon-512.png`, gerados de forma determinística antes do build. `manifest.webmanifest` aponta para a base `/gym/` e solicita exibição em `standalone`.

### Se o ícone antigo continuar aparecendo

A Tela de Início pode manter um ícone antigo em cache. Remova **somente o atalho antigo** da Tela de Início e adicione novamente pelo Safari. **Não use a opção para apagar dados do app sem antes exportar backup.**

### Atenção aos dados dos treinos

A instalação na Tela de Início pode usar um armazenamento local diferente da aba do Safari; dados não são sincronizados automaticamente entre instalações e aparelhos. Antes de instalar, abra **Perfil → Exportar backup JSON** no GYM atual e guarde o arquivo em **Arquivos**. Depois de instalar, confira se seus treinos estão no aplicativo. Se não estiverem, restaure seu backup JSON pelo Perfil da nova instalação. Restauração substitui os dados atuais daquela instalação.

### Funcionamento sem internet

O ícone e o modo standalone não significam que o aplicativo inteiro funciona offline. O cache offline e atualização controlada continuam planejados para Sprint 11. Para usar o GYM agora, mantenha acesso à internet ao abrir; os registros são guardados localmente no dispositivo.

### Verificação técnica

`npm run build` aciona `scripts/generate-icons.mjs` antes do build; `npm run test:pwa` confirma manifesto, links iOS e arquivos PNG com dimensões corretas. O workflow de publicação sincroniza o manifesto e os PNGs para a raiz que serve o Pages por branch e também os inclui no artefato de Pages por Actions. A checagem HTTP em `scripts/check-deploy.mjs` valida os endpoints públicos.

## Revisão do ícone (2026-10-12)

O ícone aprovado, com as letras **GYM** em laranja sobre grafite, está publicado como `/gym/apple-touch-icon-v3.png`. O HTML aponta exclusivamente para a nova versão e o manifesto usa `icon-192-v3.png` e `icon-512-v3.png`. Os arquivos antigos são preservados por compatibilidade.

**Ícones de aplicativos já instalados no iPhone não são necessariamente atualizados pelo Safari quando o arquivo do site muda.** Faça primeiro um backup JSON no Perfil. Depois de guardar esse backup, remova apenas a instalação antiga da Tela de Início, abra a versão mais recente do GYM no Safari normal e use **Compartilhar → Adicionar à Tela de Início** novamente. Se os treinos não forem transferidos automaticamente, importe o backup JSON na nova instalação.
