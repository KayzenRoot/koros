# M01 — Registro de decisões e botões de aceite
**Nexlabs Technology / KOROS** · **Estado atual:** 7/7 alternativas A **APPROVED_FOR_PLANNING** pelo fundador em 2026-10-29. Instalação ECC local também autorizada, mas sua execução e validação no Windows ainda são **NOT_RUN** por falta de acesso ao computador nesta sessão.  
As escolhas abaixo são o modelo de conversa módulo a módulo. O fundador escolhe, registra-se o motivo e apenas depois sai uma WO/PR de implementação.

## DEC-M01-01 — Âmbito da integração ECC
- **A, recomendada:** ECC OSS nativo no Codex **onde comprovadamente suportado**, skills/regras/hooks NECESSARY e ECC Tools Free como auditor hosted opcional; sem instalar tudo e sem dependência paga.
- B: ECC OSS apenas via project-local instructions, sem plugin. Preferir se plugin Windows incompatível.
- C: Plugin + sync legado + todos os MCPs/skills. **REJECTED_FOR_SAFETY** por risco de duplicações, privilégios e contexto excessivo.
- Evidência exigida: [#7](https://github.com/KayzenRoot/koros/issues/7), [#8](https://github.com/KayzenRoot/koros/issues/8), [#9](https://github.com/KayzenRoot/koros/issues/9). **Status:** APPROVED_FOR_PLANNING, não há instalação real.

## DEC-M01-02 — Caminho Windows
- **A, recomendada:** Codex Desktop local Windows como executor principal + Codex CLI auxiliar se disponível e compatível; dry-run, backup, plugin nativo ou fallback project-local.
- B: Codex CLI apenas, caso plugin Desktop não suporte; sem assumir que comandos de CLI se aplicam ao Desktop.
- C: migrar para Mac/cloud pago. OUT_OF_SCOPE sem novo consentimento.
- Gate: preflight real, idempotência, rollback, smoke. **Status:** APPROVED_FOR_PLANNING.

## DEC-M01-03 — Pipeline de qualidade
- **A, recomendada:** baseline atual required `governance-docs`; introduzir novos jobs modularmente, provas de publisher em PR+main e required depois; free runners standard.
- B: todos jobs CI de uma vez. Evitar: faltam linguagem e código de aplicação.
- C: status-only comments/bots como required. REJECTED: check-run não verificado, risco de check órfão.
- Gate: [#14](https://github.com/KayzenRoot/koros/issues/14), [#17](https://github.com/KayzenRoot/koros/issues/17). **Status:** APPROVED_FOR_PLANNING.

## DEC-M01-04 — Ferramentas externas e custos
- **A, recomendada:** GitHub Free público, ECC OSS, ECC Tools Free dentro de quota, CodeQL público quando elegível, Dependabot, AgentShield OSS revisado, scanners OSS e Socket informativo existente; Sonar/Trivy/Playwright opcional com direito e custo comprovados.
- B: planos de terceiros pagos por ganho de performance. OUT_OF_SCOPE (R$0).
- Não se assume plano/licença de SonarCloud, Socket ou ECC Tools da conta até read-back. **Status:** APPROVED_FOR_PLANNING.

## DEC-M01-05 — Segurança de agentes e MCP
- **A, recomendada:** allowlist de MCP por projeto, read-only default, escrita só com WO, hooks revisados, sandbox rigorosa, memória local sem dados reais, reversão com snapshot.
- B: autoaprovação persistente e permissões globais irrestritas. REJECTED.
- Evidência: [#11](https://github.com/KayzenRoot/koros/issues/11), [#12](https://github.com/KayzenRoot/koros/issues/12). **Status:** APPROVED_FOR_PLANNING.

## DEC-M01-06 — Revisão e gates
- **A, recomendada:** governança atual de ruleset sem bypass, independência humana preservada como lacuna explícita, revisão AI COMMENTED e owner autoriza merges por HEAD; elevar aprovação obrigatória somente se revisor com permissão real existir e sem deadlock.
- B: contar `kayzenweb3` READ COMMENTED como APPROVED. PROIBIDO.
- C: baixar ruleset para facilitar automação. PROIBIDO.
- **Status:** APPROVED_FOR_PLANNING como política do M01; ruleset atual já ativo.

## DEC-M01-07 — Modularidade comercial e implantação em clientes
- **A, recomendada:** KOROS é core agnóstico ao setor + conectores/workflows/templates configuráveis; ECC não é pacote de instalação do cliente. Instalabilidade por cliente é objetivo de M04 futuro.
- B: verticalizar agora para CRM/leads. Necessita discovery KOR-DISC-002.
- C: vender agente irrestrito que opera browsers sem gate. REJECTED por risco.
- **Status:** APPROVED_FOR_PLANNING como diretriz do fundador; arquitetura concreta e primeira vertical PENDING.

## Limites da aprovação
A aprovação das alternativas A é **aprovação de planejamento**. O fundador autorizou **separadamente nesta conversa de 2026-10-29** instalar e deixar o ECC funcional, **sem alterar o significado de testes ainda não realizados**. A instalação só pode ocorrer no computador local com acesso real, inventário, backup e avaliação das origens. Esta decisão não concede permissão para:
- habilitar webhook, App GitHub ou MCPs de escrita;
- mudar ruleset ou marcar checks como required;
- implementar, lançar ou vender KOROS;
- expor dados de clientes ou gerar custos.

## Critérios para PLAN_APPROVED
1. Sete decisões registradas com escolha, motivação e proprietário, sem ambiguidades.
2. [Epic #5](https://github.com/KayzenRoot/koros/issues/5) e quinze child issues com dependências/DoD.
3. PR de planejamento em Draft com `governance-docs` success no HEAD final, review técnico e aceite explícito.
4. Nenhuma implementação ocorrida. Para execução: nova WO de uma issue ou pequeno grupo, Context Lock e allowlist.

## Aceite explícito do fundador em 2026-10-29
| ADR | Escolha | Estado |
|---|---|---|
| DEC-M01-01 | A: ECC OSS seletivo e App Free complementar | APPROVED_FOR_PLANNING |
| DEC-M01-02 | A: Codex Desktop Windows local, CLI auxiliar se suportado | APPROVED_FOR_PLANNING |
| DEC-M01-03 | A: CI GitHub Free incremental, sem required órfão | APPROVED_FOR_PLANNING |
| DEC-M01-04 | A: somente OSS e planos Free confirmados, sem gastos | APPROVED_FOR_PLANNING |
| DEC-M01-05 | A: MCP mínimo, hooks e memória com least privilege | APPROVED_FOR_PLANNING |
| DEC-M01-06 | A: proteção GitHub sem bypass, COMMENTED ≠ APPROVED | APPROVED_FOR_PLANNING |
| DEC-M01-07 | A: core multissetorial e experiência simples para clientes | APPROVED_FOR_PLANNING |

**Distinção de estado:** as sete decisões foram aprovadas; a execução de ECC no Windows não pôde ser realizada via conector GitHub desta sessão. Não declarar `IMPLEMENTED_VERIFIED`; registrar `BLOCKED_LOCAL_ACCESS` até o [runbook de instalação](ecc-local-execution-wo.md) ter execução documentada com provas. As tags do M01 já estão aplicadas às issues; as cores customizadas ainda dependem de `gh label edit` com token administrativo legítimo, conforme [taxonomia](github-labels.md).
