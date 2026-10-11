# Arquitetura técnica

## Topologia

Uma SPA estática no GitHub Pages, sem servidor e sem autenticação na primeira versão.

```text
Interface React (mobile-first)
  → Camada de casos de uso (planejar / registrar / importar / exportar)
  → Modelos e validações de domínio
  → Repositórios de dados
  → IndexedDB no navegador
```

O fluxo de compartilhamento usa dados derivados dos registros e gera imagens localmente. Arquivos importados do Apple Saúde passam por uma camada de normalização, proveniência e deduplicação; jamais alteram silenciosamente sessões feitas manualmente.

## Stack inicial

- Vite + React + TypeScript.
- Tailwind integrado na configuração; CSS global leve no protótipo.
- IndexedDB para persistência nas sprints seguintes; preferir uma camada única de acesso ao banco e migrações versionadas.
- Testes automatizados de domínio, fluxo e importação antes do lançamento.
- GitHub Actions para checar build e publicar o diretório `dist`.

## Estrutura alvo

```text
src/
  app/               Rotas, estado de interface, provedores
  components/        Componentes visuais reutilizáveis
  features/
    dashboard/       Hoje
    workout-plans/   Fichas e agenda
    sessions/        Execução e descansos
    exercises/       Biblioteca
    cardio/          Corrida e esteira
    analytics/       Evolução
    sharing/         Cards e exportação
    health-import/   Parser e importações
    profile/         Preferências e backup
  domain/            Tipos, regras puras e validações
  data/              IndexedDB, migrações e repositórios
  lib/               Formatação, datas e unidades
  App.tsx
  main.tsx
```

Não criar pastas vazias: cada módulo entra quando sua sprint começa.

## Regras de domínio

- Ficha (plano) é editável; sessão concluída mantém um snapshot do planejamento e dados efetivamente executados.
- Séries efetivas são distintas de aquecimento; volume e estatísticas precisam declarar qual conjunto utilizam.
- Não guardar recordes como verdade definitiva se podem ser recalculados de sessões.
- Toda importação possui lote, fonte e IDs de origem para desfazer sem interferir nos dados manuais.
- Timestamps ISO UTC para eventos; data de treino no calendário usa a data local que o usuário escolheu.
- Sem dependência de rede para registrar informações essenciais depois da ativação offline.

## Confiabilidade do armazenamento

Dados no IndexedDB do Safari não são garantia de armazenamento permanente. A tela de perfil deverá oferecer exportação e restauração, orientação de backup e aviso quando a gravação falhar. Nunca dizer que uma série foi salva antes da confirmação de escrita.

Versão de esquema explícita com migrações testadas. Backups conterão `schemaVersion`, `exportedAt` e entidades. Restauração valida estrutura e requer confirmação antes de substituir/mesclar.

## Segurança e privacidade

- Dados permanecem no dispositivo por padrão.
- Nenhum dado de saúde enviado para rastreadores.
- Exportar cards com campos de saúde/localização desmarcados inicialmente.
- Fotos importadas usadas somente mediante ação do usuário.
- Sanitizar textos inseridos por usuário; nunca renderizar HTML arbitrário em cards.
- Importações locais validam tamanho/formato e tratam XML sem entidades externas.

## PWA e iPhone

PWA não acessa diretamente HealthKit; a Sprint 10 fará importação de arquivos exportados pelo usuário. Um eventual sincronizador HealthKit será software iOS nativo separado, sujeito a autorização específica.

Notificações e sons em segundo plano não são garantidos por uma página web no iPhone. Para descanso, armazenar `startedAt` e `endsAt` e recalcular ao retomar o aplicativo.

## GitHub Pages

Repositório `pscfredteixeira/gym` com URL projetada em `https://pscfredteixeira.github.io/gym/`. O `base` do Vite deve ser `/gym/`; o workflow publica apenas `dist`, jamais arquivos-fonte. Configuração de Pages em Settings > Pages > GitHub Actions pode ser necessária.

## Critérios técnicos por PR/sprint

- Build e checagem TypeScript sem erro.
- Teste manual em largura pequena e no iPhone para funcionalidades interativas.
- Não alterar estrutura de dados sem migração planejada.
- Sem perda de dados registrados ao editar planos.
- Documentação atualizada quando houver mudança de fluxo.

## Sprint 03 — edição e agenda

- `src/features/program/PlanEditor.tsx` e `planEditor.ts` mantêm um rascunho local, confirmação explícita e funções imutáveis.
- `savePlanWithExercises` grava plano + exercícios personalizados em uma única transação IndexedDB, sem alterar `workoutSessions`.
- `ProgramOverview` e `ProgramDayDetail` exibem os dados atuais dos planos, não apenas os valores do preset.
- `src/features/program/programSchedule.ts` resolve a agenda semanal a partir de `UserSettings.weeklyPlanIds` e `weeklyCardio`, com valores padrão no Programa 10/10.
- As duas propriedades de agenda são opcionais no backup de esquema v1, garantindo compatibilidade retroativa com arquivos exportados na Sprint 02.
- Todo salvamento deve ser confirmado no navegador antes de navegar; erros permanecem visíveis.
