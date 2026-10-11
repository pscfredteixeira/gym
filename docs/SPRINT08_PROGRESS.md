# Sprint 08 — Evolução baseada nos registros reais

A aba **Evolução** não usa mais o gráfico ilustrativo de puxada alta, 12 sessões fictícias ou um peso de 42 kg como se fossem resultados seus. Todos os dados exibidos são agregados a partir dos registros IndexedDB da musculação e do cardio.

## Como funciona

- **Período:** 30 dias, 90 dias, 6 meses (180 dias) ou todo o histórico. Datas são filtradas como dias locais, para que uma sessão perto da meia-noite não seja deslocada por UTC.
- **Musculação:** mostra dias ativos, treinos efetivamente **concluídos**, número de séries efetivas e repetições. Séries de aquecimento aparecem separadas, e sessões apenas iniciadas ou interrompidas não entram no cálculo de progresso.
- **Cargas por exercício:** escolha um movimento com séries efetivas registradas. Cada ponto do gráfico representa a **maior carga efetiva informada naquele dia**. Treinos no mesmo dia são consolidados, sem somar cargas como se fossem um recorde. O painel mostra maior carga e último máximo diário do período; respeita a preferência kg/lb sem alterar o registro original em kg.
- **Volume externo:** soma de `peso × repetições` das séries efetivas. Não inclui peso corporal não informado, aquecimento ou um indicador clínico de ganho muscular. Corrigir ou desfazer um registro altera o total exibido no próximo carregamento.
- **Cardio:** quantidade de atividades, tempo, distância total **somente de atividades com distância informada** e ritmo agregado com ponderação por distância (as atividades sem distância não compõem o ritmo).
- **Constância:** barras das **últimas seis semanas**, de segunda a domingo. Dias com musculação concluída e cardio realizado contam uma única vez, sem duplicar. Esta seção tem janela própria fixa de seis semanas, indicada na interface, mesmo quando o período escolhido é outro.
- **Estados vazios:** quando nada foi registrado, exibe zero ou um traço, com links para Treinar/Cardio. Não cria números fictícios para preencher espaços.
- **Alterações e restauração:** os agregados não são salvos em um segundo banco; são recalculados a partir de `workoutSessions` e `cardioSessions` quando o histórico é atualizado ou o backup é restaurado. Os dados originais permanecem no esquema v1.
- **Estúdio de cards:** por enquanto permanece como demonstração separada, explicitamente identificada como **dados fictícios**, sem apresentar uma prévia como resultado real.

## Teste no Safari do iPhone

1. Abra **Evolução**: se nunca registrou um treino, devem aparecer zeros e orientações, sem gráfico de cargas inventado.
2. Complete algumas séries de uma ficha como PULL ou PUSH, com as cargas reais informadas e finalize a sessão.
3. Volte a Evolução: selecione o movimento trabalhado e confira sua carga registrada no gráfico. Séries de aquecimento não devem contar como efetivas.
4. Em Cardio, registre 20 minutos e 3,2 km; confirme em Evolução tempo, distância e ritmo correspondentes. Faça outro cardio sem distância e confirme que a quilometragem não aumenta.
5. Experimente os filtros 30 dias/90 dias/6 meses/Tudo e confira o detalhamento das últimas seis semanas.
6. Edite um cardio e confira os totais novamente. No Perfil, faça um backup antes de testar restauração.
7. Se o estúdio de cards for aberto, ele deve continuar identificado como uma simulação, não um resumo com dados reais.

## Limitações

Sem GPS, Apple Health, sensores, composição corporal ou calorias estimadas. Em exercícios com carga zero (como movimentos de peso corporal), o gráfico representa **0 kg informado**, não o peso corporal. A interface não cria prognósticos ou conclusões sobre hipertrofia a partir do volume levantado.
