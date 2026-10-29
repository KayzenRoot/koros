# Evidence Bundle KOR-M01-ECC-03 — ECC no Codex Desktop Windows

**Data:** 2026-10-29. **Issue:** [#8](https://github.com/KayzenRoot/koros/issues/8). **Branch desta evidência:** `evidence/KOR-M01-ECC-03-install`. **Base:** `docs/KOR-M01-ECC-PLAN-001` @ `c4cb4c54ec82b05533abcf6acd9710299645170f`. **Classificação:** NECESSARY. **Custo:** R$0. **Veredito:** **BLOCKED** (drift de proveniência + trust de hook stale + prova Desktop não executada).

## 1. Context Lock

| Item | Valor observado |
|---|---|
| `main` | `30819b2622d5dc865931d5c55e9e9e9586648276`, protegida |
| Branch de planejamento | `docs/KOR-M01-ECC-PLAN-001` @ `c4cb4c54ec82b05533abcf6acd9710299645170f` |
| Issue | #8 `OPEN` |
| Autenticação | `gh` em `github.com`, conta `KayzenRoot`, `admin=true` |
| SO | Windows 10.0.26200 (Windows 11), x64, pt-BR |
| Shell | Git Bash; Git `2.55.0.windows.3` |
| Node / npm | `26.4.0` / `11.17.0` |
| PowerShell | `5.1.26100.9711` |
| Codex CLI | `0.162.1` (requisito upstream `>= 0.146.0`: atendido) |
| Codex Desktop | `26.1023.6621.0` instalado; update `26.1027.3384.0` disponível |
| Desktop em execução | processos `codex` e `codex-computer-use-swift` presentes |

Nenhum token, PAT, credencial ou conteúdo de `auth.json` foi lido ou publicado.

## 2. Instalação ECC preexistente

- `codex plugin list --json`: **`ecc@ecc`**, versão declarada `2.2.3`, `installed=true`, `enabled=true`, marketplace `ecc`, origem git oficial `https://github.com/affaan-m/ECC.git`.
- Existe **um único** plugin `ecc`; não há duplicata.
- Marketplace local: HEAD `25278e7d7b6cf6e6a4e7a6c8e10f14ff22f0eb5b`, `main` oficial.
- Cache do plugin: HEAD `25278e7d7b6cf6e6a4e7a6c8e10f14ff22f0eb5b`; árvore limpa, exceto o diretório gerado `.codex-plugin/migrated-command-skills/`.
- `config.toml` declara `[marketplaces.ecc] ref = c05b2d6614f62f6db0047669aa4eefb223d478f9` (tag `v2.2.3`).
- Upstream: `main = 25278e7…` (commit verificado pelo GitHub, `verified=true`); release mais recente `v2.2.3` em `c05b2d6…` (2026-10-01).

### Drift material encontrado

| Item | Valor |
|---|---|
| Pin declarado | `c05b2d6614f62f6db0047669aa4eefb223d478f9` (`v2.2.3`) |
| Instalado (marketplace e cache) | `25278e7d7b6cf6e6a4e7a6c8e10f14ff22f0eb5b` (`main`) |
| Distância | 1017 commits; 906 arquivos; 105053 inserções e 7897 remoções |
| Manifesto | continua declarando versão `2.2.3` apesar do código de `main` |

O código instalado é oficial e o commit é verificado, mas **não corresponde ao pin declarado**. A instalação está em uma snapshot não lançada de `main`, não no release `v2.2.3`.

### Trust do hook

| Origem | SHA-256 |
|---|---|
| Hook instalado (`hooks/codex-hooks.json`) | `9db4faf6508bec11e82b0901fc7ded42afc1a00974fc15e9b221c3911b476249` |
| Hook no pin `v2.2.3` | `57edf21eb83d9c8144cfdc19f621700a854b6fd4abc4c368ddaeb5c74488b43c` |
| Trust registrado em `config.toml` | `3cbe25e3f5c727db9feb5274a5a3753a9267ef75cbf29df3b6602f6283b664f4` |

O trust registrado **não corresponde** nem ao pin nem ao instalado. O hook `SessionStart` está, portanto, sem trust válido para o conteúdo atual. Não foi feita edição manual do trust nem re-trust por bypass.

### Integridade e ausência de sync legado

- `node scripts/codex/check-plugin-cache.js` no cache instalado: **PASS** — `skills`, `mcpServers`, ícone e logo resolvem; “All cached manifest references resolve.”
- Hashes de `hooks/codex-hooks.json`, `.codex-plugin/plugin.json` e `.mcp.json` são idênticos entre cache e marketplace.
- Nenhum skill ECC foi encontrado em `~/.codex/skills`, `~/.agents/skills` ou `~/.claude/skills`; não há marcador de `scripts/sync-ecc-to-codex.sh` nem checkout legado ativo.
- `chrome-devtools` do plugin: `enabled=false` no `config.toml` e `disabled` em `codex mcp list`.
- MCPs preexistentes `jev`, `node_repl`, `rea` e `rea-hopper` permanecem intactos; nenhum MCP novo foi habilitado.

## 3. Backup local seguro

- Backup fora do repositório, em `<LOCAL_BACKUP_ROOT>`; 130 MB, 4713 arquivos.
- ACL restrita a `GOODZ\csn19`, `SYSTEM` e `BUILTIN\Administrators`, sem herança do perfil.
- Conteúdo: `config.toml`, `AGENTS.md`, `version.json`, `.hook-trust`, cache completo do plugin, metadados do marketplace (`marketplace.json`, `ecc-tools.json`, `codex-hooks.json`, `.mcp.json`, `plugin.json`), SHA git e status.
- Hashes registrados no backup: `config.toml` `e6538683…`; `AGENTS.md` `4b7b63cd…`; `plugin.json` `09d1f838…`; `.mcp.json` `dcba600b…`; `hooks/codex-hooks.json` `9db4faf6…`; `marketplace.json` `a006b8f8…`; `ecc-tools.json` `59517057…`.
- O backup contém configuração local e não foi publicado no GitHub.

## 4. Revisão da origem oficial

- `affaan-m/ECC`: público, não arquivado, `main`, licença **MIT**, release mais recente `v2.2.3`.
- SHA instalado `25278e7…` é o `main` oficial atual e o commit está verificado pelo GitHub.
- `install.ps1` e `install.sh` inspecionados: não baixam código remoto nem removem caminhos; apenas verificam Node e instalam dependências quando executados a partir de clone.
- Hook `SessionStart` inspecionado: resolve o root do plugin, lê o evento por stdin, executa Node local e carrega contexto de sessão; remove apenas arquivos expirados `*-session.tmp`; não faz egress HTTP.
- `.mcp.json` fixa `chrome-devtools-mcp@1.10.1`, mas o servidor está desabilitado.

## 5. Instalação, reinstalação e rollback em sandbox

Executado em `CODEX_HOME` temporário isolado, usando o marketplace local oficial em `25278e7…`, sem tocar na instalação real.

| Passo | Resultado |
|---|---|
| `plugin marketplace add` | PASS, marketplace `ecc` |
| `plugin add ecc@ecc` | PASS, 1 plugin instalado |
| `plugin add ecc@ecc` novamente | PASS idempotente, continua 1 plugin |
| `plugin remove ecc@ecc` | PASS, 0 plugins |
| `plugin add ecc@ecc` (restauração) | PASS, 1 plugin |
| Hash do `config.toml` real | inalterado `e6538683…` |

O teste prova o mecanismo de instalação/reinstalação/rollback, mas **não** prova a instalação real nem o Desktop.

## 6. Skills, agentes, hooks e MCPs

### Skills selecionadas (presentes no cache)

| Skill | SHA-256 do `SKILL.md` |
|---|---|
| `tdd-workflow` | `8887afa786ef30de834e7567115d3df71934b343c3d9d849714f8ea43f979ee0` |
| `verification-loop` | `5b06be54d4852f60e6cf1b04c6e9a4748554334eb3e41af6c0959b544e6464ae` |
| `security-review` | `b9eb6416eebc8dda046674f0a2dbb3be88aff526d182b60a0f55998d3d6d0d8d` |
| `plan-canvas` | `0ee9356f9305eb8ceec671753700a0a7a438c76dca9983ed87c66be0b5681b64` |
| `plan-orchestrate` | `df127a46f7b5db2608f00da04d0cdfe5ed4a075ecc7e2876189e1de26c99d4fe` |
| `api-design` | `250e464413a13c0eb93cc73447b423df1f9aa8e4f80e5e68c41f895b2c33e352` |
| `docs-governance` | `499ac59071e6e2b8fb60f085e337a3a1ec16e200adb8f5b8bc027afb338cf3eb` |
| `mcp-dependency-review` | `766536baa981710a85c8f761675f6a57f58600fff42b23ccf6171606180f4c12` |
| `skill-host-compat` | `246242187c2da04369c23d782ba0970bcb9b9fb74acb421161649e4c572d4b54` |

### Agentes selecionados (presentes no cache)

| Agente | SHA-256 |
|---|---|
| `architect` | `6b8e1e8bd274995f3949691731f4334820c061d3054eaea3be2ce163386d1f24` |
| `code-reviewer` | `9dd23be23d65f18126e10f7680fc1eb2576ec54a427d076ff2f870bd0bafd5d2` |
| `security-reviewer` | `813e4062bed5f42ab25dd02a0070f682058ffe9508198fcfdbb2c31296f93b7b` |
| `planner` | `63aba865206bac9cb5887542fb01b97656e7701faff98e091aa77057ba9860bc` |
| `docs-lookup` | `11560171e4535419e7917158d0de3bc7bbbf0408f83f61f0f3558b356802419e` |

Regras comuns presentes: `common/security.md`, `common/testing.md`, `common/code-review.md`, `common/hooks.md`.

### Status das provas de execução

| Prova | Status |
|---|---|
| Descoberta do plugin e catálogo | PASS (cache e manifesto) |
| Invocação de skill no Codex Desktop | **NOT_RUN** — exige reinício/trust humano da sessão Desktop |
| Agente/planner em execução | **NOT_RUN** |
| Hook `SessionStart` positivo | **BLOCKED** — trust stale |
| Hook negativo (comando destrutivo) | **NOT_RUN** |
| MCP ECC read-only | **NOT_RUN** — `chrome-devtools` desabilitado |
| MCP escrita não autorizada | **NOT_RUN** |
| Reinício do Codex Desktop | **NOT_RUN** — não executável de dentro desta sessão |

## 7. ECC Tools Free

- App `ecc-tools` instalado no repositório; comentários de `ecc-tools[bot]` observados em PRs anteriores.
- **Não publica check-runs**: no HEAD `df84a07…` existem apenas `governance-docs` e dois checks Socket. Portanto é **informativo**, nunca required.
- Permissões do App: `contents: write`, `issues: write`, `metadata: read`, `pull_requests: write`; eventos `issue_comment`, `pull_request`, `push`.
- Plano público: Free para repositórios públicos, **10 análises/mês**, até **200 commits por análise**; Pro **US$19/seat/mês** não ativado.
- Quota da conta **UNKNOWN**; nenhum comando `/ecc-tools analyze` foi disparado nesta execução.
- `.claude/ecc-tools.json` do OSS declara `tier: enterprise` e `profile: full`; é template do repositório upstream, não assinatura paga desta conta. Risco registrado; nenhum recurso pago foi habilitado.

## 8. Etiquetas GitHub

- 24/24 etiquetas da paleta canônica aplicadas e verificadas com cor exata.
- Nenhuma etiqueta fora da allowlist foi alterada: `NONPALETTE_CHANGED=0`; total de 37 etiquetas.
- As 16 issues #5–#20 permanecem etiquetadas; os conjuntos de nomes de etiquetas não mudaram.
- Snapshot antes/depois e read-back registrados localmente e resumidos aqui; nenhuma etiqueta foi apagada.
- Fonte da paleta: [taxonomia](https://github.com/KayzenRoot/koros/blob/docs/KOR-M01-ECC-PLAN-001/docs/modules/M01-ECC/github-labels.md).

## 9. Gates

| Gate | Critério | Resultado |
|---|---|---|
| G1 | Context Lock e acesso administrativo | PASS |
| G2 | Compatibilidade Codex (`>= 0.146.0`, plugin CLI) | PASS |
| G3 | Inventário da instalação preexistente | PASS com drift |
| G4 | Backup local seguro e ACL | PASS |
| G5 | Origem oficial, licença e pin | PASS na origem; drift de pin **BLOCKED** |
| G6 | Canal único e ausência de sync legado | PASS |
| G7 | Instalação/reinstalação/rollback em sandbox | PASS |
| G8 | Skills/agentes necessários presentes | PASS; invocação **NOT_RUN** |
| G9 | Hooks confiados e testados | **BLOCKED** (trust stale) |
| G10 | MCP read-only e escrita bloqueada | **NOT_RUN** (MCP ECC desabilitado) |
| G11 | ECC Tools Free e checks | PASS parcial; quota **UNKNOWN** |
| G12 | Cores das etiquetas | PASS |
| G13 | Smoke real no Codex Desktop | **NOT_RUN** |

## 10. Veredito e riscos

**BLOCKED.** O ECC está instalado e o mecanismo de plugin funciona, mas a instalação real não está no pin declarado, o trust do hook `SessionStart` está stale e as provas no Codex Desktop não puderam ser executadas. Não é `IMPLEMENTED_VERIFIED`; não há declaração de 100% funcional.

Riscos residuais:
- **Alto:** pin `v2.2.3` vs código de `main` (1017 commits), com mudanças extensas em hooks e scripts.
- **Alto:** hook `SessionStart` sem trust válido para o conteúdo atual.
- **Médio:** App ECC Tools tem permissões de escrita (`contents`, `issues`, `pull_requests`) e quota Free desconhecida.
- **Médio:** template `ecc-tools.json` declara tier enterprise/full, embora nenhum plano pago tenha sido ativado.
- **Baixo:** `chrome-devtools-mcp@1.10.1` usa `npx` quando habilitado; permanece desabilitado.

## 11. Próximas ações NECESSARY

1. Autorizar a política de versão: reinstalar no release `v2.2.3` (`c05b2d6…`, alinhado ao pin atual) **ou** re-pinar para `25278e7…` (main oficial verificado). O backup e o rollback já foram testados em sandbox.
2. Após a escolha, reconciliar marketplace/cache, reiniciar o Codex Desktop e aprovar conscientemente o trust do hook `SessionStart` (ação humana).
3. Executar os smokes pendentes: skill de análise, skill de teste, hook positivo/negativo e MCP read-only com rejeição de escrita.
4. Verificar a quota ECC Tools no painel do App; manter Free, sem Pro.
5. Atualizar esta evidência e a issue #8; somente então avaliar `IMPLEMENTED_VERIFIED`.

## 12. Limites preservados

Sem merge, sem alteração da `main`, sem bypass, sem deploy, sem gasto, sem KOR-DISC-002, sem novo MCP, sem re-trust manual e sem modificação da instalação real. A única mutação externa ao repositório foi a cor das 24 etiquetas autorizadas.

## Rastreamento

[Runbook de instalação/remediação](../../docs/modules/M01-ECC/install-runbook-windows.md) · [Work Order](https://github.com/KayzenRoot/koros/blob/docs/KOR-M01-ECC-PLAN-001/docs/modules/M01-ECC/ecc-local-execution-wo.md) · [README do módulo](https://github.com/KayzenRoot/koros/blob/docs/KOR-M01-ECC-PLAN-001/docs/modules/M01-ECC/README.md)
