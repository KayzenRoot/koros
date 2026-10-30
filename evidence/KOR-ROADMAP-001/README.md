# KOR-ROADMAP-001 | Evidence Bundle de planejamento
**Data 2026-10-30 · Base Git main 30819b2622d5dc865931d5c55e9e9e9586648276 · M01 em PR #36 Draft HEAD d9f88b6a6087e395784b618d0b9e2967d228bcef.**

## Fatos confirmados
- GitHub criou 8 epics (#37..#44) e 23 Work Orders (#45..#67), IDs estáveis de M02 a M09; M01 já existe em #23..#35.
- Escopo técnico ordenado e mapeado a R-01..R-17; classes NECESSARY/IMPORTANT/FUTURE declaradas.
- Critérios comerciais da issue #24 aceitos apenas para planejamento futuro; validação real de mercado = NOT_RUN. Administração empresarial/INPI/contatos/cadastros foi expressamente adiada pelo fundador para fases comerciais.
- Arquitetura de runtime concreta e direitos OpenBot/Intelligence continuam ADR PENDING; primeiro incremento #45 realiza avaliação necessária, sem assumir licença.
- Documento de roadmap proposto em branch separada baseada na main. O estado Draft da PR #36 deve ser reconciliado antes de promover decisões ao Source Pack canônico.

## Checks e limitações
| Prova | Situação |
|---|---|
| GitHub issues criadas | CONFIRMED, #37..#67 |
| Contrato de cada WO | SPECIFIED, implementação NOT_STARTED |
| CI governance-docs da PR do roadmap | PENDING HEAD READ-BACK |
| Socket PR alerts e project report | INFORMATIVO, PENDING HEAD READ-BACK |
| Código, unit, lint, typecheck, build, integração/E2E | NOT_RUN |
| T-01..T-12 e CRM-R01..12 | NOT_RUN |
| Licença de runtime, uso de dados reais, ROI | UNKNOWN |
| Merge, Ready, deploy, compra e contato | NOT_DONE |

## Riscos e STOP
Source Pack main mais antiga que a PR #36 de M01; não assumir que decisões não mergeadas estão em main. Falha de arquitetura/licença, HIGH/CRITICAL, cross-tenant, aprovação humana indevida, custo, secrets e falso claim de teste são STOP. Revisão COMMENTED não equivale a aprovação independente. Checkpoint Delta somente PROPOSTO, sem promoção.
