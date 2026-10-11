# GYM

Aplicativo web de musculação e corrida, pensado primeiro para iPhone: rápido durante o treino, detalhado no histórico e com exportação visual para redes sociais.

## Situação do projeto

**Sprint 02 — armazenamento e preferências.** A interface de Perfil agora salva nome, objetivo, unidades, intervalo padrão e acessibilidade usando IndexedDB. Também exporta um backup JSON versionado e permite restauração validada e atômica. **Os treinos, séries, corridas e gráficos demonstrativos continuam fictícios e não são persistidos**: o editor de fichas começa na Sprint 03 e o registro real na Sprint 04.

## Tecnologia

- React + TypeScript + Vite
- CSS organizado com abordagem mobile-first (Tailwind CSS integrado à base)
- Armazenamento local planejado: IndexedDB, com migrações e backup
- Hospedagem estática: GitHub Pages
- Aplicativo instalável e modo offline: Sprint 11
- Apple Saúde: importação de arquivo somente na Sprint 10; sincronização automática depende de componente nativo futuro

## Executar

É necessário Node.js moderno (22 ou superior).

```bash
npm install
npm run dev
```

Para validar a base:

```bash
npm run typecheck
npm test
npm run build
```

## Estrutura

```text
src/
  domain/          Modelos de domínio
  App.tsx          Dez telas de demonstração
  main.tsx         Bootstrap
  styles.css       Estilos responsivos
docs/
  PRODUCT.md       Objetivos, fluxos e critérios
  ARCHITECTURE.md  Arquitetura técnica
  DATA_MODEL.md    Estrutura e regras dos dados
  SPRINTS.md       Roadmap completo
  DECISIONS.md     Decisões e limitações técnicas
.github/workflows/ CI e publicação
```

## Publicação

**Correção de tela branca:** o código-fonte HTML agora mora em `app/index.html`. O arquivo `index.html` na raiz e a pasta `assets/` são artefatos compilados, gerados pelo GitHub Actions. Isso garante que o site abra tanto no modo Pages por branch quanto no modo Pages por Actions. **Não edite manualmente o `index.html` da raiz**; edite `app/index.html`. O workflow precisa de permissão `contents: write` para sincronizar arquivos compilados.

O Vite está configurado com a base `/gym/`. O modo **Settings > Pages > Build and deployment > Source: GitHub Actions** continua sendo o recomendado, mas a publicação por branch também tem suporte via artefatos compilados na raiz. O workflow realiza build e deploy a cada atualização de `main`. Enquanto o Pages não estiver ativado e o workflow não for concluído, não há URL pública confirmada.

## Regras do projeto

1. Treinos concluídos são registros históricos: alterar uma ficha não reescreve sessões anteriores.
2. Nunca simular dados de saúde como se fossem dados reais.
3. Operações de importação precisam ser reversíveis e evitar duplicações.
4. Sem upload de informações pessoais para serviços externos por padrão.
5. Backup e restauração são requisitos, não funcionalidades opcionais.
6. Cada sprint é validada no iPhone antes da próxima entrega.

Ver [escopo](docs/PRODUCT.md), [arquitetura](docs/ARCHITECTURE.md), [modelo](docs/DATA_MODEL.md) e [sprints](docs/SPRINTS.md).

## Sprint 02 — Teste de persistência

1. No iPhone, abrir **Perfil** e escolher um nome de exibição, um objetivo e Textos maiores.
2. Aguardar **Dados locais disponíveis**; fechar a aba e abrir novamente para confirmar as preferências.
3. Em **Backup e restauração**, escolher **Exportar backup JSON** e guardar o arquivo no app Arquivos.
4. Alterar temporariamente o nome, escolher **Restaurar backup** e selecionar o arquivo exportado; confirmar a substituição. O nome deve voltar ao anterior.
5. Usar **Atualizar contagens** para conferir os registros reais. Os exemplos da prévia não entram nas contagens.

O armazenamento pertence a cada navegador/instalação. Abrir uma aba privada ou outro dispositivo não reproduz automaticamente os mesmos dados. Nunca confiar exclusivamente no cache do navegador; guardar backups periodicamente.

## Programa 10/10

O planejamento semanal de segunda a domingo agora está pré-cadastrado: PUSH, PULL, LEGS, descanso, UPPER, LOWER + BÍCEPS, descanso, com 66 séries efetivas e cardio especificado. Visualizar em **Hoje** e **Treinar**; os dias sem musculação apresentam recuperação. As prescrições e faixas de RIR ficam salvas em IndexedDB sem sobrescrever dados existentes. Consulte [docs/PROGRAMA-10-10.md](docs/PROGRAMA-10-10.md).

Atenção: a ficha está disponível para consulta e backup, não para registrar séries reais ainda. As páginas de execução anteriores permanecem simulações. Idade, altura e peso corporal não estão armazenados neste repositório público.

## Sprint 03 — Editor de fichas e agenda

O GYM agora tem um editor funcional de fichas, acessível por **Treinar > selecionar um dia > Personalizar esta ficha**. Alterações de nome, ordem dos exercícios, séries de aquecimento/efetivas, faixas de repetições, RIR mínimo/máximo, descanso e observações são persistidas em IndexedDB após clicar em **Salvar alterações**.

É possível adicionar movimentos da biblioteca (33 posições originais, com exercícios repetidos reutilizados), cadastrar movimentos próprios, substituir exercícios, duplicar fichas e criar novos treinos. Fichas personalizadas fora da semana aparecem em **Treinar > Fichas fora da agenda**.

A opção **Treinar > Organizar semana** permite trocar fichas entre os sete dias e ajustar cardio opcional, tipo de atividade e duração. Quando se seleciona uma ficha já alocada em outro dia, as posições são trocadas para evitar duplicações inadvertidas. Cardios são planejamento, não sessões concluídas.

Regras de segurança: edição nunca escreve na store `workoutSessions`; dados antigos permanecem íntegros; exclusão só é oferecida para fichas criadas pelo usuário, e estas devem primeiro sair da agenda. Presets originais permanecem disponíveis para reatribuição. Alterações entram no backup JSON versionado, com leitura compatível com backups da Sprint 02.

### Teste manual no iPhone

1. Entrar em **Treinar**, escolher PULL (terça) e clicar em **Personalizar esta ficha**.
2. Alterar o descanso da puxada neutra para 90 segundos e salvar. Fechar e reabrir o GYM para verificar.
3. Em **Treinar > Organizar semana**, trocar PULL e PUSH e salvar; conferir **Hoje** e a agenda.
4. Criar uma ficha nova, adicionar e reordenar dois exercícios, salvar. A ficha aparece fora da semana até ser atribuída.
5. Em **Perfil**, exportar backup. Alterar um exercício e restaurar o backup: a alteração deve ser revertida.
6. Conferir que o histórico não ganhou sessões falsas após editar fichas.

**Não é Sprint 04:** a tela de execução fictícia permanece identificada como simulação; registro de séries reais, carga efetivamente usada e cronômetro associado a uma sessão ainda não foram implementados.


## Sprint 04 — Musculação com registros reais

O GYM já permite iniciar, registrar, retomar, concluir e consultar sessões **reais** de musculação, armazenadas apenas no IndexedDB deste navegador. A prévia ilustrativa de exercícios continua separada e não cria resultados reais.

### Como testar no Safari

1. Abra **Treinar > PULL (ou outro dia) > Iniciar treino real**.
2. No primeiro exercício, informe uma carga e repetições; o RIR é opcional. Toque **Salvar série**. O contador de progresso só aumenta após gravação confirmada.
3. Feche a aba do Safari, abra novamente o GYM e toque no aviso **Treino em andamento**. A série já registrada deve aparecer.
4. Edite os valores dessa série e toque **Atualizar registro**; ela deve ser atualizada, não duplicada. Também é possível **desfazer o registro** mediante confirmação.
5. Navegue para outro exercício, registre mais uma série e finalize. O sistema permite encerrar uma sessão incompleta após confirmação; séries sem registro continuam vazias.
6. Abra **Histórico de musculação**, expanda a sessão e confira nome, data, duração, exercícios e resultados.
7. Na área **Perfil**, exporte um backup JSON e verifique que contém os registros. Faça backup antes de experimentar a restauração, que substitui todos os dados locais.

### Integridade

- Ao iniciar uma sessão, são copiados: nome da ficha, nome de cada exercício, ordem, séries planejadas, RIR, carga de referência e descanso planejado.
- Editar a ficha original **não modifica** a sessão iniciada ou concluída.
- Somente uma sessão pode estar aberta por instalação de navegador. Outra aba não pode iniciar uma segunda sessão simultaneamente.
- Cada série tem uma ligação única com a série planejada; salvar novamente atualiza o mesmo registro.
- Séries sem registro não são marcadas como concluídas.
- **Finalizar** exige pelo menos uma série salva. **Encerrar como interrompido** guarda a sessão no histórico.
- Cargas são guardadas canonicamente em kg, mesmo quando exibidas em libras; repetições e RIR são digitados pelo usuário, nunca inferidos.
- Registros e ajustes entram no backup JSON, ainda no esquema v1 e sem modificar arquivos antigos válidos.
- O cronômetro avançado de descanso/alertas e o modo academia otimizado ficam para a Sprint 05. Não há promessa de notificações em segundo plano no iPhone.
- Esta é uma PWA web, **não** uma sincronização automática com HealthKit ou Apple Watch.

### Testes

`npm test` executa testes isolados de snapshot, proteção contra múltiplas sessões, persistência no IndexedDB, gravação/edição/desfazer série, histórico, fim de treino e restauração com arquivos malformados. `npm run build` e o workflow de publicação verificam TypeScript e carregamento público do site.

## Sprint 06 — Biblioteca de exercícios e substituições
A aba **Exercícios** agora usa a biblioteca real do Programa 10/10 e movimentos personalizados, com busca, filtros, guias em português, mapas musculares esquemáticos e opções de troca de exercícios nas fichas. Consulte [a documentação da Sprint 06](docs/EXERCISE_LIBRARY.md). Fotografias demonstrativas específicas seguem pendentes de direitos de uso comprovados.


## Imagens demonstrativas adicionadas pelo usuário (Sprint 06.1)

A ficha do exercício agora oferece **Adicionar foto da galeria** e **Usar link de uma imagem**. Na biblioteca, toque num movimento (por exemplo, Puxada neutra); a foto aparece acima do mapa muscular e dos passos de execução. Pode ser trocada ou removida a qualquer momento.

- **Fotos do iPhone:** o navegador reduz a imagem para até 900 pixels no maior lado, converte para JPEG e limita cada imagem a cerca de 195 mil caracteres no banco. O arquivo original fica apenas no dispositivo; os dados compactados são mantidos no IndexedDB e exportados no backup JSON. Nada é enviado para o GitHub nem ao servidor do GYM.
- **Links HTTPS:** opcionalmente, o usuário pode cadastrar um link externo de imagem. O endereço fica salvo na ficha, mas a fotografia depende de conexão e da disponibilidade do servidor original. Ao abrir uma imagem externa, o navegador acessará o site remoto. É responsabilidade do usuário usar material autorizado.
- **Onde aparece:** cartão da biblioteca, detalhe do exercício, prescrição de cada dia de musculação, editor de ficha e modo academia. A sessão em andamento também dispõe de **Ver foto demonstrativa** para ampliar uma foto já cadastrada.
- **Preservação:** a imagem pertence ao cadastro global do movimento, não a uma cópia da ficha. O ato de adicionar/remover imagem não troca o exercício ou altera séries e registros históricos.
- **Limites:** backup JSON permanece sujeito ao limite global de 10 MB. Se o usuário cadastrar muitas fotos grandes, o tamanho pode chegar ao limite; a compactação permite dezenas de imagens pequenas. O armazenamento está associado ao navegador, não sincronizado entre aparelhos.
- **Não há foto automática:** os 31 exercícios do Programa 10/10 continuam sem fotografia pré-cadastrada até que o usuário escolha uma imagem ou que seja integrada uma biblioteca com direitos de uso verificados.

### Teste manual

1. Abra **Exercícios > Puxada neutra** e toque **Adicionar foto da galeria**.
2. Selecione uma fotografia do aparelho e aguarde **Foto reduzida e salva**.
3. Volte à lista de exercícios. Confira a miniatura; depois abra **Treinar > PULL** e veja a mesma imagem ao lado do nome.
4. Abra uma sessão real e expanda **Ver foto demonstrativa**.
5. Feche e reabra o Safari. A foto deve continuar associada à Puxada neutra.
6. Em **Perfil**, exporte backup JSON com a foto. Restaure o backup somente depois de verificar que tem uma cópia segura.
7. Remova a imagem na ficha do exercício e confirme que as cargas, séries e nomes continuam intactos.
