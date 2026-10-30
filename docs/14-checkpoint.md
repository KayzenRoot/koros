# 14 — Checkpoint
**Data:** 2026-10-28; **Fase:** FOUNDATION DOCUMENTAL; **Status atual:** PR #1 MERGED por squash NORMAL em `e969d2c00f7f779e58be3dd37848801580b60800`; Source Pack incorporado à main. Revisão independente formal continua uma lacuna de processo, pois GitHub exigia 0 aprovações.
**Repositório:** KayzenRoot/koros. **Base main:** `57dd78a6eb2b39c1d07fdf2728de2cde20fda3b8`. **Tree:** `7b224899e8118500c0356902528070c53190f2ab`. README inicial `# koros`. **WO:** KOR-PLAN-001, branch `docs/KOR-PLAN-001-source-pack`.

## Evidência observada
GitHub retornou somente README na main inicial; `main` com `protected=false` e `/rulesets` com `[]`. Leitura detalhada de `/branches/main/protection` retornou `403 Resource not accessible by integration`; portanto, o diagnóstico se limita às consultas acessíveis. PR #1 foi lida como Draft e não mesclada no HEAD inicial `0ac7c203f38550f0534d68d819e416067148091d`; após Correction Delta, exigir nova leitura do HEAD final. Source Pack está proposto em branch, NÃO incorporado à main até merge.

## Estados
- Documentação: validação técnica de estrutura, escopo, referências e evidências satisfatória no HEAD `03313701eb28543f637fc018803e90f84d66e4a5`; revisão humana/independente e eventual merge PENDENTES. Revalidar HEAD final da PR após este registro.
- Código, testes, build, CI, deploy: NOT_RUN ou NOT_STARTED.
- VPS: NOT_INSPECTED; dados reais: NONE; custos: NONE AUTHORIZED.
- Marca: KOROS para planejamento, clearance NÃO VERIFICADO.
- Upstream OpenBot: referência MIT; direitos de Intelligence PENDING.
- Issues: backlog documental, issues de implementação NOT_CREATED.

## Gates
G0 aprovar fundação documental; G1 configurar proteção GitHub/checks antes de código; G2 validar marca antes de comercializar; G3 licenciamento e arquitetura; G4 isolamento e LGPD; G5 VPS benchmark; G6 contrato do piloto. Falha G0: Correction Delta no mesmo PR e STOP. Após G0, merge normal só com revisão e controles reais, depois KOR-DISC-002.

## Proposta histórica de controles GitHub (levantamento anterior a KOR-GOV-002)
- **Ruleset da main:** exigir pull request e resolução de conversas; bloquear force-push, exclusão de branch e pushes diretos; sem bypass silencioso, preservando alterações só por PR.
- **Merge:** preferir somente squash NORMAL depois de veredito e autorização; tornar os demais métodos indisponíveis se compatível com os controles da conta. PR Draft não é elegível para merge.
- **Reviews:** definir requisito de aprovação compatível com conta individual e revisor independente disponível, sem criar bloqueio impossível; preferir aprovação externa real, nunca aprovação fictícia ou dismissal como substituto de revisão.
- **Checks:** primeiro instalar e validar produtores estáveis de testes documentais (links internos, estrutura, segredos) e depois, quando houver código, unit/lint/typecheck/build/SAST/SCA conforme risco. Só então marcar nomes exatos como required. Os checks Socket observados são informativos: PR Alerts reportou **sem mudanças de dependências**; não equiparar ao teste de segurança do produto.
- **Verificação posterior:** ler regras efetivas e bypass actors, criar PR de teste que deve ser recusada ao falhar, conferir que merge normal obedece ao gate. Sem permissões de leitura administrativa, marcar as propriedades detalhadas NÃO VERIFICADAS.

## Estado operacional após conciliação KOR-PLAN-001 (2026-10-28)
- Histórico acima é evidência do **baseline inicial**, não descrição das configurações atuais. Em `main=943f634797122473b56e7190f8c5cc1aa8fdd9f5`, o ruleset #26074776 está `active`, sem bypass, com PR obrigatório, resolução de threads, bloqueio de exclusão/force-push, histórico linear e squash-only.
- `governance-docs` é required check (`integration_id=15368`, App GitHub Actions), com produtor validado em `main` e PR de prova #3. O código/documentação da PR #1 foi reconciliado **somente na sua branch**, com merge commit de dois pais `8d54bb51bf9b6e9c4d9413fcfc4d2fb6396f06ab` (pais: HEAD anterior `ba166dc7fc69435c3905b8c3864749b6a5f8adec` e `main=943f634797122473b56e7190f8c5cc1aa8fdd9f5`); nenhuma alteração foi realizada na `main` por KOR-PLAN-001.
- G1 **proteção GitHub e check documental requerido: COMPROVADOS**; pendência de governança humana: `required_approving_review_count=0`, apenas revisão COMMENTED; revisão independente formal não substituída por CI.
- G0 **Source Pack:** auditoria documental prévia aceita pelo fundador; revalidação final após conciliação e checks do último HEAD ainda exigidos. Manter PR #1 Draft e sem merge até decisão humana separada; não iniciar implementação.
- Requisitos futuros de lint, testes, build e scanners para código continuam **NOT_RUN / NÃO CONFIGURADOS**. Nome KOROS, licença Intelligence, privacidade/LGPD, infraestrutura, custos e piloto permanecem condicionados a provas posteriores.
- Esta seção atualiza o estado dos gates sem apagar o histórico do baseline. Evidence Bundle e HEAD final precisam ser conferidos após o último commit da branch.

## Checkpoint pós-merge KOR-PLAN-001 (canônico proposto em PR de fechamento)
- **Main verificada após merge:** `e969d2c00f7f779e58be3dd37848801580b60800` (antes `943f634797122473b56e7190f8c5cc1aa8fdd9f5`); commit squash da PR #1, parent único igual à main anterior; 23 arquivos Markdown do Source Pack, nenhum código de aplicação.
- **PR #1:** mesclada normalmente, HEAD de origem preservado `35f883a9512499efe117ee00c455ce6240001229`; avaliação pré-merge `mergeable_state=clean`, regras GitHub respeitadas, sem bypass.
- **Checks do HEAD PR:** `governance-docs`, `Socket Security: Pull Request Alerts`, `Socket Security: Project Report`, todos `completed/success`; nova execução `governance-docs` acionada ao marcar Ready também `success` (GitHub Actions run `40770081002`).
- **CI na nova main:** `governance-docs` `success` no push run `40770164295`; `Socket Security: Project Report` `success`. Não afirmar que testes de runtime/segurança de aplicativo foram executados.
- **Governança:** ruleset #26074776 `active`, bypass `[]`, `governance-docs` required (App `15368`), PR obrigatório, sem force-push/exclusão, squash-only. `required_approving_review_count=0`; as revisões de `kayzenweb3` foram `COMMENTED`, não `APPROVED`.
- **Escopo:** documentação aprovada pelo fundador; nenhuma implementação, deploy, alteração da VPS, gastos ou início de KOR-DISC-002. Marca KOROS, licenças do Intelligence, LGPD, custos, arquitetura e piloto permanecem **PENDING**.
- **Nota histórica:** referências anteriores neste arquivo a `main` desprotegida, PR Draft e G1 pendente são fotografias do estado de 2026-10-28 **antes** das respectivas correções. O estado atual é o descrito nesta seção.
- **Promoção:** este delta pós-merge exige PR própria e auditoria protegida para entrar na `main`. Até esse futuro merge autorizado, o registro canônico da `main` inclui o histórico pré-merge e a evidência pública complementar fica na PR #1.

## Checkpoint Delta PROPOSTO | KOR-PM02-WO-001 (2026-10-30)
- **Context Lock:** main `30819b2622d5dc865931d5c55e9e9e9586648276` e fingerprints exatos no [Evidence Bundle](../evidence/KOR-PM02-WO-001/README.md). PR #36 Draft HEAD `d9f88b6a6087e395784b618d0b9e2967d228bcef` e PR #68 Draft HEAD `b66181e9f2adf206aae2654e7c7056053eacca99` consultadas, **não mergeadas**.
- **Implementação limitada:** branch `feat/KOR-PM02-WO-001-runtime-baseline`, PR #69 Draft. Código original Node.js ESM sem pacotes npm; API de leitura apenas no loopback, tenant envelope somente estrutural, operações externas DESABILITADAS, banco/auth/CRM/IA NOT_IMPLEMENTED.
- **Evidência local reproduzível:** Node `22.16.0`: `npm run check` com 8 módulos sintaticamente válidos e 10/10 testes Node; `npm run build` apenas sintaxe; `npm run smoke` PASS em `127.0.0.1`. Git blob SHA de todos os arquivos coincidiu com os publicados. Em CI do primeiro HEAD `d2622fa32e4e775f08968f0bb6aed6164d4fe674`: `m02-baseline`, `governance-docs` e dois Socket `success`; revalidar CI no HEAD após este delta.
- **Decisão técnica restrita:** ADR-016 PROPOSED na PR; ADR-006 e ADR-009 continuam PENDING; comercialização, INPI e contas reais DEFERRED e não exigidos para testes sintéticos. Nenhum merge ou deploy autorizado.
- **STATUS HONESTO:** `BASELINE_LOCAL_TESTED=YES`, `PRODUCT_M02_COMPLETE=NO`, `APP_RELEASE=NO`, `AUTH=NOT_IMPLEMENTED`, `CRM_API=NOT_RUN`, `MARKET_VALIDATED=NO`, `T-01..T-12/CRM-R01..R12=NOT_RUN`. Este checkpoint NÃO foi promovido à main.

## Checkpoint Delta PÓS-MERGE PROPOSTO | KOR-PM02-WO-001 — 2026-10-30
**Este delta é preparado na PR documental separada; NÃO está incorporado à `main` até novo merge autorizado.** O histórico acima `PROPOSTO` foi escrito antes do squash e permanece como fotografia temporal.
- **Merge autorizado e verificado:** PR [#69](https://github.com/KayzenRoot/koros/pull/69) `MERGED/CLOSED` por **squash normal**; HEAD autorizado `56e006435531e5d596a22f52e3b52db59a4d3ade`; `main` anterior `30819b2622d5dc865931d5c55e9e9e9586648276`; novo commit de `main` `e24d7cf458f61d1b98850f34a304023ee1d87ce1`, pai único igual à main anterior, sem bypass.
- **Integridade:** tree do HEAD aprovado e do commit squash idênticas: `319d7c0d91a3a1348d71f691aae52f76f16780d7`. 18 arquivos escopados a runtime Node básico, teste, CI e documentação; 2 commits da PR comprimidos em 1 na main.
- **CI:** HEAD aprovado: `m02-baseline` 10/10 testes + lint sintático + build sintático + smoke e `governance-docs` SUCCESS; dois Socket SUCCESS. Após push da `main`, `governance-docs` [run 41084211605](https://github.com/KayzenRoot/koros/actions/runs/41084211605) e Socket Project Report SUCCESS. `m02-baseline` **não rodou no push da main** porque o workflow atual usa gatilho `pull_request`/manual; equivalência de árvores torna a prova de PR aplicável apenas ao mesmo conteúdo, não comprova execução de CI no ambiente pós-merge.
- **Implementado:** baseline local sintético com `127.0.0.1`, três GET públicos, deny-all para futuras rotas, envelope tenant apenas estrutural, zero bibliotecas npm externas. **Não implementado:** auth/RBAC, banco, tenant isolado de verdade, CRM, IA, persistência, produção, deploy, T-01..T-12/CRM-R01..R12.
- **Decisão técnica:** ADR-016 aceita para **escopo do baseline já incorporado**, não substitui ADR-006/009 PENDING. Licenciamento de terceiros não presumido.
- **Governança:** PRs #36 e #68 continuam Draft/sem merge no read-back; #45 permanece OPEN para rastrear documentação de encerramento. Nenhuma nova WO, Ready adicional, merge da PR documental, deploy, conta, gasto ou dado real. O status final do módulo M02 é `NOT_COMPLETE`; `BASELINE_WO_001_MERGED` é específico e verificável.

## Checkpoint Delta PROPOSTO | KOR-PM07-WO-001 / Issue #61 — 2026-10-30
- **Context Lock:** `main=3216dd88cd9cce764857962383e37f4422f016d0`; issue #45 `CLOSED/COMPLETED`; PR #36 Draft `d9f88b6a6087e395784b618d0b9e2967d228bcef` e PR #68 Draft `b66181e9f2adf206aae2654e7c7056053eacca99` NÃO mergeadas. Fingerprints e escopo em [Evidence Bundle](../evidence/KOR-PM07-WO-001/README.md).
- **Próximo incremento NECESSARY #61:** estender CI nativo para `push: main`, negativas de integridade e CodeQL JS com action SHA pinado; `governance-docs` required existente e ruleset inalterados; sem novas dependências npm.
- **Status ainda PROPOSTO:** `CI_QUALITY_IMPLEMENTATION_IN_PR`, testes `PENDING` até read-back real no HEAD; `TS_TYPECHECK=NOT_APPLICABLE` (sem TS), `BUILD_PRODUCTION=NOT_IMPLEMENTED` (apenas sintaxe), `APP_RELEASE=NO`, `M02/M07_COMPLETE=NO`.
- **STOP:** se CodeQL ou checks falharem, `CORRECTION_REQUIRED/BLOCKED` no mesmo PR; não inserir custos/segredos, não alterar main/required ruleset, não iniciar outra WO, nem Ready/merge/deploy. Este Delta NÃO é checkpoint canônico até auditoria e merge autorizado.

### Read-back técnico da KOR-PM07-WO-001 no HEAD inicial da PR #71 (delta PROPOSTO, 2026-10-30)
- PR #71 Draft HEAD inicial `f038134201ce5af2f7460776245694fdbafdca99`: `m02-baseline` e `codeql-js` no run `41087652565` SUCCESS, 14/14 testes Node, 10 arquivos syntax-check, CI manifest/action/credential guard PASS, smoke PASS. `governance-docs` run `41087652423`, CodeQL check, SonarCloud e dois Socket SUCCESS. **Nenhum scanner SUCCESS é automaticamente evidência de zero findings**; inventário granular do CodeQL ainda NOT_VERIFIED.
- Typecheck JS/TS e build de produção continuam NOT_APPLICABLE / NOT_IMPLEMENTED; ênfase em não alegar produção. O HEAD deve ser rechecado após esta atualização documental. **Não foi autorizado merge, Ready, deploy ou próxima WO.**
