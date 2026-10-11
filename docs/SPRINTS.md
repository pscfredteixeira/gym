# Roadmap de sprints

Cada sprint possui uma entrega testável. Não iniciar outra etapa enquanto houver regressão crítica em registros de treino ou dados.

| Sprint | Escopo | Critério de aceite |
|---|---|---|
| 00 | arquitetura, domínio, backlog, repositório e base de execução | docs versionados, projeto inicial com build |
| 01 | design system escuro/laranja e 10 telas responsivas | navegação mobile, sem cortes ou controles ilegíveis |
| 02 | IndexedDB, repositórios, migrações, backup/restore | informação persiste e backup restaura sem corrupção |
| 03 | editor de fichas, séries planejadas e agenda | criar, editar, reordenar e preservar histórico |
| 04 | sessões musculação, registro peso/reps/RIR, histórico | concluir treino e consultar séries realizadas |
| 05 | timer, retomada, modo academia | contador correto após alternar/bloquear tela; UX rápida |
| 06 | biblioteca visual, busca, equipamentos, substituições | encontrar, ver execução e substituir exercício |
| 07 | esteira, corrida externa e cardio manual | registrar sessões, calcular ritmo e revisar histórico |
| 08 | métricas, recordes, evolução, relatórios | gráficos auditáveis contra dados conhecidos |
| 09 | cards social, editor, formatos 9:16/4:5/1:1, exportação | PNG/JPG corretos e salváveis no iPhone |
| 10 | importação Apple Saúde exportada, deduplicação e origem | validar arquivo real e desfazer lote |
| 11 | PWA, instalação, service worker e uso offline | app instalado e registro essencial sem conexão |
| 12 | testes de usabilidade, acessibilidade, proteção dos dados | correções críticas e regressão sem perda de dados |
| 13 | GitHub Pages, documentação e release 1.0 | URL publicada, instalação verificada e backup documentado |
| 14 | opcional: progressão assistida, consultas e iOS/HealthKit | novas capacidades só após análise de viabilidade |

## Marcos

- **M1:** Sprints 00–03 — estrutura, visual e criação de fichas.
- **M2:** Sprints 04–06 — musculação utilizável na academia.
- **M3:** Sprints 07–10 — corrida, gráficos, cards e importação manual de saúde.
- **M4:** Sprints 11–13 — PWA pronta e versão estável.

## Definition of Done (todas as sprints)

- Funcionalidade implementada e não apenas desenhada.
- Teste do fluxo principal + estados vazios e erros.
- Build e TypeScript passam.
- Nenhum dado do usuário perdido em mudanças.
- Uso confortável em tela de iPhone e largura 320 px.
- Escopo entregue e limitações descritos no changelog do sprint.

## Sprint 00 — checklist

- [x] Repositório localizado e inspecionado.
- [x] Visão e requisitos documentados.
- [x] Arquitetura modular definida.
- [x] Modelo e invariantes documentados.
- [x] Decisões de PWA, saúde, privacidade e backup.
- [x] Estrutura de execução React/TypeScript/Vite adicionada.
- [x] Build remoto e workflow GitHub Pages validados (execução bem-sucedida).
- [ ] Verificar abertura e instalação no iPhone.
- [ ] Aceite visual da interface-base no aparelho.

A Sprint 01 entregou uma prévia navegável com dez telas, biblioteca demonstrativa, timer visual, edição temporária de séries, corrida de exemplo, gráficos ilustrativos, exportação PNG de cards e ajustes de acessibilidade. O usuário ainda precisa aprovar o design no iPhone, antes da Sprint 02.

## Sprint 02 — acompanhamento

- [x] Stores IndexedDB v1 e repositórios CRUD.
- [x] Preferências no Perfil com gravação automática e mensagens de status.
- [x] Backup JSON versionado e restauração transacional com validação antecipada.
- [x] Testes automatizados de integridade, exportação e restauração.
- [ ] Confirmar manualmente no Safari do iPhone: fechar/abrir, backup em Arquivos e restauração.

**Registros de treino ainda não estão disponíveis**: dados demonstrativos permanecem separados dos dados reais.

## Atualização incremental — Programa 10/10

- [x] Importar as cinco fichas e sete dias da semana com repetições e RIR precisos.
- [x] Preservar 66 séries efetivas totais e os cardio/resto opcionais.
- [x] Cadastro local idempotente no IndexedDB (sem sobrescrita de dados).
- [x] Visualização em Hoje / Treinar / Exercícios e backup contendo o programa.
- [ ] Sprint 03: edição da ficha e adaptação personalizada.
- [ ] Sprint 04: execução e salvamento de séries reais.

## Sprint 03 — implementação

- [x] Editor responsivo de fichas, exercícios, ordem e observações.
- [x] Alteração de quantidade e tipo das séries, repetições, RIR por faixa e descanso.
- [x] Troca de exercícios existentes e cadastro de exercício personalizado.
- [x] Criação, duplicação e exclusão segura de fichas personalizadas fora da agenda.
- [x] Agenda semanal editável com troca de dias e cardio opcional.
- [x] Salvamento explícito em IndexedDB, preservação de sessões antigas e backup.
- [x] Testes automatizados de operações imutáveis, guarda de históricos, agenda e restauração.
- [x] Testes automatizados de build e publicação GitHub Pages.
- [ ] Validação manual no Safari do iPhone pelo usuário, antes de iniciar a Sprint 04.

Observação: a interface de execução da Sprint 01 ainda apresenta valores simulados e NÃO registra séries reais. Não misturar a simulação com dados salvos.

## Sprint 04 — implementação

- [x] Snapshot das fichas e séries no momento de iniciar uma sessão real.
- [x] Persistência de uma sessão em andamento e retomada após reabrir o navegador.
- [x] Bloqueio transacional de duas sessões em andamento no mesmo banco.
- [x] Registro, edição e remoção de carga, repetições e RIR por série.
- [x] Suporte a séries de aquecimento e efetivas, navegação e exercícios pulados.
- [x] Finalização (com ao menos uma série), encerramento como interrompido.
- [x] Histórico consultável, sem modificar registros antigos ao editar a ficha.
- [x] Backup com histórico e validação de referência das séries.
- [x] Testes automatizados de domínio e persistência.
- [x] Compilação e publicação automatizadas.
- [ ] Aceite manual no Safari do iPhone: iniciar, registrar, fechar e retomar, concluir e consultar histórico.

A Sprint 05 deverá acrescentar descanso por relógio real, comandos rápidos e aprimoramento do modo academia. Não incluir dados fictícios nas estatísticas reais.


## Sprint 05 — Implementação (11/10/2026)

- [x] Descanso automático ao registrar série nova, conforme ficha ou padrão do Perfil.
- [x] Contagem por prazo absoluto em UTC; recálculo após suspender o Safari.
- [x] Pausar, continuar, +15 s, -15 s e pular com persistência.
- [x] Correção de série existente não reinicia a contagem.
- [x] Alternar entre Uma série (modo academia) e Todas as séries.
- [x] Avanço de seleção para próxima série pendente após salvar.
- [x] Backup/restauração validam e preservam o estado de descanso.
- [x] Testes automáticos, compilação, publicação e renderização no navegador.
- [ ] Validação prática no iPhone pelo usuário.

**Limitação:** não há notificação nem sinal sonoro confiável com a página fechada ou o iPhone bloqueado.

## Sprint 06 — entrega técnica

- [x] Biblioteca pesquisável dos 31 movimentos originais e exercícios personalizados em IndexedDB.
- [x] Filtros por nome (com ou sem acento), músculo, equipamento e movimentos pessoais.
- [x] Instruções individualizadas e cuidados para cada movimento original.
- [x] Mapas musculares SVG esquemáticos, originais e rotulados como ilustração.
- [x] Substituições explícitas, alternativas existentes e integração ao editor de ficha.
- [x] Troca persistente, preservando configurações das séries e o histórico de treinos.
- [x] Testes de cobertura e integridade, compilação e publicação automatizada.
- [ ] Fotografias reais por movimento com licença verificável.
- [ ] Validação manual do novo layout e trocas no Safari iPhone.

Não usar fotos de bases cujo próprio mantenedor desconheça a licença.


## Complemento da Sprint 06 — Fotografias demonstrativas

- [x] Adicionar/trocar/remover imagem pela galeria do iPhone e por link HTTPS.
- [x] Compactação de fotos com limite e armazenamento local persistente.
- [x] Exibir miniaturas em Exercícios, Treinar, editor e modo academia.
- [x] Ver foto maior no detalhe e durante a sessão real.
- [x] Preservar fotos em backup JSON e validar formatos permitidos.
- [x] Testar persistência de imagem e integridade da ficha no IndexedDB.
- [ ] Validação prática de upload JPG/HEIC no Safari iOS.
- [ ] Fotografias originais curadas para os 31 movimentos, com licença verificada.

## Sprint 07 — implementação

- [x] Registro manual de esteira, corrida externa, caminhada e atividades nomeadas.
- [x] Duração, distância opcional, inclinação, frequência cardíaca e observações.
- [x] Ritmo/velocidade calculados sem números fictícios.
- [x] Cronômetro por relógio real, pausa e preenchimento manual da duração; persistência local do cronômetro auxiliar.
- [x] Histórico local, edição e exclusão confirmada de registros manuais.
- [x] Resumos reais em Hoje/Evolução e gráfico semanal de cardio.
- [x] Integração com sugestões do Programa 10/10, sem marcar treino planejado como realizado.
- [x] Backup JSON com cardio e validação de importações protegidas.
- [x] Testes automatizados, build e publicação GitHub Pages.
- [ ] Teste manual em Safari iPhone e aprovação do usuário.

**Sem GPS ou sincronização automática com o Apple Watch.**

## Sprint 08 — Evolução real

- [x] Substituição dos indicadores e gráficos fictícios da aba Evolução por agregados reais.
- [x] Filtros 30/90/180 dias e todo o histórico, segundo datas locais.
- [x] Gráfico de maior carga efetiva por dia e por exercício registrado; kg/lb.
- [x] Total de séries efetivas, repetições, aquecimento e volume externo (kg × reps).
- [x] Indicadores de cardio com minutos e distância opcional; ritmo de atividades com distância.
- [x] Gráfico de dias ativos nas últimas seis semanas, sem duplicação de cardio e força no mesmo dia.
- [x] Estados vazios sem números fictícios e acesso a Histórico/Cardio.
- [x] Reprocessamento após editar/restaurar históricos, sem nova versão do backup.
- [x] Testes automatizados, compilação, GitHub Pages e smoke test da rota Evolução.
- [ ] Validação manual da aba Evolução no Safari do iPhone pelo usuário.

O estúdio de cards permanece como prévia com **dados fictícios** e não é exportação de treinos reais.


## Correção das fotografias (após Sprint 08)

- [x] Esclarecer que a coleção original de 31 exercícios não tinha fotografias pré-carregadas.
- [x] Indicar "SEM FOTO" claramente na biblioteca e nas fichas.
- [x] Adicionar sugestões externas com licenças CC BY, CC BY-SA, CC0 ou domínio público.
- [x] Incluir confirmação de correspondência técnica antes de vincular uma foto.
- [x] Preservar autor, licença e link da fonte junto do exercício no backup.
- [x] Não substituir imagens já salvas nem preencher imagens aleatórias automaticamente.
- [x] Testes de parser de licenças, persistência e integridade das fichas.
- [ ] Validar acesso à API Commons e visualização das fotos no Safari do iPhone.

## Atualização de instalação iPhone — PWA básica

- [x] Ícone GYM laranja e grafite, arquivo Apple touch PNG de 180 × 180.
- [x] Ícones PWA em PNG 192 × 192 e 512 × 512; manifesto com base e escopo `/gym/`.
- [x] Cabeçalhos Apple para abrir pela Tela de Início sem barra do Safari.
- [x] Publicação dos novos arquivos por Pages/Actions e Pages/branch.
- [x] Testes automatizados dos ícones e da publicação pública.
- [ ] Validar manualmente a instalação e abertura no iPhone do usuário.

Esta melhoria antecipa a **instalabilidade**; o cache offline completo e atualizações offline permanecem na Sprint 11. Veja `docs/INSTALL_IPHONE.md`.
