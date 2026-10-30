# KOR-DISC-002-01 | Proposta de valor, posicionamento e hipótese econômica
**Nexlabs Technology | KOROS** · **Estado:** PROPOSED_COPY / NOT_COMMERCIALLY_VALIDATED · **Buyer:** gestor de agência B2B / consultoria comercial usando CRM existente.

## Mensagem principal para futura validação
**'Leads B2B organizados no seu CRM, com verificação e aprovação antes de cada registro.'**
Complemento: 'O KOROS recebe leads de fontes autorizadas, padroniza campos, sugere classificações, sinaliza possíveis duplicatas e prepara a ação para seu time aprovar. Você acompanha o que foi autorizado, enviado ou bloqueado sem trocar de CRM.'
Esta mensagem descreve um **produto planejado**, não capacidade atual, economia garantida ou promessa comercial.

## JTBD e benefícios submetidos a teste
| Antes, hipótese | Depois pretendido | Evidência a exigir |
|---|---|---|
| Digitação, revisão e roteamento de leads em ferramentas distintas | Uma proposta já formatada para aprovação, sem alterar CRM até aceite | Tempo líquido com aprovação humana incluída |
| Contatos duplicados/confusos | Chave por fonte/tenant e proposta de dedupe para operador | Duplicações por 100 eventos e resolução humana |
| IA sugere campos sem certeza | Resposta estruturada com incerteza e revisão obrigatória | Erros e qualidade em base sintética e depois consentida |
| Desconexão/timeout do CRM provoca retrabalho | Estado UNCERTAIN e reconciliação sem escrita duplicada | Testes de timeout/replay e auditoria |
| Integrações operadas por scripts sem rastro claro | Controle de aprovador/alterações e relatórios por empresa | Operador consegue entender/contestar cada ação |

## Diferenciação real a provar, não publicidade vazia
- Ser **camada de governança antes da escrita externa**, entre fonte de lead e CRM do cliente, com policy server-side. A IA nunca autoriza.
- Ser **agnóstico a CRM** mediante contrato de conector, sem prometer Agendor/HubSpot/RD todos no MVP.
- Ser **configurável sem código** com wizard e templates, sem dar acesso privilegiado irrestrito a integrações.
- Não garantir redução de custos/erros sem ensaio controlado e baseline. Não afirmar certificações de segurança não existentes.

## Cálculo de ROI (ILUSTRAÇÃO, não tarifa ou demanda observada)
Definições: `horas_recuperadas = leads_mes * minutos_manual_por_lead / 60 * fracao_liquida_realmente_economizada`.
`beneficio_bruto = horas_recuperadas * custo_hora_real`.
`ganho_liquido = beneficio_bruto + perdas_evitas_comprovadas - assinatura_KOROS - novos_custos_CRM_API_IA - suporte_e_revisao_adicional`.
- **Cenário baixo fictício:** 100 leads/mês, 4 min/lead, 60% ganho líquido de tempo, R$45/h => 4h e **R$180/mês de benefício bruto** antes das despesas. Este nível pode **não** justificar SaaS recorrente; gate NO_GO sem outro valor.
- **Cenário alto fictício:** 300 leads/mês, 6 min/lead, 60% ganho líquido de tempo, R$50/h => 18h e **R$900/mês brutos** antes das despesas. Não inferir que o mercado tem esse volume.
- A fração já deve descontar o tempo de aprovação, correção e falha. Se a revisão tornar a fração negativa, o benefício será negativo. Não transformar em promessa de venda.
- **Preço KOROS, custo API/LLM/infra, margem e disposição a pagar:** UNKNOWN, sujeitos à issue #33 futuramente; nenhuma compra/cadastro autorizado agora.

## Testes comerciais contra substitutos
- **Agendor + Make:** consegue executar ingestão/roteamento/dedupe/review + auditoria comparável em custos e onboarding? Se sim, por que pagar outro SaaS?
- **HubSpot nativo:** a conta concreta já tem workflow/approvals suficientes? Analisar plano/limites.
- **Zapier:** dois passos/100 tasks Free podem bastar ao microcliente; então o alvo deve ser empresa com complexidade que exceda solução gratuita e ganho comprovado.
- **Fluxo manual bem feito:** a equipe já registra lead em poucos segundos sem erros? Isso é NO_GO para automatizar, independentemente do apelo IA.

## Critérios GO/NO_GO para só então iniciar a validação comercial autorizada
1. Comprador real reconhece problema recorrente e pelo menos um custo/risco mensurável (sem alegar validação hoje).
2. CRM do cliente expõe API necessária, com autorização, sem custo surpresa; fonte de lead legalmente autorizada.
3. Existe responsável por aprovação e política de tempo; o ciclo de revisão não elimina o benefício.
4. É possível provar um resultado **incremental** acima da automação já incluída no CRM, Make/Zapier ou processo manual.
5. Resultado econômico líquido plausivelmente positivo sob custo real, incluindo hospedagem, IA, suporte e licenças.
6. Direitos de leads e contratos de tratamento de dados adequados; proibir mistura de bases entre agência e clientes.
**Se um dos gates falhar: STOP e revisar posicionamento/ICP.**

## Estratégia de comercialização como hipótese, não ação
Primeiro a consultoria com leads próprios; depois, se funcionar, agências com vários clientes mediante tenancy/contratos e testes cross-tenant adicionais. Estrutura de **taxa de implantação + recorrência** já aceita; precificação, descontos, promessas e material publicitário só após validação. Nenhuma mensagem, formulário, contato de empresa ou campanha foi enviado.

## Refinamento de posicionamento do micro-ICP C1 (2026-10-29)
**Buyer prioritário agora aprovado:** direção da consultoria comercial B2B com CRM ativo e leads próprios; restante do mercado agências B2B continua futura alternativa, sem reabrir decisão.
**Hipótese de mensagem, NÃO slogan lançado:** 'Antes de entrar no CRM, seus leads passam por validação e aprovação com histórico claro.' Evitar afirmar que só KOROS possui approval, pois **Zapier Human in the Loop já oferece aprovação em planos pagos**. O comparativo deve medir ganho real de tempo, taxa de duplicidade, audit trail e custo total das alternativas.
A métrica de economia deve subtrair o tempo de aprovação e de correção; simulações sintéticas revisadas em [valuation gates](consultoria-b2b-validation-go-nogo.md), não usar como preço de venda. Conformidade LGPD depende de controlador, operador, finalidade e consentimento/hipótese legal de cada origem, não é algo garantido por existir SaaS.
