# Registro de decisões (ADR)

## ADR-001 — PWA antes de app nativo (aceita)
O objetivo é testar e usar no iPhone sem conta de desenvolvedor Apple ou custo de App Store. A interface será web, hospedada no GitHub Pages. Limitações nativas são documentadas, não escondidas.

## ADR-002 — React, TypeScript e estrutura modular (aceita)
Evitar HTML monolítico. Separar domínio, dados, funcionalidades e interface. Build com Vite e base `/gym/`.

## ADR-003 — Local-first com IndexedDB (aceita com ressalva)
Sem servidor na v1. Dados offline e pertencentes ao usuário. Risco de remoção do armazenamento local é mitigado com exportação/restauração e indicação clara de backup; não existe garantia absoluta de persistência.

## ADR-004 — Históricos imutáveis (aceita)
Alterar fichas não modifica sessões já realizadas. Exibições estatísticas serão recalculadas de eventos realmente registrados.

## ADR-005 — Apple Saúde por arquivo na v1 (aceita)
Um website não recebe acesso HealthKit diretamente. Importação manual de exportação Apple Saúde entra na Sprint 10; sincronização automática requer aplicativo/componente nativo e fica para fase futura.

## ADR-006 — Compartilhamento respeita privacidade (aceita)
Dados sensíveis e localização ocultos por padrão. Geração de PNG/JPG local e menu de compartilhamento apenas quando suportado.

## ADR-007 — Identidade visual (aceita)
Interface escura, grafite, laranja, fotos grandes com licença e tipografia legível. Mobile-first com acessibilidade. Evitar estatísticas inventadas na experiência funcional.

## ADR-008 — Publicação incremental (aceita)
O workflow prepara build e Pages, mas disponibilidade pública depende da configuração do repositório e sucesso da publicação. A versão estável 1.0 fica para Sprint 13; prévias poderão ser publicadas antes.
