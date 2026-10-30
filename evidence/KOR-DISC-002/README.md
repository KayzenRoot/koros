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

## Acceptance Delta — founder approved PM01-D01..05 (2026-10-29)
O fundador aceitou expressamente **PM01-D01=A**, **PM01-D02=A**, **PM01-D03=A**, **PM01-D04=A**, **PM01-D05=A** como **diretrizes de PLANEJAMENTO** do KOROS da Nexlabs Technology. Sem autorização de merge, implementação, gastos, deploy nem coleta de dados reais.
- **D01:** primeiro público de validação = serviços com leads/agendamentos; outros segmentos preservados pelo core.
- **D02:** SaaS gerenciado primeiro; caminho de portabilidade/self-host projetado, não disponível no MVP inicial.
- **D03:** core único genérico, templates configuráveis e conectores oficiais. Stack e licenças ainda PENDING.
- **D04:** primeiro fluxo escolhido para planejar = lead autorizado → dedupe/classificação → aprovação humana → CRM via API oficial, ainda não validado/implementado.
- **D05:** IA sem autoridade para conceder permissão ou gravar no CRM; políticas server-side com fail-closed.

### Artefatos acrescentados à branch da PR #36
- `docs/product-m01/decisions.md`: ata/estado de D01..D05.
- `docs/product-m01/lead-to-crm-contract.md`: fluxo, entidades, máquina de estados e casos adversos.
- `docs/product-m01/architecture-onboarding-security.md`: core, fronteira tenant, SaaS e caminho self-host futuro.
- `docs/product-m01/commercial-discovery.md`: subsegmentos hipotéticos, entrevistas, métricas/risco.
- `docs/product-m01/issue-matrix.md`: rastreabilidade de 12 issues e testes T-01..T-12.

### Lacunas (não mascarar como concluído)
ICP específico, clientes reais, demanda e ROI, consentimentos, CRM e source API, ambientes sandbox, preço, LLM, infraestrutura, benchmarks, direitos/licenças, LGPD contratual, provas de isolamento, implementação e 12 testes técnicos seguem **UNKNOWN/PENDING/NOT_RUN**. Código de produto, deploy e compras: **NÃO FEITOS**.

**A PR #36 continua Draft; base/main continuam protegidas. Read-back do HEAD e 3 checks deve ser confirmado após o commit.**

## Research Delta — issue #24 (2026-10-29; fontes públicas, sem contato)
- Estudo documental [segment-comparison.md](../../docs/product-m01/segment-comparison.md): quatro subsegmentos, dados IBGE PAS2024/Sebrae2025, dores e riscos hipotéticos, concorrentes Auvo/Field Control/GetNinjas/HubSpot/Agendor/RD/Pipedrive/Trinks/AgendaPro/Calendly, APIs com restrições de plano e preços publicados, scorecard ponderado interno 85/73/67/57 sem pretensão estatística.
- [Scorecard](../../docs/product-m01/icp-validation-scorecard.md) e regras GO/NO_GO para futuro piloto; números de volume/minutos/ROI são hipóteses, NÃO validações.
- Alerta crítico: API RD Station CRM v2 exige plano pago Basic/Pro/Advanced; Calendly webhook exige assinatura paga; Trinks API solicita liberação e serviço adicional; Auvo exige plano ativo. HubSpot possui conta developer grátis; Agendor lista API aberta no Free. Nenhum entitlement de cliente foi comprovado.
- Recomendação **C (agências/consultorias com CRM)** sujeita a aceite do fundador, segundo lugar manutenção técnica; PM01-D01 amplo aprovado não foi alterado. Nenhum prospect/contato/cadastro, API call, dado real, código, deploy ou gasto.
- Delta limitado a issue #24 e documentos de pesquisa, mantendo PR #36 Draft e ECC fora dos gates. Revalidar HEAD/checks e colocar resultado em review `COMMENTED` após commit, sem fingir aprovação.

## Acceptance/Research Delta | PM01-D01-S1 C (2026-10-29)
- **Aprovação explícita do fundador** de opção C para planejamento: agências B2B e consultorias comerciais com CRM, preferencialmente com leads próprios. O termo "recomendação pendente" nos históricos anteriores está SUPERCEDIDO, não foi apagado.
- [Documento ICP](../../docs/product-m01/agency-consultancy-icp.md): buyer, usuário, aprovador, sub-ICPs, H01..H07, exclusões e regras de GO/NO_GO. Micro-ICP preferido (consultoria B2B, leads próprios) é recomendação, não aprovado isoladamente.
- [Matriz oficial de fornecedores](../../docs/product-m01/crm-provider-competitive-matrix.md): Agendor Free até 3 usuários com API; HubSpot developer test grátis; RD Station CRM v2 requer planos pagos; Make, Zapier e n8n como concorrentes/restrições de licença.
- [Proposta de valor](../../docs/product-m01/agency-value-proposition.md): diferencial como camada de validação/aprovação/auditoria antes do CRM; duas simulações de ROI **sintéticas**, não custos observados.
- Sem fornecedor final, contrato, cliente entrevistado, interesse de compra, dados reais, prova de sandbox/API, software ou gasto. Entrevistas e validação permanecem NOT_RUN.
- PR #36 Draft, somente documentação, ECC fora de gates. Novo HEAD/checks a revalidar após publicação.

## Delta de aceite PM01-D01-S1-C1 e pesquisa oficial (2026-10-29)
**Aprovação explícita:** primeiro micro-ICP de planejamento = **consultorias comerciais B2B com CRM ativo e leads próprios**, mantendo Core genérico e outras agências como mercado futuro. A aprovação NÃO autoriza clientes/entrevistas, cadastro, teste de API, contratação, gastos, código, deploy nem Ready/merge.
- [Buyers, personas, jornada de compra, H01..H10 e objeções](../../docs/product-m01/consultoria-b2b-micro-icp.md).
- [Processo AS-IS e TO-BE, fontes próprias/permitidas, APIs e comportamentos de erro](../../docs/product-m01/consultoria-b2b-manual-process-and-sources.md).
- [Concorrentes nativos, métricas e eligibility GO/NO_GO](../../docs/product-m01/consultoria-b2b-validation-go-nogo.md).
**Principais novas evidências públicas:** Agendor API REST V3 4 req/s e webhooks, integração Pluga em planos pagos; HubSpot developer-test grátis, workflows/duplicate management avançados em planos pagos; RD CRM v2 somente Basic/Pro/Advanced, 120 req/min; Google Forms watch usa Cloud Pub/Sub com requisitos de auth/renovação; Zapier HITL pago e Free 100 tarefas, Make Free 1.000 créditos. Links oficiais localizados nos três documentos. Nenhuma conta individual/entitlement comprovado; despesas de Cloud Pub/Sub desconhecidas, **não presume R$0**.
**Fato versus hipótese:** nenhuma consultoria entrevistada, nenhum lead avaliado, nenhum tempo/ROI medido, preços do KOROS UNKNOWN, nenhuma integração testada. Simulações de 60/300 leads meramente matemáticas. LGPD: verificar controlador/operador por cliente conforme https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados . 
**Restrição:** somente issue #24 / PR #36 Draft. 3 novos arquivos Markdown, updates em documentos #24 e Evidence, CI e read-back a conferir no novo HEAD. Sem ECC e sem alteração de main/ruleset.

## CRM comparative research delta — Agendor/HubSpot (2026-10-30)
**Fonte de verdade PROPOSTA em PR #36 Draft:** [crm-reference-agendor-vs-hubspot.md](../../docs/product-m01/crm-reference-agendor-vs-hubspot.md), 11 seções, 2 CRMs, matriz de objetos/scopes/webhooks/limites/plano, custos oficiais e esforço de engenharia como hipótese, 12 proof obligations FUTURAS.
**Evidências verificadas via fontes públicas oficiais:** Agendor Free R$0 até 3 usuários e API aberta incluída (contradiz generalização anterior sobre Pluga paga no Free; planos de terceiros são à parte); API REST V3, upserts, 4 req/s, webhook por token e visibilidade atrelada ao usuário. HubSpot Free US$0 até 2 usuários/1k contatos, developer test gratuito; API DBV e Projects, OAuth para multiportal, Service Key S2S sem webhook, suporte legado v1-v3 encerrando em set/2027; quota Free/Starter 100 req/10s e 250k/dia do catálogo. Nenhuma prova de conta real, integração, autenticação, webhook assinado ou custo de operação.
**Recomendação CONDICIONAL NÃO APROVADA:** opção A Agendor como primeiro contrato de API sintético; HubSpot segundo conector e referência multiportal, embora score heurístico de plataforma multiempresa seja HubSpot 89 e Agendor 71. Score não é prova de mercado nem preço.
**Estado:** PM01-D01-S1-C1 `APPROVED_FOR_PLANNING`, nova PM01-D01-S1-CRM-REF-01 `FOUNDER_DECISION_PENDING`. Nenhum gasto, código, contato, cadastro ou mudança no pipeline. CI e HEAD final da PR a conferir depois do commit.
