# Runbook Windows — ECC no Codex Desktop (KOR-M01-ECC-03)

**Estado:** correção CLI executada em 2026-10-29; **trust do hook e smoke Desktop pendentes**. **Issue:** [#8](https://github.com/KayzenRoot/koros/issues/8). **Evidência:** [codex-plugin-smoke.md](../../../evidence/M01-ECC/codex-plugin-smoke.md). **Custo:** R$0. **Sem YOLO, sem sync legado, sem plano pago, sem bypass de trust.**

## 1. Pré-condições

- Windows real com Codex CLI `>= 0.146.0` e Codex Desktop instalado.
- Backup local fora do repositório, com ACL restrita, contendo `config.toml`, `AGENTS.md`, `.hook-trust`, cache do plugin e metadados do marketplace.
- `gh auth status -h github.com` válido apenas para as etapas GitHub; nenhum token deve ser gravado no repositório.
- Nenhum `scripts/sync-ecc-to-codex.sh` em execução.

## 2. Política de versão

Adotado o **release oficial `v2.2.3`**, commit `c05b2d6614f62f6db0047669aa4eefb223d478f9`, por ser o pin já declarado e o release mais recente. Não usar `@latest` sem revisão.

## 3. Correção executada (CLI)

```powershell
codex plugin remove ecc@ecc
codex plugin marketplace remove ecc
codex plugin marketplace add https://github.com/affaan-m/ECC.git --ref c05b2d6614f62f6db0047669aa4eefb223d478f9 --json
codex plugin add ecc@ecc --json
codex plugin list --json
```

Read-back obtido:

- marketplace e cache em `c05b2d6…` (`v2.2.3`);
- uma única entrada `ecc@ecc` `2.2.3`, habilitada;
- `node scripts/codex/check-plugin-cache.js` PASS;
- MCP `chrome-devtools` mantido `enabled=false`;
- nenhuma duplicata e nenhum sync legado.

## 4. Seleção de skills

O catálogo do release tem 293 skills. A seleção operacional usa o mecanismo oficial `[[skills.config]]` do Codex: 281 skills ECC não selecionadas ficam `enabled=false`; 12 são mantidas (`tdd-workflow`, `verification-loop`, `security-review`, `plan-canvas`, `plan-orchestrate`, `api-design`, `living-docs-governance`, `architecture-decision-records`, `mcp-server-patterns`, `skill-comply`, `agent-architecture-audit`, `security-scan`). Nada é apagado; a seleção é reversível.

O bloco `[skills]` existente já contém `max_context_tokens = 10_000`. Não criar uma segunda tabela `[skills]`; as entradas `[[skills.config]]` pertencem à tabela existente.

Smokes CLI em `--sandbox read-only`, sem `--dangerously-bypass-hook-trust`:

- `$tdd-workflow` → plano red-green de 3 passos: PASS;
- `$security-review` → riscos de SQL injection e correção: PASS.

## 5. Trust do hook `SessionStart`

O hook `v2.2.3` tem SHA-256 `57edf21eb83d9c8144cfdc19f621700a854b6fd4abc4c368ddaeb5c74488b43c`. A configuração ainda contém `trusted_content_hash = 3cbe25e3…`, campo que a versão atual do Codex declara ignorado. **Não editar esse hash manualmente** e **não usar `--dangerously-bypass-hook-trust`**.

Procedimento oficial pendente:

1. Fechar e reabrir o Codex Desktop.
2. Ler o comando do hook exibido pelo Codex e aprovar o trust somente se ele apontar para `<CODEX_HOME>\plugins\cache\ecc\ecc\2.2.3\hooks\codex-hooks.json` e `scripts/hooks/session-start-bootstrap.js`.
3. Confirmar que o hook executa uma vez por sessão e que não duplica configuração global.
4. Se o Desktop não expuser o prompt de trust, registrar `BLOCKED` — não procurar bypass.

## 6. Smoke Desktop obrigatório

Executar no **Codex Desktop real**, não apenas no CLI:

1. Skill de análise: `$security-review` em trecho sintético; confirmar origem no cache ECC.
2. Skill de teste: `$tdd-workflow` em projeto sintético; confirmar red/green sem escrita fora do workspace.
3. Hook positivo: iniciar sessão e confirmar o contexto do `SessionStart` uma única vez.
4. Hook negativo: criar um `*-session.tmp` expirado sintético e confirmar que apenas ele é removido.
5. MCP: manter `chrome-devtools` desabilitado. Para um teste read-only, usar `--headless --isolated` e desabilitar categorias de input/emulação/rede/performance/debug; chamar apenas `list_pages` e vetar `navigate_page`/`new_page`/`close_page` no cliente.
6. Custo: confirmar que nenhum plano Pro foi ativado; ECC Tools permanece Free; não disparar `/ecc-tools analyze` sem contar a quota.

## 7. Rollback

1. Fechar o Codex Desktop.
2. Restaurar `<LOCAL_BACKUP_ROOT>` sobre `<CODEX_HOME>` (config, `AGENTS.md`, `.hook-trust`, cache do plugin e metadados).
3. Reabrir o Desktop e confirmar `codex plugin list --json` com uma única entrada `ecc@ecc` no estado anterior.
4. Alternativa: `codex plugin remove ecc@ecc` e re-adicionar pelo marketplace auditado, conforme a seção 3.
5. Nunca apagar configurações globais, skills de outros plugins ou o backup.

O rollback em `CODEX_HOME` isolado foi testado no release `v2.2.3`: `install → 1`, `add novamente → 1`, `remove → 0`, `re-add → 1`.

## 8. Evidência final

Registrar na branch/PR:

- versão, SHA do marketplace e do cache;
- hash do hook e estado de trust;
- skills/agentes invocados e arquivos de origem;
- resultado dos smokes CLI e Desktop;
- MCP read-only e veto de escrita;
- quota/plano ECC Tools e custo R$0;
- qualquer `NOT_RUN`, `FAIL` ou `BLOCKED`.

**Não declarar `IMPLEMENTED_VERIFIED` sem reinício real do Desktop, trust oficial do hook e smokes positivos/negativos concluídos.**
