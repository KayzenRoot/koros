# KOR-M01-ECC-03 | WO de instalação e verificação do ECC no Windows
**Autoridade:** usuário autorizou instalar ECC no Codex Desktop Windows e ativar capacidades necessárias (2026-10-29). **Estado real:** `BLOCKED_LOCAL_ACCESS` nesta conversa; não executar no runner GitHub para fingir instalação no PC. **Issue:** [#8](https://github.com/KayzenRoot/koros/issues/8).

## Objetivo
Deixar o ECC OSS genuinamente **funcional no Codex Desktop Windows** usado pela Nexlabs Technology, com pin, skills necessárias, MCPs seguros, hooks confiáveis e smoke real. ECC Tools GitHub App é uma instalação distinta: confirmar o Free/quotas e checks, não confundir com plugin Codex.

## Escopo e preflight (sem gasto)
- Read-only: confirmar versões do `codex`, `git`, `node`, `npm`, `gh`, PowerShell, plataforma Windows e instalação local do Codex Desktop. Verificar se `codex plugin` existe; **Codex 0.146.0+** exigido para `plugin add` na documentação upstream; versões incompatíveis: `STOP BLOCKED` sem instalação forçada.
- Inventariar `CODEX_HOME` (sem publicar conteúdo de credenciais), `AGENTS.md`, `.codex/`, skills/hooks/MCPs atuais; distinguir plugin `ecc@ecc` já instalado, marketplace prévio e sync legado, com hashes dos arquivos afetados.
- Fazer backup local **fora do repositório**, com ACL restrita, sem exportar tokens ou segredos ao GitHub. Não sobrescrever skills, hooks ou MCPs existentes.
- Conferir upstream **https://github.com/affaan-m/ECC** e código de scripts de instalação, licença, pin SHA e cache/arquivos de origem. Somente fontes oficiais, nunca mirrors ou `npx @latest` sem revisão.

## Instalação compatível (uma só via)
1. Se `ecc@ecc` já estiver instalado e íntegro: **não reinstalar**; auditar o cache/versão e avançar para validação.
2. Caso não esteja: preferir plugin Codex **nativo**; documentação oficial:
   ```powershell
   codex plugin marketplace add affaan-m/ECC
   codex plugin add ecc@ecc
   codex plugin list --json
   ```
   Essas linhas são **referência para Codex executar após verificação e pin de origem**, não comandos realizados nesta conversa. Para controlar versão, preferir checkout Git de SHA auditado e marketplace por caminho local quando suportado.
3. **Não executar** `scripts/sync-ecc-to-codex.sh` junto com o plugin nativo. Esse fluxo é legado e pode duplicar skills/hooks e alterar `CODEX_HOME`.
4. Analisar `.mcp.json` e servidor Chrome DevTools que vem no plugin; habilitar somente o necessário, sem servidores duplicados ou autorização de escrita ampla. Hooks nativos têm decisão de trust própria, não herdar padrões Claude sem leitura.
5. Não habilitar planos Pro/pagos, perfis YOLO, autoaprovadores ou cópia indiscriminada de 200+ skills para o contexto do projeto. A instalação pode disponibilizar catálogo completo, mas a **seleção operacional de skills** segue [matriz de governança](harness-mcp-skills.md).

## Testes e provas antes de declarar funcionamento
- `codex plugin list --json` mostra `ecc@ecc` habilitado, único, com versão/proveniência auditáveis.
- Teste de cache do upstream `node scripts/codex/check-plugin-cache.js` em checkout oficial quando aplicável; se não puder rodar, `NOT_RUN`.
- **Prova Codex Desktop real:** reiniciar a sessão local e invocar uma skill ECC de análise e uma de teste, confirmando comportamento e arquivos de origem; não confundir execução no CLI com Desktop.
- Validar 1 MCP necessário em read-only, demonstrar rejeição de chamada não autorizada; MCP cloud pago/duplicado é rejeitado.
- Hooks confiados de forma consciente, smoke de execução positiva e caso negativo sem segredos reais ou comandos destrutivos.
- Reinstalação idempotente (sem duplicação), plano de rollback executado em cenário sintético, preservação de configurações, cost-free e logs sanitizados.
- GitHub: confirmar 16 issues etiquetadas e, quando houver autenticação gh no PC, aplicar as cores da [taxonomia](github-labels.md); sem alterar proteção da main.
- Evidence Bundle com `version, pinSHA, hashes, CODEX_HOME redacted, skills_smoke, mcp_smoke, hooks_test, backup/rollback, checks, cost, STOP` em branch/PR própria. Sem material sensível.

## Critério de 100% e STOP
`IMPLEMENTED_VERIFIED` somente se **todas** as provas efetivas acima passarem no Windows real e o review independente confirmar. Falta de acesso à máquina, versão incompatível, duplicação de instalação, scripts não auditados, App Pro, tokens ou falha de plugin = `STOP BLOCKED`, sem declarar sucesso. O suporte a ECC Tools hospedado pode continuar `LIMITED/INFORMATIVE` sem false green.

Fontes: https://github.com/affaan-m/ECC/blob/main/.codex-plugin/README.md ; https://github.com/affaan-m/ECC ; https://cli.github.com/manual/gh_label_create .
