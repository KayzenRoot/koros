# Evidence Bundle KOR-PLAN-001 — Correction Delta documental
**Data:** 2026-10-28. **WO:** KOR-PLAN-001; **PR:** #1 (Draft).  
**Base main:** `57dd78a6eb2b39c1d07fdf2728de2cde20fda3b8`; **base tree:** `7b224899e8118500c0356902528070c53190f2ab`.  
**HEAD auditado antes deste Correction Delta:** `0ac7c203f38550f0534d68d819e416067148091d`; **HEAD final:** conferir no GitHub/PR após atualização (não autodeclarar um SHA que depende do próprio commit).

## Source Check e Context Lock
- `README.md` inicial: conteúdo `# koros`, Git blob `dd9bf67a6be6dd98a134bd57576e7e16fdc74424`.
- `main`: `protected=false`; `GET /rulesets`: `[]`; `GET /branches/main/protection`: `403 Resource not accessible by integration`. Não foi possível inspecionar flags detalhadas de proteção; informações não disponíveis = **NÃO VERIFICADO**.
- PR #1: Draft, aberta, não mesclada, nenhum review formal e nenhuma thread encontrados na consulta inicial. Refazer read-back após correção.
- Upstream `CopilotKit/OpenBot` **pin** `4bb0c0b42ee95ef052225357ba5291ddaa94e5c2`; blobs verificados: LICENSE `3b2206e4a39953e65bfde70f550573d343f5b510` (MIT © 2026 CopilotKit); README `09a6a682192ef53932bb4f5502aca146480ae60d`; architecture `5c8c8546c78108c397e006dc400303ffb801e5ef`; deployment `0f5b6d7337811891e6d351962a7d89cddd85f0dd`; routines `d903eb8f533e50f388890af8aaca78c97094db3d`; configuration `fa36f916f86c73f0ff6d7ee345951e0abadbc2b0`. São fingerprints Git de blobs, não hashes SHA-256. Intelligence/white-label/licenças de serviços **NÃO VERIFICADO**.

## Auditoria objetiva do HEAD anterior
- Compare Git `main...HEAD`: **ahead 1 / behind 0**, 23 arquivos, 388 adições e 1 exclusão; **todos `.md`**. Árvore Git `f41162509b645e046388fca871d408d5835fb6a9`, não truncada, mostrou 23 blobs Markdown.
- Parser de diferenças Markdown: **30 links internos** resolvidos para arquivos presentes, **0 quebrados**; **0 detecções** pelos padrões heurísticos de segredos `sk-...`, `ghp_...` e PEM private key. Isso não constitui secret scan completo ou auditoria jurídica.
- Fonte de verdade e cobertura: README/hierarquia, Overview, Requirements, Scope, Architecture, Security, Data Model, API/Integration, UI/UX, Test/Benchmark, Deployment, Commercial, Backlog, DoD, Ledger, Checkpoint, Legal, Migration/Recovery, Risk, Pilot, WO e Evidence presentes.
- GitHub check-runs no HEAD anterior: `Socket Security: Pull Request Alerts` = **success**, mensagem **Skipped: no dependency changes**; `Socket Security: Project Report` = **success** (relatório informativo). `GET /commits/{sha}/status`: `pending` com zero status contexts. Nenhum check required confirmado e nenhuma verificação do produto executada.
- Testes de aplicação, lint, typecheck, build, E2E, container scans, benchmark, restore, deploy, VPS e isolamento: **NOT_RUN/NÃO VERIFICADO**. Não houve instalação, alteração da main, ruleset nem gasto.

## Correction Delta nesta mesma Work Order
1. `docs/14-checkpoint.md`: substituir predição de read-back por referências efetivamente auditadas; documentar `403`; adicionar proposta **não aplicada** de proteção GitHub.
2. `docs/17-risk-register.md`: qualificar RK-12 com evidência e mitigação.
3. `docs/12-definition-of-done.md`: eliminar frase inglesa e distinguir evidência documental de provas técnicas.
4. Este Bundle: registrar SHA, achados, links, checks e limitações.
**Sem código, sem deployment e sem mudança de decisões aprovadas.**

## Riscos residuais e decisão
RK-01..13 permanecem como riscos da futura implementação. G1 GitHub sem ruleset, G2 marca, G3 Intelligence, G4 LGPD, G5 VPS e G6 contrato são bloqueios da fase técnica/comercial, não prova de defeito de runtime neste Source Pack.
**Status desta auditoria:** evidência documental preliminar consistente; inspeção pós-correção, revisão objetiva final e aceite de KOR-PLAN-001 ainda requeridos. Não promover o checkpoint por conta própria.

## Checkpoint Delta PROPOSTO (não promovido)
Registrar base/head e diff da PR após Correction Delta, concluir auditoria do Source Pack, manter Draft e `main` intocada até autorização de eventual squash NORMAL. Propor próxima etapa de governança apenas após G0 APPROVED; nunca iniciar implementação enquanto G1 estiver pendente.

## Validação pós-Correction Delta (HEAD intermediário)
- HEAD `03313701eb28543f637fc018803e90f84d66e4a5`: compare `ahead=2, behind=0`, **23 arquivos apenas Markdown**, árvore Git `42e6cfb5ae1dc709cb4e3e62e1d5caed454400b5`, 419 adições, 1 exclusão.
- Análise do diff: 30 links internos, 0 quebrados; 0 padrões heurísticos de segredo; 17 requisitos, 24 backlog IDs, 11 ADRs, 13 riscos, nenhum ID duplicado; cobranças mensal/trimestral/semestral/anual explícitas.
- Check-runs neste HEAD: 2 Socket **success**, sendo PR Alerts sem alteração de dependências; o status combinado `pending` com zero status contexts NÃO prova CI de aplicativo nem required checks.
- Estado técnico do Source Pack: **sem defeitos documentais bloqueantes identificados**. Não se confunde com aprovação formal por revisor independente, liberação de `main`, marca comercial ou aprovação de implementação. HEAD final precisa de novo read-back após este registro.
