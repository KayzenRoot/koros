# Evidence Bundle KOR-M01-ECC-03 — correção para v2.2.3 e smokes

**Data:** 2026-10-29. **Issue:** [#8](https://github.com/KayzenRoot/koros/issues/8). **Branch:** `evidence/KOR-M01-ECC-03-install`. **Base:** `docs/KOR-M01-ECC-PLAN-001` @ `c4cb4c54ec82b05533abcf6acd9710299645170f`. **Classificação:** NECESSARY. **Custo:** R$0. **Veredito:** **BLOCKED** (Desktop/hook trust não comprovados; instalação CLI corrigida e verificada).

## 1. Context Lock

| Item | Valor observado |
|---|---|
| `main` | `30819b2622d5dc865931d5c55e9e9e9586648276`, protegida |
| PR #21 (base) | `OPEN`, Draft, HEAD `c4cb4c54ec82b05533abcf6acd9710299645170f` |
| PR #22 | `OPEN`, Draft, HEAD anterior `729b913c1b6ea3a8e5c75607622c155f60c206dd` |
| Issue #8 | `OPEN` |
| Autenticação | `gh` como `KayzenRoot`, `admin=true` |
| SO | Windows 10.0.26200 x64, Git Bash, PowerShell `5.1.26100.9711` |
| Codex CLI | `0.162.1` (requisito `>= 0.146.0`: atendido) |
| Codex Desktop | `26.1023.6621.0` (app `ChatGPT`/`OpenAI.Codex`), em execução |

Nenhum token, credencial ou conteúdo de `auth.json` foi lido ou publicado.

## 2. Estado anterior e correção aplicada

O estado pré-correção tinha `ecc@ecc` instalado a partir de `main` (`25278e7…`), enquanto o `config.toml` pinava o release `v2.2.3` (`c05b2d6…`): 1017 commits e 906 arquivos de diferença. O trust do hook também estava stale.

Correção executada com o CLI oficial, sem sync legado e sem bypass:

```text
codex plugin remove ecc@ecc
codex plugin marketplace remove ecc
codex plugin marketplace add https://github.com/affaan-m/ECC.git --ref c05b2d6614f62f6db0047669aa4eefb223d478f9 --json
codex plugin add ecc@ecc --json
```

Read-back:

| Item | Valor |
|---|---|
| Marketplace HEAD | `c05b2d6614f62f6db0047669aa4eefb223d478f9` (`v2.2.3`) |
| Cache HEAD | `c05b2d6614f62f6db0047669aa4eefb223d478f9` |
| Plugin | `ecc@ecc`, versão `2.2.3`, habilitado, **uma única entrada** |
| Config | `[marketplaces.ecc] ref = c05b2d6…`, `source = https://github.com/affaan-m/ECC.git` |
| Cache checker | PASS — todas as referências do manifesto resolvem |
| Sync legado | ausente; nenhum skill ECC fora do plugin |
| MCP `chrome-devtools` | `enabled=false` no config e `disabled` em `codex mcp list` |

## 3. Backup preservado

- Backup completo fora do repositório: `<LOCAL_BACKUP_ROOT>`, 130 MB, 4726 arquivos, ACL restrita a usuário/SYSTEM/Administradores.
- Snapshot pré-realinhamento com `config.toml` anterior, `config-after-reinstall.toml`, `config-before-skills.toml`, lista de plugins e hashes.
- Hashes relevantes: config atual `2c606e64…`; hook `57edf21e…`; `AGENTS.md` `4b7b63cd…`.
- O backup não foi publicado; contém configuração local, sem tokens no GitHub.

## 4. Capacidades do release v2.2.3

O release contém as capacidades necessárias, com nomes reais diferentes dos usados em `main`:

| Necessidade | Skill/agente no release |
|---|---|
| TDD e verificação | `tdd-workflow`, `verification-loop` |
| Segurança e revisão | `security-review`, agente `security-reviewer`, agente `code-reviewer` |
| Planejamento | `plan-canvas`, `plan-orchestrate`, agente `planner` |
| Docs/ADR | `living-docs-governance`, `architecture-decision-records` |
| API/contratos | `api-design` |
| MCP/skills | `mcp-server-patterns`, `skill-comply`, `agent-architecture-audit`, `security-scan` |
| Arquitetura/docs lookup | agentes `architect`, `docs-lookup` |

As skills mais novas `docs-governance`, `mcp-dependency-review` e `skill-host-compat` **não existem no release**; as equivalentes acima foram usadas. O release contém 68 arquivos de agentes, mas o `plugin.json` do Codex expõe apenas `skills`, `mcpServers` e `hooks` — os agentes são catálogo, não subagentes carregados pelo plugin Codex.

## 5. Seleção operacional de skills

O catálogo do release tem 293 skills e excedia o orçamento inicial do Codex. A seleção foi aplicada pelo mecanismo oficial `[[skills.config]]`, desabilitando 281 skills ECC não selecionadas e mantendo 12; `[skills] max_context_tokens = 10_000` já estava configurado. Nada foi apagado.

Smokes no CLI, em `--sandbox read-only`, sem bypass de hook trust:

| Teste | Resultado |
|---|---|
| `$tdd-workflow` — plano red-green de 3 passos | **PASS** |
| `$security-review` — revisão de SQL injection sintética | **PASS** |
| Aviso de orçamento de skills | desapareceu após a seleção |

Os smokes foram executados no **Codex CLI**, não no Desktop. O evento de sessão não mostrou falha de skill.

## 6. Hook `SessionStart` e trust

- Hook instalado (`v2.2.3`): `57edf21eb83d9c8144cfdc19f621700a854b6fd4abc4c368ddaeb5c74488b43c`.
- Config: `trusted_hash = af11f84a…`; `trusted_content_hash = 3cbe25e3…`.
- `codex exec` sem `--dangerously-bypass-hook-trust` alertou: `hooks.state…trusted_content_hash is ignored` (campo não reconhecido nesta versão). Não houve prompt de trust nem lease `SessionStart` no rollout; a execução do hook não foi comprovada.
- O app Desktop observado (`ChatGPT`/`OpenAI.Codex 26.1023.6621.0`) abriu uma conversa de projeto existente e não expôs superfície de plugin/hook trust; o atalho de nova conversa não criou sessão nova. A conversa do usuário não foi alterada.
- **Não** foi editado `trusted_content_hash`, **não** foi usado `--dangerously-bypass-hook-trust` e **não** houve re-trust manual.

Status: **BLOCKED/NOT_RUN** — o trust oficial exige reinício/prompt humano no Desktop e não foi possível prová-lo nesta sessão.

## 7. MCP read-only e veto de escrita

O MCP ECC permanece desabilitado na instalação real. Foi feito um smoke direto do servidor fixado `chrome-devtools-mcp@1.10.1`, em `--headless --isolated`, com categorias de input/emulação/rede/performance/debug/memória desabilitadas:

- Inicialização: `chrome_devtools` `1.10.1`.
- Ferramentas expostas: 6 (`close_page`, `list_pages`, `navigate_page`, `new_page`, `select_page`, `wait_for`).
- Leitura: `list_pages` → `about:blank [selected]` — **PASS**.
- Ferramentas de input expostas: **nenhuma**.
- `navigate_page` presente, mas **não invocado**: veto de cliente registrado (`invoked=false`) — **PASS** de veto.
- O servidor foi encerrado; nenhum perfil real do Chrome foi usado.
- O MCP real continua desabilitado; este teste não habilita escrita no Codex.

## 8. Idempotência e rollback

| Teste | Resultado |
|---|---|
| `codex plugin add ecc@ecc` novamente na instalação real | **PASS** — continua uma entrada, versão `2.2.3`, heads `c05b2d6…` |
| Sandbox `v2.2.3`: install → add novamente | **PASS** — `1 → 1` |
| Sandbox `v2.2.3`: remove | **PASS** — `1 → 0` |
| Sandbox `v2.2.3`: re-add (restauração) | **PASS** — `0 → 1` |

O rollback real não foi executado para não desfazer a correção; o backup completo e o snapshot pré-realinhamento permitem restaurar o estado anterior.

## 9. ECC Tools Free

- App `ecc-tools` instalado; publica comentários (`ecc-tools[bot]`) e **não publica check-runs**.
- Permissões: `contents: write`, `issues: write`, `metadata: read`, `pull_requests: write`; eventos `issue_comment`, `pull_request`, `push`.
- Plano Free: repositórios públicos, 10 análises/mês, até 200 commits/análise. Pro **US$19/seat/mês não ativado**.
- Quota da conta **UNKNOWN**; nenhum `/ecc-tools analyze` foi disparado nesta execução.
- O template `.claude/ecc-tools.json` do OSS declara `tier: enterprise`/`full`, mas não é assinatura paga desta conta. Risco registrado.

## 10. Etiquetas

- 24/24 etiquetas da paleta canônica com cor exata.
- Extras autorizadas: `decision:approved` → `16A34A`; `gate:local-access-required` → `F59E0B`.
- `NONPALETTE_CHANGED=0`; total de 37 etiquetas; issues #5–#20 (16) preservadas.
- Fonte: [taxonomia](https://github.com/KayzenRoot/koros/blob/docs/KOR-M01-ECC-PLAN-001/docs/modules/M01-ECC/github-labels.md).

## 11. Matriz de testes

| Teste | Status |
|---|---|
| Context Lock e autenticação | **PASS** |
| Release `v2.2.3` contém capacidades necessárias | **PASS** (equivalentes reais) |
| Backup local e ACL | **PASS** |
| Pin/marketplace/cache em `c05b2d6` | **PASS** |
| Cache checker oficial | **PASS** |
| Sem duplicata / sem sync legado | **PASS** |
| Seleção de skills (281 desabilitadas, 12 mantidas) | **PASS** |
| Skill `$tdd-workflow` no CLI | **PASS** |
| Skill `$security-review` no CLI | **PASS** |
| Agentes ECC como subagentes Codex | **NOT_RUN/UNSUPPORTED** (não expostos pelo `plugin.json`) |
| Hook `SessionStart` positivo | **BLOCKED** (trust/Desktop pendente) |
| Hook `SessionStart` negativo | **NOT_RUN** |
| Skill no Codex Desktop | **NOT_RUN/BLOCKED** (superfície de trust não exposta) |
| MCP read-only (`list_pages`) | **PASS** (servidor direto) |
| MCP escrita vetada | **PASS** (input ausente; `navigate_page` não invocado) |
| MCP real habilitado no Codex | **NOT_RUN** (mantido desabilitado) |
| Idempotência real | **PASS** |
| Rollback em sandbox | **PASS** |
| ECC Tools Free / sem Pro | **PASS parcial**; quota **UNKNOWN** |
| Cores das etiquetas | **PASS** |
| CI do HEAD desta atualização | verificado após o push; resultado no parecer final |

## 12. Veredito e riscos

**BLOCKED** para a declaração de ECC 100% funcional no Desktop. A correção de pin, a seleção de skills, os smokes CLI, o MCP read-only e a idempotência/rollback passaram; o hook `SessionStart` e as provas no Codex Desktop continuam pendentes de trust humano/oficial.

Riscos residuais:
- **Alto:** hook `SessionStart` não comprovado e trust do Desktop pendente.
- **Médio:** agentes ECC não são expostos como subagentes pelo plugin Codex.
- **Médio:** App ECC Tools tem permissões de escrita e quota Free desconhecida.
- **Baixo:** skills mais novas do `main` (`docs-governance`, `mcp-dependency-review`, `skill-host-compat`) não existem no release; foram substituídas por equivalentes.
- **Baixo:** MCP direto expõe ferramentas de navegação; o veto foi de cliente e o MCP real permanece desabilitado.

## 13. Próxima ação NECESSARY

1. Reiniciar o Codex Desktop e concluir o trust oficial do hook `SessionStart` (prompt humano; sem editar hash e sem `--dangerously-bypass-hook-trust`).
2. Executar no Desktop: skill de análise, skill de teste, hook positivo/negativo e MCP read-only com veto.
3. Confirmar quota ECC Tools no painel Free; não ativar Pro.
4. Atualizar esta evidência e a issue #8; somente então avaliar `IMPLEMENTED_VERIFIED`.

## 14. Limites preservados

Sem merge, sem alteração da `main`, sem bypass, sem deploy, sem gasto, sem KOR-DISC-002 e sem alterar a conversa existente do app Desktop. A instalação real foi corrigida para o release `v2.2.3`; o MCP ECC permanece desabilitado; as únicas mutações externas ao repositório foram as cores das etiquetas.

## Rastreamento

[Runbook](https://github.com/KayzenRoot/koros/blob/evidence/KOR-M01-ECC-03-install/docs/modules/M01-ECC/install-runbook-windows.md) · [Work Order](https://github.com/KayzenRoot/koros/blob/docs/KOR-M01-ECC-PLAN-001/docs/modules/M01-ECC/ecc-local-execution-wo.md) · [README do módulo](https://github.com/KayzenRoot/koros/blob/docs/KOR-M01-ECC-PLAN-001/docs/modules/M01-ECC/README.md)
