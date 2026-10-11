# Modelo de dados v0 (proposta inicial)

O código-fonte contém as interfaces iniciais em `src/domain/models.ts`. Persistência e validações entram na Sprint 02. Este documento define regras para evitar retrabalho.

## Entidades

| Entidade | Campos mais importantes | Observações |
|---|---|---|
| Exercise | id, nome, grupo principal, equipamento, mídia opcional | biblioteca e exercícios personalizados |
| WorkoutPlan | id, nome, itens, criadoEm, atualizadoEm | ficha editável |
| PlanExercise | id, exerciseId, ordem, séries planejadas, descanso | referência dentro da ficha |
| PlannedSet | tipo aquecimento/efetiva, meta repetições, carga/RIR opcionais | intervalo de metas, não execução |
| WorkoutSession | id, planId opcional, data local, início/fim UTC, status | histórico com snapshot da ficha |
| SessionExercise | id, exerciseId, nomeSnapshot, ordem, séries executadas | não muda se exercício for editado |
| CompletedSet | id, tipo, cargaKg, repetições, RIR opcional, horário UTC | carga 0 permitida em exercícios sem peso |
| CardioSession | id, tipo, data local, duraçãoSeg, distânciaMetros opcional | esteira/corrida/outros |
| ImportBatch | id, formato, origem, data, IDs importados | permite desfazer e auditoria |
| Settings | unidades, preferências, metas, versão | por instalação no início |

## Identificadores e unidades

- IDs opacos estáveis (`crypto.randomUUID()`).
- Instantes como strings ISO 8601 UTC (ex.: 2026-10-11T12:30:00.000Z).
- Datas de calendário `YYYY-MM-DD` na localização desejada, sem conversão UTC na renderização.
- Carga em kg; distância em metros; duração em segundos; velocidade pode ser derivada.
- Quantidades não negativas, repetições inteiras, RIR entre 0 e 10 quando informado.
- Campos desconhecidos de importações: não inferir nem inventar valores.

## Consistência

1. Cada série concluída pertence a um exercício em uma sessão.
2. Uma sessão não pode ter data final anterior ao início.
3. Editar ou excluir ficha nunca apaga automaticamente sessões finalizadas.
4. Métricas derivadas (volume, ritmo, recordes) não são fonte primária de verdade.
5. Importações de saúde precisam registrar origem e deduplicar por identificador externo estável + tipo de atividade quando disponível.
6. Exportar e restaurar dados respeitando `schemaVersion`; restaurar só após validar todas as entidades.

## Indicadores

- **Volume de musculação:** somatório de `cargaKg × repetições` apenas das séries efetivas relevantes; não confundir com trabalho mecânico.
- **Ritmo de corrida:** `duraçãoSeg / (distânciaMetros / 1000)`, em segundos/km, somente se distância > 0.
- **Recordes:** métricas recalculadas em função do histórico, com contexto de aparelho/exercício e data.
- **Consistência:** quantidade de dias com sessões concluídas, sem duplicar dias com múltiplas atividades.

## Migrações

Começar a persistência com `schemaVersion = 1` na Sprint 02. Toda alteração posterior cria migração explícita e teste com dados de versão anterior.
