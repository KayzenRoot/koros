# M01 — GitHub Pipeline profissional com custo R$0
**Status:** PROPOSTO. Nenhum workflow novo criado nesta PR. Não modificar ruleset antes de produtor real.

## Fundamento confirmado
Repositorio KOROS público. Ruleset #26074776 `active`: PR, squash-only, sem bypass, no force-push/delete, threads resolvidas e required `governance-docs` do GitHub Actions App 15368. Job atual roda em `ubuntu-latest`, checkout por SHA, contents:read, `persist-credentials:false`, autotestes + links e padrões óbvios de credenciais. O CI atual NÃO é SAST completo nem app security.

GitHub publica runners padrão gratuitos para repositórios públicos, incluindo ubuntu-latest e windows-latest; larger runners são cobrados e proibidos. A disponibilidade de cada ferramenta terceira parte no Free deve ser confirmada em conta/repo. Qualquer dependência de token pago ou licença Pro = STOP.

## Pipeline-alvo em fases (não habilitar tudo agora)
| Estágio | Gatilho futuro | Job / sinal desejado | Ativação | Required? |
|---|---|---|---|---|
| D0 Governance | PR, push main | `governance-docs` | EXISTENTE / sucesso confirmado | SIM, atual |
| D1 PR Hygiene | PR | caminhos proibidos, diff/lockfiles, permissions, secrets heurísticos, links, title/WO | APÓS PR própria e evidência | Apenas após publisher provado |
| D2 Dependencies | PR código/deps, cron baixo custo | license check, dependency audit, Dependabot alerts | FUTURO após dependências | Avaliar com App publisher |
| D3 Static analysis | PR, push main | lint/format/typecheck, CodeQL quando linguagem suportada | FUTURO, após stack/código | SOMENTE produtor comprovado |
| D4 Unit/Contract | PR código | unit+contract, fixtures de API, idempotência, mocks sem dados reais | FUTURO, após código | SIM após testes reais |
| D5 Integration & DB | PR com mudanças de banco | migrations, isolamento/denied by default, negative tests em sandbox local | FUTURO | Condicionado |
| D6 E2E | PR UI e schedule deliberado | Playwright headless Chromium + smoke Windows quando aplicável | FUTURO | Condicionado |
| D7 Agents/Security | PR configs agents/hooks/MCP | AgentShield OSS, CodeQL Actions, secrets e injection fixtures | FUTURO | Condicionado |
| D8 Supply Chain | PR deps/releases | SBOM, provenance, lockfile integrity, pinned actions | FUTURO | Condicionado |
| D9 Release Audit | release autorizado | Evidence Bundle, checks, rollback, compliance, owner approval | FUTURO | Necessário para release, não implica deploy |

## Segurança do workflow
- `permissions: contents: read` default, elevar apenas por job comprovado; ações versionadas por commit SHA, origem confiável, `persist-credentials:false`.
- Preferir `pull_request` para código não confiável; não rodar checkout de fork com privilégio de `pull_request_target` ou `workflow_run`.
- Timeouts por job, concurrency cancel-in-progress segura, caches com trust boundaries; bloquear jobs redundantes e triggers duplicados.
- Evitar runners pagos, GPU, containers premium, artifact retention longa e upload de secrets; mensagens Slack/notifications só se Free autorizado.
- Não usar `continue-on-error:true` em controle required; `skipped`, `neutral` e `success` devem ser interpretados de forma específica, sem falso GO.
- Criação de check required em **duas etapas**: primeiro workflow em branch, validar PR real; merge apenas com autorização; verificar produtor na main + app ID; então atualizar ruleset e testar falha/recovery em PR de prova. Nunca check órfão.

## Ferramentas gratuitas candidatas
| Ferramenta | Base de elegibilidade | Decisão atual |
|---|---|---|
| GitHub Actions padrão | Gratuito em repositório público; limites de armazenamento e abuso/uso aplicam | APROVADO PARA PLANEJAMENTO |
| CodeQL | Code scanning de repositório público; análise exige código suportado | PROPOSED / NOT_RUN |
| Dependabot alerts/updates | Suporte público no GitHub, disponibilidade da conta a verificar | PROPOSED / NOT_RUN |
| Socket Security | Já fornece check-runs informativos em KOROS; plano e limites da instalação desconhecidos | EXISTENTE INFORMATIVO, não required |
| ECC Tools Free | Marketplace público: 10 análises/mês, até 200 commits por run; comentários visíveis no repo | FREE candidato, check publication NÃO VERIFICADA |
| AgentShield ECC OSS | Scanner configurações agent/hook/MCP, licença/dependências a verificar | PROPOSED / NOT_RUN |
| Gitleaks ou equivalente OSS | Segredos sintéticos e padrões em repositório | PROPOSED / NOT_RUN |
| SonarCloud/SonarQube Cloud Free | Depende de elegibilidade e plano real; nenhuma integração confirmada neste repo | OPTIONAL / BLOCKED até confirmação |
| Trivy OSS | CVEs/SBOM e imagem quando houver container | FUTURO / NOT_RUN |
| Playwright OSS | E2E headless sem serviço pago | FUTURO / NOT_RUN |
| pgTAP | Testes de banco se/quanto houver PostgreSQL | FUTURO / NOT_RUN |

## Matriz de execução por mudança
| Tipo PR | D0 | D1 | D2 | D3/D4 | D5 | D6 | D7 |
|---|---|---|---|---|---|---|---|
| Docs apenas | required | elegível | não aplicável | não aplicar/sem falso verde | - | - | Docs/agent quando relevante |
| ECC/hook/MCP | required | elegível | dependências se houver | validador de config | - | smoke plugin opcional | obrigatório depois de comprovado |
| Backend | required | elegível | sim | sim | se banco | - | sim |
| Frontend | required | elegível | sim | sim | - | sim | sim |
| DB/tenant/security | required | elegível | sim | sim | sim negativo | caso tenha UI | sim |
| Release | required | elegível | sim | sim | sim | sim | security + evidence |

**Observação:** `-` significa NÃO APLICÁVEL, jamais um check required ausente. Checks obrigatórios precisam produzir estado em todas as PRs aplicáveis ou usar um agregador estável comprovado, sem bypass.

## Testes de enforcement futuros
1. PR positiva documental e PR positiva de código, status exato no HEAD, App publisher e logs reproduzíveis.
2. Alteração com link quebrado, secret fake, unit fail, MCP with unapproved writes, tampered lockfile: gate correspondente deve falhar.
3. Retorno a commit corrigido => success e elegibilidade recuperada.
4. Depois de marcar Ready, revalidar jobs novos e `mergeable_state=clean`, não confiar no run anterior.
5. Falha de scanner externo: status `NOT_RUN` ou `BLOCKED`, jamais sucesso presumido.
6. Teste em branch descartável, nunca force-push/delete na main.

## DoD CI
Mapa `check name -> publisher/app ID -> branch -> job -> testes positivos/negativos -> ruleset -> custo` com snapshots e evidência de read-back. Não agregar checks sem necessidade; segurança de software exige avaliações mais amplas que `governance-docs`.

Fontes: https://docs.github.com/en/actions/concepts/billing-and-usage ; https://docs.github.com/en/code-security/getting-started/github-security-features ; https://docs.github.com/en/actions/reference/security/secure-use .
