# Treino Fred 3.0 — seis dias no GYM

## Objetivo e origem
Plano pedido pelo usuário para hipertrofia, com prioridades em dorsais, bíceps/tríceps, ombros/trapézio e abdômen.
Inspirado em princípios de Jordan Peters, **não** uma prescrição oficial dele. Mantém alto esforço com gerenciamento de fadiga.

## Agenda
| Dia | Ficha | Exercícios | Séries efetivas | Cardio |
|---|---|---:|---:|---|
| Segunda | PULL A | 7 | 14 | 20 min após o treino |
| Terça | PUSH A | 6 | 13 | — |
| Quarta | LEGS A | 6 | 12 | — |
| Quinta | PULL B | 7 | 14 | 20 min após o treino |
| Sexta | PUSH B | 5 | 11 | — |
| Sábado | LEGS B | 5 | 10 | — |
| Domingo | descanso | 0 | 0 | caminhada opcional |
| **Total** | **6 fichas** | **36 posições** | **74** | **40 min planejados** |

Todas as séries cadastradas são séries efetivas. Aquecimento não é contado.
O RIR por movimento está em `src/data/program6.ts`. Compostos geralmente usam 1–2 RIR; isoladores 0–1 RIR, e falha absoluta não é obrigatória.
Descansos iniciais editáveis: 150 s para grandes movimentos e 120 s para os demais. Não há cargas presumidas.
Progressão orientada pelo logbook com técnica e amplitude estáveis. Primeiras duas semanas com aproximação cautelosa da falha; só progredir quando recuperar bem.

## Compatibilidade e preservação
- O programa anterior **10/10 v2** segue disponível e não é apagado.
- O programa Fred 3.0 possui IDs novos (`treino-fred-v3-6d-...`), de modo que instalar o novo preset não substitui fichas v2 editadas.
- Os exercícios mantêm IDs baseados no nome para compartilhar guias, imagens e logbook dos mesmos movimentos.
- O IndexedDB cadastra fichas novas somente se ainda não existirem; o backup já existente permanece compatível.
- Sem agenda personalizada, a programação padrão apresenta 6 dias automaticamente.
- Se a agenda armazenada coincide exatamente com o padrão 10/10 v2, atualiza apenas a programação semanal. Cardio é atualizado somente se ainda coincidir com o padrão v2.
- Agendas explicitamente personalizadas não são sobrescritas automaticamente. O botão "Ativar agenda de seis dias" permite optar pela nova distribuição; fichas e sessões antigas continuam intactas.
- Histórico de musculação e cardio é imutável por causa da criação deste preset. Uma ficha programada não gera sessões fictícias.
- Idade, peso e dados de hormonização informados na conversa **não são publicados** nos arquivos do projeto.

## Verificações
- `npm test`, `npm run build` e `npm run test:pwa`.
- Após publicação, checar a navegação Hoje/Treinar/Organizar semana, todos os RIR e as séries 3x de elevação lateral.
- Validar no iPhone que o histórico e as fichas antigas continuam acessíveis e que o novo plano pode ser editado sem alterar sessões concluídas.
