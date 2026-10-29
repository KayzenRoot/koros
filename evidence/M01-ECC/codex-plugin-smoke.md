# Evidence Bundle KOR-M01-ECC-03 — v2.2.3, trust nativo e smokes

**Data:** 2026-10-29. **Issue:** [#8](https://github.com/KayzenRoot/koros/issues/8). **Branch:** `evidence/KOR-M01-ECC-03-install`. **Base:** `docs/KOR-M01-ECC-PLAN-001` @ `c4cb4c54ec82b05533abcf6acd9710299645170f`. **Classificação:** NECESSARY. **Custo:** R$0. **Veredito:** **BLOCKED** no gate de trust nativo do hook; instalação e smokes CLI/MCP verificados.

## 1. Context Lock

| Item | Valor observado |
|---|---|
| `main` | `30819b2622d5dc865931d5c55e9e9e9586648276`, protegida |
| PR #21 (base) | `OPEN`, Draft, HEAD `c4cb4c54ec82b05533abcf6acd9710299645170f` |
| PR #22 | `OPEN`, Draft, HEAD anterior `b10d0a2e6d5f441ae4cc2d9233486c84ef166e4b` |
| Issue #8 | `OPEN` |
| Autenticação | `gh` como `KayzenRoot`, `admin=true` |
| Codex CLI | `0.162.1` (requisito `>= 0.146.0`: atendido) |
| Codex Desktop | `26.1023.6621.0` — app `ChatGPT`/`OpenAI.Codex`, em execução |

Nenhum token, credencial ou conteúdo de `auth.json` foi lido ou publicado.

## 2. Instalação corrigida e preservada

O release oficial `v2.2.3` está instalado e alinhado ao SHA `c05b2d6614f62f6db0047669aa4eefb223d478f9`:

| Item | Valor |
|---|---|
| Marketplace HEAD | `c05b2d6614f62f6db0047669aa4eefb223d478f9` |
| Cache HEAD | `c05b2d6614f62f6db0047669aa4eefb223d478f9` |
| Plugin | `ecc@ecc` `2.2.3`, habilitado, **uma única entrada** |
| Config | `[marketplaces.ecc] ref = c05b2d6…`; `source = https://github.com/affaan-m/ECC.git` |
| Cache checker | PASS — referências do manifesto resolvem |
| Sync legado / duplicata | ausente |
| MCP `chrome-devtools` | `enabled=false` |

Não houve reinstalação nesta continuação; o estado acima foi apenas lido de volta.

## 3. Backup preservado

- Backup completo fora do repositório: `<LOCAL_BACKUP_ROOT>`, 130 MB, 4726 arquivos, ACL restrita a usuário/SYSTEM/Administradores.
- Snapshot pré-realinhamento com `config.toml` anterior, `config-after-reinstall.toml`, `config-before-skills.toml`, lista de plugins e hashes.
- Hashes atuais: config `2c606e64…`; hook `57edf21e…`; `AGENTS.md` `4b7b63cd…`.
- O backup contém configuração local e não foi publicado.

## 4. Capacidades do release e skills mantidas

O release tem 293 skills; 12 estão selecionadas e **não desabilitadas**:

`tdd-workflow`, `verification-loop`, `security-review`, `plan-canvas`, `plan-orchestrate`, `api-design`, `living-docs-governance`, `architecture-decision-records`, `mcp-server-patterns`, `skill-comply`, `agent-architecture-audit`, `security-scan`.

As outras 281 estão `enabled=false` via `[[skills.config]]`; nada foi apagado. `[skills] max_context_tokens = 10_000` permanece. As skills mais novas `docs-governance`, `mcp-dependency-review` e `skill-host-compat` não existem no release; foram usadas as equivalentes reais acima.

## 5. Smokes CLI (distintos do Desktop)

Em `codex exec --sandbox read-only`, sem `--dangerously-bypass-hook-trust`:

| Smoke | Resultado |
|---|---|
| `$tdd-workflow` — plano red-green de 3 passos | **PASS** |
| `$security-review` — riscos de SQL injection e correção | **PASS** |
| Aviso de orçamento de skills | ausente após a seleção |

Esses resultados são do **Codex CLI**. Não são usados como prova do Desktop.

## 6. Trust do hook `SessionStart` — investigação oficial

### O que o host exige

A documentação oficial de hooks informa que hooks fornecidos por plugin **não são auto-confiados**. Antes de executar um hook não gerenciado, o Codex exige revisão e trust da definição exata; o trust é registrado contra o hash atual do hook e hooks alterados ficam **skipped until trusted**. O mecanismo documentado é `/hooks` no CLI, para inspecionar a origem, revisar hooks novos/alterados e confiar. `--dangerously-bypass-hook-trust` é explicitamente um bypass e **não foi usado**.

### Hashes observados

| Item | SHA-256 |
|---|---|
| Hook instalado (`hooks/codex-hooks.json`) | `57edf21eb83d9c8144cfdc19f621700a854b6fd4abc4c368ddaeb5c74488b43c` |
| `trusted_hash` no config | `af11f84aded85744187d170760b246406606904c3dd46b9dfbf6e17edc594fdc` |
| `trusted_content_hash` no config | `3cbe25e3f5c727db9feb5274a5a3753a9267ef75cbf29df3b6602f6283b664f4` |
| `.hook-trust/207fad…` | `sha256:3cbe25e3…` |

O Codex `0.162.1` alerta que `trusted_content_hash` é um campo **ignorado** nesta versão. Os hashes registrados não correspondem ao hook atual `57edf21e…`; portanto, o hook não está comprovadamente confiado para o conteúdo `v2.2.3`.

### O que foi testado no CLI

- `codex exec` sem bypass executou normalmente, mas **não exibiu prompt de trust nem comprovou execução do `SessionStart`** (sem lease/evento de hook no rollout).
- O `exec` não é prova de que o Desktop executa hooks; a documentação não estabelece que ele dispare `SessionStart`.

### O que foi observado no Desktop

- App `ChatGPT`/`OpenAI.Codex` `26.1023.6621.0`, janela de projeto existente; a interface não expôs `/hooks`, página de hooks ou prompt de trust. A conversa existente do usuário **não foi alterada**.
- O bundle do app contém strings `SessionStart`, `hook trust` e `hooks.state`, indicando que o host conhece hooks; não foi localizado um caminho de UI legítimo para concluir o trust.
- O atalho de nova conversa não criou uma sessão nova; não foi tentado novamente para evitar loop.

### Solicitação humana legítima

Para concluir este gate, executar em um terminal local:

```text
codex
/hooks
```

Revisar o hook ECC `SessionStart` cuja origem é `<CODEX_HOME>\plugins\cache\ecc\ecc\2.2.3\hooks\codex-hooks.json` (id `session:start`) e confiar no hash atual `57edf21e…` pela própria UI do `/hooks`. Não editar `trusted_hash`/`trusted_content_hash` manualmente e não usar `--dangerously-bypass-hook-trust`.

Até essa confirmação nativa, o gate permanece **BLOCKED**.

## 7. MCP read-only e veto de escrita

Teste direto do servidor fixado `chrome-devtools-mcp@1.10.1`, em `--headless --isolated`, com input/emulação/rede/performance/debug/memória desabilitados:

- Inicialização `chrome_devtools` `1.10.1`.
- 6 ferramentas expostas (`close_page`, `list_pages`, `navigate_page`, `new_page`, `select_page`, `wait_for`).
- `list_pages` → `about:blank [selected]`: **PASS**.
- Ferramentas de input expostas: **nenhuma**.
- `navigate_page` presente, mas **não invocado**; veto de cliente registrado: **PASS**.
- O MCP real permanece desabilitado; nenhuma escrita foi habilitada no Codex.

## 8. Idempotência e rollback

| Teste | Resultado |
|---|---|
| Instalação real: `plugin add` novamente | **PASS** — continua uma entrada `2.2.3` |
| Sandbox `v2.2.3`: install → add novamente | **PASS** — `1 → 1` |
| Sandbox `v2.2.3`: remove | **PASS** — `1 → 0` |
| Sandbox `v2.2.3`: re-add | **PASS** — `0 → 1` |

O rollback real não foi executado para não desfazer a correção; backup e snapshot permitem restaurar.

## 9. ECC Tools Free

- App `ecc-tools` instalado; publica comentários (`ecc-tools[bot]`) e **não publica check-runs**.
- Permissões: `contents: write`, `issues: write`, `metadata: read`, `pull_requests: write`; eventos `issue_comment`, `pull_request`, `push`.
- Free para repositórios públicos: 10 análises/mês, até 200 commits/análise.
- Pro **US$19/seat/mês não ativado**; nenhum gasto ou upgrade.
- Quota da conta **UNKNOWN**; nenhum `/ecc-tools analyze` foi disparado. O App postou comentários automáticos no PR #22, sem check-runs.

## 10. Etiquetas

- 24/24 etiquetas da paleta canônica verificadas.
- Extras: `decision:approved` → `16A34A`; `gate:local-access-required` → `F59E0B`.
- Nenhuma outra etiqueta alterada; 37 labels; 16 issues #5–#20 preservadas.

## 11. Matriz de gates

| Gate | Status |
|---|---|
| Context Lock e autenticação | **PASS** |
| Instalação `v2.2.3` e pin `c05b2d6` | **PASS** |
| Backup local e ACL | **PASS** |
| Cache checker e ausência de duplicata/sync legado | **PASS** |
| 12 skills selecionadas mantidas | **PASS** |
| `$tdd-workflow` no CLI | **PASS** |
| `$security-review` no CLI | **PASS** |
| Agentes ECC como subagentes Codex | **NOT_RUN/UNSUPPORTED** |
| MCP read-only e veto de escrita | **PASS** |
| Idempotência real | **PASS** |
| Rollback em sandbox | **PASS** |
| Trust oficial do `SessionStart` | **BLOCKED** — requer `/hooks` humano |
| Hook positivo/negativo no Desktop | **BLOCKED** |
| Skills no Codex Desktop | **NOT_RUN/BLOCKED** — sem superfície de trust/plugin localizada |
| MCP no Codex Desktop | **NOT_RUN/BLOCKED** |
| ECC Tools Free / sem Pro | **PASS parcial**; quota **UNKNOWN** |
| Cores das etiquetas | **PASS** |
| CI do HEAD desta atualização | verificado após o push; resultado no parecer final |

## 12. Veredito e riscos

**BLOCKED** no gate de trust nativo do hook `SessionStart`. A instalação `v2.2.3`, a seleção das 12 skills, os smokes CLI, o MCP read-only, a idempotência, o rollback em sandbox e as etiquetas passaram. O hook e os smokes no Desktop não podem ser declarados sem a confirmação nativa via `/hooks`.

Riscos residuais:
- **Alto:** hook `SessionStart` não confiado para o hash atual; execução não comprovada.
- **Médio:** o app Desktop observado não expôs `/hooks`/trust; pode ser necessária uma versão/interface compatível.
- **Médio:** agentes ECC não são expostos como subagentes pelo `plugin.json` do Codex.
- **Médio:** ECC Tools tem permissões de escrita e quota Free desconhecida.
- **Baixo:** MCP direto expõe ferramentas de navegação; veto foi de cliente e o MCP real está desabilitado.

## 13. Próxima ação NECESSARY

1. Executar `codex` e `/hooks` no terminal local.
2. Revisar o hook ECC `SessionStart` em `<CODEX_HOME>\plugins\cache\ecc\ecc\2.2.3\hooks\codex-hooks.json`.
3. Confiar no hash atual `57edf21e…` pela UI oficial do `/hooks`.
4. Reabrir o Codex Desktop e executar os smokes de hook positivo/negativo e skills; sem bypass.
5. Confirmar a quota Free do ECC Tools; manter Pro desativado.
6. Atualizar esta evidência e a issue #8; somente então avaliar `IMPLEMENTED_VERIFIED`.

## 14. Limites preservados

Sem merge, alteração da `main`, deploy, gasto, bypass, implementação do MVP ou KOR-DISC-002. A instalação real está no release `v2.2.3`; o MCP permanece desabilitado; a conversa existente do app Desktop não foi alterada.

## Rastreamento

[Runbook](https://github.com/KayzenRoot/koros/blob/evidence/KOR-M01-ECC-03-install/docs/modules/M01-ECC/install-runbook-windows.md) · [Work Order](https://github.com/KayzenRoot/koros/blob/docs/KOR-M01-ECC-PLAN-001/docs/modules/M01-ECC/ecc-local-execution-wo.md) · [README do módulo](https://github.com/KayzenRoot/koros/blob/docs/KOR-M01-ECC-PLAN-001/docs/modules/M01-ECC/README.md)
