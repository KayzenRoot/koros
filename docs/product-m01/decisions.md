# PRODUCT-M01 | Decisões para o fundador
**Nexlabs Technology · KOROS · 2026-10-29**
**Direção já definida:** produto comercial B2B multissetorial, integração fácil, instalação/onboarding simples, GitHub source of truth, ECC não requerido. **As escolhas abaixo estão todas PROPOSED; não marcar como APPROVED antes de clique ou aceite explícito.**

## PM01-D01 — Primeiros clientes que vamos atender
- **A, recomendado para validação:** empresas de serviços com alto volume de atendimento, leads e agendamentos; APIs CRM/agenda autorizadas. Caminho curto para provar tempo economizado; boa chance de reutilização.
- **B:** comércios físicos (restaurantes/lojas) com mensagens e pedidos; muitos canais e particularidades de operação.
- **C:** e-commerce e sellers multicanal, com ERP/marketplaces; competição, limitações e contratos de API.
- **D:** lançar todos os segmentos no MVP; não recomendado: escopo e suporte crescem antes de validar venda.
- **Critério:** facilidade de vender para 3 empresas, dor de frequência alta, custo de integração, direitos de API e instalação realista.
- **Estado:** DECISION_PENDING; a seleção de um primeiro nicho **não fecha** o KOROS para os outros segmentos.

## PM01-D02 — Entrega e instalação do KOROS para o cliente
- **A, recomendado:** SaaS gerenciado com **isolamento dedicado por cliente**, wizard de setup e contratos portáveis projetados para self-host posterior. Mais rápido de operar primeiros pilotos, mas exige manter infraestrutura e não oferece self-host no dia 1.
- **B:** self-host desde primeiro release, via instalador Docker/Compose e healthcheck com backup/rollback; mais fácil para cliente com infraestrutura própria, mais difícil para pequeno comércio sem TI.
- **C:** SaaS + self-host plenamente suportados no MVP; maior abrangência, complexidade e custo operacional inicial.
- **Estado:** DECISION_PENDING, sem prometer instalador implementado ou custos conhecidos.

## PM01-D03 — Estrutura do core
- **A, recomendado:** core agnóstico ao setor + templates versionados + conectores por APIs oficiais + políticas de aprovação fora da IA.
- **B:** versões separadas do código por ramo; simples para iniciar, porém aumenta manutenção e risco de deriva.
- **C:** um único agente generalista com permissão ampla em navegador/shell; rejeitado por riscos e suporte difícil.
- **Estado:** PROPOSED; fluxo preciso será definido após D01.

## PM01-D04 — Primeira automação comercial
- **A, hipótese inicial:** receber lead autorizado, deduplicar, classificar, aprovar e registrar no CRM. Documentada anteriormente, mas não vendida/validada.
- **B:** coletar pedido/cotação autorizada, organizar dados, aprovação e encaminhar sistema de vendas.
- **C:** responder e classificar demandas de suporte/agenda com confirmação humana antes de atos externos.
- **Estado:** DECISION_PENDING; priorizar dor mensurável, não a opção tecnicamente mais vistosa.

## PM01-D05 — Autonomia de IA
- **A, recomendado:** política do servidor controla permissões, orçamento, aprovações humanas e dados; IA só propõe/estrutura ações.
- **B:** execução autônoma ampla sem confirmação em sistemas de clientes; NÃO recomendado por segurança/risco jurídico.
- **Estado:** PROPOSED, mas princípios de segurança da main já exigem deny-by-default e rastreio.

## Decisões já tomadas (não reabrir sem motivo)
- **PROCESSO-01 APPROVED:** GitHub é fonte da verdade, branch/PR protegida, checks reais, sem bypass, squash apenas mediante autorização.
- **PROCESSO-02 APPROVED:** ferramenta ECC plugin/hosted/hooks/MCP **fora do workflow e pipeline obrigatórios**; skills opcionais sob demanda.
- **CUSTO-01 APPROVED:** nenhuma execução paga ou deploy sem consentimento. GitHub Actions standard em repo público e ferramentas OSS/free quando elegíveis.
- **COMERCIAL-01 APPROVED_STRUCTURE:** setup único + planos mensal/trimestral/semestral/anual; preço e quota ainda PENDING.

## Como aceitaremos as escolhas
O fundador responde por botões no chat. Para cada opção, registrar: escolha, por quê, tradeoffs, custo hipotético, risco, escopo e evidência. Somente após isso atualizar ADR e requisitos de implementação; não abrir PR de execução nem prometer produto funcionando.
