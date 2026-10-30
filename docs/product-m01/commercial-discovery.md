# PRODUCT-M01 | Descoberta comercial, ICP e validação do primeiro produto
**Startup:** Nexlabs Technology | **PM01-D01 A aceita:** começar validação em empresas de **serviços com leads e agendamentos**. **Status de mercado:** hipóteses, NÃO VALIDADO.

## Hipótese ICP para pesquisa, não segmento comprovado
| Perfil candidato | Dor a investigar | Fluxo candidato | Dependência crítica |
|---|---|---|---|
| Clínicas/estúdios de serviços NÃO clínicos | leads perdidos, retorno lento, agendamento | lead→CRM com revisão humana | consentimento e políticas de comunicação, dados potencialmente sensíveis |
| Prestadores de manutenção/instalação | solicitações em diferentes canais, duplicação de cadastro | lead→CRM com categorização | API de CRM, catálogo de serviços |
| Serviços de consultoria/agências | qualificação manual e follow-up disperso | lead→CRM com classificação | fonte oficial e CRM/sandbox |
| Serviços para casa e empresas | triagem de orçamento, perda de oportunidade | lead→CRM com revisão | classificação sem prometer preço/decisão automática |

A tabela não define empresas ou contagem de mercado. Evitar segmentos com dados médicos, financeiros ou regulados no piloto inicial até avaliar o risco. Não contactar terceiros nesta fase sem aprovação.

## Entrevista de descoberta (roteiro sugerido)
1. Como o lead chega hoje? Quais canais e sistemas são realmente usados?
2. Quantos leads/semana e quanto tempo por lead? Há números registrados?
3. Onde ocorrem perdas, retrabalho, dados duplicados e atrasos?
4. Quais campos podem ser automatizados com segurança e quais precisam de aprovação?
5. Qual CRM/ERP possui API oficial e sandbox e quem tem poder para autorizar?
6. Quanto custa hoje o trabalho, e qual seria o ganho econômico mensurável?
7. Como a empresa prefere ativar o serviço: SaaS gerenciado, infraestrutura própria, ou outro?
8. Quais restrições de dados, LGPD, integração e consentimento se aplicam?
9. O que impede a compra? Suporte, segurança, preço, treinamento, precisão da IA?
10. Existe interesse em piloto com dados fictícios e critérios de aceite definidos?

## Evidências necessárias antes de prometer adequação
- Entrevistas reais com registro de fonte/consentimento, ou marcar UNKNOWN, nunca inventar.
- Pelo menos 3 propostas comerciais hipotéticas comparadas por ICP; a seleção final do ICP exige confirmação.
- Baseline real de tempo por lead, taxa de duplicação, volume, custo operacional, taxa de intervenção, erros e disponibilidade do CRM, com proteção de dados.
- Teste em sandbox de um conector escolhido e um workflow sintético, só em fase futura de implementação autorizada.
- Modelagem de margem por cliente: preço de setup/assinatura (não decidido) menos infraestrutura, IA, API, suporte, tributos e aquisição; budget/caps antes de transação.
- Critérios de descarte: CRM sem API permitida, perda de dados pessoais, integração cara, ROI não demonstrável, risco de autonomia excessiva ou falta de aprovador.

## Hipóteses de métricas e política de decisão
| Métrica | Como medir | Meta atual |
|---|---|---|
| Tempo manual por lead | cronômetro/processo observado e consentido | PENDING baseline |
| Tempo até primeiro valor | onboarding e primeiro fluxo sintético concluído | PENDING benchmark |
| Duplicação por evento | external_id e reconciliação | Objetivo técnico 0 duplicações nos cenários de teste, não promessa de mundo real |
| Taxa de correções humanas | total de recomendações revisadas | PENDING baseline |
| Custo por lead e margem | logs de uso + cotação dos provedores | PENDING cotação |
| Intenção de pagamento | entrevista/proposta comercial sem cobrança | UNKNOWN |

## Próxima conversa no chat
O fundador já escolheu as cinco diretrizes PM01-D01..D05. O próximo detalhe legítimo é definir **qual subsegmento de serviços vale a primeira prospecção**, com critérios de priorização, deixando CRM/stack/hospedagem pendentes até pesquisa concreta. Isso não reabre ECC e não autoriza entrevistas/contatos externos.

## Pesquisa comparativa independente e critérios de 2026-10-29
A comparação pública em profundidade foi registrada em [segment-comparison.md](segment-comparison.md), com mercado nacional IBGE/Sebrae, concorrentes por segmento, acessos de API, planos efetivos e pontuação **hipotética**, não numérica de mercado. O [scorecard](icp-validation-scorecard.md) separa elegibilidade e baseline das hipóteses ainda sem entrevista.

**Recomendação, NÃO ACEITE DO FUNDADOR:** primeiro validar agências de marketing B2B e consultorias comerciais **com CRM já implantado**, idealmente seus próprios leads; reserva manutenção técnica como segundo candidato se CRM nativo já resolver a dor. **PM01-D01 amplo permanece aprovado** (serviços) e esta escolha específica permanece `PENDING_DECISION`, vinculada exclusivamente à issue #24. Não iniciar contato, teste de API, registro de conta ou gastos.

## Atualização PM01-D01-S1 após decisão do fundador (2026-10-29)
**Escolha C APROVADA PARA PLANEJAMENTO:** agências de marketing B2B e consultorias comerciais já utilizando CRM, preferencialmente leads próprios. O trecho histórico acima que chama C de "recomendação não aceita" registra o estado **antes** desta aprovação e não deve ser usado como estado atual.
- [ICP, personas, subsegmentos e critérios de exclusão](agency-consultancy-icp.md).
- [Comparativo de fornecedores/planos/API e concorrentes](crm-provider-competitive-matrix.md).
- [Proposta de valor e teste de diferenciação versus CRM/Make/Zapier](agency-value-proposition.md).
- **Orientação ainda não aprovada:** investigar primeiro consultorias comerciais com leads próprios, depois agência de geração de demanda; volume de leads, ROI e contrato continuam UNKNOWN.
- Nenhum fornecedor contratado, cliente entrevistado, preço definido ou plataforma implementada.

## Estado vigente depois do novo aceite do fundador (2026-10-29)
**PM01-D01-S1-C1: APPROVED_FOR_PLANNING.** Priorizar consultorias comerciais B2B com **CRM ativo e leads próprios**; agências B2B seguem alternativa posterior. A seção histórica anterior que tratava essa prioridade como 'não aprovada' foi superada por este aceite.
Próximos artefatos somente #24: [personas e compra](consultoria-b2b-micro-icp.md), [fontes e processos](consultoria-b2b-manual-process-and-sources.md), [critérios GO/NO_GO e comparativo nativo](consultoria-b2b-validation-go-nogo.md). Fontes oficiais e quotas são públicas, mas entitlement de cada conta, ROI e demanda permanecem UNKNOWN. Nada foi implementado ou comprado.
