# Work Order KOR-GOV-002 — GitHub Governance
**Classificação:** NECESSARY; **escopo:** governança GitHub exclusiva; **estado:** ruleset e squash-only APLICADOS e verificados; required checks BLOCKED até merge autorizado do produtor; veredito global BLOCKED. **Data:** 2026-10-28.
**Context Lock:** `KayzenRoot/koros`, main `57dd78a6eb2b39c1d07fdf2728de2cde20fda3b8`, PR #1 KOR-PLAN-001 Draft HEAD `ba166dc7fc69435c3905b8c3864749b6a5f8adec`, PR #2 KOR-GOV-002 Draft HEAD `53a1f4fb7779505a9fc51a3bcfe222d07f1bf7b5` (antes do commit desta atualização). NÃO alterar PR #1.
## Objetivo
Exigir PR para main, bloquear force-push e exclusão, definir revisão independente sem bloqueio impossível, squash normal, required checks com provedores validados, e testes de enforcement. Sem implementar KOROS.
## Source Check e preflight
Na execução KOR-GOV-002, o GitHub CLI autenticado como `KayzenRoot` confirmou `admin=true` e aplicou as mutações via API oficial. Estado anterior: `main protected=false`; `GET /rulesets=[]`; `GET /branches/main/protection` → 404 `Branch not protected`; merges squash/merge-commit/rebase = true/true/true. O caminho anterior via GitHub App era somente leitura; a execução administrativa usou `gh` local, sem criar PAT e sem imprimir token. Repo público suporta rulesets no plano atual.
Fontes: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets e https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches .
## Allowlist
Somente `.github/workflows/koros-governance.yml`, `.github/scripts/check-docs.mjs`, `governance/KOR-GOV-002.md`, `evidence/KOR-GOV-002/README.md`. Work Order independente da PR #1, sem edição na main. GitHub Actions é infraestrutura de governança e não software MVP.
## Configuração aplicada (ruleset 26074776)
- Ruleset ativo `KOROS — Protected Main` (`id=26074776`) apenas em `refs/heads/main`; `bypass_actors=[]` e `current_user_can_bypass=never`.
- Regras ativas: `pull_request`, `deletion`, `non_fast_forward`, `required_linear_history`; `required_review_thread_resolution=true`.
- Required approving reviews: **0** porque não existe revisor independente com write; `COMMENTED` não conta como aprovação. Revisão independente segue exigida pelo processo, sem automação possível hoje.
- Required check `governance-docs`: **NÃO ativado**. O check foi observado com sucesso em PR real (app GitHub Actions, contexto exato), mas o workflow não está na `main`; ativação criaria check órfão. Checks Socket seguem informativos.
- Preferências do repo: `allow_squash_merge=true`, `allow_merge_commit=false`, `allow_rebase_merge=false`, `allow_auto_merge=false`; read-back confirmado.
## Estratégia de prova e resultados
1. CI positivo: `governance-docs` SUCCESS no HEAD real da PR #2 (run `40752683127`, job `123043259313`), incluindo autotestes de link quebrado, path escape e segredo sintético.
2. Read-back administrativo: `GET /rulesets/26074776` e `GET /rules/branches/main` confirmam as regras na main; `protected=true`.
3. Enforcement negativo em branch descartável `governance-proof/KOR-GOV-002` com ruleset temporário `26074814`, sem bypass: push direto rejeitado (`Changes must be made through a pull request`), force-push rejeitado (`Cannot force-push to this branch`) e exclusão rejeitada (`Cannot delete this branch`). Recursos descartáveis removidos.
4. Revalidado: PR #1 Draft/intacta, SHA da main, ausência de bypass e Evidence Bundle atualizado.
## Acceptance / STOP
Aceitação parcial: ruleset, squash-only e enforcement foram aplicados e demonstrados. Required checks continuam **BLOCKED** enquanto o produtor não estiver na main; revisão independente não é automação disponível. Sem merge, deploy, gastos, dados reais, ECC ou alterações em projeto MVP.

## Sequência obrigatória para evitar checks órfãos
O workflow `governance-docs` está apenas na branch da PR #2 enquanto ela não for mesclada. **Não habilitar como required agora:** a PR #1 partiu de `main` antes desse workflow existir e pode não produzir esse job. Fluxo seguro: autorização humana para integrar check producer via PR normal após segurança/gates → verificar o job em `main` e em PRs de teste → sincronizar PR #1 com a `main` de modo não destrutivo e revalidar todos os seus testes/reviews → somente então marcar `governance-docs` como obrigatório. Administrar rulesets pode ocorrer em ordem compatível, inicialmente exigindo PR/sem force-push/deletion, mas sem check obrigatório órfão.

## Segurança do runner
Primeiro run do checkout v4.2.2 pinado em `11bd719...` passou, mas logs alertaram runtime Node 20 depreciado/forçado para Node 24. Correction Delta fixa `actions/checkout@v7.0.1` no commit oficial `3d3c42e5aac5ba805825da76410c181273ba90b1`, obtido da referência Git de `actions/checkout`. Verificado no HEAD `53a1f4f…`: run `40752683127` concluiu SUCCESS com o pin v7.0.1.

## Referências internas verificáveis
[Evidence Bundle](../evidence/KOR-GOV-002/README.md) · [README raiz](../README.md)
