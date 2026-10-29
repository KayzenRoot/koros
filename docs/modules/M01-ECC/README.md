# M01 — ECC & Engineering Foundation
**Startup:** Nexlabs Technology | **Produto:** KOROS | **WO de planejamento:** `KOR-M01-ECC-PLAN-001` | **Epic:** [#5](https://github.com/KayzenRoot/koros/issues/5) | **Estado:** PLANNED / NOT_IMPLEMENTED.
**Baseline de leitura GitHub:** `main=30819b2622d5dc865931d5c55e9e9e9586648276` em 2026-10-29. Revalidar antes da execução.
**Classificação:** NECESSARY; custo-alvo **R$0**; sem merge/implementação/deploy nesta PR de planejamento.

## 1. Por que este é o primeiro módulo
Por decisão de priorização do fundador, o primeiro módulo é a fundação de engenharia em ECC, Codex e GitHub. O backlog anterior listava KOR-DISC-002 como o próximo incremento de produto: **ele continua pendente**. M01 não autoriza selecionar stack, fechar produto B2B ou publicar promessa comercial. Primeiro preparar um ambiente confiável para, depois, planejar o produto.

## 2. Contrato produto × ferramentas
O sistema futuro deve ser **setorialmente agnóstico**, vendável a comércios, prestadores de serviço e outras empresas. A instalação do produto nos clientes precisa ser fácil e reversível, com conectores plugáveis por canal/ERP/CRM, workflows configuráveis, isolamento de dados, aprovação humana para escritas sensíveis e cotas. Tais capacidades são DIRETRIZES DE PRODUTO para módulos futuros, não software existente.

ECC e ECC Tools são **ferramentas internas de engenharia**. Clientes não precisam instalar ECC para rodar KOROS. A distribuição por cliente (SaaS gerenciado, self-host, appliance/container, cloud) será escolhida em módulo próprio, sem criar lock-in prematuro.

## 3. Arquitetura de engenharia (proposta)
```text
Nexlabs Technology (Founder + decisões e aceites)
        |
ChatGPT (planejamento e auditoria) ---- GitHub (Source of Truth)
                                            |
              Epic / WOs / ADRs / Evidence / PR Draft
                                            |
                           main ruleset #26074776
                             PR + squash + no bypass
                             governance-docs REQUIRED
                                            |
                   Codex Desktop LOCAL / Windows
                     |                |
           ECC OSS native plugin   MCPs já instalados
             |                    (mínimo privilégio)
        skills/agents/rules/hooks          |
             |                            |
         Implementador local -- CI GitHub Actions Free
                                   |  docs + testes + segurança
                                   |  checks em HEAD exato
                              read-back / GO / STOP
```
**Não confundir desenho com componentes instalados.** O GitHub é validado; o Windows, plugin nativo, skills reais e MCPs locais ainda precisam de inventário e execução.

## 4. Inventário confirmado e lacunas
| Item | Fato observado | Estado |
|---|---|---|
| GitHub `KayzenRoot/koros` público | main `30819b26...`, proteção ativa e sem PR aberta antes desta Work Order | VERIFIED |
| Ruleset #26074776 | `active`, bloqueia force push/delete, PR obrigatório, squash-only, `governance-docs` required App 15368, 0 aprovações exigidas | VERIFIED |
| `governance-docs` | GitHub Actions `pull_request` e `push main`, script check-docs, Node autotestes | VERIFIED |
| Socket Security | Check-runs informativos na main e PRs anteriores | VERIFIED, escopo do scanner NÃO generalizar |
| ECC Tools App | Comentários `ecc-tools[bot]` no KOROS em PRs passadas, inclusive 'Check publication denied or unavailable' | APP ACTIVITY VERIFIED; permissões/plan/estado dos checks NÃO VERIFICADOS |
| ECC OSS | Upstream público `affaan-m/ECC`, documentação Codex e perfis; licença MIT conforme upstream | PUBLIC_DOC_VERIFIED; versão local NÃO VERIFICADA |
| Codex Desktop/CLI Windows e MCP local | Usuário pretende usar, mas conectores GitHub não inspecionam instalação local | NOT_VERIFIED |
| Pipelines de aplicação, CodeQL, SAST/SCA e E2E | Ainda não há código de produto; novos produtores não estão na main | NOT_IMPLEMENTED |
| Custo ECC Hosted Free | Marketplace informa Free em repos públicos com 10 análises/mês, até 200 commits por análise; quota consumida da conta NÃO LIDA | PUBLIC_POLICY_VERIFIED / ACCOUNT_QUOTA_UNKNOWN |

## 5. Alcance funcional de 100% no M01
- Instalação e manutenção confiável do ECC na estação de trabalho escolhida; selecionar **canal único**, evitar conflito plugin nativo x sync legado.
- Skills, agents, rules e hooks NECESSARY selecionados, inspecionados, testados, com budget de contexto e requisitos de segurança.
- MCPs existentes preservados; novas capacidades sob allowlist (não instalar todos nem espalhar tokens); separar read-only de ações de escrita.
- ECC Tools hospedado integrado **somente dentro do Free comprovado**; se publicar comentários e não checks, sinaliza informativo, nunca required.
- CI GitHub Free profissional para docs e, quando houver código de aplicação, quality, build, testes, segurança e cross-OS; checks obrigatórios adicionados **após produtor comprovado na main e PR real**.
- Provas positivas e negativas, recuperação de falhas, threat model, version pins, evidência, rollback Windows e proteção da main.
- 100% = todas as **15 issues técnicas** com provas e aceite + auditoria independente; **não** significa ausência matemática de bugs ou 100% line coverage.

## 6. Decomposição por workstreams
**Bloco A — Contratos e compatibilidade (pré-requisitos):**
[#6](https://github.com/KayzenRoot/koros/issues/6) inventário;
[#7](https://github.com/KayzenRoot/koros/issues/7) upstream;
[#8](https://github.com/KayzenRoot/koros/issues/8) Codex Windows.

**Bloco B — Inteligência do harness:**
[#9](https://github.com/KayzenRoot/koros/issues/9) skills;
[#10](https://github.com/KayzenRoot/koros/issues/10) agentes;
[#11](https://github.com/KayzenRoot/koros/issues/11) hooks/rules;
[#12](https://github.com/KayzenRoot/koros/issues/12) MCPs.

**Bloco C — GitHub Free e pipeline:**
[#13](https://github.com/KayzenRoot/koros/issues/13) ECC Tools;
[#14](https://github.com/KayzenRoot/koros/issues/14) Actions Free;
[#15](https://github.com/KayzenRoot/koros/issues/15) qualidade/testes;
[#16](https://github.com/KayzenRoot/koros/issues/16) segurança;
[#17](https://github.com/KayzenRoot/koros/issues/17) ruleset/revisão.

**Bloco D — Validação e operação:**
[#18](https://github.com/KayzenRoot/koros/issues/18) E2E negativos;
[#19](https://github.com/KayzenRoot/koros/issues/19) manutenção/rollback;
[#20](https://github.com/KayzenRoot/koros/issues/20) DoD/encerramento.

## 7. Fluxo de execução futuro
1. **PLAN_REVIEW:** discutir decisões em [decisions.md](decisions.md); alinhar custos/compatibilidade; revisar e eventualmente integrar PR documental com autorização.
2. **PREFLIGHT:** Context Lock novo, inventário real Windows e contas GitHub; sem segredos na evidência.
3. **INSTALL_REVIEW:** avaliar pin e scripts do ECC; instalar seletivamente no Codex com backup/dry-run, sem yolo nem sync simultâneo.
4. **MCP/AGENTS:** confirmar ferramentas atuais, configurar allowlist por projeto, testes de permissões, hooks idempotentes.
5. **CI:** montar em PRs independentes, provando cada produtor antes de required; CodeQL só quando linguagem/código suportados.
6. **PROOFS:** tests positivos/negativos, compatibilidade Windows, ECC App quotas/avisos, rollback e docs de suporte.
7. **CHECKPOINT:** auditar Evidence Bundle, escopo, revisão e quotas; somente depois classificar IMPLEMENTED_VERIFIED.

## 8. Não negociar
- R$0, sem upgrade, sem ferramentas pagas/cloud extra, sem runner maior e sem declarar preços de provedores não confirmados.
- Sem force-push, bypass, exclusão da main, reset da configuração global de Codex e segredos em PR/Actions/logs.
- `COMMENTED` não significa `APPROVED`. 0 required approvals no ruleset é lacuna organizacional, não falsificar revisão.
- Não alegar Codex Desktop Windows 100% compatível, ECC instalado, skills ativos ou MCPs conectados sem prova.
- Sem alteração do MVP ou instalação em ambiente de cliente por este módulo.

## 9. Referências e próximos documentos
[Decisões](decisions.md) · [Plano de harness, skills e MCP](harness-mcp-skills.md) · [Pipeline R$0](ci-quality-gates.md) · [Aceites e issues](acceptance-and-issues.md) · [Evidence Bundle](../../../evidence/KOR-M01-ECC-PLAN-001/README.md).

Fonte: https://github.com/affaan-m/ECC , https://github.com/marketplace/ecc-tools , https://docs.github.com/en/actions/concepts/billing-and-usage .

## Aprovação do fundador / execução local (2026-10-29)
As sete escolhas A de `DEC-M01-01..07` foram **APPROVED_FOR_PLANNING**. O fundador também pediu autorização de setup ECC no Codex Desktop Windows. Esta conversa possui ferramentas GitHub, mas **não possui acesso autorizado ao Windows do usuário**. Portanto, nenhuma instalação local, smoke de plugins/MCP/hook ou reparo de conflito foi executada. Consultar o [runbook executável](ecc-local-execution-wo.md); [tags coloridas](github-labels.md) e issues #5–#20 estão registradas. O M01 permanece `IMPLEMENTED_VERIFIED=NO`.
