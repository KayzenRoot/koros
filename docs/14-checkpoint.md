# 14 — Checkpoint
**Data:** 2026-10-28; **Fase:** FOUNDATION DOCUMENTAL; **Status atual:** PR #1 MERGED por squash NORMAL em `e969d2c00f7f779e58be3dd37848801580b60800`; Source Pack incorporado à main. Revisão independente formal continua uma lacuna de processo, pois GitHub exigia 0 aprovações.
**Repositório:** KayzenRoot/koros. **Base main:** `57dd78a6eb2b39c1d07fdf2728de2cde20fda3b8`. **Tree:** `7b224899e8118500c0356902528070c53190f2ab`. README inicial `# koros`. **WO:** KOR-PLAN-001, branch `docs/KOR-PLAN-001-source-pack`.

## Evidência observada
GitHub retornou somente README na main inicial; `main` com `protected=false` e `/rulesets` com `[]`. Leitura detalhada de `/branches/main/protection` retornou `403 Resource not accessible by integration`; portanto, o diagnóstico se limita às consultas acessíveis. PR #1 foi lida como Draft e não mesclada no HEAD inicial `0ac7c203f38550f0534d68d819e416067148091d`; após Correction Delta, exigir nova leitura do HEAD final. Source Pack está proposto em branch, NÃO incorporado à main até merge.

## Estados
- Documentação: validação técnica de estrutura, escopo, referências e evidências satisfatória no HEAD `03313701eb28543f637fc018803e90f84d66e4a5`; revisão humana/independente e eventual merge PENDENTES. Revalidar HEAD final da PR após este registro.
- Código, testes, build, CI, deploy: NOT_RUN ou NOT_STARTED.
- VPS: NOT_INSPECTED; dados reais: NONE; custos: NONE AUTHORIZED.
- Marca: KOROS para planejamento, clearance NÃO VERIFICADO.
- Upstream OpenBot: referência MIT; direitos de Intelligence PENDING.
- Issues: backlog documental, issues de implementação NOT_CREATED.

## Gates
G0 aprovar fundação documental; G1 configurar proteção GitHub/checks antes de código; G2 validar marca antes de comercializar; G3 licenciamento e arquitetura; G4 isolamento e LGPD; G5 VPS benchmark; G6 contrato do piloto. Falha G0: Correction Delta no mesmo PR e STOP. Após G0, merge normal só com revisão e controles reais, depois KOR-DISC-002.

## Proposta histórica de controles GitHub (levantamento anterior a KOR-GOV-002)
- **Ruleset da main:** exigir pull request e resolução de conversas; bloquear force-push, exclusão de branch e pushes diretos; sem bypass silencioso, preservando alterações só por PR.
- **Merge:** preferir somente squash NORMAL depois de veredito e autorização; tornar os demais métodos indisponíveis se compatível com os controles da conta. PR Draft não é elegível para merge.
- **Reviews:** definir requisito de aprovação compatível com conta individual e revisor independente disponível, sem criar bloqueio impossível; preferir aprovação externa real, nunca aprovação fictícia ou dismissal como substituto de revisão.
- **Checks:** primeiro instalar e validar produtores estáveis de testes documentais (links internos, estrutura, segredos) e depois, quando houver código, unit/lint/typecheck/build/SAST/SCA conforme risco. Só então marcar nomes exatos como required. Os checks Socket observados são informativos: PR Alerts reportou **sem mudanças de dependências**; não equiparar ao teste de segurança do produto.
- **Verificação posterior:** ler regras efetivas e bypass actors, criar PR de teste que deve ser recusada ao falhar, conferir que merge normal obedece ao gate. Sem permissões de leitura administrativa, marcar as propriedades detalhadas NÃO VERIFICADAS.

## Estado operacional após conciliação KOR-PLAN-001 (2026-10-28)
- Histórico acima é evidência do **baseline inicial**, não descrição das configurações atuais. Em `main=943f634797122473b56e7190f8c5cc1aa8fdd9f5`, o ruleset #26074776 está `active`, sem bypass, com PR obrigatório, resolução de threads, bloqueio de exclusão/force-push, histórico linear e squash-only.
- `governance-docs` é required check (`integration_id=15368`, App GitHub Actions), com produtor validado em `main` e PR de prova #3. O código/documentação da PR #1 foi reconciliado **somente na sua branch**, com merge commit de dois pais `8d54bb51bf9b6e9c4d9413fcfc4d2fb6396f06ab` (pais: HEAD anterior `ba166dc7fc69435c3905b8c3864749b6a5f8adec` e `main=943f634797122473b56e7190f8c5cc1aa8fdd9f5`); nenhuma alteração foi realizada na `main` por KOR-PLAN-001.
- G1 **proteção GitHub e check documental requerido: COMPROVADOS**; pendência de governança humana: `required_approving_review_count=0`, apenas revisão COMMENTED; revisão independente formal não substituída por CI.
- G0 **Source Pack:** auditoria documental prévia aceita pelo fundador; revalidação final após conciliação e checks do último HEAD ainda exigidos. Manter PR #1 Draft e sem merge até decisão humana separada; não iniciar implementação.
- Requisitos futuros de lint, testes, build e scanners para código continuam **NOT_RUN / NÃO CONFIGURADOS**. Nome KOROS, licença Intelligence, privacidade/LGPD, infraestrutura, custos e piloto permanecem condicionados a provas posteriores.
- Esta seção atualiza o estado dos gates sem apagar o histórico do baseline. Evidence Bundle e HEAD final precisam ser conferidos após o último commit da branch.

## Checkpoint pós-merge KOR-PLAN-001 (canônico proposto em PR de fechamento)
- **Main verificada após merge:** `e969d2c00f7f779e58be3dd37848801580b60800` (antes `943f634797122473b56e7190f8c5cc1aa8fdd9f5`); commit squash da PR #1, parent único igual à main anterior; 23 arquivos Markdown do Source Pack, nenhum código de aplicação.
- **PR #1:** mesclada normalmente, HEAD de origem preservado `35f883a9512499efe117ee00c455ce6240001229`; avaliação pré-merge `mergeable_state=clean`, regras GitHub respeitadas, sem bypass.
- **Checks do HEAD PR:** `governance-docs`, `Socket Security: Pull Request Alerts`, `Socket Security: Project Report`, todos `completed/success`; nova execução `governance-docs` acionada ao marcar Ready também `success` (GitHub Actions run `40770081002`).
- **CI na nova main:** `governance-docs` `success` no push run `40770164295`; `Socket Security: Project Report` `success`. Não afirmar que testes de runtime/segurança de aplicativo foram executados.
- **Governança:** ruleset #26074776 `active`, bypass `[]`, `governance-docs` required (App `15368`), PR obrigatório, sem force-push/exclusão, squash-only. `required_approving_review_count=0`; as revisões de `kayzenweb3` foram `COMMENTED`, não `APPROVED`.
- **Escopo:** documentação aprovada pelo fundador; nenhuma implementação, deploy, alteração da VPS, gastos ou início de KOR-DISC-002. Marca KOROS, licenças do Intelligence, LGPD, custos, arquitetura e piloto permanecem **PENDING**.
- **Nota histórica:** referências anteriores neste arquivo a `main` desprotegida, PR Draft e G1 pendente são fotografias do estado de 2026-10-28 **antes** das respectivas correções. O estado atual é o descrito nesta seção.
- **Promoção:** este delta pós-merge exige PR própria e auditoria protegida para entrar na `main`. Até esse futuro merge autorizado, o registro canônico da `main` inclui o histórico pré-merge e a evidência pública complementar fica na PR #1.

## Checkpoint atual de direção — Nexlabs Technology / PRODUCT-M01 (2026-10-29)
**Estado encontrado no preflight:** `main=30819b2622d5dc865931d5c55e9e9e9586648276`, protegida, ruleset #26074776 ativo sem bypass, required `governance-docs` do GitHub Actions App 15368. Antes desta documentação, nenhuma PR aberta após encerrar #21 e #22 sem merge.
- **Mudança explícita do fundador:** ECC NÃO é dependência, gate ou etapa necessária para desenvolver KOROS; skills, se usadas, são auxiliares opcionais. NÃO realizar nova instalação/trust/MCP/hosted ECC; não existe nenhum check ECC obrigatório na `main`.
- **Encerramento histórico:** PRs #21/#22 fechadas, sem merge; Epic #5 e 14 issues técnicas antigas (#6-#12, #14-#20) fechadas `not_planned`. A issue #13 ficou aberta devido a bloqueio explícito de segurança da integração para sua atualização; não contornar. Documentos em branches fechadas preservados como histórico, sem promoção a fonte canônica.
- **Trabalho atual:** [PRODUCT-M01 / KOR-DISC-002](product-m01/README.md) em planejamento, Epic #23 e issues de descoberta #24–#35. Não há aprovação do primeiro ICP, instalação comercial, arquitetura física, frameworks de produto ou pilotos.
- **Qualidade:** continuar PR protegida, source pack, CI documental, qualidade/segurança futura por evidência no código real, zero bypass; sem assinatura Pro, compras, deploy ou implementação do MVP.
- **Rastro:** novas decisões/provas em [documento de escolhas](product-m01/decisions.md) e [Evidence Bundle](../evidence/KOR-DISC-002/README.md). Esta seção é PROPOSED na PR documental até passar checks e merge protegido explicitamente autorizado. O checkpoint histórico anterior continua registrado para auditoria.

## Delta de decisão KOR-DISC-002 / PRODUCT-M01 — 2026-10-29
- **Aprovação do fundador:** PM01-D01..D05 = `APPROVED_FOR_PLANNING`: serviços com leads/agendamentos primeiro, core genérico com templates/conectores, SaaS gerenciado com caminho self-host futuro, primeiro fluxo leads→CRM com aprovação humana e controle server-side independente da IA.
- **PR de registro:** [#36](https://github.com/KayzenRoot/koros/pull/36), Draft sobre `main=30819b2622d5dc865931d5c55e9e9e9586648276` protegida. Nenhum merge autorizado.
- **Epic e subtarefas:** [#23](https://github.com/KayzenRoot/koros/issues/23), #24..#35 abertas e PLANNED. Todas as tarefas de pesquisa, engenharia/contratos e provas negativas ainda pendem. A seleção do fluxo não equivale a conclusão da descoberta comercial.
- **Norma:** ECC não é gate ou requisito. GitHub source of truth apenas após PR protegida/merge legítimo. `governance-docs` App 15368 continua required, checks Socket informativos.
- **Bloqueios comerciais/técnicos:** ICP mais específico, entrevistas/demanda, API de origem e CRM, preços, custo por tenant, modelo LLM, implementação, licenças, LGPD, dados reais e piloto permanecem `UNKNOWN/NOT_RUN`.
- **Escopo desta alteração:** Markdown na PR #36, sem código, dependência ECC, infra, deploy, gasto, bypass ou alterações em main/ruleset. O HEAD final e CI devem ser lidos depois do commit.

## Checkpoint Delta PROPOSTO, não promovido à main — issue #24 / 2026-10-30
- **Aceite novo:** `PM01-D01-S1-CRM-REF-01=A APPROVED_FOR_PLANNING`: Agendor v3 primeira referência documental sintética para Pessoa/Contato; HubSpot DBV/Projects segunda referência de portabilidade. Cliente não é obrigado a trocar CRM.
- **Restrições de execução:** PR #36 permanece Draft, issue #24 OPEN. As referências não constituem fornecedor definitivo, integração, software, homologação nem ROI. `CRM-R01..R12=NOT_RUN`, T-01..T-12 = NOT_RUN; testes com clientes, preços e LGPD real = UNKNOWN.
- **Auditoria candidata:** [issue24-plan-ready-audit.md](../evidence/KOR-DISC-002/issue24-plan-ready-audit.md) separa `PLAN_READY_DOCUMENTAL_CANDIDATE` de `PLAN_APPROVED` e `MARKET_VALIDATED`; a promoção deste delta à verdade de main só ocorrerá após auditoria, autorização e merge normal futuros.
- **Sem alterações ao ruleset, dependências ECC, workflow CI, contas, merge, deploy, dados reais ou custos.** HEAD/CI do commit documental final exigem read-back.

## Checkpoint Delta PROPOSTO | Founder accepted #24 documentary readiness — 2026-10-30
- **Novo marco na branch (não na main):** `PM01-D01-S1-PLAN-READY-01=FOUNDER_ACCEPTED_DOCUMENTAL_READINESS`. O fundador aprovou a prontidão DOCUMENTAL da issue #24, com parecer `GO_DOCUMENTAL`; não aprovou implantação, validação comercial, passagem da fase PRODUCT-M01 nem merge.
- **Preflight:** PR #36 em Draft no HEAD `72177a6b36d1e8e75663ce5984420b1b406b0e26`, `main=30819b2622d5dc865931d5c55e9e9e9586648276`, três checks `success`, revisão `COMMENTED`; revalidar gates do HEAD criado pelo aceite.
- **Estado preservado:** #24 OPEN para validação comercial futura, #25..#35 sem avanço, `PLAN_APPROVED=NO` (transição de fase), `MARKET_VALIDATED=NO`, `IMPLEMENTED_VERIFIED=NO`, ADR-009 PENDING. `T-01..T-12` e `CRM-R01..R12` NOT_RUN, dados reais e direitos de conta/CRM UNKNOWN.
- **STOP:** somente documentação na PR; nenhuma escrita na main, Ready, merge, código, contas, testes de API, contato, gastos, deploy, ECC ou mudança de ruleset.

## Checkpoint Delta PROPOSTO | preparação do protocolo comercial da #24 — 2026-10-30
- Work Order `KOR-DISC-002-01`, subetapa documental `KOR-DISC-002-01-CV-PREP-01`: [protocolo de validação comercial](product-m01/issue24-commercial-validation-protocol.md) e [pesquisa pública](../evidence/KOR-DISC-002/issue24-desk-research-2026-10-30.md) acrescentados **apenas na branch Draft**.
- **Nova pesquisa:** dados CNAE/Sebrae/Mapa empresas confirmam universo setorial amplo, não compradores; concorrentes CRM/Make/Zapier refutam alegação de exclusividade de aprovação humana. O filtro/benchmark futuro será contra o **plano real** de CRM do cliente; pré-registro de limiares proposto, não aprovado.
- **Estado:** `GO_DOC_PROTOCOL_ONLY` (sujeito a auditoria HEAD/CI), `FIELD_VALIDATION=NOT_RUN`, `MARKET_VALIDATED=NO`, `PLAN_APPROVED=NO` como passagem de fase; manter `FOUNDER_ACCEPTED_DOCUMENTAL_READINESS` do marco anterior. Não promover checkpoint à main.
- **Preservar:** issue #24 aberta, PR #36 Draft, #25..#35 não iniciadas, ADR-009 pendente, nenhuma entrevista/contato, conta/token, API, código, custo, Ready, merge ou deploy.

## Checkpoint Delta PROPOSTO | CV-CRITERIA-APPROVED e desbloqueio de PLANEJAMENTO de módulos — 2026-10-30
- Fundador aprovou os **critérios** futuros da validação da issue #24 (`APPROVED_FOR_FUTURE_VALIDATION_PLANNING`), sem autorizar pesquisa de campo, contatos, dados reais ou piloto. Não confundir critérios aprovados com validação comercial comprovada.
- Direção: concluir planejamento de todas as issues dos PRODUCT-M02..M09, evitando repetições comerciais. Administração pessoal (empresa/INPI/cadastros/contratos) **DEFERRED_FOR_BUILD**, a revisitar antes de oferta/produção; segurança, licenças de código, LGPD em projeto e testes negativos não são adiados.
- Este checkpoint segue PROPOSTO somente na PR #36 Draft; não promover à main nem avançar implementação por inferência. `MARKET_VALIDATED=NO`, `IMPLEMENTED_VERIFIED=NO`, `FIELD_VALIDATION=NOT_RUN`, T-01..T-12/CRM-R01..R12 NOT_RUN.
