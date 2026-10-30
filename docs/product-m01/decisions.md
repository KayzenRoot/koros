# PRODUCT-M01 | Decisões para o fundador
**Nexlabs Technology · KOROS · 2026-10-29**
**Direção já definida:** produto comercial B2B multissetorial, integração fácil, instalação/onboarding simples, GitHub source of truth, ECC não requerido. **PM01-D01..D05: APPROVED_FOR_PLANNING pelo fundador em 2026-10-29.** Ainda não são evidência de implementação, de mercado ou de integração real. Alternativas B/C/D abaixo ficam como histórico de opções não selecionadas.

## PM01-D01 — Primeiros clientes que vamos atender
- **A, recomendado para validação:** empresas de serviços com alto volume de atendimento, leads e agendamentos; APIs CRM/agenda autorizadas. Caminho curto para provar tempo economizado; boa chance de reutilização.
- **B:** comércios físicos (restaurantes/lojas) com mensagens e pedidos; muitos canais e particularidades de operação.
- **C:** e-commerce e sellers multicanal, com ERP/marketplaces; competição, limitações e contratos de API.
- **D:** lançar todos os segmentos no MVP; não recomendado: escopo e suporte crescem antes de validar venda.
- **Critério:** facilidade de vender para 3 empresas, dor de frequência alta, custo de integração, direitos de API e instalação realista.
- **Estado:** APPROVED_FOR_PLANNING (opção A).; a seleção de um primeiro nicho **não fecha** o KOROS para os outros segmentos.

## PM01-D02 — Entrega e instalação do KOROS para o cliente
- **A, recomendado:** SaaS gerenciado com **isolamento dedicado por cliente**, wizard de setup e contratos portáveis projetados para self-host posterior. Mais rápido de operar primeiros pilotos, mas exige manter infraestrutura e não oferece self-host no dia 1.
- **B:** self-host desde primeiro release, via instalador Docker/Compose e healthcheck com backup/rollback; mais fácil para cliente com infraestrutura própria, mais difícil para pequeno comércio sem TI.
- **C:** SaaS + self-host plenamente suportados no MVP; maior abrangência, complexidade e custo operacional inicial.
- **Estado:** APPROVED_FOR_PLANNING (opção A)., sem prometer instalador implementado ou custos conhecidos.

## PM01-D03 — Estrutura do core
- **A, recomendado:** core agnóstico ao setor + templates versionados + conectores por APIs oficiais + políticas de aprovação fora da IA.
- **B:** versões separadas do código por ramo; simples para iniciar, porém aumenta manutenção e risco de deriva.
- **C:** um único agente generalista com permissão ampla em navegador/shell; rejeitado por riscos e suporte difícil.
- **Estado:** APPROVED_FOR_PLANNING (opção A); contratos e stack ainda PENDING.

## PM01-D04 — Primeira automação comercial
- **A, hipótese inicial:** receber lead autorizado, deduplicar, classificar, aprovar e registrar no CRM. Documentada anteriormente, mas não vendida/validada.
- **B:** coletar pedido/cotação autorizada, organizar dados, aprovação e encaminhar sistema de vendas.
- **C:** responder e classificar demandas de suporte/agenda com confirmação humana antes de atos externos.
- **Estado:** APPROVED_FOR_PLANNING (opção A).; priorizar dor mensurável, não a opção tecnicamente mais vistosa.

## PM01-D05 — Autonomia de IA
- **A, recomendado:** política do servidor controla permissões, orçamento, aprovações humanas e dados; IA só propõe/estrutura ações.
- **B:** execução autônoma ampla sem confirmação em sistemas de clientes; NÃO recomendado por segurança/risco jurídico.
- **Estado:** APPROVED_FOR_PLANNING (opção A); controles reais continuam NOT_IMPLEMENTED.

## Decisões já tomadas (não reabrir sem motivo)
- **PROCESSO-01 APPROVED:** GitHub é fonte da verdade, branch/PR protegida, checks reais, sem bypass, squash apenas mediante autorização.
- **PROCESSO-02 APPROVED:** ferramenta ECC plugin/hosted/hooks/MCP **fora do workflow e pipeline obrigatórios**; skills opcionais sob demanda.
- **CUSTO-01 APPROVED:** nenhuma execução paga ou deploy sem consentimento. GitHub Actions standard em repo público e ferramentas OSS/free quando elegíveis.
- **COMERCIAL-01 APPROVED_STRUCTURE:** setup único + planos mensal/trimestral/semestral/anual; preço e quota ainda PENDING.

## Como aceitaremos as escolhas
O fundador responde por botões no chat. Para cada opção, registrar: escolha, por quê, tradeoffs, custo hipotético, risco, escopo e evidência. Somente após isso atualizar ADR e requisitos de implementação; não abrir PR de execução nem prometer produto funcionando.

## Ata de aceite explícito — 2026-10-29
O fundador aprovou por mensagem inequívoca estas **cinco opções A**, com implementação, gastos, deploy e merge expressamente vedados nesta execução.

| Decisão | Escolha aceita | Significado exato | Ainda pendente |
|---|---|---|---|
| **PM01-D01** | A: serviços com leads/agendamentos | Primeiro **público de validação e prospecção futura**; outros segmentos continuam no produto | Segmento específico, ICP e entrevistas reais, preço, volume, canal de aquisição |
| **PM01-D02** | A: SaaS gerenciado → self-host planejado | Primeira modalidade gerenciada com isolamento seguro por cliente e onboarding guiado; portabilidade futura prevista como contrato | Topologia física, custo por tenant, fornecedor, requisitos de instalador self-host, benchmarks |
| **PM01-D03** | A: core genérico + templates + conectores | Core sem ramificação por setor; plugins e templates versionados, APIs oficiais e política fora da IA | Stack, contratos completos, tecnologia de persistência e testabilidade |
| **PM01-D04** | A: leads → CRM com aprovação humana | Um único fluxo inicial: evento autorizado → validação/dedupe → classificação → aprovação humana → registro no CRM por API oficial | Fonte e CRM concretos, permissões, sandbox, política de consentimento, métricas, piloto |
| **PM01-D05** | A: IA sob política do servidor | IA classifica/sugere, não concede permissões nem grava diretamente; aprovação amarrada ao payload e expiração | Autenticação, design do approval gate, avaliação IA, segurança/isolamento em código |

### Regras para aplicação
- Aceitar uma direção não é escolher OpenBot/CopilotKit, LLM, CRM, canal de mensagens, banco, VPS, fornecedor ou integração específica; ADR-006 e ADR-009 seguem pendentes.
- O foco em serviços **não implica** automação de agendamentos já implementada; agendamento é contexto de negócio, o fluxo comercial inicial é **lead→CRM**.
- SaaS inicial **não autoriza** usar infraestrutura do fundador, criar contas cloud, acessar dados de clientes ou gastar dinheiro.
- Aprovação humana significa antes de toda escrita externa no fluxo inicial, sem exceções silenciosas, com vínculo ao payload aprovado.
- PM01-D01..D05 = **APPROVED_FOR_PLANNING**. As issues #24..#35 permanecem **PLANNED** até entregáveis e evidência; PR #36 permanece Draft.
- [Fluxo autorizado](lead-to-crm-contract.md) · [Arquitetura e instalação propostas](architecture-onboarding-security.md) · [Plano de validação](commercial-discovery.md).

## PM01-D01-S1 | Subsegmento de serviços, recomendação PENDING (2026-10-29)
Pesquisa pública aprofundada das quatro opções na [issue #24](https://github.com/KayzenRoot/koros/issues/24) e em [segment-comparison.md](segment-comparison.md):
- **C RECOMENDADA para decisão futura:** agências/consultorias comerciais B2B já usando CRM via API autorizada, priorizando operações próprias e aprovação humana. Score **hipotético** 85/100, ainda sem entrevista/demanda/ROI.
- A alternativa: manutenção e instalações técnicas, pontuação hipotética 73/100; considerar se a automação nativa de CRM já satisfaz agência.
- D alternativa: negócios com agendamentos 67/100, APIs frequentemente pagas/restritas.
- B alternativa: serviços domiciliares 57/100, pouco acesso de API de marketplace comprovado.
**Estado:** `FOUNDER_DECISION_PENDING`. Não promove PM01-D01-S1 ao status de aprovado nem inicia prospecção, dev, gasto ou alteração de infraestrutura. As cinco escolhas PM01-D01..D05 continuam aprovadas como direção ampla.
