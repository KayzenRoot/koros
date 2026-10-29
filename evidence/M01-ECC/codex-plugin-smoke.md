# Evidence Bundle KOR-M01-ECC-03 — trust nativo, hook e limites do Desktop

**Data:** 2026-10-29. **Issue:** [#8](https://github.com/KayzenRoot/koros/issues/8). **Branch:** `evidence/KOR-M01-ECC-03-install`. **Base:** `docs/KOR-M01-ECC-PLAN-001` @ `c4cb4c54ec82b05533abcf6acd9710299645170f`. **Classificação:** NECESSARY. **Custo:** R$0. **Veredito:** **BLOCKED** no gate Desktop; trust nativo lido e hook comprovado no CLI.

## 1. Context Lock

| Item | Valor observado |
|---|---|
| `main` | `30819b2622d5dc865931d5c55e9e9e9586648276`, protegida |
| PR #21 (base) | `OPEN`, Draft, HEAD `c4cb4c54ec82b05533abcf6acd9710299645170f` |
| PR #22 | `OPEN`, Draft, HEAD anterior `69c5323426cbf769b0263c212e32f4cdb4c6658b` |
| Issue #8 | `OPEN` |
| Autenticação | `gh` como `KayzenRoot`, `admin=true` |
| Codex CLI | `0.162.1` |
| Codex Desktop | `26.1023.6621.0` — app `ChatGPT`/`OpenAI.Codex` |

Nenhum token, credencial ou conteúdo de `auth.json` foi lido ou publicado.

## 2. Instalação preservada

| Item | Valor |
|---|---|
| Marketplace HEAD | `c05b2d6614f62f6db0047669aa4eefb223d478f9` (`v2.2.3`) |
| Cache HEAD | `c05b2d6614f62f6db0047669aa4eefb223d478f9` |
| Plugin | `ecc@ecc` `2.2.3`, habilitado, uma única entrada |
| Config | `[marketplaces.ecc] ref = c05b2d6…` |
| Cache checker | PASS |
| Sync legado / duplicata | ausente |
| MCP `chrome-devtools` | `enabled=false` |

Não houve reinstalação nesta verificação; o estado foi apenas lido.

## 3. Backup preservado

- Backup completo fora do repositório: `<LOCAL_BACKUP_ROOT>`, 130 MB, 4726 arquivos.
- ACL com usuário/SYSTEM/Administradores e ACE `CodexSandboxUsers` (ReadAndExecute) aplicado pelo ambiente Codex; a remoção exige `SeSecurityPrivilege` e não foi tentada.
- Snapshot pré-realinhamento com configs e hashes para rollback.
- Hashes atuais: config `2c606e64…` (antes do /hooks); hook `57edf21e…`; `AGENTS.md` `4b7b63cd…`.

## 4. Capacidades e 12 skills

O release tem 293 skills; 12 estão selecionadas e não desabilitadas:

`tdd-workflow`, `verification-loop`, `security-review`, `plan-canvas`, `plan-orchestrate`, `api-design`, `living-docs-governance`, `architecture-decision-records`, `mcp-server-patterns`, `skill-comply`, `agent-architecture-audit`, `security-scan`.

As outras 281 estão `enabled=false` via `[[skills.config]]`; nada foi apagado. As skills mais novas `docs-governance`, `mcp-dependency-review` e `skill-host-compat` não existem no release; foram usadas as equivalentes reais.

## 5. Smokes CLI (distintos do Desktop)

Em `codex exec --sandbox read-only`, sem `--dangerously-bypass-hook-trust`:

| Smoke | Resultado |
|---|---|
| `$tdd-workflow` — plano red-green | **PASS** |
| `$security-review` — riscos de SQL injection e correção | **PASS** |
| Aviso de orçamento de skills | ausente |

Esses resultados são do Codex CLI e não são usados como prova do Desktop.

## 6. Trust nativo do `SessionStart` — read-back e execução

### Read-back somente leitura

O config foi atualizado pelo owner às `2026-10-29 18:16:30` com:

```
[hooks.state."ecc@ecc:hooks/codex-hooks.json:session_start:0:0"]
trusted_hash = "sha256:323e81078cae514b4f174616936588fa47fadf2c23fc314568d00f25d53ccff1"
trusted_content_hash = "sha256:8a906232b39478953771130c6344a15b302e52292a565f6c2df563b035e9ffc7"
enabled = true
```

Não editei nem repeti trust. O arquivo `hooks/codex-hooks.json` do ECC `v2.2.3` tem SHA-256 bruto `57edf21e…`. Os valores de trust são derivados pelo host e **não coincidem com o SHA-256 bruto do arquivo**; o confronto direto é inconclusivo, mas a autorização nativa foi confirmada pela execução real abaixo.

### Execução positiva

Duas sessões reais `codex exec` (sem bypass) imprimiram:

```
hook: SessionStart
hook: SessionStart Completed
```

A sessão também criou `~/.claude/session-data`, confirmando a inicialização do hook.

### Execução negativa seletiva

- Criado `KOR-M01-ECC-03-expired-session.tmp` com mtime de 40 dias atrás.
- Criado `KOR-M01-ECC-03-fresh-session.tmp` com mtime atual.
- Executada uma sessão real com o hook confiado.
- Resultado: o arquivo **expirado foi removido**; o arquivo **fresco permaneceu**. O arquivo fresco sintético foi removido manualmente após o teste; `~/.claude/session-data` ficou vazio.
- Nenhum dado de sessão real do usuário foi tocado.

### Desktop

- O app `ChatGPT`/`OpenAI.Codex` `26.1023.6621.0` foi observado em uma conversa de projeto existente; a interface não expôs `/hooks`, página de hooks ou controle de nova sessão.
- O controle de UI permaneceu indisponível nesta sessão (`Computer control was stopped... Start a new session to continue`); não houve nova tentativa para evitar loop.
- Não foi possível executar `security-review`/`tdd-workflow` no Desktop nem provar o hook no Desktop. **Não simulei Desktop via CLI.**
- Status Desktop: **NOT_VERIFIED/BLOCKED**.

## 7. MCP read-only e veto de escrita

Teste direto do servidor fixado `chrome-devtools-mcp@1.10.1`, em `--headless --isolated`, com input/emulação/rede/performance/debug/memória desabilitados:

- Inicialização `chrome_devtools` `1.10.1`.
- 6 ferramentas expostas (`close_page`, `list_pages`, `navigate_page`, `new_page`, `select_page`, `wait_for`).
- `list_pages` → `about:blank [selected]`: **PASS**.
- Ferramentas de input expostas: **nenhuma**.
- `navigate_page` presente, mas **não invocado**; veto de cliente: **PASS**.
- O MCP real permanece desabilitado.

## 8. Idempotência e rollback

| Teste | Resultado |
|---|---|
| Instalação real: `plugin add` novamente | **PASS** — uma entrada `2.2.3` |
| Sandbox `v2.2.3`: install → add novamente | **PASS** — `1 → 1` |
| Sandbox `v2.2.3`: remove | **PASS** — `1 → 0` |
| Sandbox `v2.2.3`: re-add | **PASS** — `0 → 1` |

O rollback real não foi executado para não desfazer a correção; backup e snapshot permitem restaurar.

## 9. ECC Tools Free

- App `ecc-tools` instalado; publica comentários, **não check-runs**.
- Permissões: `contents: write`, `issues: write`, `metadata: read`, `pull_requests: write`.
- Free para repositórios públicos: 10 análises/mês, até 200 commits/análise.
- Pro **US$19/seat/mês não ativado**; sem gasto ou upgrade.
- Quota da conta **UNKNOWN**; nenhum `/ecc-tools analyze` disparado. Há comentários automáticos no PR #22.

## 10. Etiquetas

- 24/24 da paleta canônica verificadas.
- Extras: `decision:approved` → `16A34A`; `gate:local-access-required` → `F59E0B`.
- Nenhuma outra etiqueta alterada; 37 labels; 16 issues #5–#20 preservadas.

## 11. Matriz de gates

| Gate | Status |
|---|---|
| Context Lock e autenticação | **PASS** |
| Instalação `v2.2.3` / pin `c05b2d6` | **PASS** |
| Backup preservado | **PASS** |
| Cache checker / sem duplicata / sem sync legado | **PASS** |
| 12 skills selecionadas mantidas | **PASS** |
| `$tdd-workflow` no CLI | **PASS** |
| `$security-review` no CLI | **PASS** |
| Read-back do trust nativo | **PASS** — config atualizado às 18:16:30 |
| Hook positivo no CLI | **PASS** — `SessionStart Completed` |
| Hook negativo no CLI | **PASS** — expirado removido, fresco preservado |
| `security-review` no Codex Desktop | **NOT_VERIFIED/BLOCKED** |
| `tdd-workflow` no Codex Desktop | **NOT_VERIFIED/BLOCKED** |
| Hook positivo/negativo no Desktop | **NOT_VERIFIED/BLOCKED** |
| MCP no Codex Desktop | **NOT_VERIFIED/BLOCKED** |
| MCP read-only/veto direto | **PASS** |
| Idempotência real | **PASS** |
| Rollback em sandbox | **PASS** |
| Agentes ECC como subagentes Codex | **NOT_RUN/UNSUPPORTED** |
| ECC Tools Free / sem Pro | **PASS parcial**; quota **UNKNOWN** |
| Cores das etiquetas | **PASS** |
| CI do HEAD desta atualização | verificado após o push; resultado no parecer final |

## 12. Veredito e riscos

**BLOCKED** no gate Desktop. O trust nativo foi lido, o hook executa em sessões reais do CLI (positivo e negativo) e os demais gates CLI/MCP/pin/skills/rollback/etiquetas passaram. Os smokes exigidos no Codex Desktop permanecem **NOT_VERIFIED/BLOCKED** porque o controle de UI não estava disponível e a interface observada não expôs nova sessão/trust.

Riscos residuais:
- **Alto:** hook e skills não comprovados no Desktop.
- **Médio:** o hash de trust é derivado pelo host e não coincide com o SHA-256 bruto do arquivo; a prova funcional é a execução, não a igualdade literal.
- **Médio:** agentes ECC não são expostos como subagentes pelo `plugin.json`.
- **Médio:** ECC Tools tem permissões de escrita e quota Free desconhecida.
- **Baixo:** backup contém ACE `CodexSandboxUsers` (RX); remoção exige elevação e não foi tentada.

## 13. Próxima ação NECESSARY

1. Abrir uma sessão controlável no Codex Desktop (nova conversa/aba Codex) e executar `$security-review` e `$tdd-workflow`; registrar as respostas e a origem das skills.
2. Confirmar o hook `SessionStart` no Desktop e repetir o caso negativo com arquivo sintético.
3. Manter `chrome-devtools` desabilitado; se testar MCP, usar read-only e veto de escrita.
4. Atualizar esta evidência e a issue #8; somente então avaliar `IMPLEMENTED_VERIFIED`/GO.

## 14. Limites preservados

Sem merge, alteração da `main`, deploy, gasto, bypass, implementação do MVP ou KOR-DISC-002. A instalação real está no release `v2.2.3`; o MCP permanece desabilitado; o trust não foi editado nem repetido.

## Rastreamento

[Runbook](https://github.com/KayzenRoot/koros/blob/evidence/KOR-M01-ECC-03-install/docs/modules/M01-ECC/install-runbook-windows.md) · [Work Order](https://github.com/KayzenRoot/koros/blob/docs/KOR-M01-ECC-PLAN-001/docs/modules/M01-ECC/ecc-local-execution-wo.md) · [README do módulo](https://github.com/KayzenRoot/koros/blob/docs/KOR-M01-ECC-PLAN-001/docs/modules/M01-ECC/README.md)
