# PRODUCT-M01 / KOR-DISC-002-01 | Agendor vs HubSpot como CRM de referência
**Empresa:** Nexlabs Technology · **Produto:** KOROS · **Micro-ICP aprovado:** consultorias comerciais B2B com CRM ativo e leads próprios · **Issue:** [#24](https://github.com/KayzenRoot/koros/issues/24) · **Data da pesquisa:** 2026-10-30 · **Estado:** RESEARCH_DOCUMENTED / CRM_REFERENCE_APPROVED_FOR_PLANNING_A / IMPLEMENTATION_NOT_STARTED.
**Restrições:** PR #36 Draft, sem merge, código, testes de API, inscrição, contato, despesas, deploy ou ECC obrigatório.

## 1. Conclusão executiva e natureza dos fatos
**Direção aprovada para planejamento pelo fundador em 2026-10-30, exclusivamente como referência documental:** **Agendor** como CRM de referência **exclusivamente para desenho e contrato sintético**, HubSpot como segundo provedor e caso de interoperabilidade futura. **O KOROS não deve exigir que clientes migrem seu CRM.** Recomenda-se Agendor para um primeiro mapeamento por documentação local em português, plano Free com API explicitamente listada e métodos `upsert` de Pessoa/Empresa. HubSpot é superior em modelo público de apps com OAuth por várias contas e ambiente de testes, mas tem superfície de modelo maior e transição de API/legacy apps durante 2026–27.

**EVIDÊNCIA OFICIAL:** URLs de páginas do fornecedor, docs e publicações de changelog. **ESTIMATIVA/HIPÓTESE:** custo de horas do executor, ranking, vantagem de venda e exemplos de volume. **UNKNOWN/NOT_RUN:** permissão e plano de conta cliente, latência, quotas efetivas, assinatura de webhook, direitos LGPD, suporte do provider, preço final KOROS e custo operacional. Nenhuma API foi chamada.

### Mudanças relevantes que REVOGAM interpretações antigas
1. O comparativo oficial Agendor [planos, 2026](https://www.agendor.com.br/planos-precos/crm) lista **API aberta, Pluga, Zapier e Make inclusive no Gratuito**. Um artigo antigo sobre integrações nativas pagas não deve ser usado para afirmar que a integração Pluga é indisponível no Free. Acesso de produto terceiro/plano de Pluga/Make/Zapier ou automações internas é outra questão, com eventual cobrança.
2. Agendor Free custa **R$0 e inclui até 3 usuários, 10 mil pessoas, 10 mil empresas, 1.500 negócios, 1 funil**, sem campos customizados, sem MFA e sem controles de privacidade de Pro; Performance **R$83/usuário/mês** inclui automações internas. Fonte: [planos oficiais](https://www.agendor.com.br/planos-precos/crm). **Preço de plano NÃO é custo de API real e NÃO comprova nível de privilégios por token.**
3. HubSpot Free tem **até 2 usuários e 1.000 contatos** publicados no [site oficial](https://br.hubspot.com/pricing/crm), e a Developer Platform fornece conta de teste gratuita, mas conta de produção precisa de direitos/assentos adequados. Preços promocionais Starter variam por contrato/região/período; não converter USD nem atribuir preço final.
4. HubSpot anunciou em **15/set/2026** fim de suporte das APIs numéricas v1-v3 e apps legados em **set/2027**, e v4 em **mar/2027**; projetar **API versionada por data (`2026-09`, conforme endpoint escolhido) e Projects**, não começar aplicação nova com app privado legado. Fontes: [changelog](https://developers.hubspot.com/changelog/legacy-apis-and-legacy-apps-whats-going-unsupported-and-when), [referência de API](https://developers.hubspot.com/docs/api/how-to-use-hubspot-api).

## 2. Matriz profunda, com estado de prova
| Dimensão | Agendor (documentação pública) | HubSpot (documentação pública) | Implicação KOROS |
|---|---|---|---|
| Plano sem assinatura | Free R$0, até 3 usuários, 10k pessoas/empresas, 1.500 negócios, 1 funil | Free US$0, até 2 usuários, 1k contatos | Agendor reduz probabilidade de cliente precisar de upgrade só pelo limite de contato |
| API declarada em Free | **SIM**, API aberta explicitamente no comparativo de planos | CRM APIs públicas disponíveis; conta de dev test gratuita | Ambos candidatos; acesso concreto do cliente depende de entitlement e permissões |
| Objeto pessoa/contato | `people` + endpoint `POST /v3/people/upsert`; GET `people?email` | `contacts` com properties/ID, busca/upsert conforme endpoint versionado disponível | Validar correspondência, não assumir mesmo esquema |
| Empresa/organização | `organizations` + `POST /v3/organizations/upsert` | `companies`, propriedades e associações | CNPJ/domínio/email com dedupe intra-tenant; empresa não é automaticamente negócio |
| Negócios | `deals` vinculados a pessoa/empresa por rotas concretas | `deals`, pipelines/stages e associações | Mapear stage por ID local do cliente, nunca adivinhar estágios |
| Tarefas | `tasks` em deal por endpoint documentado | `tasks` e outros CRM activities | Não incluir tarefa como escrita inicial sem aprovação separada |
| Campos personalizados | Não inclusos no Free; Pro R$59/usuário/mês | Properties/variantes por plano/objetos, quota/scope dependem da assinatura | Primeiro schema usa campos nativos, extras opcionais/fail-safe |
| Autenticação | Header `Authorization: Token ...` de Menu > Integrações, atrelado à privacidade do usuário; OAuth de distribuição NÃO CONFIRMADO nas fontes | OAuth em app Projects para vários portais; Service Keys para S2S uma conta; hooks não suportados por Service Keys | Agendor requer UX de token seguro e checagem de papéis; HubSpot pode facilitar one-click futuro |
| Webhooks | Eventos de criação/alteração/exclusão de pessoa, empresa, negócio, tarefa e outros; `POST /integrations/subscriptions`; permissões do dono do token definem visibilidade | Webhook subscription no Projects, targetUrl, `crmObjects`, eventos e scopes; Service Keys NÃO têm webhooks | No primeiro fluxo o evento entra no KOROS a partir do formulário próprio; webhook do CRM é opcional |
| Segurança webhook | API token usado na criação; **assinatura HMAC e replay do payload NÃO COMPROVADOS** na documentação consultada | Projetos com configuração de webhooks e política de autenticação a homologar; não afirmar verificação já implantada | Não habilitar escrita por evento não validado; se assinaturas indisponíveis, limitar a dados não confiáveis e reconciliação segura |
| Rate limit geral | **4 requisições/segundo**, 429 após ultrapassar; GET paginado com `links.next`, `per_page` máximo 100 | Free/Starter **100 requisições/10 segundos** e 250k chamadas/dia no catálogo público, regras especiais para apps/pesquisa | Implementar por conta/conector limitação e backoff; não confundir escalas |
| Rate limit busca | Não confirmado independente de 4 req/s | CRM Search **5 requisições/segundo** segundo anúncio HubSpot 2024 (revalidar endpoint date-versioned) | Dedupe não pode depender de busca massiva rápida |
| Suporte/versionamento | API V3 pública; changelog de depreciação da V3 não encontrado nesta pesquisa | API versionada por data e fim de suporte 2027 para v1–v3; Projects atual | Mais esforço de versionamento HubSpot; Agendor monitorar alterações |
| Experiência SaaS multicliente | Tokens por empresa e credencial/escopo isolados; OAuth público NÃO COMPROVADO | OAuth/Projects apropriado a apps multiportal; 1 instalação por conta HubSpot | HubSpot tem modelo oficial de distribuição mais bem documentado |
| Concorrência nativa | API Free, integração externa; automações internas no Performance, campos customizados/privacidade Pro | Workflows/duplicidade avançados por assinatura; CRM e ecosistema fortes | KOROS só vende se ganhos + aprovação/auditoria/reconciliação superarem oferta nativa |
| Custo de CRM do cliente | Free R$0; Pro R$59/u/mês; Performance R$83/u/mês, Corporativo R$156/u/mês min 10 (valores anunciados; sem contratação) | Free US$0, Starter promocional a partir de US$7/licença/mês anual, preço padrão/condições variáveis | Plano Free reduz orçamento exigido, mas custo efetivo cliente e addon UNKNOWN |
| Escalabilidade de mercado | Brasil, documentação em português, baixo custo de entrada hipotético | Multi-country, Apps Marketplace e ambientes dev, potencial de escala futura | Não prometer mercado nem conversões sem evidência |

**Fontes oficiais-chave:** [Agendor pricing](https://www.agendor.com.br/planos-precos/crm), [API REST, HTTP e quotas](https://ajuda.agendor.com.br/pt-BR/articles/2660512-o-agendor-pode-ser-integrado-ao-meu-sistema-atual), [exemplos V3](https://ajuda.agendor.com.br/pt-BR/articles/2653028-voces-tem-exemplos-de-como-utilizar-a-api-do-agendor), [webhooks e privacidade](https://ajuda.agendor.com.br/pt-BR/articles/6281963-a-api-do-agendor-possui-webhooks-gatilhos), [HubSpot developer](https://developers.hubspot.com/developer-platform-basics), [HubSpot webhooks Projects](https://developers.hubspot.com/docs/apps/developer-platform/build-apps/features/configure-webhooks), [HubSpot planos](https://br.hubspot.com/pricing/crm), [limites legais/API](https://legal.hubspot.com/hubspot-product-and-services-catalog/technical-limits), [rate limit Search](https://community.hubspot.com/t/increasing-our-api-limits/116905), [Service Keys](https://developers.hubspot.com/changelog/service-keys), [depreciações 2026](https://developers.hubspot.com/changelog/legacy-apis-and-legacy-apps-whats-going-unsupported-and-when).

## 3. Contratos de API e operações concretas de REFERÊNCIA, sem chamadas
### Agendor
A [biblioteca de exemplos V3](https://ajuda.agendor.com.br/pt-BR/articles/2653028-voces-tem-exemplos-de-como-utilizar-a-api-do-agendor) publica:
- `POST /v3/people/upsert` com `name` e `contact.email`; `GET /v3/people?email=...` para localizar pessoa.
- `POST /v3/organizations/upsert` com `name` e `cnpj` válido; o exemplo público contém um valor ilustrativo inconsistente para CNPJ, **não copiar dados exemplo como contrato de validação**.
- `POST /v3/organizations/{organizationId}/deals` com `title`, `value`, `dealStage`; `POST /v3/deals/{dealId}/tasks` com tipo/data/responsável.
- Para paginação GET `/deals`, `links.next` e `per_page <=100`; HTTP 429 acima de 4/s, códigos de erro 400,401,404,500,503,504.
- **Atenção:** `upsert` pode **alterar** contato existente. Antes de usar, KOROS deve exibir diff e exigir aprovação do payload + operação CREATE vs UPDATE e do ID correto. Nenhum merge automático entre pessoas só por semelhança de e-mail.
- API token guarda segredo por tenant e com permissão efetiva do usuário; sem token de admin persistente por padrão. Não guardar token em markdown, URL, log ou modelo de IA.

### HubSpot
- Objetos documentados contacts, companies, deals, tasks e associations; endpoint antigo `POST /crm/v3/objects/contacts` aparece em blogs, mas para desenvolvimento novo selecionar **rota date-versioned suportada** pelo [API reference](https://developers.hubspot.com/docs/api/how-to-use-hubspot-api).
- App Projects com OAuth e scopes por objeto (por exemplo `crm.objects.contacts.read/write`, além de company/deal quando necessário), tokens associados ao portal. App/portal/scope precisa ser autorizado explicitamente; o KOROS nunca aceitará `portal_id` do request como prova de acesso.
- **Service Keys** (beta a partir de fevereiro/2026) são por conta e **não suportam webhooks**; para integração SaaS com muitas contas e eventos use app Projects/OAuth. Não iniciar novo app legado privado em 2026: criação encerrada set/out 2026.
- HTTP/429, limites diários e burst variam por subscrição e modelo de app; o catálogo lista Free/Starter 100/10 s e 250k/dia; anúncio público listou apps públicos 110/10 s e busca CRM 5/s. **Não somar cotas nem substituir medição no account real.**
- Contatos no Free têm limite publicado de 1.000; app de teste é ambiente de desenvolvimento, não prova de direitos nem throughput de cliente real.

## 4. Mapping canônico de campos, versionado (schema proposto KOROS)
| Campo semântico KOROS | Agendor V3 | HubSpot DBV atual | Regra de integridade |
|---|---|---|---|
| tenant_id | NUNCA como propriedade de autoridade no Agendor | Hub ID/portal somente após OAuth/lookup verificado | Isolamento e acesso controlados no KOROS |
| external_lead_id | chave interna no KOROS (custom field não disponível Free) | ID/campo custom condicional a objeto/conta; fallback key interna | Armazenar source+external id no banco KOROS |
| person.name | `people.name` | `contacts.properties.firstname/lastname` | Não inventar sobrenome, normalizar sem perda |
| person.email | `people.contact.email` | `contacts.properties.email` | Normalizar e verificar antes de dedupe |
| person.phone | `people.contact.*` sob contrato concreto; **campo exato PENDING** | `contacts.properties.phone` ou mobilephone conforme API | Não presumir formato/consentimento |
| organization.name | `organizations.name` | `companies.properties.name` | Pode existir mais de uma empresa similar |
| organization.cnpj | `organizations.cnpj` | propriedade nativa específica **NÃO CONFIRMADA**, custom se permitido | Não inventar property HubSpot; manter canônico KOROS |
| organization.domain | propriedade Agendor **PENDING** | `companies.properties.domain` | Domínio é sinal, não identidade legal |
| deal.title | `deals.title` | `deals.properties.dealname` | Texto de lead não pode gerar instruções |
| deal.stage | `deals.dealStage` (ID real do cliente) | `deals.properties.dealstage` e pipeline ID | Não usar IDs fixos entre contas |
| deal.value | `deals.value` se necessário, **não no MVP sem aprovação de custo/monetário** | `deals.properties.amount` se necessário | Dinheiro exige precisão/tipo e revisão |
| audit/approval | **somente KOROS**, não sobrepor CRM | **somente KOROS** | Imutabilidade/aprovação vinculadas ao hash e ator |

**Contrato de objeto canônico futuro:** `LeadCanonical {schemaVersion, tenantId, sourceId, externalLeadId, person{...}, organization{...}, desiredCrmObject, proposedChanges, approvedPayloadHash, approvalExpiresAt}`. Este é um esquema **conceitual**, não código produzido e não significa que o CRM aceite todos os campos.
**Regras:** campos obrigatórios, valores permitidos, consentimento, formato e vínculo serão documentados num contrato posterior; `company`/person/deal são entidades diferentes. Na primeira versão planejar **Pessoa/Contato aprovado**, com Organização/Negócio como extensões IMPORTANT, evitando múltiplas escritas antes de resolver transação/consistência.

## 5. Webhooks vs fluxo principal: evitar complexidade que não cria valor
O primeiro evento do MVP será **da fonte de lead própria para o KOROS** e a escrita **do KOROS para o CRM** somente após approval. Portanto:
- **Webhooks do CRM NÃO são NECESSARY** para criar uma Pessoa/Contato na prova inicial; o KOROS pode obter status por resposta/GET de reconciliação se permitido.
- Agendor pode enviar eventos sobre pessoas/empresas/deals/tarefas; tokens de colaboradores restringem visibilidade, eventos de administrador ampliam. Não assumir assinatura HMAC sem documentação. É mecanismo de sincronização posterior, não gatilho de escrita privilegiada.
- HubSpot Projects webhook subscriptions suportam objetos/propriedades e eventos; Service Keys não. Configuração exige aplicação com endpoint público e validação de autenticidade.
- Para testar integração (somente futura WO) preferir **entrada sintética e execução offline** e depois sandbox oficial, não webhook exposto em produção.
- `eventId`/versão, replay, ordem/reenvio, autenticação da origem e idempotência serão contratos MUST; nunca tornar receipt de webhook equivalente a aprovação.
**Fontes:** [Agendor webhook](https://ajuda.agendor.com.br/pt-BR/articles/6281963-a-api-do-agendor-possui-webhooks-gatilhos), [HubSpot Projects](https://developers.hubspot.com/docs/apps/developer-platform/build-apps/features/configure-webhooks), [Service Keys](https://developers.hubspot.com/changelog/service-keys).

## 6. Segurança: diferenças que podem inverter a recomendação
**Agendor:** API token em geral obtido por Menu > Integrações; ações obedecem privacidade do usuário vinculado segundo documentação. **Plano Free não inclui MFA nem controle de privacidade do Pro** segundo a tabela de plano; se cliente exigir ambos, o caminho Free pode ser inadequado. Não afirmar controle de scopes OAuth/refresh sem prova oficial; segredo deve ser revogável, isolado por tenant e excluído ao desconectar. Reavaliar uso multiempresa com múltiplos tokens sob risco operacional.
**HubSpot:** app Projects/OAuth fornece fluxo de autorização do cliente e scopes declarados; roteamento por portal verificado. Atualizações de API DBV e compliance App Marketplace exigem manutenção e provas de webhook. Service Keys podem ser usadas S2S mas não são caminho ideal para instalação SaaS multiportal por usuário final.
**Invariantes comuns:** não expor tokens a IA, não logar PII nem token em PR público, negar cross-tenant, não aceitar uma sugestão de modelo como autoridade, aprovação vinculada ao payload e expiração, rate-limits/backoff, read-before-retry em resultado incerto, revogação de acesso e STOP se CRM exigir permissão maior do que a necessária.
**NO_GO de segurança para piloto:** conta sem mecanismo de segregação aceitável, token admin irrestrito sem mitigação, acesso à API sem base legal, webhook sem autenticidade quando depender dele, dados reais no GitHub ou ausência de aprovador.

## 7. Custos de integração: fatos versus esforço hipotético
### Valores oficiais de CRM visíveis ao cliente (não são preço do KOROS)
| Item | Agendor | HubSpot |
|---|---|---|
| Free | R$0, até 3 usuários, 10k pessoas, 10k empresas, 1.500 negócios | US$0, até 2 usuários, 1k contatos |
| Pago inicial divulgado | Pro R$59/usuário/mês (campos customizados, privacidade, MFA); Performance R$83/usuário/mês (automações) | Starter a partir de US$7/licença/mês em condição promocional anual na página Brasil; valor padrão e renovação variáveis |
| API / dev test | API aberta no plano Free; sandbox gratuita oficial separada **NÃO COMPROVADA** | Developer test account com dados sintéticos e APIs grátis |
| Extras e funcionalidades | WhatsApp Sync a partir de R$49/mês por número, Chat e Intelligence extra/sob consulta, não incluir no fluxo | Workflows avançados e dedupe premium por nível; preços variáveis e adicionais |
| Custo KOROS | **UNKNOWN**, nenhuma infra/LLM/conta adquirida | **UNKNOWN**, nenhuma infra/LLM/conta adquirida |

### Estimativas de engenharia para FUTURO, não compromissos (horas técnicas não cotadas)
| Fase | Agendor, hipótese de trabalho | HubSpot, hipótese de trabalho |
|---|---:|---:|
| Revisão de contrato + mapeamento mínimo | 6–12 h | 8–16 h |
| Mock adapter/falhas/contratos negativos | 10–20 h | 12–24 h |
| Preparação auth de conta/entitlement/sandbox autorizada | 4–10 h | 8–20 h |
| Testes end-to-end com conta sintética e operação reversível | 8–16 h | 10–20 h |
| **Total de planejamento estimativo, NÃO execução** | **28–58 h** | **38–78 h** |
Essas horas são **estimativas internas ilustrativas** de uma futura implementação mínima, **não benchmarks**, salário, cotação, custo incorrido nem previsão de prazo. Assume-se código core já existente para adapter/approval, o que ainda não há. Se for necessária app OAuth multiportal, monitoramento ou testes de segurança ampliados, horas podem superar as faixas.
Fórmula de custo futuro: `total_ownership = horas_tecnicas * custo_hora_aprovado + plano_CRM_adicional_real + LLM/infra/storage + revisão/segurança + suporte + manutenção_API`. Todas variáveis reais ainda UNKNOWN; não multiplicar preços mensais sem plano de usuário/número de assentos confirmado.

## 8. Scorecard de decisão (estimativa interna, peso e contraprova)
Critérios: menor fricção de piloto Free 25%, clareza de operações de contato 20%, segurança/permissionamento 20%, setup multiempresa SaaS 15%, manutenção futura/API estável 10%, teste oficial gratuito 10%; nota 1–5, **pontuação construída sem testes e entrevistas**.
| Critério | Peso | Agendor | HubSpot |
|---|---:|---:|---:|
| Fricção Free | 25 | 5 | 4 |
| Operações mínimas documentadas | 20 | 5 | 5 |
| Segurança/escopos nativos no modelo de app | 20 | 2 | 5 |
| Distribuição SaaS multiempresa | 15 | 2 | 5 |
| Estabilidade/migração no horizonte 2027 | 10 | 4 | 2 |
| Test account sem custo comprovada | 10 | 2 | 5 |
| **Soma ponderada / 100** | **100** | **71** | **89** |
**Interpretação importante:** **HubSpot vence a avaliação da plataforma de integração como produto SaaS multiempresa (89 vs 71)**, mas **Agendor é recomendado como CONTRATO DE REFERÊNCIA para a primeira rotina de lead→CRM**, por documentação de upsert e menores limites de dados/assentos no Free, evitando construir OAuth/distribuição já no primeiro mock sintético. A escolha é funcional/escopo, NÃO o maior score da plataforma. Se o fundador preferir padronizar primeiro o caminho de distribuição comercial multiempresa e sandbox, **HubSpot pode ser a melhor escolha**.
**Teste de sensibilidade:** se 'reuso multiempresa e segurança/OAuth' forem gates eliminatórios para o primeiro piloto, Agendor só pode ser referência de mock, não conexão real; HubSpot vira referência oficial após aprovação. Se 'conta real sem custo e upsert de contato em consultoria pequena' dominar, Agendor é atraente sujeito ao direito de token, MFA e dados.
**Nota:** pontuação é exercício de decisão, não resultado empírico.

## 9. Recomendação de aprovação e regras de STOP
**PM01-D01-S1-CRM-REF-01 (seção de alternativas histórica anterior ao aceite):** 
- **A (recomendação para o PRIMEIRO contrato sintético de cadastro):** Agendor REST v3 como **CRM de referência documental**, modelando apenas `people` e `organization` sem escrita real, com HubSpot DBV/Projects como benchmark de portabilidade e segundo candidato. Isso não obriga primeiro cliente a usar Agendor.
- **B:** HubSpot DBV/Projects como CRM de referência documental desde o começo, com app OAuth multiportal e Developer Test futuro; maior alinhamento à visão SaaS multicliente, porém exige acompanhar migrações e complexidade inicial.
- **C:** permanecer 100% agnóstico e modelar somente `ILeadCRM` sintético sem referência de API concreta. Evita comprometimento, mas não responde completamente à necessidade de mapear limites reais.
**Status atual:** `PROPOSED / FOUNDER_DECISION_PENDING`. Nenhuma aprovação implícita.
**Pontos de STOP:** API não habilitada na conta do cliente, custo extra não autorizado, ausência de MFA/segregação exigida, scope amplo, TOS/LGPD incompatível, webhook sem autenticidade quando necessário, ausência de erro/rollback/reconciliação, CRM nativo já resolve o mesmo problema ou custo > benefício.
**Próxima decisão do fundador:** escolher A/B/C no chat; atualizar issue #24/PR #36 Draft e preservar nenhuma execução até WO e aprovação separadas.

## 10. Matriz de provas futuras (NENHUMA EXECUTADA)
| Prova id | Necessidade | Evidência de execução futura |
|---|---|---|
| CRM-R01 | Entitlement da API na conta real/plano sem upgrade | Documentação/console consentido, sem token em GitHub |
| CRM-R02 | Token ou OAuth com acesso mínimo | Scope, rotação e revogação (sem expor segredo) |
| CRM-R03 | Mapear Pessoa/Contato; create/upsert/GET | Payload sintético e ID reconhecido |
| CRM-R04 | Checar organização/negócio e associações | Esquema e IDs reais de sandbox |
| CRM-R05 | Dedupe de duas entregas concorrentes | Uma única operação lógica |
| CRM-R06 | Approval de payload exato e invalidação stale | Falha fechada antes de POST |
| CRM-R07 | Timeout após escrita incerta | Reconciliação antes de retry |
| CRM-R08 | 429/backoff + 401/403/422/5xx | Testes dirigidos e logs redigidos |
| CRM-R09 | Permissões de webhooks/assinatura e replay | Prova oficial de autenticidade se usado |
| CRM-R10 | Cross-tenant + tokens isolados | Testes negativos sem acesso cruzado |
| CRM-R11 | Licença e custo real por cliente | Read-back de plano, termos e orçamento |
| CRM-R12 | Comparação com automação nativa | Diferença funcional e valor líquido por lead medidos |
**Estado de todos:** `NOT_RUN`, esta pesquisa não substitui smoke/benchmark/entrevista.

## 11. URLs oficiais primárias e classificação de confiança
- [Agendor planos e recursos completos](https://www.agendor.com.br/planos-precos/crm): CURRENT_OFFICIAL, lido 2026-10-30.
- [Agendor REST v3, limites, paginação](https://ajuda.agendor.com.br/pt-BR/articles/2660512-o-agendor-pode-ser-integrado-ao-meu-sistema-atual): OFFICIAL.
- [Agendor V3 exemplos de upsert, busca e negócios](https://ajuda.agendor.com.br/pt-BR/articles/2653028-voces-tem-exemplos-de-como-utilizar-a-api-do-agendor): OFFICIAL_EXAMPLES, validar schema exato depois.
- [Agendor Webhooks](https://ajuda.agendor.com.br/pt-BR/articles/6281963-a-api-do-agendor-possui-webhooks-gatilhos): OFFICIAL, não inclui evidência de HMAC.
- [HubSpot CRM Free e promoções](https://br.hubspot.com/pricing/crm): CURRENT_OFFICIAL.
- [HubSpot Developer Platform](https://developers.hubspot.com/developer-platform-basics): OFFICIAL.
- [HubSpot app webhook Projects](https://developers.hubspot.com/docs/apps/developer-platform/build-apps/features/configure-webhooks): OFFICIAL.
- [HubSpot Service Keys sem webhooks](https://developers.hubspot.com/changelog/service-keys): OFFICIAL.
- [HubSpot suporte legado até 2027](https://developers.hubspot.com/changelog/legacy-apis-and-legacy-apps-whats-going-unsupported-and-when): OFFICIAL dated Sep 15 2026.
- [HubSpot limites e cotas](https://legal.hubspot.com/hubspot-product-and-services-catalog/technical-limits): OFFICIAL, subject to edition and API/app type.
- [HubSpot Search limite 5/s](https://community.hubspot.com/t/increasing-our-api-limits/116905): OFFICIAL developer announcement 2024, recheck current DBV.
**Preservar a procedência:** não tratar versões de docs ou preços observados como promessas contratuais; testes reais, concessões e upgrades proibidos nesta WO.

## 12. Decisão atual consolidada: aprovação documental da alternativa A (2026-10-30)
**PM01-D01-S1-CRM-REF-01 = APPROVED_FOR_PLANNING / A:** **Agendor REST v3** é a primeira referência documental **somente sintética para entidade Pessoa/Contato**; **HubSpot DBV/Projects** é a segunda referência de portabilidade e arquitetura de integração SaaS com múltiplas contas. As alternativas B/C da seção 9 são HISTÓRICO DE DECISÃO, não opções atualmente pendentes.
**Invariantes:** (i) cliente não é obrigado a trocar de CRM; (ii) `upsert` pode atualizar dados e requer diff e autorização humana exata; (iii) fonte de lead oficial e permissão server-side antes de escrita; (iv) sem dependência de funcionalidades premium não comprovadas; (v) R-01, R-03, R-05, R-06, R-08, R-11, R-12, R-13 e R-14 permanecem obrigações futuras de projeto, não testes executados.
**Escopo autorizado:** atualizar esta pesquisa/decision/issue e preparar auditoria documental. **Não autoriza** implementar SDK, gerar app OAuth, solicitar tokens, criar contas, testar webhooks, operar com PII, fazer deploy, gerar custos ou avançar automaticamente a #25.
**Limitações:** limites/valores de docs oficiais foram observados por pesquisa, mas entitlement de cliente, quotas efetivas, CNPJ/propriedades custom, assinaturas de eventos e custo real de SaaS continuam `UNKNOWN`. Todos `CRM-R01..R12=NOT_RUN`. Consulte [audit trail](../../evidence/KOR-DISC-002/issue24-plan-ready-audit.md).
