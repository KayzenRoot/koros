# M01 — Estratégia ECC, skills, agentes, hooks e MCPs
**Estado:** DESIGN PROPOSTO. Nenhuma instalação/alteração local executada nesta WO.

## ECC: três superfícies separadas
1. **ECC OSS** (`affaan-m/ECC`, MIT): catálogo open source, agente/harness, regras/skills/hooks e tooling local. Pode ser usado sem o SaaS pago.
2. **ECC Tools GitHub App** (instalada segundo usuário; comentários foram observados): serviço hosted com Free para public repo, análise por comando e PRs geradas; plano anunciado 10 análises/mês até 200 commits/run. Contar quota real antes de disparar; Pro proibido.
3. **Codex/Desktop Windows:** ambiente onde as skills funcionam. Suporte real ao plugin, namespace e hooks deve ser provado na versão instalada. A documentação upstream descreve suporte nativo no Codex CLI e macOS; Windows Desktop ainda exige teste.

## Seleção de instalação proposta
**Preferido:** plugin nativo ECC do marketplace Codex no escopo do projeto, se houver suporte funcional no Windows do proprietário. Documentação pública registra:
```sh
codex plugin marketplace add affaan-m/ECC
codex plugin add ecc@ecc
codex plugin list --json
```
**Esses comandos são referência de futura WO, NÃO foram executados.** Antes de instalação: `codex --version`, `codex plugin --help`, dry-run da alternativa guiada `npx ecc-universal@2.2.3 install --guided --harness codex --dry-run` **somente após pin e revisão de origem**. Conferir registry integrity antes de npx. Não misturar plugin e legacy sync. Plano fallback: invocação explícita das skills revisadas por repositório se plugin nativo incompatível; exigir aceite e testes, nunca baixar comandos shell aleatórios.

## Perfis de capacidades propostos
| Perfil | NECESSARY / acionamento | Uso e restrição |
|---|---|---|
| planning & requirements | Toda nova WO | Research-first, escopo e critérios de aceite |
| code review + security review | Toda PR de código | Verificar evidências, riscos, diffs; não conta como APPROVED humano |
| TDD/verification/debugging | Mudança de comportamento | Red/green, regressão, falhas reais |
| docs + ADR | Contratos e roadmap | Atualiza GitHub como fonte da verdade |
| API/contracts | Futuras integrações | Contratos oficiais, idempotência, endpoints de sandbox |
| frontend/e2e | Futuro dashboard | Selecionar apenas depois da stack |
| data/RLS/tenant isolation | Futuro core | Testes negativos sem dados de clientes |
| infra/deploy/recovery | Futuro onboarding de clientes | Observabilidade, backup e rollback sob autorização |
| performance/LLM eval | Futuro runtime | Cotas e preço por execução, não gastar neste módulo |

Verificar nomes **reais** do catálogo na versão fixada antes de gerar arquivos, evitando inventar IDs de skills. Não copiar os 100+ skills automaticamente. Agente com responsabilidade definida e prova de fallback se multi-agent não for suportado.

## Agentes e handoffs
Planner (proposta) -> Executor (mudanças em allowlist) -> Tester (comandos reproduzíveis) -> Auditor técnico (diff/CI) -> Revisor humano independente (quando disponível) -> Founder (aceite e autorização explícita). Agentes de IA podem produzir pareceres, **mas não forjam APPROVED**. Cada handoff registra HEAD SHA, arquivos, tests, custo, riscos, STOP.

## Política de hooks e memória
- Não ativar `yolo`/full auto approve. Hooks podem executar shell; revisar código e permissões antes de ativar.
- Não duplicar hooks de plugin e config global; preservar instalações e ajustes do usuário.
- Bloquear comandos destrutivos, segredos em prompts, acesso fora do workspace, MCP com privilégio excessivo e publicação externa de memória/sessões.
- Persistência de memória e instincts local, opt-in, com separação por projeto. Não registrar dados de clientes, credenciais, URLs privadas ou PII em skills/histórico/artefatos.
- Hook falho: resultado claro; controles críticos de segurança devem falhar com STOP. Logs sanitizados e retenção limitada.

## MCPs: allowlist de PROPOSTAS (não instalação)
| MCP / categoria | Necessidade | Permissão inicial | Estado |
|---|---|---|---|
| GitHub | Issues, PR, checks, repo | Leitura por padrão; escrita apenas em WO explícita | Plugin ChatGPT conectado; Codex MCP local NÃO VERIFICADO |
| Docs/Context7 | Documentação de frameworks atualizada | Leitura, quota Free comprovada | Opcional, quota NÃO VERIFICADA |
| Playwright/browser testes | E2E local com app sintético | Acesso somente ao app local | FUTURO |
| Git/shell local | Context Lock, testes, diffs | Workspace isolado; sem bypass | Disponibilidade no Windows a provar |
| Supabase/DB | Futuro contrato de dados | Somente sandbox deny-by-default | FUTURO, não conectar cliente agora |
| Chrome DevTools e outras | Diagnóstico de UI | Permissões restritas e binários pinados | FUTURO/OPCIONAL |

Para cada MCP registrar transport, projeto, credencial protegida, egress, escopo, tool list, TTL, quota, fallback e smoke; manter configurações existentes se não for necessário alterá-las.

## Testes de aceite (executar em WO futura)
- Plugin reconhecido em Codex Desktop Windows, `plugin list` coerente, skill carregada sob gatilho correto, hooks executados uma vez, MCP read-only autorizado, MCP escrita bloqueada sem aprovação.
- Caso negativo: pacote não oficial, instalação duplicada, broken hook, pseudo-segredo, comando perigoso, stale token, prompt injection em skill, MCP indisponível, quota ECC excedida.
- Depois de rollback recuperar exatamente o snapshot de config/hook/MCP, sem mexer em outras instalações.
**Todas as provas acima: NOT_RUN agora.**

Fontes: https://github.com/affaan-m/ECC , https://github.com/marketplace/ecc-tools .
