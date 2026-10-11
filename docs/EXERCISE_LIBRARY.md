# Sprint 06 — Biblioteca real de exercícios

A biblioteca do GYM exibe os **31 movimentos distintos** do Programa 10/10 e os exercícios personalizados cadastrados no dispositivo.

## Funcionalidades
- **Exercícios:** consulta às entidades reais do IndexedDB (não a uma lista fictícia). Busca que ignora maiúsculas e acentos, filtro de grupo muscular, equipamento e exercícios pessoais.
- **Guia individual:** três instruções específicas, dois cuidados de execução, objetivo muscular e equipamento para cada exercício original. Exercícios pessoais sem guia não recebem instruções fabricadas.
- **Mapa muscular:** vistas anterior e posterior esquemáticas, com a região principal em laranja, rotuladas como **ilustrativas**. Não representam uma fotografia ou modelo anatômico exato.
- **Substituições:** recomendações baseadas primeiro nas opções explicitamente compatíveis do programa, e depois em movimentos existentes no mesmo grupo muscular. Nenhuma alternativa ausente do banco local aparece como disponível.
- **Troca direta:** na tela do exercício, escolher a ficha em que ele está cadastrado e uma alternativa, confirmar. Somente o ID do exercício naquela posição da ficha é alterado. Séries, cargas planejadas, RIR, descanso e históricos permanecem inalterados. Para consultar a substituição, voltar à ficha ou abrir a biblioteca novamente.
- **Editor:** dentro de um exercício da ficha, abrir **Técnica e alternativas** para ler os passos e selecionar outro movimento; a alteração só é persistida ao clicar em **Salvar alterações**.

## Cuidados de direito autoral
Não copiar fotografias do projeto `yuhonas/free-exercise-db`. Embora o repositório anuncie Unlicense, seu mantenedor declarou não conhecer a procedência ou os direitos das fotografias originais, com risco para distribuição. Ver:
- https://github.com/yuhonas/free-exercise-db/issues/2
- https://github.com/yuhonas/free-exercise-db/issues/12

Os SVGs musculares foram escritos especificamente para o GYM e não dependem de licença externa. **Fotografias de execução específicas ainda não foram incluídas nesta Sprint 06**, pois precisam de fontes e licenças verificadas. As imagens de ambientação herdadas do Sprint 01 são separadas dos guias técnicos.

## Teste no Safari
1. Abra **Exercícios**, busque `puxada` e depois `triceps` (sem acento).
2. Filtre `Bíceps`, selecione **Rosca Scott** e leia as instruções e cuidados.
3. Abra **Puxada neutra**, veja a área dorsal destacada e as alternativas.
4. Selecione **Puxada unilateral no cabo** entre as alternativas para verificar o guia próprio.
5. Na Puxada neutra, selecione a ficha **Terça — PULL**, escolha uma substituição e confirme. Confira na ficha se as séries e RIR não mudaram.
6. No editor de ficha, expanda **Técnica e alternativas** e altere outro movimento, salvando ao final.
7. Faça um backup antes de qualquer teste destrutivo. Se houver treino em andamento, confirme que suas séries já salvas continuam associadas ao nome antigo do exercício.

### Limites
As orientações de execução são educativas, não substituem análise individual da técnica. A biblioteca não realiza avaliação de vídeo nem tem sincronização de imagens offline nesta versão. Nenhuma fotografia é atribuída a movimento diferente do retratado.
