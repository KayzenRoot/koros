# KOR-DISC-002-01 | Processo manual, fontes de lead autorizadas e contratos de CRM
**Nexlabs Technology | KOROS | Issue #24** · **Estado:** desenho de pesquisa, nenhum fornecedor contratado, nenhum lead real lido. Primeiro fluxo: lead→CRM com approval humano.

## 1. Processo AS-IS de uma consultoria comercial B2B (HIPÓTESE)
| Seq. | Etapa manual possível | Ator/ferramenta | Desperdício ou erro a MEDIR |
|---|---|---|---|
| 1 | Receber lead no site, formulário, e-mail ou evento oficial | Form/caixa de entrada | Tempo até primeira leitura |
| 2 | Conferir autorização, origem e dados obrigatórios | Operador | Campo faltante e possível base ilícita |
| 3 | Conferir se é prospect B2B correto | SDR | Classificação inconsistente |
| 4 | Copiar/colar nome/empresa/email/telefone | Operador → CRM | Minutos e erros de transcrição |
| 5 | Pesquisar duplicidade de pessoa/empresa | CRM | Contatos duplicados por domínio/telefone |
| 6 | Vincular etapa e responsável correto | Head of Sales | Atribuição incorreta |
| 7 | Pedir confirmação de informação ambígua | Gestor/operador | Tempo e canal de retrabalho |
| 8 | Criar pessoa/empresa/negócio | CRM | Ação sem auditoria ou permissão |
| 9 | Avisar o responsável e registrar resultado | CRM/comunicação | Leads não processados no prazo |
| 10 | Resolver falhas/duplicados posteriormente | RevOps | Retrabalho e perda de confiança |

**Ainda não confirmado** que alguma consultoria execute todas as 10 etapas, ou que gaste vários minutos por lead. Uma entrevista futura deverá mapear o fluxo real e eliminar passos inexistentes.

## 2. Processo TO-BE do KOROS (PROPOSTO, não implementado)
Fonte autorizada → evento autenticado → validação de esquema/finalidade → normalização e dedupe intra-tenant → IA sugere classificação estruturada sem receber campos excessivos → preview com destino CRM e versões → **gestor aprova payload exato** → policy/RBAC server-side verifica → CRM API oficial recebe upsert seguro/reconciliação → trilha auditável e alertas de erro.
O KOROS **não** substitui o CRM, não envia mensagens proativas e não realiza agenda ou cobrança no primeiro MVP.

## 3. Fontes de lead elegíveis e não elegíveis
| Fonte | Via legítima possível | Restrições comprovadas ou a verificar | Classificação atual |
|---|---|---|---|
| **Formulário no site próprio** da consultoria | Webhook backend assinado/integração consentida pelo controlador | HTTPS, secret, replay nonce/timestamp, finalidade LGPD, mapeamento; API de cada CMS a confirmar | **PREFERÊNCIA CONCEITUAL, não escolhida como provider** |
| **Landing page contratada** | API/webhook **oficial** e direito do titular | Recursos variam por assinatura/canal e dados coletados | CANDIDATO / PLAN_UNKNOWN |
| **Google Forms próprio** | Forms API oficial + watch para Pub/Sub, com OAuth e acesso ao formulário | Push usa Cloud Pub/Sub, watch dura 7 dias, notificações podem agrupar eventos; custos/cotas do Cloud Pub/Sub **não verificados**; não chamar de integração gratuita | CANDIDATO/COMPLEXO |
| **E-mail de caixa empresarial própria** | API oficial do provedor e autorização do titular/empresa, parser sob consentimento | Escopos e tratamento de dados pessoais; não pedir senha do usuário | DEFER/REVIEW |
| **Importação manual de CSV de leads próprios** | Upload explícito autorizado, pré-visualização e validação, sem conectividade externa | Proveniência, finalidade e retenção; útil como fallback sintético futuro | DEFER/OPCIONAL |
| **WhatsApp Business oficial** | Cloud API da Meta / fornecedor autorizado | Regras de conversa, templates, custos, consentimentos e app review; não presumir API livre nem scraping via WhatsApp Web | DEFER/NO MVP |
| **Leads Meta Ads** | Marketing/Lead Ads API oficialmente habilitada e permissões `leads_retrieval` quando aplicáveis | App review, permissões business, consentimento e custos, sem entitlement comprovado | DEFER/NO MVP |
| **Listas raspadas / marketplace / CRM de terceiros sem mandato** | Nenhuma rota autorizada para o piloto | Sem direito/finalidade/consentimento, proibir scraping e exportação indevida | **EXCLUDED/STOP** |

**Fonte oficial Google Forms:** https://developers.google.com/workspace/forms/api/guides/push-notifications . Para fontes CMS/e-mail/Meta, documentação e direitos específicos devem ser verificados em ADR de conector FUTURO, sem gerar API keys, formulários reais ou contas.

## 4. Fornecedores CRM: dados oficiais relevantes (revalidar na fase técnica)
| CRM | API, conta/plano e detalhe oficial | Comportamento concorrente/risco |
|---|---|---|
| **Agendor** | API REST v3 pública e webhooks; docs de integração declaram **4 req/s** com HTTP 429 quando exceder. Plano Free 3 usuários, 10k pessoas/empresas, 1.500 negócios; API token/entitlement por conta concreta ainda **a verificar**; integrações **nativas** e automações de tarefas são condicionadas a planos pagos e não devem ser confundidas com API. | Potencial baixo atrito no plano que já usa; não afirmar irrestritamente que API/webhooks estão em todo Free sem read-back |
| **HubSpot** | Developer account/test com dados sintéticos e public APIs sem assinatura paga de developer; produção depende do plano/escopo do cliente. Workflows de automação avançada geralmente requerem Professional/Enterprise, assim como gerenciamento avançado de duplicatas. | Tem forte funcionalidade nativa; comparar exatamente plano e recursos que a consultoria possui |
| **RD Station CRM** | API CRM v2 exige **Basic, Pro ou Advanced**; limite documentado 120 req/min e HTTP 429 Retry-After; não habilitar em cliente Free por suposição. | Compatibilidade futura somente com contrato/plano suficiente |
| **Pipedrive** | API v2 de pessoas, empresas, negócios e busca. Token ligado ao usuário/empresa e com acesso amplo conforme usuário; para apps considerar OAuth. | Escopos e custos concretos dependem de conta/integração real |

**Fontes:** https://ajuda.agendor.com.br/pt-BR/articles/2660512-o-agendor-pode-ser-integrado-ao-meu-sistema-atual ; https://ajuda.agendor.com.br/pt-BR/articles/5371555-o-agendor-tem-plano-gratuito ; https://ajuda.agendor.com.br/pt-BR/articles/2691414-como-fazer-integracoes-atraves-da-pluga ; https://developers.hubspot.com/developer-platform-basics ; https://knowledge.hubspot.com/get-started/automate-your-processes ; https://knowledge.hubspot.com/pt/records/manage-duplicate-records ; https://developers.rdstation.com/reference/crm-v2-introduction ; https://pipedrive.readme.io/docs/pipedrive-api-v2 ; https://pipedrive.readme.io/docs/core-api-concepts-authentication .

## 5. Contrato de API que deve ser HOMOLOGADO depois (não implementar aqui)
- Origem: propriedade/mandato válido, verificação de webhook, replay protection, timestamp, versão do schema, revogação.
- CRM: prova documental de **permissão de leitura e escrita na conta/plano**, campos e objetos permitidos, forma de autenticação, armazenamento de secret, quotas, logs, limites, contrato de licença.
- Sem alterar CRM: obter preview sintético e comparar com política de campos e idempotência. Só write após aprovação humana de payload versionado, server-side authorization por tenant.
- Duplicidade: chave composta por tenant + source + external_id; buscar contato existente por identificador legítimo dentro do tenant, política de merge explicitamente humana.
- Ambiguidade do resultado: POST timeout pode ter escrito. Estado `UNCERTAIN_EXTERNAL_RESULT` e reconciliação por identificador antes de tentar novamente; nenhum retry cego.
- Tratamento de 401/403, 422, 429/Retry-After, 5xx, timeout, duplicate, token expirado e payload inválido; leitura e escrita com escopos separados quando a API permitir.
- Isolamento: conexão, token, webhook, fila, logs e aprovação pertencem ao tenant correto, sem mistura de leads próprios com dados de clientes da consultoria.
- Segurança: dados de lead são **conteúdo não confiável**, nunca instruções a agente, shell ou política; LGPD exige esclarecer controlador/operador por arranjo concreto e não usar dados para treinar terceiros por padrão.
- **Status:** TODOS os testes de API/entitlement/consentimento nesta tabela `NOT_RUN`; não criar App, webhook ou enviar POST nesta issue.

## 6. Métricas a medir no AS-IS/TO-BE em fase futura consentida
Tempo de coleta, tempo de copiar/colar, tempo de dedupe, tempo de revisão humana, taxa de duplicados, taxa de correção, fila, SLA de aprovação, sucesso efetivo do CRM, incidentes 429/5xx, tempo até resolução de UNCERTAIN, custo de API/IA/infra por run e custo de suporte. Não prometer automação de 100% dos passos; medir o trabalho do comprador antes de desenhar preço.
