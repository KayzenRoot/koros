# KOR-DISC-002-01 | ICP prioritário aprovado: agência B2B / consultoria comercial com CRM
**Startup:** Nexlabs Technology · **Produto:** KOROS · **Issue:** [#24](https://github.com/KayzenRoot/koros/issues/24) · **Decisão:** PM01-D01-S1 C = APPROVED_FOR_PLANNING em 2026-10-29 · **Evidência de mercado:** pesquisa pública, sem cliente entrevistado.
**Escopo EXCLUSIVO:** detalhamento do ICP e proposta de valor. Não modifica as issues #25–#35 ou o fluxo PM01-D04 já aprovado.

## 1. Escolha precisa do primeiro comprador
**ICP prioritário S1:** agência de marketing B2B de geração de demanda **ou consultoria comercial B2B** que receba seus próprios leads de canais autorizados, já tenha CRM com API permitida em seu plano e disponha de um responsável comercial capaz de aprovar dados antes de gravá-los. Preferir operação com funil de captação própria, não agência usando credenciais de múltiplos clientes. Proposta de validação comercial, não produto homologado.

**Buyer:** sócio/diretor comercial ou de operações que responde por perdas de oportunidades e orçamento. **Usuário direto:** operador comercial, SDR, assistente ou analista de qualificação. **Aprovador:** pessoa com permissão específica no tenant, diferente do motor de IA. **Administrador técnico:** opcional para conectar CRM via API. **Terceiro afetado:** lead que forneceu informações com base legal e finalidade específica, direitos LGPD a verificar.

## 2. Micronichos e ordem de descoberta (scores hipotéticos)
| Micro-ICP candidato | Por que faz sentido | Limite/riscos | Proposta de ordem |
|---|---|---|---|
| **Consultoria comercial B2B de prospecção própria** | Vendas estruturadas, dono do CRM acessível, menor complexidade de controladoria de terceiros | Pode usar CRM com automação nativa; volume próprio não comprovado | **1, preferido para discovery** |
| **Agência de geração de demanda B2B com captação própria** | Conhece formulários/campanhas, recebe oportunidades por vários canais, experiência com SaaS | Grande maturidade em Make/Zapier/CRM reduz valor incremental | **2, validação paralela** |
| Agência full-service com vários clientes | Muitos fluxos repetíveis, possível escala comercial | Dados/credenciais de terceiros, separação por conta e autorização, contratos/LGPD, custos por cliente | **3, fase posterior** |
| Consultoria de implantação CRM/RevOps | Sabe usar APIs e pode revender indicação/serviço | Forte capacidade interna de criar automações, concorrência funcional; avaliar parceria em vez de venda direta | **4, possível canal comercial** |

**Características verificáveis a coletar somente em entrevistas futuras autorizadas:** equipe comercial de 2 a 10 como hipótese, CRM já contratado, responsável legal e aprovador identificados, origens de leads próprias com finalidade e acesso legítimos, processos de registro repetitivos, autorização para sandbox, volume mensal e tempo manual medidos. **Não inventar 30+ leads e 4+ min como dados observados**, são limiares hipotéticos do estudo anterior.

**Não incluir no primeiro piloto:** clínicas/saúde e dados sensíveis; bases raspadas, compra de listas sem direito, envio em massa, credenciais de contas de clientes da agência, disparos de mensagens comerciais automáticos, alteração de CRM sem aprovação, agendamento automático. Nenhum contato externo autorizado nesta WO.

## 3. Jobs-to-be-done e fronteira do problema
- 'Quando um lead B2B chega por canal autorizado, quero validar os campos, identificar duplicidade e receber uma proposta clara de registro no CRM, para aprovar sem repetir digitação e sem perder rastreabilidade.'
- 'Quando a IA erra ou não sabe, quero bloquear/revisar, nunca lançar informação inventada no CRM.'
- 'Quando o CRM está indisponível ou posso ter escrito e não recebido confirmação, quero reconciliar antes de tentar de novo.'
- 'Quando mudo de CRM ou de serviço atendido, quero configurar conector/template sem reconstruir meu produto inteiro.'

**Hipóteses a testar (H01..H07):**
H01 leads chegam por ao menos duas fontes autorizadas; H02 revisão/manual é repetitiva e mensurável; H03 há duplicações/erros custosos; H04 aprovação humana preserva tempo líquido; H05 automações nativas do CRM ainda deixam lacunas; H06 API está contratualmente acessível; H07 cliente quer um SaaS separado e aceita preço superior a custo marginal. Todas UNKNOWN.

## 4. Jornada de compra e implantação (PLANEJAMENTO, não software)
1. Sócio identifica gargalo com dados de processo e decide se o CRM atual não resolve.
2. Demonstração sintética com KOROS em modo sem escrita: entrada → validação/dedupe → proposta → revisão → auditoria.
3. Verificação de plano CRM, API, direitos sobre fonte, contas/consentimento e papéis de aprovação.
4. Gestor conecta conta por integração oficial (apenas futura implementação), escolhe template "Lead B2B → CRM", mapeia campos, limites e aprovações.
5. Teste de integração em sandbox oficial e verificação do external_id/roteamento.
6. Ativação controlada com limites, logs redigidos, revogação e suporte definidos em contrato.
**Objetivo de UX:** não exigir que cliente escreva scripts ou hospede ECC/n8n/servidor; setup guiado no SaaS gerenciado. O modo self-host futuro não é requisito do primeiro piloto.

## 5. Diferenciação mínima necessária (contra CRM/Make/Zapier)
**Não posicionar como** 'mais um formulário que adiciona contato', 'ChatGPT conectado ao CRM', 'CRM substituto' ou 'automação genérica'. Esses recursos são fáceis de replicar e alguns já existem nativamente.
**Posicionar para teste como:** 'A camada de controle entre seus leads e o CRM: valida dados, identifica possíveis duplicatas, prepara o registro e só executa o que seu time aprovou, com histórico e fácil configuração.'
Quatro capacidades que precisam de prova comparativa: (1) preview e aprovação vinculada aos campos e à versão do payload, (2) deduplicação e reconciliação de erro de API, (3) auditoria por responsável/tenant, (4) onboarding de canal e CRM com poucas etapas. **Nenhuma comprovada no produto ainda.**

## 6. Critérios claros para não fazer um SaaS redundante
- Se o CRM e Make/Zapier do cliente já oferecem o mesmo fluxo e qualidade sem custo adicional relevante: **NO_GO do ICP** ou reposicionar como solução de gestão de aprovações, apenas mediante valor mensurável.
- Se a empresa não tem CRM ou não pode conceder integração: fora do piloto inicial, sem obrigá-la a contratar planos pagos.
- Se o decisor precisa de execução automática sem gate humano: incompatível com o primeiro produto escolhido; não remover aprovação.
- Se a revisão humana consome mais tempo do que economiza: NO_GO para a promessa de produtividade, ainda que tecnicamente funcione.
- Se não houver base legal para os leads, DPA e finalidade demonstráveis: STOP.
- Se só houver dados de clientes da agência, risco de tenancy/controller adicional: diferir.

## 7. Evidências que faltarão mesmo após esta issue documental
Entrevistas reais, uma amostra consentida de processo, plano/API da conta concreta, tempo de qualificação, frequência de duplicatas, custo por lead, disposição a pagar, disponibilidade de aprovador, teste sandbox e ROI. **Todos NOT_RUN/UNKNOWN, não inventar empresas ou clientes.**

Referências oficiais de mercado e API: [Agendor](https://www.agendor.com.br/planos-precos/crm), [HubSpot developer](https://developers.hubspot.com/developer-platform-basics), [RD Station CRM v2](https://developers.rdstation.com/reference/crm-v2-introduction), [Make](https://www.make.com/en/pricing), [Zapier](https://zapier.com/pricing), [n8n licença](https://support.n8n.io/article/can-i-use-your-license-for-my-use-case). Consulte os planos reais antes da integração.
