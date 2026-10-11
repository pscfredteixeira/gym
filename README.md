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
