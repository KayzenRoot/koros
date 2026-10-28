# Work Order KOR-GOV-002 — GitHub Governance
**Classificação:** NECESSARY; **escopo:** governança GitHub exclusiva; **estado:** BLOCKED para regras administrativas até evidência de instalação. **Data:** 2026-10-28.
**Context Lock:** `KayzenRoot/koros`, main `57dd78a6eb2b39c1d07fdf2728de2cde20fda3b8`, PR #1 KOR-PLAN-001 Draft HEAD `ba166dc7fc69435c3905b8c3864749b6a5f8adec`. NÃO alterar PR #1.
## Objetivo
Exigir PR para main, bloquear force-push e exclusão, definir revisão independente sem bloqueio impossível, squash normal, required checks com provedores validados, e testes de enforcement. Sem implementar KOROS.
## Source Check e preflight
GitHub API informou `main protected=false`; `GET /rulesets=[]`; `GET /branches/main/protection=403 Resource not accessible by integration`. Repo é público, usuário conectado tem admin=true, mas o GitHub App não expõe escrita para rulesets/protection ou opções de merge; `allow_squash_merge=true`, `allow_merge_commit=true`, `allow_rebase_merge=true`. Plano GitHub Free para repo público suporta rulesets, logo não presumir restrição de pagamento. Proposta administrativa NÃO aplicada.
Fontes: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets e https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches .
## Allowlist
Somente `.github/workflows/koros-governance.yml`, `.github/scripts/check-docs.mjs`, `governance/KOR-GOV-002.md`, `evidence/KOR-GOV-002/README.md`. Work Order independente da PR #1, sem edição na main. GitHub Actions é infraestrutura de governança e não software MVP.
## Configuração alvo (PROPOSTA, NÃO INSTALADA)
- Ruleset ativo `KOROS — Protected main` apenas em `refs/heads/main`; zero bypass por padrão.
- Exigir pull request, resolução de threads, bloquear force-push (non_fast_forward) e exclusão (deletion). Exigir linear history. 
- Required approving reviews: **0** temporariamente enquanto não existir revisor humano com acesso write apto a aprovar, sem contar COMMENTED como aprovação. Revisão independente exigida pelo processo até que seja possível configurar 1 aprovação com revisor legítimo; nunca falsear review ou usar dismissal como substituto.
- Required check inicial: `governance-docs` **somente após observar check-run success em PR real**; GitHub Actions como source quando identificável. Checks Socket: informativos até provar cobertura e estabilidade. Em etapa técnica futura, adicionar lint, typecheck, build, testes e análise de segurança com produtores comprovados.
- Preferências do repo: desabilitar `allow_merge_commit` e `allow_rebase_merge`, manter `allow_squash_merge=true`, auto-merge desabilitado. Nunca bypass.
## Estratégia de prova
1. CI positivo na PR Draft desta Work Order, com job `governance-docs` e HEAD rastreável; fixtures negativas do próprio script devem PASSAR por detectar corretamente falhas simuladas.
2. Com admin de rulesets disponível, aplicar configurações e ler estado efetivo; diferenciar branch protected, rulesets e settings de merges.
3. Enforcement negativo: em PR de prova isolada, introduzir erro no check em branch descartável, conferir merge bloqueado **sem efetuar merge**, corrigir na mesma branch e comprovar desbloqueio. Para force-push/deletion, verificar enforcement do GitHub sem tentar ação destrutiva na main. Aprovadores reais: não forçar CHECKED com conta do autor.
4. Revalidar PR #1 Draft/intacta, SHA main, ausência de bypass e Evidence Bundle.
## Acceptance / STOP
Não declarar GO enquanto ruleset, required checks e enforcement não estiverem aplicados e demonstrados. Se admin API/UI ou permissão não estiver disponível, **BLOCKED**; continuar apenas read-only e evidência. Não inserir required checks órfãos. Sem merge, deploy, gastos, dados reais, ECC ou alterações em projeto MVP.
