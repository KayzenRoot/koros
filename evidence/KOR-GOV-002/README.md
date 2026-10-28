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

## Teste real do produtor no HEAD inicial da PR #2
- PR #2 Draft, primeiro HEAD `5f927cff428f2d20f225efbf4e6c0b7ffcec42fb`; diff `ahead 1 / behind 0`, **4 arquivos somente da allowlist**.
- Workflow Actions run `40752303767`, job `123041940812`, nome exato `governance-docs`: **SUCCESS** no GitHub. Logs: `PASS: valid link, broken link, path escape, synthetic secret` e `Markdown files: 3; local links: 0; findings: 0`. Essas fixtures negativas provam **apenas a detecção do validador**, não bloqueio GitHub de PR/merge.
- Socket Security: PR Alerts e Project Report: **SUCCESS** no mesmo HEAD, mas PR Alerts apenas informou ausência de mudança de dependências.
- Aviso não bloqueante do checkout v4.2.2 Node20 → Node24 forçado. Correction Delta usa pin oficial v7.0.1; resultado no próximo HEAD ainda **PENDING**.
- **Lacuna estrutural:** PR #1 não possui o produtor do check enquanto `main` não tiver o workflow. Obrigatoriedade de check deve ser implantada só após merge autorizado do produtor, read-back e nova prova em PRs. NÃO mesclar nesta Work Order.
