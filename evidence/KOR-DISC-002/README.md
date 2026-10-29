# Evidence Bundle — KOR-DISC-002 / PRODUCT-M01
**Data:** 2026-10-29 | **Organização:** Nexlabs Technology | **Produto:** KOROS | **Estado:** PLANNING / NOT_IMPLEMENTED.

## Estado verificado antes da PR
- Repositório `KayzenRoot/koros`, `main=30819b2622d5dc865931d5c55e9e9e9586648276`, protected=true; ruleset #26074776 `active`, `bypass_actors=[]`, required check `governance-docs` da App GitHub Actions 15368.
- Workflow real `.github/workflows/koros-governance.yml` executa apenas Node autocheck de docs e verificação de links/strings de credenciais. Nenhuma referência ECC nesse workflow, logo **nenhum workflow precisou ser desativado ou alterado**.
- PRs de integração ECC #21/#22 estavam em Draft e foram fechadas **sem merge** por decisão do fundador; histórico preservado.
- Epic #5 e issues antigas #6..#12/#14..#20 foram fechadas `not_planned`, não IMPLEMENTED. Atualização da issue #13 foi **bloqueada pelo controle de segurança da integração** e não reexecutada; issue permanece aberta como pendência administrativa de histórico, sem efeito sobre main/CI.
- Nova Epic #23 e issues de descoberta #24..#35 criadas em Github, `PLANNED`, sem construir software, sem aprovar opções D01..D05.

## Pedido do fundador
"Esquecer o ECC como pré-requisito, retirá-lo de workflow/pipeline e usar apenas skills quando necessário; iniciar planejamento do produto." Interpretação operacional: nenhuma obrigação de reinstalar/desinstalar plugin ou de executar trust/hook; skills opcionais sem controle de gates. Qualidade e governança independentes, gratuitas.

## Controles preservados
- PR Draft para especificações, `main` protegida, squash-only, sem bypass.
- `governance-docs` preservado como required; Socket Security informativo já existente; futuros linters, tests, CodeQL/Dependabot/Playwright apenas quando tiver código real e elegibilidade gratuita confirmada.
- Sem mudança de regras, GitHub Apps, plugin local, custos, deploy, dados reais, clientes ou tecnologia do produto.

## Regras para esta PR
- Alterações exclusivamente Markdown nos documentos de direção, backlog, checkpoint, ADR e catálogo M01; nenhuma mudança de workflows, código ou settings.
- PENDENTE de prova: número/head da PR, checks do HEAD, revisão e DEC-PM01-D01..D05 após escolha.
- Não marcar PLAN_APPROVED nem fechar as novas issues sem consentimento e evidência. Módulos M02+ são PROPOSTAS de divisão, não issues criadas antecipadamente.

## Resultado final (preencher em comentário de auditoria na PR)
Read-back de HEAD, diff, links, required check e veredito após publicação da PR Draft. Não inventar hashes não conhecidos antes do commit.
