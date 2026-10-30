# Auditoria de prontidão documental | KOR-DISC-002-01 / issue #24
**Empresa:** Nexlabs Technology · **Produto:** KOROS · **Data:** 2026-10-30 · **PR:** [#36 Draft](https://github.com/KayzenRoot/koros/pull/36) · **Issue:** [#24](https://github.com/KayzenRoot/koros/issues/24).
**Base de Context Lock:** `main=30819b2622d5dc865931d5c55e9e9e9586648276` protegida; PR HEAD pré-incremento `77432831728af6b5e9a34f896c72328d73b10222`, árvore `d085b93203821bdd6947ca867351494c46d19445`.
**Veredito que este artefato PREPARA:** `PLAN_READY_DOCUMENTAL_CANDIDATE` para revisão humana; **não** `PLAN_APPROVED`, **não** `MARKET_VALIDATED`, **não** `IMPLEMENTED_VERIFIED`, **não** autorização de avançar/fechar. Confirmar no HEAD final o diff e checks antes de emitir parecer definitivo.

## 1. Fonte de verdade e decisões aprovadas
- [Source Pack](../../docs/README.md), [requirements R-01..R-17](../../docs/01-requirements.md), [scope](../../docs/02-scope.md), [security](../../docs/04-security.md), [DoD](../../docs/12-definition-of-done.md), [decisions ledger](../../docs/13-decisions-ledger.md), [checkpoint proposto](../../docs/14-checkpoint.md) e [backlog](../../docs/11-backlog.md).
- PM01-D01..D05 APPROVED_FOR_PLANNING: serviços, SaaS gerenciado, core genérico/templates/conectores, lead→CRM supervisionado e policy do servidor.
- PM01-D01-S1=C APPROVED_FOR_PLANNING: agências B2B/consultorias com CRM, preferindo leads próprios.
- PM01-D01-S1-C1 APPROVED_FOR_PLANNING: micro-ICP prioritário consultorias comerciais B2B com CRM ativo e leads próprios.
- **PM01-D01-S1-CRM-REF-01=A APPROVED_FOR_PLANNING agora:** Agendor v3 primeira referência documental sintética **Pessoa/Contato**, HubSpot DBV/Projects segunda referência para portabilidade, sem troca obrigatória de CRM; **ADR-009 de fornecedor de produção continua PENDING**.

## 2. Matriz de critérios de aceite DOCUMENTAIS da issue #24
| Critério | Estado documental | Evidência / lacuna |
|---|---|---|
| Comparação de pelo menos 4 segmentos/subsegmentos | SATISFEITO COMO ESTUDO | [quatro segmentos](../../docs/product-m01/segment-comparison.md), com fontes públicas e scores rotulados heurísticos |
| Buyer persona, operador, sponsor e gatekeeper | SATISFEITO COMO HIPÓTESE | [consultoria-b2b-micro-icp](../../docs/product-m01/consultoria-b2b-micro-icp.md); nenhum entrevistado |
| Processo manual e fontes autorizadas | SATISFEITO COMO MODELO | [AS-IS/TO-BE e API](../../docs/product-m01/consultoria-b2b-manual-process-and-sources.md); nenhuma fonte em produção |
| Concorrência, CRMs e produtos substitutos | SATISFEITO COMO PESQUISA | [matriz CRM](../../docs/product-m01/crm-provider-competitive-matrix.md), [Agendor vs HubSpot](../../docs/product-m01/crm-reference-agendor-vs-hubspot.md) |
| Direito/limites por plano, auth, objetos e mapeamento | SATISFEITO COMO CONTRATO PROPOSTO | [estudo de APIs](../../docs/product-m01/crm-reference-agendor-vs-hubspot.md); entitlement na conta real UNKNOWN |
| Dedupe, riscos, política de aprovação server-side | SATISFEITO COMO CRITÉRIO | [fluxo](../../docs/product-m01/lead-to-crm-contract.md); testes T-01..T-12 NOT_RUN |
| Valor diferencial e cálculo de ROI | SATISFEITO COMO HIPÓTESE | [value proposition](../../docs/product-m01/agency-value-proposition.md), [filtro GO/NO_GO](../../docs/product-m01/consultoria-b2b-validation-go-nogo.md); resultados reais UNKNOWN |
| Benchmark de alternativas e sensibilidade | SATISFEITO COMO EXERCÍCIO HEURÍSTICO | score 85/73/67/57 de segmentos e 71/89 de CRM como hipóteses; não usar como previsão |
| Entrevistas, fontes e piloto FUTUROS definidos | SATISFEITO COMO PLANO | [scorecard](../../docs/product-m01/icp-validation-scorecard.md), sem contato ou consentimento coletado |
| Decisões do fundador, rastreabilidade e Scope | SATISFEITO COMO REGISTRO PENDENTE DE MERGE | [decisões](../../docs/product-m01/decisions.md), [issue matrix](../../docs/product-m01/issue-matrix.md), [ledger](../../docs/13-decisions-ledger.md) |
| CI, HEAD final, diff e segurança documental | PENDING READ-BACK FINAL | somente após commit na PR #36, required `governance-docs`, Socket informativo |
| Parecer independente e aceite de avanço | PENDING | revisão `COMMENTED` não substitui `APPROVED`; issue continua OPEN |

## 3. Rastreabilidade realista dos Requirements
| Requirement | Reflexo na escolha #24 | Obrigação pendente |
|---|---|---|
| R-01, R-11 | tenant, papéis, isolamentos e credenciais por empresa no contrato | testes negativos cross-tenant e implementação |
| R-02, R-14 | workflow versionado e estados lead→approval→CRM | contratos e FSM em código |
| R-03 | leads próprios com fonte oficial e esquema de ingestão | autenticação de fonte e consentimento reais |
| R-04 | saída IA estruturada apenas como sugestão | avaliação IA com dados sintéticos |
| R-05 | aprovação humana exata antes de escrita | autorização server-side, rejeição, expiração e replay |
| R-06 | Agendor v3 referência sintética; HubSpot DBV segunda referência | `CRM-R01..R12=NOT_RUN`; sandbox e APIs reais |
| R-07, R-08 | buyer, operador, fila, log e auditoria propostos | UX e auditoria de produto verificáveis |
| R-09, R-10 | custo/limites/backup/rollback descritos como gates | benchmark e testes de recovery |
| R-12, R-13 | APIs oficiais, contratos e LGPD | direito em conta real, controlador/operador, DPA/retention |
| R-15, R-16 | portal/faturamento automático IMPORTANT posterior | sem implantação nesta issue |
| R-17 | designer visual, múltiplos conectores genéricos FUTURE | sem escopo técnico neste piloto |
**NUNCA** transferir um `SATISFEITO COMO DOCUMENTO` a um `IMPLEMENTED`.

## 4. Lacunas explícitas, classificadas por impacto
- **BLOQUEIAM qualquer validação comercial/cliente:** nenhuma entrevista/observação, ausência de baseline de leads/minutos, desconhecida disposição a pagar, custo por cliente e ganho líquido, comparativo do CRM na conta real.
- **BLOQUEIAM integração/implementação:** ausência de plano/entitlement/sandbox e scope reais, segredo autorizado, esquema e quota verificados, webhook autenticado se usado, mecanismos de MFA/privacidade, licença/comercialização, contratos LGPD.
- **BLOQUEIAM produto/launch:** código inexistente, R-01..R-14 NOT_IMPLEMENTED, T-01..T-12 e CRM-R01..R12 NOT_RUN, segurança/backup/deploy não provados.
- **NÃO BLOQUEIAM a prontidão exclusivamente DOCUMENTAL:** ausência de execução de entrevistas ou API, pois não estavam autorizadas; são fontes de prova de estágio posterior, não suposição de êxito.

## 5. Testes adversos que o plano deve exigir FUTURAMENTE
Lead com prompt injection; dados pessoais sem direito; webhook replay/forjado; atualização indevida por `upsert` com alteração de campos após approval; persona e negócio de tenants diferentes; conta Free sem permissão de escrita; token expirado/escopo insuficiente; limite 429; timeout após escrita incerta; CRM Service Key sem webhook; orçamento estourado; CRM nativo com solução mais barata; falha na restauração/retention. Todos **NOT_RUN**.

## 6. Política de vereditos de #24
- `PLAN_READY_DOCUMENTAL_CANDIDATE`: matriz documental preenchida, decisões aprovadas de recorte/CRM de referência, riscos e provas futuras descritos, HEAD/checks OK no read-back e auditoria independente sem defeito HIGH/CRITICAL documental.
- `PLAN_APPROVED`: exige veredito de auditoria, aceite explícito da passagem de fase pelo fundador e atualização de checkpoint, ainda não concedidos.
- `COMMERCIAL_VALIDATED`: depende de pesquisa futura autorizada, dados legítimos, baseline/concorrência e valor; **não alcançado**.
- `IMPLEMENTED_VERIFIED`: depende de código/testes/CI de software em outra fase; **não alcançado**.
- `BLOCKED`: drift, check não verde, contradição de decisão, inferência de integração/custo como prova, segredo exposto ou HIGH/CRITICAL conhecido. Corrigir antes de avançar.

## 7. Checkpoint Delta proposto, NÃO promovido
`Issue #24: estudo documental de público, micro-ICP e CRM de referência concluído para auditoria; PM01-D01-S1-CRM-REF-01 A aprovada para planejamento; cliente e API real desconhecidos. PR #36 Draft, main protegida. PLAN_READY_DOCUMENTAL_CANDIDATE condicionado a HEAD/checks/review. Sem merge, encerramento de issue, código, contatos, custos ou deploy.`

**Aguardando evidência do HEAD pós-commit e resultado da review da PR #36.** Auditoria da versão completa PRODUCT-M01 permanece futura: esta evidência diz respeito somente à issue #24.
