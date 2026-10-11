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

A Sprint 01 começa com a revisão visual do conceito aprovado e construção dos componentes definitivos.
