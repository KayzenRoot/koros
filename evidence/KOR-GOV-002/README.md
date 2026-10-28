# Evidence Bundle KOR-GOV-002 — execução administrativa
**Data:** 2026-10-28 (UTC-03). **Repositório:** `KayzenRoot/koros` (público). **Identidade autorizada:** `KayzenRoot` (id `114633702`), sessão ativa do GitHub CLI em `github.com` (token no keyring; escopos `gist`, `read:org`, `repo`, `workflow`). `GET /repos/KayzenRoot/koros` → `permissions.admin=true`. Nenhum token, PAT ou segredo foi impresso, copiado ou registrado neste bundle.

## 1. Context Lock e preflight (pré-mutação)
| Item | Valor observado |
|---|---|
| `main` | `57dd78a6eb2b39c1d07fdf2728de2cde20fda3b8` |
| PR #1 (KOR-PLAN-001) | Draft, `headRefOid=ba166dc7fc69435c3905b8c3864749b6a5f8adec`, `baseRefOid=57dd78a…`, sem merge |
| PR #2 (KOR-GOV-002) | Draft, `headRefOid=53a1f4fb7779505a9fc51a3bcfe222d07f1bf7b5`, `baseRefOid=57dd78a…`, sem merge |
| Rulesets | `GET /rulesets` → `[]` (HTTP 200) |
| Branch protection | `GET /branches/main/protection` → HTTP 404 `Branch not protected` |
| Regras efetivas na main | `GET /rules/branches/main` → `[]` |
| `protected` inicial | `false` |
| Merge | squash=true, merge-commit=true, rebase=true, auto-merge=false |
| Permissão efetiva | `admin=true`, `maintain=true`, `push=true` |
| Revisores | único colaborador `KayzenRoot` (admin); `kayzenweb3` enviou review `COMMENTED` em #1 e #2 |

- `owner.type=User`, portanto não há rulesets de organização herdados.
- Workspace local `D:\Projects\koros` estava vazio e não era repositório git; nenhuma operação foi feita nele. Toda mutação usou a API oficial e um clone temporário em `%TEMP%`, removido após os testes.
- Checks observados no HEAD real da PR #2 (`53a1f4f…`): `governance-docs` (GitHub Actions, app id `15368`) **success**; `Socket Security: Pull Request Alerts` e `Socket Security: Project Report` (app id `156372`) **success**.
- `contents/.github/workflows?ref=main` → HTTP 404; árvore recursiva da `main` sem nenhum caminho `.github`. O workflow existe apenas em `governance/KOR-GOV-002` (blob `bd3cde1266b0e46dae36c2d7d905df26f5d1dea8`). Portanto o produtor `governance-docs` **não está na main**.

## 2. Configuração aplicada e read-back
- `POST /repos/KayzenRoot/koros/rulesets` → ruleset **`26074776`**, nome `KOROS — Protected Main`, `target=branch`, `enforcement=active`, `source_type=Repository`, condições `include=["refs/heads/main"]`, `exclude=[]`, `bypass_actors=[]`, `current_user_can_bypass=never`.
- Regras ativas: `deletion`, `non_fast_forward`, `required_linear_history`, `pull_request` com `allowed_merge_methods=["squash"]`, `required_approving_review_count=0`, `required_review_thread_resolution=true`, `dismiss_stale_reviews_on_push=false`, `require_code_owner_review=false`, `require_last_push_approval=false`.
- `GET /rulesets/26074776` → HTTP 200, conteúdo idêntico ao criado (sem bypass).
- `GET /rules/branches/main` → HTTP 200, os quatro tipos de regra retornados com `ruleset_id=26074776`.
- `GET /branches/main` → HTTP 200, `protected=true`, SHA inalterado `57dd78a6eb2b39c1d07fdf2728de2cde20fda3b8`.
- `PATCH /repos/KayzenRoot/koros` → `allow_squash_merge=true`, `allow_merge_commit=false`, `allow_rebase_merge=false`, `allow_auto_merge=false`; nova leitura confirma exatamente esses valores. `delete_branch_on_merge` permaneceu `false` (não foi alterado).
- Observação factual: a API retorna `require_extra_approval_for_unattributed_changes=true` no bloco `pull_request`, valor que **não integrou o payload enviado** (default da plataforma), sem bypass. Os commits atuais de #1 e #2 são atribuídos a `KayzenRoot` (`114633702+KayzenRoot@users.noreply.github.com`), portanto o parâmetro não os atinge nesta execução.
- O endpoint clássico de branch protection continua 404; `protected=true` deriva do ruleset. A prova usa `GET /rules/branches/main`, não apenas o campo `protected`.

### Antes → depois
| Controle | Antes | Depois | Prova |
|---|---|---|---|
| Ruleset na main | nenhum | `26074776` ativo | `GET /rulesets/26074776` |
| PR obrigatório | não | sim (`required_approving_review_count=0`) | `GET /rules/branches/main` |
| Exclusão / force-push | não | bloqueados | `GET /rules/branches/main` + testes negativos |
| Linear history | não | exigida | `GET /rules/branches/main` |
| Threads | não | resolução exigida | `GET /rules/branches/main` |
| Merge commit / rebase | permitidos | desabilitados | `GET /repos/KayzenRoot/koros` |
| Squash | permitido | único permitido | ruleset + settings |
| Bypass | n/a | nenhum | `bypass_actors=[]`, `current_user_can_bypass=never` |

## 3. Testes positivos (`READ_BACK_VERIFIED`)
- Ruleset existe, está `active` e cobre exclusivamente `refs/heads/main`.
- Regras de PR, exclusão, force-push e linear history aplicáveis à main.
- Squash é o único método de merge; auto-merge desabilitado.
- Nenhum bypass configurado e o usuário autenticado não pode contornar (`never`).
- Resolução de conversas ativa.
- `main` permanece em `57dd78a6eb2b39c1d07fdf2728de2cde20fda3b8`.
- PR #1 e PR #2 continuam `OPEN` e `Draft`, sem merge.

## 4. Testes negativos (`ENFORCEMENT_VERIFIED` em branch descartável)
- Branch descartável `governance-proof/KOR-GOV-002` criada a partir da main `57dd78a…`, commit sintético `6e9a2a8` (apenas `KOR-GOV-002-PROOF.md`, sem dados de clientes).
- Ruleset temporário **`26074814`**, mesmas regras, escopo `refs/heads/governance-proof/KOR-GOV-002`, `bypass_actors=[]`, `current_user_can_bypass=never`.
- Nenhum teste destrutivo foi executado na `main`, na PR #1 ou na PR #2.

| Teste | Comando | Resultado observado | Status |
|---|---|---|---|
| Push direto | `git push origin governance-proof/KOR-GOV-002` | HTTP remoto `GH013`: `Changes must be made through a pull request.` exit 1 | **PASS** |
| Force-push | `git push --force origin governance-proof/KOR-GOV-002` | `GH013`: `Cannot force-push to this branch` + `Changes must be made through a pull request.` exit 1 | **PASS** |
| Exclusão | `git push origin --delete governance-proof/KOR-GOV-002` | `GH013`: `Cannot delete this branch` exit 1 | **PASS** |

- Limpeza: `DELETE /rulesets/26074814` → **HTTP 204**; em seguida a branch foi excluída; `GET /branches/governance-proof/KOR-GOV-002` → HTTP 404; `GET /rulesets` lista apenas `26074776`; `main` inalterada.
- Limitação registrada: a prova negativa demonstra o motor de rulesets em branch descartável. O enforcement na `main` é demonstrado pelo read-back de `GET /rules/branches/main`; não houve tentativa destrutiva na `main`.

## 5. Required checks
- `governance-docs` observado com sucesso em PR real: run `40752683127`, job `123043259313`, app `github-actions` (id `15368`), contexto exato `governance-docs`.
- O workflow não está na `main` (404 no diretório e ausência de `.github` na árvore). Ativá-lo como obrigatório criaria check órfão para a PR #1 e para PRs futuras.
- Decisão: **não ativar required checks**. Classificação: `REQUIRED_CHECKS_BLOCKED_PENDING_AUTHORIZED_PRODUCER_MERGE`.
- Teste negativo de bloqueio de merge por CI: **NOT_RUN/BLOCKED**. Nenhum merge foi realizado e nenhum estado de check foi manipulado por API.
- Checks Socket permanecem informativos; não foram usados como substitutos de testes de código.

## 6. Política de revisão
- Configuração efetiva: `required_approving_review_count=0`, `required_review_thread_resolution=true`; `require_code_owner_review=false` e `require_last_push_approval=false`.
- Não existe revisor independente com permissão `write` no repositório. A conta `kayzenweb3` submeteu apenas reviews `COMMENTED`, que **não são aprovação**. Nenhuma identidade fictícia foi criada e nenhum review foi manipulado.
- A revisão humana independente continua sendo requisito do processo de engenharia, mas **não está automatizada** pelo GitHub nesta configuração. Limitação registrada como risco residual.

## 7. Estado final anterior à publicação deste arquivo
- `main`: `57dd78a6eb2b39c1d07fdf2728de2cde20fda3b8`, sem merge.
- PR #1: `OPEN`, `Draft`, HEAD `ba166dc7fc69435c3905b8c3864749b6a5f8adec`, intocada.
- PR #2: `OPEN`, `Draft`, HEAD `53a1f4fb7779505a9fc51a3bcfe222d07f1bf7b5` antes do commit que contém este arquivo.
- Recursos descartáveis removidos: ruleset `26074814` e branch `governance-proof/KOR-GOV-002`.
- Arquivos alterados nesta execução: somente este Evidence Bundle e `governance/KOR-GOV-002.md`, na branch da PR #2. Nenhum arquivo de aplicação/MVP foi modificado.
- Sem merge, deploy, gasto, upgrade, bypass, issue ou PR nova.

## 8. Resultado da auditoria
| Verificação | Resultado |
|---|---|
| `main` no SHA inicial | PASS |
| PR #1/#2 Draft e sem merge | PASS |
| Ruleset ativo e escopo somente `main` | PASS |
| Sem bypass | PASS |
| Merge squash único | PASS |
| Threads obrigatórias | PASS |
| Force-push/exclusão bloqueados (branch de prova) | PASS |
| Testes na `main` | NÃO EXECUTADOS (proibido) |
| Required checks ativos | BLOCKED (produtor ausente da main) |
| Configuração preexistente removida | NÃO |
| Arquivos de aplicação alterados | NÃO |
| Gasto/deploy realizados | NÃO |

- O commit que contém este arquivo altera o HEAD da PR #2; o workflow reexecuta em `synchronize`. O HEAD final e o resultado dos checks são verificados após o push e registrados no parecer final desta execução. Nenhum PASS é antecipado aqui.

## 9. Veredito
- **GO_COMPONENT:** ruleset de proteção da main, restrição a squash, bloqueio de force-push/exclusão e testes negativos.
- **BLOCKED:** required check `governance-docs` não ativado enquanto o produtor não estiver na `main`; revisão independente não automatizável.
- **Global: BLOCKED**, conforme §11 da Work Order — não há GO_GOVERNANCE com required checks pendentes.

### Risco residual
- **Alto:** ausência de revisor independente com `write`; aprovação automática não é exigível hoje.
- **Médio:** ausência de required checks ativos; regressões de CI não bloqueiam merge.
- **Baixo:** `require_extra_approval_for_unattributed_changes=true` (default da API) pode exigir aprovação extra para commits não atribuídos no futuro; não afeta os commits atuais, atribuídos a `KayzenRoot`.
- **Baixo:** endpoint clássico de branch protection continua 404; a proteção efetiva vem exclusivamente do ruleset, verificada por `/rules`.

## 10. Checkpoint Delta PROPOSTO
- Delta de governança aplicado: ruleset `26074776` ativo em `refs/heads/main`, squash como único merge, sem bypass, com enforcement negativo comprovado em branch descartável.
- Pendência bloqueante: integrar o produtor `governance-docs` à `main` por PR autorizada e, só depois de nova prova, ativá-lo como required check; revalidar PR #1 de forma não destrutiva.
- Nenhum checkpoint de código/MVP foi promovido. A PR #1 permanece intocada e Draft.

## Rastreamento interno
[Work Order KOR-GOV-002](../../governance/KOR-GOV-002.md) · [README raiz](../../README.md) · [Ruleset 26074776](https://github.com/KayzenRoot/koros/rules/26074776)
