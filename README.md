# GYM

Aplicativo web de musculação e corrida, pensado primeiro para iPhone: rápido durante o treino, detalhado no histórico e com exportação visual para redes sociais.

## Situação do projeto

**Sprint 01 — prévia visual navegável publicada.** O projeto contém dez telas para testar a experiência de musculação, corrida, evolução, biblioteca, perfil e cards sociais. **Os dados exibidos são fictícios e os registros não são persistidos.** A persistência e as fichas reais começam nas sprints seguintes.

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

O Vite está configurado com a base `/gym/`. Para publicar, selecionar **Settings > Pages > Build and deployment > Source: GitHub Actions**. O workflow realiza build e deploy a cada atualização de `main`. Enquanto o Pages não estiver ativado e o workflow não for concluído, não há URL pública confirmada.

## Regras do projeto

1. Treinos concluídos são registros históricos: alterar uma ficha não reescreve sessões anteriores.
2. Nunca simular dados de saúde como se fossem dados reais.
3. Operações de importação precisam ser reversíveis e evitar duplicações.
4. Sem upload de informações pessoais para serviços externos por padrão.
5. Backup e restauração são requisitos, não funcionalidades opcionais.
6. Cada sprint é validada no iPhone antes da próxima entrega.

Ver [escopo](docs/PRODUCT.md), [arquitetura](docs/ARCHITECTURE.md), [modelo](docs/DATA_MODEL.md) e [sprints](docs/SPRINTS.md).
