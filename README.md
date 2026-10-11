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
