# Programa 10/10 — implementação no GYM

## Origem e fidelidade

Plano informado diretamente pelo usuário, apelidado **Treino Fred — versão 2.0**, inspirado no estilo Jordan Peters. Direção: hipertrofia e redução gradual de gordura. Prioridades: dorsal, bíceps/tríceps, ombros/trapézio e abdômen.

**Privacidade:** idade, altura e peso corporal enviados na conversa NÃO foram incluídos nos arquivos públicos do GitHub. O programa de exercícios e a divisão semanal, por sua vez, ficam versionados como preset reutilizável.

## Divisão

| Dia | Ficha | Exercícios | Séries efetivas | Cardio |
|---|---|---:|---:|---|
| Seg | PUSH | 5 | 10 | Corrida moderada, 20 min |
| Ter | PULL | 7 | 14 | — |
| Qua | LEGS + ABDÔMEN | 6 | 12 | — |
| Qui | Descanso | 0 | 0 | Corrida leve, 20 min, opcional; caminhada ou descanso conforme fadiga |
| Sex | UPPER | 8 | 16 | — |
| Sáb | LOWER + BÍCEPS | 7 | 14 | — |
| Dom | Descanso | 0 | 0 | Caminhada leve opcional |
| **Total** | **5 fichas** | **33 posições** | **66** | |

A especificação completa e as 66 séries estão em `src/data/program1010.ts`. Cada série possui faixa própria de repetições, RIR mínimo e RIR máximo. A primeira série de supino inclinado usa 6–9 repetições e a segunda 9–12.

## Dados e funcionamento

- Ao abrir o aplicativo, o preset é cadastrado por ID estável no IndexedDB, se ainda não existir.
- Usa uma transação única para cadastrar todas as cinco fichas e exercícios da biblioteca sem criar duplicatas.
- **Nunca sobrescreve** uma ficha ou exercício que já tenha o mesmo ID; preservar edições futuras.
- A agenda de segunda a domingo e as informações sobre cardio/resto aparecem no app.
- O backup JSON da Sprint 02 inclui os planos e exercícios salvos.
- Um plano é uma prescrição, não uma sessão de treino. Abrir a ficha ou marcar um dia no calendário **não cria treino concluído**.
- As séries são exclusivamente efetivas: não foi presumido número de séries de aquecimento.
- Carga e tempo de descanso não foram fornecidos no programa; aparecem sem valor inventado (descanso = 0 no modelo, significando ainda não configurado).
- A interface de execução, tempo de descanso e gráficos antigos continuam **demonstração** até implementação do registro de séries reais (Sprint 04).

## Validação

Rodar `npm test`, `npm run build` e o teste de publicação. Conferir no iPhone as sete opções em **Treinar**, os detalhes de cada dia e a navegação do calendário em **Hoje**. Na área Perfil, conferir contagens das cinco fichas e backup.
