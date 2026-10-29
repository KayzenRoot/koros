# Evidence Bundle — KOR-M01-ECC-PLAN-001 (PLANNING ONLY)
**Empresa:** Nexlabs Technology · **Produto:** KOROS · **Data:** 2026-10-29 · **Status:** PLANNED / sem implementação · **Epic:** https://github.com/KayzenRoot/koros/issues/5
**Base main confirmada no início:** `30819b2622d5dc865931d5c55e9e9e9586648276`; protegida=true, ruleset #26074776 `active`.

## Context Lock e fatos GitHub
- Repo público, sem issues de execução e sem PRs abertas antes da criação desta WO; PRs #1/#2/#4 integradas e PR #3 encerrada sem merge.
- Source Pack KOR-PLAN-001 e checkpoint incorporados, GitHub protegido com regras de PR, squash-only, no force-push/delete/bypass e `governance-docs` required App 15368.
- Workflow existente `.github/workflows/koros-governance.yml` `pull_request` e `push: main`, Node script check-docs; necessário preservar na PR de planejamento.
- Checks na main base: `governance-docs=success`, `Socket Security: Project Report=success`. Não alegar SonarCloud, CodeQL ou ECC checks ativos nesse repo.
- Comentários de `ecc-tools[bot]` aparecem em PRs anteriores, mas incluem `Check publication was denied or unavailable`. Isso é evidência de **atividade**, não de permissão/estado do serviço, cobrança Free ou check-run válido.
- Consulta de instalações do conector atual não expõe inventário geral e completo dos apps terceiros. Estado real da instalação ECC Tools, permissões e quota desta conta permanece **NÃO VERIFICADO**.

## Evidência pública de ECC e custos (read-only)
- Official OSS: https://github.com/affaan-m/ECC ; README anuncia Codex marketplace plugin nativo, skill packs, hooks, AgentShield e projetos harness. Licença MIT pública. Estado na estação Windows NOT_INSPECTED.
- ECC Tools Free: https://github.com/marketplace/ecc-tools ; descrição pública: **10 análises por mês**, até **200 commits por execução**, repositório público; Pro pago não elegível por restrição R$0.
- GitHub Actions standard hosted runners em repositórios públicos: https://docs.github.com/en/actions/concepts/billing-and-usage ; larger runners são cobrados e proibidos.
- GitHub CodeQL code scanning em repo público: https://docs.github.com/en/code-security/getting-started/github-security-features ; não aplicar antes da linguagem/código existir.
- Codex native plugin na documentação upstream inclui especificidades CLI/macOS; suporte exato da edição Desktop Windows e MCP local NÃO VERIFICADO.
- *Sem dados sobre aplicações externas instaladas, quotas atuais, licenças Sonar/Socket, pagamentos, VPS, credenciais ou ambiente local.*

## Escritas autorizadas e efetivamente realizadas nesta fase
- Epic #5 e 15 issues NECESSARY de planejamento, ids #6..#20.
- Branch exclusiva `docs/KOR-M01-ECC-PLAN-001` derivada da main base. Documentos canônicos de M01 e índice de módulos. Nenhum arquivo de produção.
- PR Draft de documentação (revalidar ID/HEAD após publicação), sem merge, CI novo ou alteração de settings.
- Projetos seguintes M02..M10 apenas linhas de roadmap PROPOSED, sem abertura de 500 issues.
- Não houve instalação de ECC/skills/MCP, mudanças no Codex, gastos, deployment ou início de KOR-DISC-002.

## Segurança, validade e limitações
1. `PLAN_READY` somente após read-back de diff, links locais e `governance-docs` no HEAD final da PR.
2. `PLAN_APPROVED` exige aceite humano das escolhas DEC-M01-01..07 e auditoria documental, não presumida.
3. `IMPLEMENTED_VERIFIED` exige WOs futuras com execução real, testes negativos, App quotas, Windows smoke e read-back; todas as issues atuais estão `PLANNED`.
4. Revisões independentes `COMMENTED` não são `APPROVED`; ruleset requer 0 aprovações formais e essa lacuna permanece.
5. Nenhuma prova de produto multissetorial/instalação no cliente existe ainda. Isso requer discovery/arquitetura/implementação de módulos futuros.
6. Se custo, dependência paga, acesso admin insuficiente, edição fora da allowlist ou drift: STOP BLOCKED.

## Checkpoint Delta proposto
M01 aprovado para planejamento no chat pelo fundador; decidir perfil ECC nativo Windows (sujeito a preflight), pipeline Free em estágios, limites de MCP/hook e política de review; sem avançar ao software nem marcar 100% implementado. Não promover o checkpoint via merge automático.

## Final read-back desta PR
A ser preenchido em **comentário de revisão na PR Draft**, após seu HEAD, checks e diff reais estarem disponíveis. Não inventar SHA final que depende do próprio commit.
