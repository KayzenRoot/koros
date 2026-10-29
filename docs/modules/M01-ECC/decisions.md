# M01 — Registro de decisões e botões de aceite
**Nexlabs Technology / KOROS** · **Estado:** propostas para aprovação, não instalação.  
As escolhas abaixo são o modelo de conversa módulo a módulo. O fundador escolhe, registra-se o motivo e apenas depois sai uma WO/PR de implementação.

## DEC-M01-01 — Âmbito da integração ECC
- **A, recomendada:** ECC OSS nativo no Codex **onde comprovadamente suportado**, skills/regras/hooks NECESSARY e ECC Tools Free como auditor hosted opcional; sem instalar tudo e sem dependência paga.
- B: ECC OSS apenas via project-local instructions, sem plugin. Preferir se plugin Windows incompatível.
- C: Plugin + sync legado + todos os MCPs/skills. **REJECTED_FOR_SAFETY** por risco de duplicações, privilégios e contexto excessivo.
- Evidência exigida: [#7](https://github.com/KayzenRoot/koros/issues/7), [#8](https://github.com/KayzenRoot/koros/issues/8), [#9](https://github.com/KayzenRoot/koros/issues/9). **Status:** PROPOSED, não há instalação real.

## DEC-M01-02 — Caminho Windows
- **A, recomendada:** Codex Desktop local Windows como executor principal + Codex CLI auxiliar se disponível e compatível; dry-run, backup, plugin nativo ou fallback project-local.
- B: Codex CLI apenas, caso plugin Desktop não suporte; sem assumir que comandos de CLI se aplicam ao Desktop.
- C: migrar para Mac/cloud pago. OUT_OF_SCOPE sem novo consentimento.
- Gate: preflight real, idempotência, rollback, smoke. **Status:** PROPOSED.

## DEC-M01-03 — Pipeline de qualidade
- **A, recomendada:** baseline atual required `governance-docs`; introduzir novos jobs modularmente, provas de publisher em PR+main e required depois; free runners standard.
- B: todos jobs CI de uma vez. Evitar: faltam linguagem e código de aplicação.
- C: status-only comments/bots como required. REJECTED: check-run não verificado, risco de check órfão.
- Gate: [#14](https://github.com/KayzenRoot/koros/issues/14), [#17](https://github.com/KayzenRoot/koros/issues/17). **Status:** PROPOSED.

## DEC-M01-04 — Ferramentas externas e custos
- **A, recomendada:** GitHub Free público, ECC OSS, ECC Tools Free dentro de quota, CodeQL público quando elegível, Dependabot, AgentShield OSS revisado, scanners OSS e Socket informativo existente; Sonar/Trivy/Playwright opcional com direito e custo comprovados.
- B: planos de terceiros pagos por ganho de performance. OUT_OF_SCOPE (R$0).
- Não se assume plano/licença de SonarCloud, Socket ou ECC Tools da conta até read-back. **Status:** PROPOSED.

## DEC-M01-05 — Segurança de agentes e MCP
- **A, recomendada:** allowlist de MCP por projeto, read-only default, escrita só com WO, hooks revisados, sandbox rigorosa, memória local sem dados reais, reversão com snapshot.
- B: autoaprovação persistente e permissões globais irrestritas. REJECTED.
- Evidência: [#11](https://github.com/KayzenRoot/koros/issues/11), [#12](https://github.com/KayzenRoot/koros/issues/12). **Status:** PROPOSED.

## DEC-M01-06 — Revisão e gates
- **A, recomendada:** governança atual de ruleset sem bypass, independência humana preservada como lacuna explícita, revisão AI COMMENTED e owner autoriza merges por HEAD; elevar aprovação obrigatória somente se revisor com permissão real existir e sem deadlock.
- B: contar `kayzenweb3` READ COMMENTED como APPROVED. PROIBIDO.
- C: baixar ruleset para facilitar automação. PROIBIDO.
- **Status:** PROPOSED como política do M01; ruleset atual já ativo.

## DEC-M01-07 — Modularidade comercial e implantação em clientes
- **A, recomendada:** KOROS é core agnóstico ao setor + conectores/workflows/templates configuráveis; ECC não é pacote de instalação do cliente. Instalabilidade por cliente é objetivo de M04 futuro.
- B: verticalizar agora para CRM/leads. Necessita discovery KOR-DISC-002.
- C: vender agente irrestrito que opera browsers sem gate. REJECTED por risco.
- **Status:** diretriz do fundador para planejamento; arquitetura concreta e primeira vertical PENDING.

## Limites da aprovação
Um clique de aceite das alternativas é **aprovação de planejamento**, não permissão para:
- instalar ECC ou rodar scripts remotos no PC;
- habilitar webhook, App GitHub ou MCPs de escrita;
- mudar ruleset ou marcar checks como required;
- implementar, lançar ou vender KOROS;
- expor dados de clientes ou gerar custos.

## Critérios para PLAN_APPROVED
1. Sete decisões registradas com escolha, motivação e proprietário, sem ambiguidades.
2. [Epic #5](https://github.com/KayzenRoot/koros/issues/5) e quinze child issues com dependências/DoD.
3. PR de planejamento em Draft com `governance-docs` success no HEAD final, review técnico e aceite explícito.
4. Nenhuma implementação ocorrida. Para execução: nova WO de uma issue ou pequeno grupo, Context Lock e allowlist.
