# Fotografias de demonstração

A Sprint 01 utiliza imagens de terceiros apenas como elementos visuais demonstrativos. São carregadas de servidores externos e **não são parte do pacote offline**. A biblioteca definitiva poderá substituir essas imagens por ativos locais devidamente licenciados, priorizando correspondência exata entre movimento e fotografia.

- [Unsplash — Levantamento com barra, imagem de abertura](https://unsplash.com/photos/a-man-lifting-a-barbell-in-a-gym-YwK5YfOkqww), imagem 1646072507379-c6c9dca7de0c; licença Unsplash.
- [Pexels — Puxada alta na academia](https://www.pexels.com/photo/man-on-the-lat-pulldown-low-row-machine-in-the-gym-18060085/), foto 18060085; licença Pexels.
- [Unsplash — Levantamento com barra em ambiente escuro](https://unsplash.com/photos/a-woman-lifting-a-barbell-in-a-dark-room-rgYc1rGuHTA), imagem 1697019921949-d5ec698cb6ca; licença Unsplash.
- [Pexels — Corrida na esteira](https://www.pexels.com/photo/man-running-on-treadmill-1954524/), foto 1954524; licença Pexels.

**Importante:** algumas imagens de ambientação não correspondem ao movimento mostrado no cartão. Na Sprint 06, substituir por registros precisos de cada exercício e adicionar imagens alternativas caso o CDN falhe. Nunca apresentar uma foto de outro exercício como instrução técnica de execução.

## Sprint 06: mapas próprios e fotografias não incluídas
A biblioteca real de movimentos utiliza mapas SVG originais, construídos em `src/features/library/ExerciseLibrary.tsx`, para indicar músculos predominantes em vista anterior e posterior. São **diagramas estilizados**, não fotografias, nem demonstrações exatas da biomecânica.

Não foi feito hotlink nem cópia de imagens do `yuhonas/free-exercise-db`, porque o próprio mantenedor desconhece as licenças das fotografias fornecidas e declara que o uso ocorre por conta e risco do distribuidor:
- https://github.com/yuhonas/free-exercise-db/issues/2
- https://github.com/yuhonas/free-exercise-db/issues/12

A obtenção de fotografias exatas e com licença clara continua pendente.


## Fotografias escolhidas diretamente pelo usuário

A partir da atualização de outubro de 2026, o GYM aceita fotografias selecionadas no iPhone ou links HTTPS informados pelo usuário. Fotos escolhidas na galeria são compactadas localmente e persistidas no IndexedDB; não fazem parte do repositório público. Links apontam para servidores externos, sujeitos a licença, disponibilidade e privacidade.

**Não confundimos essas fotos escolhidas com fotografias licenciadas e curadas oficialmente pelo projeto.** A biblioteca inicial continua sem fotos automáticas dos movimentos originais.


## Atualização: escolha de fotografias demonstrativas com licença aberta

O Programa 10/10 foi inicialmente cadastrado sem fotos. Exibir um ícone ou "SEM FOTO" não significa que o carregamento de uma imagem previamente fornecida falhou; significa, em geral, que nenhuma imagem foi ainda associada àquele exercício.

Agora, em **Exercícios > toque no exercício > Encontrar foto demonstrativa**, o GYM consulta a API oficial do **Wikimedia Commons** para apresentar miniaturas candidatas de imagens que declararam licença **CC BY, CC BY-SA, CC0 ou domínio público**. Os termos de busca em inglês são específicos para cada um dos 31 movimentos do programa. A página traz imagem, título, licença, créditos e link para o arquivo original.

**A pesquisa é uma lista de candidatos, não uma certificação técnica.** O mesmo termo de busca pode retornar uma máquina parecida, uma posição inadequada ou outro tipo de exercício. O usuário verifica se a foto realmente corresponde ao movimento e confirma **Usar foto**. Só então a imagem aparece na biblioteca, na ficha e durante o treino. Não atribuímos fotos arbitrárias automaticamente. Caso não haja opções, continua possível carregar uma imagem da galeria do iPhone ou indicar um link HTTPS próprio.

As fotografias obtidas no Commons mantêm `imageUrl`, `imageSourceUrl`, `imageAuthor` e `imageLicense` no IndexedDB e no backup JSON. O detalhe do exercício exibe a licença e o link de fonte. Imagens da galeria continuam locais e privadas, sem serem enviadas ao Commons.

**Dependências:** o Commons e seu servidor de imagens precisam estar acessíveis. A busca pode falhar por indisponibilidade, bloqueio do Safari ou ausência de fotos relevantes com licença aberta. A imagem de um link escolhido depende da conectividade futura do servidor. Para uso em publicações ou materiais externos, deve-se respeitar a licença individual, especialmente os termos ShareAlike de CC BY-SA.

**Teste:** Abra Exercícios > Puxada neutra; confira se aparece "Foto ainda não cadastrada" e a área "Encontrar foto demonstrativa". Se a API estiver acessível, escolha uma opção verificando máquina/pegada e toque **Usar foto**. Volte para Treinar > PULL e confira a miniatura. Faça backup pelo Perfil e verifique se a imagem permanece após reabrir. Se já havia foto na sua ficha, ela não foi apagada pela mudança.
