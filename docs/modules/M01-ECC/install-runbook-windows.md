# Runbook Windows — ECC no Codex Desktop (KOR-M01-ECC-03)

**Estado:** procedimento de remediação; **não executado na instalação real** nesta evidência. **Issue:** [#8](https://github.com/KayzenRoot/koros/issues/8). **Evidência:** [codex-plugin-smoke.md](../../../evidence/M01-ECC/codex-plugin-smoke.md). **Custo:** R$0. **Sem YOLO, sem sync legado, sem plano pago.**

## 1. Pré-condições

- Windows real com Codex CLI `>= 0.146.0` e Codex Desktop instalado.
- Backup local fora do repositório, com ACL restrita, contendo `config.toml`, `AGENTS.md`, `.hook-trust`, cache do plugin e metadados do marketplace.
- `gh auth status -h github.com` válido apenas para as etapas GitHub; nenhum token deve ser gravado no repositório.
- Nenhum `scripts/sync-ecc-to-codex.sh` em execução.

## 2. Escolher a política de versão

O estado encontrado tem pin declarado `v2.2.3` (`c05b2d6…`) e código instalado `main` (`25278e7…`). Escolher **uma** opção antes de reconciliar:

- **A — release estável:** reinstalar no commit do release `v2.2.3` (`c05b2d6614f62f6db0047669aa4eefb223d478f9`).
- **B — main auditada:** manter o código atual e re-pinar o marketplace para `25278e7d7b6cf6e6a4e7a6c8e10f14ff22f0eb5b`.

Não misturar as duas. Não usar `@latest` sem revisão. Não instalar Pro/pago.

## 3. Reconciliar o canal único

### Opção A — release `v2.2.3`

```powershell
# Backup já existente; confirmar o caminho antes de continuar.
codex plugin remove ecc@ecc
codex plugin marketplace remove ecc
codex plugin marketplace add https://github.com/affaan-m/ECC.git --ref c05b2d6614f62f6db0047669aa4eefb223d478f9 --json
codex plugin add ecc@ecc --json
codex plugin list --json
```

Conferir: um único `ecc@ecc`, versão `2.2.3`, cache em `<CODEX_HOME>\plugins\cache\ecc\ecc\2.2.3`, marketplace no SHA `c05b2d6…`.

### Opção B — pin `main` auditada

Com o backup feito, ajustar somente a referência do marketplace para o SHA auditado e reinstalar pelo caminho oficial:

```powershell
# Editar <CODEX_HOME>\config.toml com backup prévio:
# [marketplaces.ecc]
# ref = "25278e7d7b6cf6e6a4e7a6c8e10f14ff22f0eb5b"
codex plugin add ecc@ecc --json
codex plugin list --json
```

Conferir: um único `ecc@ecc`, cache e marketplace em `25278e7…`, `git status` limpo (exceto artefatos gerados pelo Codex).

Se a API/CLI recusar a operação, parar e restaurar o backup. Não contornar com bypass, deleção de regra ou marketplace alternativo.

## 4. Trust do hook `SessionStart`

O trust registrado não corresponde ao hook instalado. Não editar `trusted_content_hash` manualmente.

1. Fechar e reabrir o Codex Desktop.
2. Ler o comando do hook exibido pelo Codex e aprovar o trust somente após conferir que ele aponta para o cache do plugin e para `scripts/hooks/session-start-bootstrap.js`.
3. Confirmar que o hook executa **uma vez** por sessão e que não há duplicação com configuração global.
4. Se o Codex não pedir trust ou o hook falhar, parar e restaurar o backup.

## 5. Smoke tests obrigatórios

Executar no **Codex Desktop real**, não apenas no CLI:

1. **Skill de análise:** invocar `security-review` ou `plan-orchestrate` em um arquivo sintético; confirmar que a skill carregada vem do cache ECC.
2. **Skill de teste:** invocar `tdd-workflow` em um projeto sintético; confirmar red/green e ausência de escrita fora do workspace.
3. **Hook positivo:** iniciar sessão e confirmar a mensagem/contexto do `SessionStart`; verificar que nenhum hook duplicado rodou.
4. **Hook negativo:** usar um arquivo sintético `*-session.tmp` expirado; confirmar que apenas ele é removido. Não usar comando destrutivo real.
5. **MCP:** manter `chrome-devtools` desabilitado por padrão. Se for necessário habilitar, usar escopo de projeto, testar uma leitura (`list_pages`) e demonstrar que uma ação de escrita/navegação sem aprovação é bloqueada; desabilitar ao final.
6. **Custo:** confirmar que nenhum plano Pro, crédito ou serviço pago foi ativado. ECC Tools permanece Free; não disparar `/ecc-tools analyze` sem contar a quota.

## 6. Rollback

1. Fechar o Codex Desktop.
2. Restaurar `<LOCAL_BACKUP_ROOT>` sobre `<CODEX_HOME>` (config, `AGENTS.md`, `.hook-trust`, cache do plugin e metadados do marketplace).
3. Reabrir o Codex Desktop e confirmar `codex plugin list --json` com um único `ecc@ecc` no estado anterior.
4. Se a restauração não for possível, remover o plugin com `codex plugin remove ecc@ecc` e re-adicionar pelo marketplace auditado; registrar o resultado.
5. Nunca apagar configurações globais, skills de outros plugins ou o backup.

O rollback do instalador foi testado em `CODEX_HOME` isolado: `install=1`, reinstalação idempotente `=1`, remoção `=0`, restauração `=1`, sem alterar o `config.toml` real.

## 7. Evidência final

Registrar, na branch/PR de evidência:

- versão, SHA do marketplace e SHA do cache;
- hash do hook e hash de trust efetivo;
- skills/agentes invocados e arquivos de origem;
- resultado dos smokes e do rollback;
- quota/plano ECC Tools e confirmação de custo R$0;
- qualquer `NOT_RUN` ou `STOP` remanescente.

**Não declarar `IMPLEMENTED_VERIFIED` sem reinício real do Desktop, trust consciente do hook e smokes positivos/negativos concluídos.**
