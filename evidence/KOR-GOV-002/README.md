# Evidence Bundle KOR-GOV-002 — preflight
**Data:** 2026-10-28; **Estado inicial:** BLOCKED para controles administrativos.
- main SHA `57dd78a6eb2b39c1d07fdf2728de2cde20fda3b8` e apenas `README.md`; PR #1 Draft no HEAD `ba166dc7fc69435c3905b8c3864749b6a5f8adec`, sem merge.
- `GET /branches/main` → `protected=false`; `GET /rulesets` → `[]`; `GET /branches/main/protection` → 403 Resource not accessible by integration.
- Preferências de merge: squash=true, merge-commit=true, rebase=true; auto-merge=false.
- Dois check-runs Socket em HEAD da PR #1, ambos success; PR Alerts observou ausência de mudanças de dependências. Não evidenciam enforcement nem teste do produto.
- GitHub Free permite rulesets em repositórios públicos (documentação oficial). Capacidade da conexão GitHub atual: leituras de rulesets, mas não existe action de escrita administrativa para essas regras.
- Branch `governance/KOR-GOV-002` destina-se apenas a check producer/documentação. Testes e checks no seu HEAD devem ser preenchidos por read-back após publicação, **não antecipar sucesso**.
- Testes de enforcement real, branch main protegida, regras e required checks: **NOT_RUN / BLOCKED** até acesso administrativo.
- Nenhuma instalação, gasto, implementação MVP, deploy ou alteração da main. PR #1 preservada Draft.

## Checkpoint Delta PROPOSTO
Work Order versionada em PR separada e produtor de checks potencialmente executável, sem declarar ruleset instalado. Estado final será documentado no parecer GitHub com SHA verificável; nunca promover checkpoints da PR #1.
