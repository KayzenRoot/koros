# KOR-ROADMAP-001 | Fila de Work Orders de execução
**2026-10-30 | #45/#61 já mescladas; código de produto e testes de produto NOT_RUN.**

## Reconciliação pós-merge (2026-10-30)

- `main` verificada em `21ed96b05aa5a567089b384f11d4a202ca290328`.
- **#45 / PR #69 MERGED** (baseline Node.js) e **#61 / PR #71 MERGED** (CI/CodeQL). Ambas as issues estão `CLOSED`.
- **Próximo caminho:** #47 (dados/migrations) → #46 (auth/RBAC) → #48/#49 (M03) → #51/#53/#50/#52 (M04).
- Contrato técnico de M02 em [README](../product-m02/README.md): `PROPOSED_FOR_FOUNDER_APPROVAL`; sem código/banco/dependência.
- A tabela abaixo preserva a ordem histórica; as linhas 1 e 2 já foram executadas e não devem ser reabertas.

| Ordem proposta | Work Order | Entrega |
|---|---|---|
| 1 | [KOR-PM02-WO-001 #45](https://github.com/KayzenRoot/koros/issues/45) | runtime, arquitetura, licença, baseline — **MERGED via PR #69** |
| 2 | [KOR-PM07-WO-001 #61](https://github.com/KayzenRoot/koros/issues/61) | CI real lint/typecheck/build/test — **MERGED via PR #71** |
| 3 | [KOR-PM02-WO-003 #47](https://github.com/KayzenRoot/koros/issues/47) | modelo de dados e migrations |
| 4 | [KOR-PM02-WO-002 #46](https://github.com/KayzenRoot/koros/issues/46) | auth/RBAC cross-tenant |
| 5 | [KOR-PM03-WO-001 #48](https://github.com/KayzenRoot/koros/issues/48) | ingestão autenticada/replay |
| 6 | [KOR-PM03-WO-002 #49](https://github.com/KayzenRoot/koros/issues/49) | adapter CRM mock Agendor/HubSpot portabilidade |
| 7 | [KOR-PM04-WO-001 #51](https://github.com/KayzenRoot/koros/issues/51) | FSM auditável |
| 8 | [KOR-PM04-WO-003 #53](https://github.com/KayzenRoot/koros/issues/53) | approval server-side e payload hash |
| 9 | [KOR-PM03-WO-003 #50](https://github.com/KayzenRoot/koros/issues/50) | outbox/retry/reconcile |
| 10 | [KOR-PM04-WO-002 #52](https://github.com/KayzenRoot/koros/issues/52) | IA estruturada e injection negativo |
| 11 | [KOR-PM04-WO-004 #54](https://github.com/KayzenRoot/koros/issues/54) | auditoria/custos/kill switch |
| 12 | [KOR-PM05-WO-001 #55](https://github.com/KayzenRoot/koros/issues/55) | dashboard seguro |
| 13 | [KOR-PM05-WO-002 #56](https://github.com/KayzenRoot/koros/issues/56) | fila aprovação |
| 14 | [KOR-PM05-WO-003 #57](https://github.com/KayzenRoot/koros/issues/57) | template versionado |
| 15 | [KOR-PM06-WO-002 #59](https://github.com/KayzenRoot/koros/issues/59) | ambiente local reproduzível |
| 16 | [KOR-PM06-WO-001 #58](https://github.com/KayzenRoot/koros/issues/58) | wizard/dry-run |
| 17 | [KOR-PM06-WO-003 #60](https://github.com/KayzenRoot/koros/issues/60) | backup/restore |
| 18 | [KOR-PM07-WO-002 #62](https://github.com/KayzenRoot/koros/issues/62) | security regressions |
| 19 | [KOR-PM07-WO-003 #63](https://github.com/KayzenRoot/koros/issues/63) | benchmark |
| 20 | [KOR-PM08-WO-001 #64](https://github.com/KayzenRoot/koros/issues/64) | unit economics sem preço/contas |
| 21 | [KOR-PM09-WO-001 #66](https://github.com/KayzenRoot/koros/issues/66) | E2E sintético e T-01..12 |
| 22 | [KOR-PM09-WO-002 #67](https://github.com/KayzenRoot/koros/issues/67) | gates release, comercial diferido |
| 23 | [KOR-PM08-WO-002 #65](https://github.com/KayzenRoot/koros/issues/65) | portal/billing IMPORTANT posterior |

## Caminho crítico
- #45 e #61 **concluídos** (PRs #69/#71). O próximo caminho é #47 (schema/migrations) → #46 (auth/RBAC) → #48/#49 (M03); o contrato M02 está em [README](../product-m02/README.md) e depende de aceite do fundador.
- #47 e #46 estabelecem tenant/auth. #48 e #49 fornecem entrada e CRM mock. #51, #53, #50 e #52 montam workflow com aprovação e idempotência. #54 audita custos.
- #55..#57 habilitam operação no dashboard; #58..#60 permitem onboarding e restore; #62 e #63 têm gates de segurança/benchmark.
- #66 consolida E2E com dados sintéticos; #67 audita release. #64 projeta custo sem cobrança; #65 é IMPORTANT e não bloqueia MVP.
- Quando dependência não estiver pronta, não executar WO subsequente. Se houver CI/segurança falha, Correction Delta no mesmo ID/PR.

## Rastreabilidade canônica
| Requisitos | Issues |
|---|---|
| R-01,R-11 | #45,#46,#47,#62 |
| R-02,R-14 | #47,#51,#57 |
| R-03 | #48 |
| R-04 | #52 |
| R-05 | #53,#56,#66 |
| R-06 | #49,#50,#66 |
| R-07 | #55,#56,#58 |
| R-08 | #47,#54,#66 |
| R-09 | #54,#63,#64 |
| R-10 | #59,#60,#67 |
| R-12 | #45,#49,#62,#67 |
| R-13 | #47,#60,#62,#67 |
| R-15,R-16 | #65 IMPORTANT |
| R-17 | FUTURE, nenhuma implementação |

## Gates não negociáveis
Aprovação humana antes de escrita externa; tenant autenticado no servidor; fontes autorizadas, sem scraping ou credenciais reais; segurança de dependências, LGPD by design e rollback. No desenvolvimento usar mocks, fixtures e infraestrutura local gratuita. Registro de empresa, INPI, DPA, contas fiscais, preço final, entrevistas e contratos de clientes não bloqueiam sintético, mas bloqueiam venda/produção até comprovação.

As WOs foram criadas para permitir execução, **não** representam autorização de merge/Ready/produção. Um incremento por vez, Evidence Bundle e auditoria. Sem falsos SUCCESS de aplicativo.
