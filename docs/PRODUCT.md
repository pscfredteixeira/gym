# Produto — GYM

## Visão

Treinamento de musculação e cardio em uma interface visual, limpa e rápida, com histórico verificável e cards compartilháveis. O aplicativo começa pessoal, sem conta nem assinatura, e pode ser expandido no futuro.

## Público e contexto

Uso principal: iPhone dentro da academia; ações rápidas, uma mão, botões grandes, leitura sob luz variável e boa retomada após interrupções. O desktop serve para planejar e analisar. Conteúdo em português brasileiro.

## Navegação principal

- **Hoje:** visão semanal, atividade planejada, continuidade de sessão e últimas atividades.
- **Treinar:** fichas, sessão atual, corrida e cardio.
- **Exercícios:** biblioteca, orientações, equipamentos e alternativas.
- **Evolução:** históricos, recordes, gráficos, relatórios e compartilhamento.
- **Perfil:** metas, preferências, arquivos, privacidade e backup.

O editor de cards é um fluxo contextual a partir de uma atividade concluída ou relatório, não um sexto item fixo.

## Fluxos essenciais

### Musculação
1. Criar ficha com exercícios, séries planejadas (aquecimento/efetivas), faixa de repetições, carga opcional, RIR e descanso.
2. Iniciar sessão: gerar uma cópia imutável do planejamento daquele dia.
3. Registrar série com carga, repetições, RIR opcional e horário.
4. Descansar com contador visual recuperável após reabrir o app.
5. Substituir, pular ou adicionar exercício sem alterar sessões antigas.
6. Concluir sessão e visualizar resumo, histórico e progresso.

### Corrida/cardio
1. Escolher esteira, corrida externa ou cardio genérico.
2. Registrar duração e distância; ritmo = duração / distância quando distância > 0.
3. Adicionar velocidade/inclinação no caso de esteira e frequência cardíaca apenas quando medida.
4. Visualizar comparação longitudinal.

### Compartilhamento
1. Abrir resumo de sessão/relatório.
2. Escolher modelo: treino, corrida, recorde, evolução, semana.
3. Escolher formato: 9:16 (1080 × 1920), 4:5 (1080 × 1350) ou 1:1 (1080 × 1080).
4. Selecionar dados visíveis, imagem e estilo.
5. Gerar PNG/JPG; compartilhar via recursos disponíveis do dispositivo ou salvar.

## Sistema visual (direção aprovada)

- Fundo quase preto, superfícies grafite, laranja como cor de ação.
- Títulos fortes, números de destaque, fotografia de exercícios bem licenciada.
- Navegação simples, contraste adequado, alvos de toque grandes.
- Nada de texto pequeno obrigatório para registrar treino; nenhum fluxo crítico depende de hover.
- Sempre diferenciar claramente exemplo visual de registro pessoal real.

## Requisitos não funcionais

- Design mobile-first até 320 px, sem rolagem horizontal da página.
- Conteúdo essencial acessível offline a partir da Sprint 11.
- Persistência de sessão/estado e controle de falhas em gravação.
- Fuso local no calendário; timestamps em UTC para eventos.
- Entrada de carga e distância em unidades configuráveis, armazenamento canônico.
- Gráficos baseados em dados verdadeiros e fórmulas documentadas.
- Exportação/restauração verificáveis e versões de esquema.
- Fotos licenciadas ou próprias, com alternativa sem imagem.
- Dados sensíveis ocultos por padrão na exportação social.

## Fora da v1

Sistema de pagamentos, feed social, ranking, contagem por câmera, avaliação biométrica por IA, GPS em background e sincronização direta HealthKit em PWA.

## Entrega incremental

Sprint 00: estrutura e decisões.
Sprint 01: sistema visual.
Sprint 02: persistência.
Sprints 03 a 06: musculação.
Sprint 07: cardio.
Sprint 08: evolução.
Sprint 09: compartilhamento.
Sprint 10: importação Apple Saúde.
Sprints 11 a 13: PWA, testes e publicação estável.
Sprint 14: funcionalidades avançadas opcionais.

Ver critérios objetivos em [SPRINTS.md](SPRINTS.md).
