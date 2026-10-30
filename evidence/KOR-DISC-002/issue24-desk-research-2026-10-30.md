# Evidence Bundle | KOR-DISC-002-01-CV-PREP-01 | Desk research pública (2026-10-30)
**Issue [#24](https://github.com/KayzenRoot/koros/issues/24) · PR [#36 Draft](https://github.com/KayzenRoot/koros/pull/36) · Fonte oficial ou fornecedor · Sem interação com indivíduos, contas ou sistemas privados.**
**Base Context Lock pré-incremento:** main `30819b2622d5dc865931d5c55e9e9e9586648276`; PR HEAD `de514fe793f952fb9bfaef6d0fda42c9f00924a4`. Verificar SHA final e checks após registro.

## 1. Registro de fontes e qualidade
| ID | URL original | Observação verificável (data/escopo) | Classe | Limitação e interpretação |
|---|---|---|---|---|
| S01 | [IBGE/CONCLA CNAE 7020-4/00](https://cnae.ibge.gov.br/?subclasse=7020400&tipo=cnae&versao=9&view=subclasse) | Serviços de consultoria e orientação em gestão empresarial (definição da atividade) | DEFINIÇÃO OFICIAL | Não confirma empresa com CRM, lead próprio ou cliente potencial |
| S02 | [Observatório Sebrae, grupo consultoria gestão](https://observatorio.sebrae.com.br/profile/industry/atividades-de-consultoria-em-gestao-empresarial) | Exibe **173.876** empresas/estabelecimentos ativos para dezembro de 2025, e indicadores de 2025/2026 | AGREGADO OFICIAL/SETORIAL, BAIXA CONFIANÇA PARA TAM | Categoria mais ampla que micro-ICP; seção combina 173.876 e 172.521 em cortes distintos, e subtotais por porte não reconciliam diretamente com o total destacado; NÃO somar ou usar como TAM |
| S03 | [Mapa de Empresas, painéis](https://www.gov.br/empresas-e-negocios/pt-br/mapa-de-empresas/painel-mapa-de-empresas) | Fonte CNPJ; painel com dados até setembro/2026, publicado/atualizado em 20/10/2026 | ÓRGÃO FEDERAL | Nenhum filtro de CRM, origem dos leads ou orçamento; não foi extraído dataset segmentado nesta rodada |
| S04 | [Agendor, preços e capacidades](https://www.agendor.com.br/planos-precos/crm) | Free R$0/até 3 usuários, API aberta/Pluga/Zapier/Make listados; Performance R$83/usuário/mês com automações | PRIMÁRIA DO FORNECEDOR | Oferta comercial mutável e integrações de terceiros com custos/limites próprios; entitlement de cliente UNKNOWN |
| S05 | [HubSpot, automatizar processos](https://knowledge.hubspot.com/get-started/automate-your-processes) | Recursos de automação variam por assinatura, página atualizada em agosto/2026 | DOCUMENTAÇÃO FORNECEDOR | Não comprova automação habilitada em conta real |
| S06 | [HubSpot, duplicatas](https://knowledge.hubspot.com/records/manage-duplicate-records) | Ferramenta de gerenciamento de duplicatas com subscrições Professional/Enterprise listadas; página setembro/2026 | DOCUMENTAÇÃO FORNECEDOR | Não presume automação superior/inferior, nem todos planos/objetos |
| S07 | [Zapier, Human in the Loop](https://help.zapier.com/hc/en-us/articles/38731463206029-Request-approval-to-keep-your-workflow-running-with-Human-in-the-Loop) | Request Approval pausando Zap para aprovar/rejeitar/alterar, recurso premium pago | DOCUMENTAÇÃO FORNECEDOR | Aprovação humana **não é exclusiva** do KOROS; confirmar preços/capacidade antes de comparação real |
| S08 | [Zapier Free](https://help.zapier.com/hc/en-us/articles/32337438839565-What-s-included-in-Zapier-s-Free-plan) | Free com 100 tarefas/mês e Zaps de duas etapas, atualização 21/08/2026 | DOCUMENTAÇÃO FORNECEDOR | Pode ser suficiente para pequenas operações; não confundir com Human in the Loop pago |
| S09 | [Make preços](https://www.make.com/en/pricing) | Free inclui até 1.000 créditos/mês e intervalo mínimo de 15 minutos | OFERTA FORNECEDOR | Uso/contagem de créditos, limites e condições podem mudar |
| S10 | [ANPD, papéis dos agentes](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-para-definicoes-dos-agentes-de-tratamento-de-dados-pessoais-e-do-encarregado) | Diretriz controlador/operador, papéis e responsabilidades | ORIENTAÇÃO REGULATÓRIA | Contratos e bases legais de clientes reais NÃO VERIFICADOS |
| S11 | [ANPD, legítimo interesse](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-lanca-guia-orientativo-sobre-legitimo-interesse) | Necessidade, finalidade e balanceamento; não aplicável a dados sensíveis | ORIENTAÇÃO REGULATÓRIA | Não constitui avaliação jurídica nem autoriza prospectar pessoas |
| S12 | [HubSpot Sales pricing](https://br.hubspot.com/pricing/sales) | Automação e ferramentas variam entre Free/Starter/Professional; alguns custos de onboarding | OFERTA FORNECEDOR | Moeda, promoção, licença e configuração concreta variam; não cotar preço KOROS a partir disso |

**Interpretação de evidência:** `PUBLIC_VERIFIED` = URL e texto de autoridade primária consultados em 2026-10-30. `VENDOR_CLAIM` = informação divulgada pelo fornecedor, não homologada ou testada. `INFERENCE` = hipótese de negócio. `UNKNOWN` = sem fonte/prova suficiente. `NOT_RUN` = testes/entrevistas/contas/prospecção jamais realizados. Não atribuir HIGH_CONFIDENCE a mercado endereçável com base em classificação CNAE ampla.

## 2. Achados e contraevidência
1. **Existência setorial comprovada, demanda não:** CNAE e registros agregados não mostram funil, ferramenta CRM, volume de leads, tempo manual ou desejo de contratar. `TAM/SAM/SOM=UNKNOWN`.
2. **Forte substituição competitiva:** Agendor Free oferece API; Performance automatiza tarefas/negócios; HubSpot tem workflows/duplicate management conforme plano; Zapier permite aprovação humana em plano pago; Make tem alternativa de baixo custo. O KOROS **não pode vender aprovação/IA como exclusividade**.
3. **Qualidade do Sebrae:** destacar que o painel tem rótulos e períodos distintos e subtotais não conciliados. Não calcular taxa de penetração de CRM ou número de clientes elegíveis sem microdados reconciliados, filtro válido e proveniência.
4. **LGPD:** consulta a dados públicos **não** prova liberdade para captar/prospectar pessoas físicas ou usar leads de terceiros. Pesquisa atual não coletou qualquer lead, endereço de contato ou dado de cliente.
5. **ROI não calculável:** custo/hora real, volume, taxa de aprovação, retrabalho, suporte, licenças e preço do KOROS continuam desconhecidos. Exemplos anteriores de 60/300 leads são matemática ilustrativa.
6. **Resultado permitido:** apenas pré-registrar critérios de falsificação e pesquisa futura em [protocolo](../../docs/product-m01/issue24-commercial-validation-protocol.md).

## 3. Evidence table desta rodada
| Obrigação | Resultado | Prova / limite |
|---|---|---|
| Pesquisa pública restrita ao ICP aprovado | PASS_DOCUMENTARY | S01–S12, sem listas nominativas |
| Contrafactual CRM/Make/Zapier | PASS_DOCUMENTARY | S04–S09, disponibilidade por plano documentada |
| Métricas objetivas e amostra futura | PREPARED_NOT_EXECUTED | protocolo, H-CV01..08 e gates propostos |
| Proveniência de clientes/tempo/ROI | UNKNOWN / NOT_RUN | sem acesso ou cliente |
| LGPD/mandato de leads próprios | UNKNOWN / NOT_RUN | apenas guia ANPD |
| Entrevistas, contas, API ou piloto | NOT_RUN | explicitamente proibidos nesta rodada |
| Testes T-01..T-12 e CRM-R01..R12 | NOT_RUN | nenhum software ou CRM foi testado |
| Código/CI/segredos/PR #25+ | NOT_APPLICABLE / NO_CHANGE | read-back pós-commit para confirmar |
| Aprovação de passagem de fase | NO | aceite anterior é somente `FOUNDER_ACCEPTED_DOCUMENTAL_READINESS` |

## 4. Risk & STOP
- **R1 HIGH (para validação futura):** extrapolar 173.876 para potencial de compra, violando denominador/recorte. Mitigação: nenhuma estimativa de TAM/SAM/SOM nesta PR.
- **R2 HIGH (para go-to-market):** afirmar diferenciação sem benchmark vs CRM nativo e automação (plano efetivo) → `NO_GO` se não houver economia adicional.
- **R3 HIGH (para dados/clientes):** uso de dados sem direitos, base legal ou mandato → `BLOCKED` e `STOP`.
- **R4 STANDARD (para pesquisa):** painel com série/subtotais não conciliados → não inferir tamanho do micro-ICP nem ticket.
- **R5 STANDARD (para projeto):** confundir `GO_DOC_PROTOCOL_ONLY` com `MARKET_VALIDATED` ou `GO_PILOT` → exigir novo aceite e auditoria.
**Nunca** publicar dados pessoais, criar conta, contactar empresas, acessar API, gastar, fazer merge/Ready, editar outras issues ou iniciar #25.

## 5. Veredito a confirmar por CI
`DOCUMENTARY_RESEARCH_PREPARED`, sujeito a read-back HEAD, diff, check obrigatório `governance-docs`, Socket informativo e revisão `COMMENTED`. Não é `COMMERCIAL_VALIDATED`; mercado e viabilidade monetária seguem UNKNOWN.
