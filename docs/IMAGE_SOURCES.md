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
