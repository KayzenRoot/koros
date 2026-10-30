# KOR-DISC-002-01 | Scorecard de ICP e roteiro de validação futuro
**Issue:** #24 · **Estado:** PROPOSED / FOUNDER_DECISION_PENDING, entrevistas NOT_RUN · **Start:** serviços e leads/agendamentos já aprovados pelo fundador.
**Recomendação condicional:** agências/consultorias comerciais B2B que já possuem CRM oficial, priorizando leads próprios para evitar mais um relacionamento de controladoria de dados; alternativa manutenção/instalação técnica.

## Scorecard para aplicar em cada futura empresa (sem dados reais agora)
| Campo | Pergunta objetiva / forma de comprovar | Estado desta pesquisa |
|---|---|---|
| Subsegmento | Agências B2B, consultoria, manutenção, domiciliares ou agendamentos | Candidato, founder não escolheu |
| Leads/mês | Contagem extraída do processo da empresa com autorização | UNKNOWN; threshold 30+ é hipótese |
| Tempo manual por lead | Cronometragem consentida de 10 operações ou amostra acordada | UNKNOWN; threshold 4+ min é hipótese |
| Fonte do lead | Formulário/webhook/API oficial com termos permitidos | UNKNOWN |
| CRM | Produto, plano, versão, API efetiva, scopes e sandbox | UNKNOWN; APIs públicas não provam entitlement |
| Duplicação | Taxa de external_id repetido e conflito humano | UNKNOWN |
| Aprovadores | Papel, disponibilidade para revisão, no máximo de filas | UNKNOWN |
| Custo atual | Horas operacionais + licenças que a empresa já paga | UNKNOWN |
| Alternativa nativa | Automação integrada no CRM que já resolve a dor? | UNKNOWN; veto se não houver valor incremental |
| LGPD e direito | Controlador/operador, bases legais, retenção, DPA | UNKNOWN |
| Budget | Valor econômico aceitável para setup e assinatura | UNKNOWN |
| ROI | `tempo_recuperado×custo_hora - mensalidade - novos custos` | UNKNOWN |
| Interesse/aceite | Entrevista e carta de intenção opcionais, com consentimento | NOT_RUN |

## Questionário de descoberta futura (não contatar agora)
1. Quantos leads chegam semanalmente e por onde? Há dados medidos?
2. Quem valida e como registra no CRM hoje? Quantas pessoas?
3. Quanto tempo por lead, duplicações e erros ocorrem em amostra?
4. Quais CRMs/planos e APIs existem? Há autorização para integrar e sandbox?
5. O CRM já automatiza isso sozinho? Por que a empresa ainda gasta tempo?
6. Qual volume financeiro representa um lead qualificado não registrado?
7. Quem pode aprovar gravações, quais alterações exigem revisão e como pausar?
8. Quais dados sensíveis/terceiros surgem, e quem é controlador?
9. Qual restrição de instalação, suporte e segurança impede contratar SaaS?
10. Que ganho mensurável justificaria setup e recorrência? Qual seria critério de desistência?

## Regras GO/NO_GO antes de implementar
- **GO DISCOVERY:** usuário escolhe subsegmento para aprofundar; somente pesquisa read-only autorizada.
- **GO PILOT (futuro):** pelo menos 1 empresa interessada identificada legitimamente, autorização de contato, API/termos apropriados, ambiente sintético e critérios de métricas.
- **NO_GO:** API paga não aceita pelo cliente, sem consentimento, política insegura, CRM já resolve plenamente o problema, ausência de tempo manual a recuperar, custo previsto maior que benefício esperado.
- **PIVOT:** se agências não demonstrarem dor além de HubSpot/Agendor/RD/Make, priorizar manutenção técnica e medir triagem pré-OS sem substituir Auvo/Field Control.
- Nenhum cliente foi contatado, conta criada, teste executado ou preço proposto.

## Perfil aprovado e atualização de uso (2026-10-29)
**Aprovação do fundador:** PM01-D01-S1 C, agências de marketing B2B/consultorias comerciais com CRM ativo e preferência por leads próprios. A linha anterior "Founder decision pending" era histórico pré-aceite; o subsegmento de SERVIÇOS está escolhido como direção. **O micro-ICP e os thresholds continuam hipóteses**.
- Consultar [ICP detalhado](agency-consultancy-icp.md) para buyer, usuário e controlador de dados.
- Conferir em cada futuro cliente se o CRM já faz o mesmo serviço e se a API contratada permite escrita; sem isso => NO_GO.
- Volumes 30+ leads/mês, 4+ min/lead e 2–10 pessoas são filtros hipotéticos de triagem, não fatos de mercado. Validar por coleta consentida futura.
- Sem entrevistas, clientes, cadastros, testes de API ou compra nesta etapa.

## PM01-D01-S1-C1 aprovado: aplicar scorecard apenas ao micro-ICP da consultoria (2026-10-29)
O fundador escolheu **consultorias comerciais B2B com CRM ativo e leads próprios** como micro-ICP PRIORITÁRIO de planejamento. Não confundir com validação de demanda. [Métricas de baseline e GO/NO_GO](consultoria-b2b-validation-go-nogo.md) e [jornada AS-IS](consultoria-b2b-manual-process-and-sources.md) são a especificação vigente de coleta futura. Sem contato externo na atual Work Order; cada entrevista/piloto exige autorização e consentimento próprios.
