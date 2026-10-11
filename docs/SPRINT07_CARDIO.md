# Sprint 07 — Corrida e cardio com registros reais

A tela de cardio não utiliza mais os valores fictícios da primeira interface. Entre por **Hoje > Cardio registrado**, **Treinar > dia > Ver módulo de corrida** ou **Evolução > Registrar corrida ou caminhada**.

## Funcionalidades entregues

- **Registro manual:** esteira, corrida ao ar livre, caminhada e outros cardios com nome próprio. Data, duração e observações, além de distância, inclinação para esteira e batimentos médios opcionais.
- **Ritmo estimado dos dados:** somente calculado se o usuário informar *ambos* tempo e distância. Fórmula: segundos / (metros / 1000), convertido para `min:ss /km`. Sem distância, mostra **—** e não cria uma estimativa fictícia.
- **Cronômetro auxiliar:** Iniciar/pausar/continuar/reiniciar e **Usar tempo**. O tempo é calculado a partir de `Date.now()` e sobrevive a atualização do site via `localStorage`; ao retornar de tela suspensa o relógio real é recalculado. O cronômetro não mede distância e não cria um registro sozinho.
- **Histórico real:** mostra o tipo, data, duração, distância quando informada, ritmo, inclinação, frequência cardíaca e observações. É possível editar ou excluir entradas manuais mediante confirmação; importações externas já existentes permanecem somente leitura.
- **Resumo e gráfico semanal:** a tela Hoje e Evolução mostram o total real de sessões, duração e distância informada; a página Cardio apresenta barras de minutos reais de segunda a domingo e histórico detalhado.
- **Integração com Programa 10/10:** o treino de segunda, a corrida leve opcional de quinta e outras atividades da agenda são exibidos como **sugestão**, separadas de registros concluídos. Não são convertidas em atividade realizada sem o usuário salvar.
- **Persistência e backups:** os registros são gravados atomicamente na store `cardioSessions` do IndexedDB, incluídos na exportação/restauração JSON do Perfil, sem modificar `workoutSessions`.

## Teste no iPhone

1. Abra `https://pscfredteixeira.github.io/gym/?tab=cardio`.
2. Escolha **Esteira**. Informe 20 minutos e 3,2 km, salve: ritmo = 6:15 /km.
3. Feche/reabra o Safari. O histórico deve conservar o cardio. Em Hoje/Evolução, o total deve incluir 20 min e 3,2 km.
4. Edite o registro para 25 minutos. Ele deve ser atualizado sem duplicar.
5. Teste **Caminhada** com 20 minutos **sem distância**: ritmo mostra um traço, e a distância não deve aumentar.
6. Teste o cronômetro: Iniciar, alternar app/bloquear iPhone, voltar, Pausar, Usar tempo, salvar.
7. Faça um backup em Perfil. A exportação deve incluir as entradas reais de cardio; restaurar é opcional e sobrescreve os dados atuais.
8. Exclua um cardio de teste e confira que as sessões de musculação não são afetadas.

## O que ainda não há

Sem GPS/rastreamento ao vivo, Apple Health/Apple Watch, medição automática de tempo e distância, frequência cardíaca de sensor, notificações garantidas com tela bloqueada ou exportação de cards com dados reais. O estúdio antigo de cards e os gráficos de exemplo de musculação permanecem explicitamente rotulados como **fictícios**; não são os registros deste módulo.

O cronômetro é apenas auxiliar: fechar ou bloquear a tela não transforma a PWA em um app de gravação em segundo plano.
