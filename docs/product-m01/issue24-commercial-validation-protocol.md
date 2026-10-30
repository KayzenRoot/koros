# KOR-DISC-002-01 | Protocolo PROPOSTO de validação comercial do micro-ICP
**Nexlabs Technology · KOROS · Issue [#24](https://github.com/KayzenRoot/koros/issues/24) · [PR #36 Draft](https://github.com/KayzenRoot/koros/pull/36) · 2026-10-30**
**Status:** `PROTOCOL_PREPARED / FIELD_VALIDATION_NOT_AUTHORIZED / NOT_RUN`. Este é o **próximo estágio PREPARADO**, não uma execução, autorização ou aprovação de novo produto. O marco `PM01-D01-S1-PLAN-READY-01=FOUNDER_ACCEPTED_DOCUMENTAL_READINESS` permanece intacto.

## 1. Work Order existente, incremento documental limitado
- **ID estável:** `KOR-DISC-002-01`; subetapa de preparação `KOR-DISC-002-01-CV-PREP-01`, sem abrir outro módulo/issue.
- **OBJECTIVE:** pré-registrar hipóteses falsificáveis, desenho amostral futuro, protocolo de coleta segura e gates comerciais no ICP já escolhido.
- **CONTEXT:** PM01-D01..D05, PM01-D01-S1 C, PM01-D01-S1-C1 e CRM-REF-01 A aceitos para planejamento; lead próprio → proposta IA → aprovação humana server-side → CRM oficial. Agendor v3 é REFERÊNCIA SINTÉTICA, HubSpot DBV/Projects é REFERÊNCIA DE PORTABILIDADE, não stack obrigatória.
- **SCOPE (NECESSARY):** fontes agregadas públicas; matriz de concorrência por entitlement; observáveis e fórmulas; hipóteses H-CV01..08; viés e cadeia de evidências; gates/STOP; integração com scorecard já existente.
- **OUT OF SCOPE:** procurar indivíduos, adquirir listas, enviar mensagem, entrevista, scraping/crawling automatizado, obter API key, criar conta, comprar, alterar software, executar piloto, formular preço de venda definitivo, aprovar mercado, avançar #25 ou passar fase.
- **FILES/SOURCES TO READ:** `docs/14-checkpoint.md`, `docs/13-decisions-ledger.md`, `docs/02-scope.md`, `docs/12-definition-of-done.md`, `docs/01-requirements.md`, `docs/product-m01/decisions.md`, `icp-validation-scorecard.md`, `consultoria-b2b-validation-go-nogo.md`, `crm-reference-agendor-vs-hubspot.md`, `evidence/KOR-DISC-002/issue24-plan-ready-audit.md` e evidência pública [2026-10-30](../../evidence/KOR-DISC-002/issue24-desk-research-2026-10-30.md).
- **REQUIREMENTS:** R-03, R-05, R-06, R-08, R-12, R-13, R-14 em escopo de provas futuras, sem alegação de implementação; nunca ampliar R-15..R-17.
- **ARCHITECTURE RULES:** core multissetorial, CRM existente do cliente, fonte própria com direito, aprovação humana antes de qualquer escrita, política/limites fora do LLM, deny-by-default, sem integração não autorizada.
- **CONSTRAINTS:** somente Markdown na branch PR #36 Draft, `main` protegida e intacta, `governance-docs` obrigatório, Socket informativo, revisão COMMENTED; ECC nunca requerido.
- **ACCEPTANCE CRITERIA desta PREPARAÇÃO:** fontes com data/escopo/limitações; hipóteses testáveis; amostra e enviesamento; métricas/denominadores; comparação com concorrente nativo; pré-registro de GO/NO_GO/STOP; separação de fatos, propostas e lacunas; read-back do HEAD e CI.
- **TESTS:** revisão de links locais e markdown por CI; casos adversos definidos; nenhum teste de app/API/mercado. `T-01..T-12=NOT_RUN`, `CRM-R01..R12=NOT_RUN`.
- **DELIVERABLES:** este protocolo, evidence desk-research, referências da issue #24 e Evidence Bundle, Checkpoint Delta **PROPOSTO**.
- **REVIEW FORMAT:** Context Lock base/head, arquivos e limites, citações, testes CI, riscos, verdict `GO_DOC_PROTOCOL_ONLY` ou `CORRECTION_REQUIRED/BLOCKED`.
- **STOP CONDITION:** qualquer drift, decisão conflitante, dados pessoais, entitlement suposto, evidência de monetização fabricada, alteração de outra issue, commit de código, falha documental HIGH/CRITICAL ou ausência de permissão para pesquisa com pessoas.

## 2. Mercado e definição do universo (DESK RESEARCH, não TAM/SAM/SOM)
A [CNAE IBGE 7020-4/00](https://cnae.ibge.gov.br/?subclasse=7020400&tipo=cnae&versao=9&view=subclasse) abrange **consultoria em gestão empresarial**, que inclui organizações sem operação comercial B2B com leads próprios ou CRM. O [Observatório Sebrae](https://observatorio.sebrae.com.br/profile/industry/atividades-de-consultoria-em-gestao-empresarial) exibe **173.876 empresas/estabelecimentos ativos** em sua visão de dezembro de 2025 e métricas de emprego de 2025; o mesmo painel exibe períodos e subtotais não diretamente reconciliados nesta leitura. O [Mapa de Empresas](https://www.gov.br/empresas-e-negocios/pt-br/mapa-de-empresas/painel-mapa-de-empresas) disponibiliza dados CNPJ até setembro de 2026. **Nenhuma dessas populações** representa automaticamente organizações com CRM ativo, leads próprios, orçamento ou demanda pelo KOROS. Não aplicar percentuais arbitrários para fabricar TAM/SAM/SOM.

**Filtro ICP futuro, NÃO OBSERVADO:** consultoria comercial B2B prestando serviço a outras empresas, responsável pelos **próprios leads**, CRM já em uso (qualquer fornecedor autorizado), decisor acessível sob autorização, operador/aprovador humano e processos repetitivos que o CRM atual não resolva a menor custo. **Excluir:** bases compradas/raspadas, leads de clientes sem mandato, campos sensíveis, negócios regulados, empresas sem direito de API e dependência de trocar de CRM.

## 3. Hipóteses refutáveis, com estado hoje
| ID | Hipótese a testar futuramente | Evidência aceitável | Falsificador / evidência contrária | Estado |
|---|---|---|---|---|
| H-CV01 | Existe volume repetível de leads **próprios** | export agregado autorizado do CRM/fonte com janela e denominador | volume esporádico, proveniência desconhecida | UNKNOWN |
| H-CV02 | Trabalho manual AS-IS é relevante | ≥10 eventos cronometrados por empresa (amostra sugerida) e lista de passos | quase nenhuma intervenção ou erros | UNKNOWN |
| H-CV03 | Revisão humana + IA pode poupar tempo **líquido** | comparação pareada (mesmos casos sintéticos/consentidos), aprovação e retrabalho inclusos | aprovação/correções consomem ganhos | UNKNOWN |
| H-CV04 | CRM + recursos nativos não suprem a dor | diagnóstico do **plano atual efetivo** e teste comparativo autorizado | nativo/Make/Zapier resolve igualmente a menor custo | UNKNOWN |
| H-CV05 | Decisor reconhece dor e pagaria para resolvê-la | entrevista consentida + orçamento/faixa de gasto confirmável e próximo passo voluntário | apenas curiosidade sem orçamento/prioridade | NOT_RUN |
| H-CV06 | Entitlement do CRM e fonte permitem caminho legítimo | documentação oficial **e** permissões concretas futuras, escopos, contrato e autenticação | API proibida/cara, sem acesso, sem controlador | UNKNOWN |
| H-CV07 | Separação controlador/operador e retenção é viável | avaliação LGPD por empresa, contrato/DPA e mapa mínimo de dados | falta de fundamento legal/mandato e dados excessivos | NOT_RUN |
| H-CV08 | Unit economics não dependem de custo oculto | custo incremental de aprovação, suporte, operação, API e licenças por cliente | margem negativa/implantação maior que benefício | UNKNOWN |

## 4. Desenho futuro da amostra, APENAS PROPOSTO (exige autorização independente)
1. **Desk research pública**: após eventual autorização futura de protocolo, examinar agregados de 3 fontes oficiais (IBGE/CNAE, Sebrae, Mapa de Empresas), documentar data/corte e limitações; casos publicados por CRMs são marketing, não amostra imparcial. **Não coletar nem publicar listas nominativas de prospects nesta PR.**
2. **Pesquisa com pessoas futura, NÃO AUTORIZADA**: sugerir `12` empresas consultoras B2B independentes, por conveniência/estratos a registrar, distribuídas entre CRMs com automações básicas/avançadas; se não houver 12 elegíveis, marcar `INSUFFICIENT_SAMPLE` e não extrapolar.
3. Em cada empresa: 1 decisor econômico e, quando viável, 1 operador/aprovador distinto; **mínimo proposto** de `8` empresas com dados suficientes para avaliação de dor, com consentimento/mandato documentado. Contar empresas, não pessoas ou falas repetidas.
4. Para performance posterior: pelo menos `4` empresas elegíveis com pares de `10` eventos sintéticos ou legitimamente autorizados, medindo inclusive exceções. Não excluir falhas e não misturar métricas das empresas sem indicar heterogeneidade.
5. Controle de viés: registrar recrutamento, recusas, não resposta, configuração atual do CRM, porte, volume, sazonalidade, receita *não declarada* como UNKNOWN; não tratar avaliações de fornecedores como entrevistas neutras; não fabricar representatividade estatística.
6. **Nenhum contato, entrevista, abertura de conta, download de lista com PII ou coleta de dados reais é autorizado por este documento.**

## 5. Métricas com denominadores e instrumentação futura
| Métrica | Definição precisa | Aceite de prova |
|---|---|---|
| Leads mensais elegíveis | `L=contagem` na janela de 30 dias definida, excluir duplicados e eventos sem direito, indicar cobertura/faltantes | fonte oficial com direito e período, agregado |
| Tempo AS-IS | `T0=mediana` de intake+validação+dedupe+correção humana (min/evento), informar p25/p75 | tempo medido, não estimativa |
| Tempo TO-BE | `T1=mediana` de revisão humana+correção+falhas+reconciliação+parcela de suporte/onboarding (min/evento) | medição pareada e contabilizar falhas/recusas |
| Economia líquida | `Δ=T0−T1`, `redução=Δ/T0` se `T0>0`; calcular por empresa e não somente média global | distribuição por empresa, intervalos descritivos |
| Erros e duplicação | `N_confirmados/N_elegíveis` antes/depois; distinguir candidato vs duplicata confirmada | não substituir precisão pela ausência de log |
| Approval integrity | `N_escritas_não_autorizadas/N_tentativas_adversas`; alvo técnico **zero nos testes negativos**, não garantia universal | `NOT_RUN` até Work Order técnica |
| Benefício operacional | `L×Δ/60×custo_hora_comprovado` menos correções não incluídas; perdas evitadas **somente com causalidade** | origem de custo-hora e hipóteses claramente marcadas |
| Viabilidade | `benefício_real−licença_KOROS−infra−LLM−CRM_incremental−suporte−setup_amortizado−tributos` | preço ainda UNKNOWN e custos de fornecedor sem contrato UNKNOWN |
| Intenção de compra | nº de empresas que **voluntariamente** aprovam próximo passo com orçamento, dividido pelo nº de qualificadas | não equivaler elogio, download ou visita a compra |

**Ressalva:** thresholds exploratórios existentes `≥30 leads/mês` e `≥4 min/lead` são HIPÓTESES, não elegibilidade obrigatória aprovada nem dados observados. O benchmark precisa comparar **CRM sozinho no plano real**, **CRM + automação autorizada** e **KOROS proposto**, sob mesmas condições de dados, suporte e aprovação.

## 6. Pré-registro de critérios de decisão FUTURA (PROPOSTOS, NÃO APROVADOS)
- **GO_TO_FURTHER_VALIDATION (somente sugestão após autorização):** `≥8/12` empresas com perfil verificável; dentro das elegíveis, `≥6` com dor operacional reproduzível **e** falha identificável da alternativa nativa; `≥4` dispostas a avaliar próximo passo com orçamento plausível, sem considerar promessa de pagamento como receita; **em ≥4 empresas** medição pareada com `Δ>0` e redução mediana `≥20%` incluindo revisão, correções, falhas e suporte; custos totais projetados abaixo do benefício **e** nenhuma pendência de direito/LGPD. São limites gerenciais arbitrários de triagem, NÃO testes estatísticos, nem autorização de piloto.
- **INCONCLUSIVE:** abaixo da amostra mínima, dados inconsistentes, CRM real não identificado, simulação sem equivalência ou respostas sem orçamento; continuar somente após novo aceite humano, sem alegar GO.
- **NO_GO/PIVOT (proposta):** ausência de ganho incremental vs CRM/Make/Zapier, `T1≥T0`, custo total maior que benefício plausível, falta de processo repetível ou decisor/aprovador; avaliar outra hipótese **somente por decisão separada**, preservando esta issue.
- **BLOCKED/STOP absoluto:** sem direito dos leads, base legal indefinida, integridade da aprovação não demonstrada, violação de termos/PII, plan entitlement falso, dedupe destrutivo ou alteração indevida de cliente. Não compensar segurança por score comercial.
- **Alcance de aceite:** nem atingir os números gera automaticamente `PLAN_APPROVED`, `COMMERCIAL_VALIDATED`, `GO_PILOT`, implementação ou início da #25. Auditoria independente, decisão do fundador e DoD ainda necessários.

## 7. Provas negativas e concorrência real
- Consultoria não usa CRM; usa CRM mas não possui leads próprios; usa CRM com automações suficientes; não consegue comprovar API/escopos; dados de terceiros sem mandato; respostas positivas apenas de marketing de fornecedor; ausência de comprador/operador; approvals atrasam fluxo; volume é sazonal; custo do suporte apaga ganho; CRM cria duplicação; webhook falso ou replay; estimativas de ROI com dupla contagem; seleção enviesada por fornecedores.
- Agendor [tabela oficial](https://www.agendor.com.br/planos-precos/crm): API aberta no Free e automação nativa no Performance; não se deve anunciar recurso exclusivo ou presumir configuração concreta. HubSpot [workflows](https://knowledge.hubspot.com/get-started/automate-your-processes) e [gestão de duplicatas](https://knowledge.hubspot.com/records/manage-duplicate-records) por assinatura; comparar ao plano real. Zapier [Request Approval](https://help.zapier.com/hc/en-us/articles/38731463206029-Request-approval-to-keep-your-workflow-running-with-Human-in-the-Loop) requer plano pago; Make [Free](https://www.make.com/en/pricing) com franquia e limites. **Diferencial KOROS = HIPÓTESE a falsificar**, não funcionalidade exclusiva.

## 8. Privacidade e custódia de evidências FUTURAS
- Pesquisa atual somente em documentos públicos e agregados; não copiar CNPJ nominal, e-mails, telefones, LinkedIn ou depoimentos identificáveis ao repositório público.
- Se futura pesquisa de campo for autorizada: finalidade, base legal, controlador/operador, minimização, conservação/eliminação, mandato para leads próprios/de terceiros, controle de acesso e contrato. **Consentimento não é única base legal**, tampouco menção pública a um dado dispensa LGPD. Ver [ANPD agentes](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-para-definicoes-dos-agentes-de-tratamento-de-dados-pessoais-e-do-encarregado) e [ANPD legítimo interesse](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-lanca-guia-orientativo-sobre-legitimo-interesse).
- Evidência privada futura, em armazenamento autorizado fora do GitHub público: identificador pseudônimo de empresa, data, papel, origem, versão do instrumento, autorização, evidência negativa, tempo/amostra e integridade. GitHub recebe apenas estatísticas agregadas e referências sem PII.
- Diário de auditoria: autor, timestamp, fonte/URL, data do indicador, versão, confiança, contraevidência, incógnitas e reavaliação de mudanças de plano/contrato.

## 9. Estado e STOP
**`GO_DOC_PROTOCOL_ONLY`** após read-back técnico-documental, condicionado a CI e revisão. `FIELD_VALIDATION=NOT_RUN`; `TAM/SAM/SOM=UNKNOWN`; `COMMERCIAL_VALIDATED=NO`; `GO_API=NO`; `GO_PILOT=NO`; `PLAN_APPROVED=NO` (transição de fase); `IMPLEMENTED_VERIFIED=NO`. Não transformar documentação em execução; manter issue #24 OPEN, PR #36 Draft, #25..#35 intactas, Checkpoint Delta PROPOSTO e sem merge/Ready/código/contas/contatos/custos/deploy.
