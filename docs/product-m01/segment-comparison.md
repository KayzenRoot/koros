# KOR-DISC-002-01 | Comparativo de quatro mercados de serviços para o KOROS
**Empresa:** Nexlabs Technology · **Produto:** KOROS · **Issue:** [#24](https://github.com/KayzenRoot/koros/issues/24) · **Pesquisa pública:** 2026-10-29 · **Estado:** RESEARCH_COMPLETE / RECOMMENDATION_PROPOSED / FOUNDER_DECISION_PENDING.
**Decisões já aprovadas:** PM01-D01 (serviços com leads/agendamentos como primeiro público amplo), PM01-D02 (SaaS gerenciado primeiro), PM01-D03 (core genérico+templates+conectores), PM01-D04 (lead→CRM com aprovação), PM01-D05 (autorização fora da IA). **Nenhuma decisão sobre subsegmento foi aprovada.**

## 1. Método e níveis de evidência
- **EVIDÊNCIA OFICIAL:** dado publicado por IBGE, Sebrae, fornecedor ou documentação oficial de API; link e ressalva quando preço/recurso variam por plano.
- **INFERÊNCIA TÉCNICA/COMERCIAL:** hipótese formulada a partir dos processos descritos, sem entrevista, benchmark ou comprovação de demanda.
- **ESTIMATIVA ILUSTRATIVA:** pontuação interna 1–5, pesos e critérios de piloto; **não é** market share, TAM, taxa de conversão, preço real nem resultado estatístico.
- **UNKNOWN/PENDING:** acesso a conta de cliente/CRM, ROI, custos reais de implantação/API e licenças particulares. **Não houve** contato com fornecedores, clientes, instalação, cadastro, API calls ou pagamento.

## 2. Tamanho: não somar bases estatísticas incompatíveis
1. **Sebrae, atividade 2025:** cerca de 13,1 milhões de pequenos negócios de serviços com CNPJ ativo em dez/2025, aproximadamente 54,8% de pequenos negócios ativos. Cobertura inclui MEI e ME, não é lista de empresas elegíveis para CRM. https://agenciasebrae.com.br/dados/brasil-tem-recorde-de-cnpj-ativos-de-pequenos-negocios/
2. **IBGE PAS 2024:** 1.919.365 empresas na amostra/universo metodológico da Pesquisa Anual de Serviços não financeiros; 113.388 em `serviços de manutenção e reparação` e 778.608 em `serviços profissionais, administrativos e complementares`. Ambos são agrupamentos CNAE **amplos**, não representam exatamente os 4 ICPs aqui propostos. https://www.ibge.gov.br/estatisticas/economicas/servicos/9028pesquisa-anual-de-servicos.html
3. **Sebrae 2025 abertura:** quase 64% dos 5,1 milhões novos CNPJs abertos atuavam em serviços; abertura não é total ativo, comprador pagante ou intenção de comprar SaaS. https://agenciasebrae.com.br/economia-e-politica/e-recorde-51-milhoes-de-empresas-foram-abertas-em-2025/
4. **Metodologia:** não estimar TAM/SAM/SOM nem quota por segmento sem contagem CNAE refinada, adoção de CRM, volume de leads e verba de software. Mudança metodológica na PAS 2024 impede extrapolação direta com séries anteriores.

## 3. Subsegmento A — Assistência técnica, manutenção e instalações
**ICP de investigação:** empresas com equipe de instalação/manutenção (climatização, refrigeração, segurança eletrônica/CFTV, manutenção predial), gestor comercial/atendimento e recebimento repetitivo de pedidos de orçamento, com CRM/API ou possibilidade de começar em CRM já existente.
**Dores a validar:** WhatsApp/telefone/formulário dispersos, pedidos duplicados, orçamentos sem retorno, agendamento em campo e distância entre o primeiro lead e a OS. Um fluxo lead→CRM com humano pode capturar demanda sem o KOROS se tornar sistema de ordem de serviço.
**Concorrência comprovada:**
- **Auvo Service:** já cobre chamados, OS, agenda de técnicos, checklists, orçamento, cobrança e possui Auvo Hub com WhatsApp/CRM/agente IA. A empresa anuncia mais de 10 mil empresas usuárias (número de marketing do fornecedor, não auditado). https://www.auvo.com/auvo-service
- **Field Control:** OS, roteirização, agenda e despacho, segmentos como refrigeração, solar, CFTV, limpeza, dedetização; há API de integração, mas documentação recomenda especialista de TI e implantação gradual. https://fieldcontrol.com.br/segmentos.html ; https://ajuda.fieldcontrol.com.br/pt-br/articles/211-api-de-integracao
**API comprovada:** Auvo REST v2 e webhooks públicos, incluindo entidades cliente/tarefa/equipamento/orçamento, limite anunciado de 400 requisições/minuto/IP; o acesso requer plano Auvo ativo e credenciais da empresa. https://www.auvo.com/integracoes ; https://developer.auvo.com.br/
**Preço comprovado:** Auvo pede apresentação/cotação, valores variam por usuários/módulos e não há valor geral público confirmado nesta análise. https://www.auvo.com/software-assistencia-tecnica
**Oportunidade inferida:** triagem e aprovação de solicitação para **CRM preexistente** antes da OS. Diferencial possível: policy humana, rastreabilidade e integração segura, não substituir Auvo/Field Control.
**Risco:** operação envolve OS, técnicos, deslocamento, peças, complexidade de implementação e concorrentes com IA; integração oficial é viável para produto de manutenção, mas depende do plano e autorização concretos.
**Porta de entrada proposta:** empresa com 3–20 colaboradores e fluxo recorrente de orçamentos; limiar de leads ainda A VALIDAR. Oferecer piloto sintético, nenhum dado real aqui.
**Status:** API Auvo e Field Control VERIFIED PUBLICLY; concorrência VERIFIED; ticket, conversão e disposição de compra UNKNOWN.

## 4. Subsegmento B — Serviços domiciliares
**ICP de investigação:** empresas pequenas de limpeza residencial/empresarial, jardinagem, montagem, manutenção de casa e pequenos serviços, desde que operem com contatos próprios e consintam no uso dos dados.
**Dores possíveis:** disponibilidade, orçamento, triagem geográfica, mensagens espalhadas, escala de profissionais e confirmação; frequência pode variar por serviço e sazonalidade.
**Concorrentes e canais:**
- **GetNinjas:** plataforma de aquisição de pedidos, cobra pacotes de moedas para liberar contatos; o cadastro de profissional é gratuito. Não é equivalente a um CRM/API de automação livre. https://www.getninjas.com.br/central-de-ajuda/profissional/anuncie/o-aplicativo-do-getninjas-e-pago
- **Field Control/Auvo:** sistemas de gestão de equipes e serviços também cobrem limpeza/manutenção, dependendo do porte. https://fieldcontrol.com.br/segmentos.html ; https://www.auvo.com/gestao-de-equipes-externas
- **Jobber/Workiz** como benchmarks globais de field services; Workiz reserva `Open API` à categoria Ultimate na tabela de recursos, acesso específico exige verificar plano. https://www.workiz.com/pricing-plans/
**API:** para GetNinjas, **NÃO FOI VERIFICADA** API pública/autorização para exportar leads ou operar o marketplace como conector. Não supor inexistência total de API, mas vetar scraping/bypass. CRM genérico do cliente ou formulário proprietário pode ser alternativa somente com autorização.
**Preço/custo:** GetNinjas exige moedas cujo preço de pacote varia no aplicativo; custo por contato muda com categoria/região. Sem preço fixo confiável de aquisição universal. Software gerencial e tempo de suporte variam.
**Oportunidade inferida:** organizar leads **próprios** e aprovação de orçamento, não automatizar captação não autorizada de marketplace.
**Risco:** baixa maturidade de CRM em pequenos prestadores é hipótese, não dado comprovado; adoção/onboarding e sensibilidade ao preço precisam de entrevista.
**Status:** modelo de moedas VERIFIED PUBLICLY; API para marketplace UNKNOWN/NOT VERIFIED; aptidão comercial UNKNOWN.

## 5. Subsegmento C — Agências de marketing B2B e consultorias comerciais
**ICP de investigação prioritário:** agências/consultorias de serviços B2B com processo de inbound/leads, operação regular, já usando CRM com **API legítima**, e aprovador comercial disponível. Escopo inicial limitado aos próprios leads ou leads de clientes para os quais exista autorização e DPA.
**Dores plausíveis:** formulários e e-mails que chegam com formatos diferentes, qualificação manual, registros duplicados, owner/etapas incorretos no CRM, erro de roteamento, relatórios dispersos e revisão de qualidade antes de enviar dados de terceiros.
**Concorrentes:**
- **HubSpot:** CRM com ferramentas gratuitas e extensa plataforma de APIs. Conta gratuita até 2 usuários anunciados na página brasileira. Ambiente gratuito para desenvolvedor com testes e dados fictícios oficialmente documentado. https://br.hubspot.com/pricing/crm ; https://developers.hubspot.com/developer-platform-basics
- **Agendor:** CRM gratuito até 3 usuários, API aberta listada inclusive no plano gratuito; plano Pro publicado em R$59 por usuário/mês. https://www.agendor.com.br/planos-precos
- **RD Station CRM:** plano Free até 4 usuários, Basic anunciado R$65,70/usuário/mês com cobrança anual; **API v2 exige Basic, Pro ou Advanced segundo documentação**, mesmo que landing page cite integrações no Free. https://www.rdstation.com/planos/crm/ ; https://developers.rdstation.com/reference/crm-v2-introduction
- **Pipedrive:** CRM e API v2 (deals, persons, orgs); preços oficiais em dólar com cobrança anual Lite US$14/usuário/mês (cobrança anual), Growth US$39, variáveis por plano. https://pipedrive.readme.io/docs/pipedrive-api-v2 ; https://www.pipedrive.com/pt/pricing
- **Make/Zapier/n8n:** concorrentes horizontais; Make Free tem 1.000 créditos/mês e polling mínimo de 15 min; Zapier Free tem 100 tarefas/mês e fluxos de duas etapas; n8n self-hosted Community possui licença restritiva para hospedar serviço/workflow editor acessível a cliente e pode demandar licença comercial no caso de SaaS; KOROS não deve presumir direito de embutir n8n sem análise jurídica. https://www.make.com/en/pricing ; https://help.zapier.com/hc/en-us/articles/32337438839565-What-s-included-in-Zapier-s-Free-plan ; https://support.n8n.io/article/can-i-use-your-license-for-my-use-case
**Integração de baixo atrito proposta:** ingestão por webhook de formulário autorizado, CRM HubSpot developer-test ou Agendor API; confirmação humana server-side antes de gravar pessoa/negócio. Escolha entre eles FUTURA, nenhuma conta criada.
**Valor diferencial a comprovar:** controle humano amarrado ao payload, audit trail por cliente, dedupe e integrações gerenciadas para agência/consultoria que precisa de governança e reuso, não mero 'IA escreve descrição de lead'.
**Riscos:** CRMs e automadores já oferecem funções semelhantes; competição/diferenciação elevada; agência que processa leads de seu cliente exige papéis controlador/operador, consentimento, segregação entre contas e contrato claro.
**Status:** HubSpot, Agendor e APIs/documentação oficiais VERIFIED; volume de leads, dor específica, preço disposto e prontidão do cliente UNKNOWN.

## 6. Subsegmento D — Negócios com agendamentos
**ICP de investigação:** salões, barbearias, estúdios de beleza/bem-estar **não clínico**, professores e pequenas escolas de serviços com reservas; evitar saúde e dados médicos sensíveis no piloto inicial.
**Dores a validar:** no-show, faltas de confirmação, reagendamento, mudanças de equipe, mensagens por WhatsApp e cadastros duplicados.
**Concorrentes/APIs:**
- **Trinks:** software de beleza/agenda com API REST pública documentada e webhooks, mas integração depende da contratação do serviço adicional e solicitação/liberação de API Key; **não é grátis por existir documentação**. Tabela de planos anuncia opção a partir de R$76 em configuração básica e teste grátis de cinco dias, condições por número de profissionais/modalidade. https://trinks.readme.io/reference/introducao ; https://blog.trinks.com/conheca-a-api-de-integracao-da-trinks/ ; https://negocios.trinks.com/planos/
- **AgendaPro:** agenda e gestão; a tabela brasileira indica integrações/API somente na categoria **Pro**, custo concreto para esta função deve ser confirmado, sem assumir acesso em Individual/Básico/Premium. https://agendapro.com/br/planes
- **Calendly:** API v2 disponível em qualquer plano para várias operações; **webhooks e Scheduling API exigem assinatura paga** segundo documentação atual. https://calendly.com/help/calendly-api-overview ; https://calendly.com/help/webhooks-overview
- **Google Calendar:** API oficial com cotas e uso padrão gratuito, mas política em 2026 prevê cobrança quando ultrapassar limiar diário por projeto; não assumir 'grátis ilimitado'. https://developers.google.com/workspace/calendar/api/guides/quota
**Oportunidade inferida:** automatizar lead de consulta e aprovação de inclusão no CRM, **não** reservar horário automaticamente no primeiro MVP. Agendamento é persona/fonte de evento; sistema de agenda especializado já faz muito do operacional.
**Risco:** dependência de API paga e concorrentes que já fornecem notificações, agendamentos e automações nativas; consentimento de mensagens e dados sensíveis variam por atividade.
**Status:** Trinks/AgendaPro/Calendly APIs e restrições VERIFIED PUBLICLY; ROI e willingness to pay UNKNOWN.

## 7. Matriz quantitativa de escolha (pontuações são HIPÓTESES)
Escala 1 a 5 (5 mais favorável) avaliada pela Nexlabs Technology **sem entrevistas**. Pesos propostos: dor mensurável 25%, facilidade de API/licença 25%, disposição potencial a pagar 20%, acesso a primeiros clientes/onboarding 15%, espaço competitivo diferencial 10%, repetibilidade 5%. Total `score = Σ(peso × nota/5)`, de 0 a 100. Ordem não é dado de mercado.
| Critério (peso) | Manutenção | Domiciliares | Agências/consultorias | Agendamentos |
|---|---:|---:|---:|---:|
| Dor mensurável (25) | 5 | 4 | 4 | 5 |
| API/contrato acessível (25) | 3 | 2 | 5 | 2 |
| Disposição potencial a pagar (20) | 4 | 2 | 4 | 3 |
| Venda/onboarding simples (15) | 3 | 3 | 5 | 4 |
| Diferenciação defensável (10) | 2 | 3 | 2 | 2 |
| Repetibilidade (5) | 4 | 4 | 5 | 4 |
| **Score hipotético / 100** | **73** | **57** | **85** | **67** |

**Sensibilidade:** se a concorrência nativa dos CRMs eliminar a dor de agências, reduzir a nota de dor 4→2 retira 10 pontos e reduzir disposição 4→2 retira outros 8, levando agência 85→67, **abaixo da manutenção (73)**. Portanto o vencedor é condicional a entrevistas que revelem dor real além da automação nativa.

## 8. Recomendação / proposta de decisão do fundador
**Primeiro alvo de pesquisa/piloto: C — agências de marketing B2B e consultorias comerciais que JÁ utilizam CRM oficial**, com um operador que aprova os dados antes de escrita e volume de leads mensurável. Foco: reduzir implantação, usar CRM existente e comprovar confiança na automação. A preferência por uma **consultoria B2B que opera leads próprios** reduz complexidade de contrato multicliente no primeiro piloto.
**Segundo alvo em caso de baixa dor ou saturação: A — empresas de manutenção/instalação técnica**, começando no pré-OS, antes de construir gestão de técnicos ou criar integrações de OS.

### Filtro de elegibilidade (HIPÓTESE para validar)
- Empresa legalmente ativa, time comercial de ao menos 2 pessoas, responsável pelo aceite de CRM, fonte de leads com uso permitido, CRM com API acessível sob plano atual, possibilidade de sandbox/conta teste.
- `30+ leads por mês` e `4+ minutos de retrabalho por lead` são **limiares hipotéticos de triagem**, NÃO métricas observadas. Modificar com dados reais.
- Adotar cap de custo `R$0 durante a pesquisa`; nenhum teste/conta/assinatura paga, contato externo ou coleta de dados pessoais nesta WO.

### Critérios para avançar de pesquisa à validação com pessoas (somente após autorização específica)
1. Comparar 4 subsegmentos por pelo menos um sinal de processo, concorrência e acesso real a API; entrevistas exigem consentimento.
2. Entrevistar futuramente 5–10 gestores como meta **proposta**, sem atribuir entrevistas realizadas; documentar 3 evidências independentes de retrabalho recorrente.
3. Confirmar pelo menos 2 empresas com fonte oficial e CRM acessível sem comprar plano extra; se faltar, revisar ICP ou negociar preço como decisão nova.
4. Distinguir se o CRM já faz essa automação nativamente; **sem vantagem quantificável, NO_GO** para vender um produto redundante.
5. Exigir prova de policy humana, dedupe, confiabilidade e custo em sandbox sintético, após aprovação futura de implementação.
6. Fundador aprova subsegmento no chat; atualizar PM01-D01-S1 como `APPROVED_FOR_PLANNING`; status #24 segue PLANNED até evidências/aceite integral.

## 9. Preços: referencial externo vs custo do KOROS (não misturar)
| Produto | Referência pública em 2026-10-29 | Implicação |
|---|---|---|
| HubSpot | CRM Free até 2 usuários; dev-test grátis | Candidato a sandbox futura, recursos da API concreta a verificar |
| Agendor | Free até 3 usuários e API aberta; Pro R$59 por usuário/mês | Candidato de integração sem upgrade inicial, sujeito a quotas/termos |
| RD Station CRM | Free até 4 usuários; Basic R$65,70 por usuário/mês anual | API CRM v2 **não** acessível pelo Free segundo doc v2 |
| Pipedrive | Lite US$14 usuário/mês em faturamento anual, sem plano Free permanente informado | Integração provável com custo de CRM do cliente |
| Trinks | Configuração básica a partir de R$76 e teste 5 dias | API/liberação pode exigir adicional; custo real desconhecido |
| Auvo | Cotação sob consulta por tamanho/módulo | Não estimar assinatura sem proposta |
| Make | Free até 1.000 créditos/mês; Core US$12/mês com 10k créditos | Concorrente de automações e benchmark de custo |
| Zapier | Free até 100 tarefas/mês | Alternativa de baixo volume, sem rivalizar por feature count |
| Calendly | Webhook exige plano pago | Evitar prometer integração push gratuita |
| Google Calendar | Uso padrão gratuito dentro dos limites; cobrança de excesso em 2026 anunciada | Limitar quotas em qualquer desenho |

**Custo real de KOROS:** `C_mensal = infraestrutura_alocada + IA_por_execução + APIs/canais + logs/backups + suporte + tributos/taxas + aquisição`; monetização depende de volume, preço de setup/assinatura, incidentes, margem e risco contratual. Valores de cada parcela são **UNKNOWN** hoje. O plano de pesquisa não autoriza sequer criar contas/testes ou usar quotas pagas. Preço de concorrente NÃO é preço do nosso SaaS.

## 10. Saídas e STOPs
- **Esta pesquisa entrega**: comparação de mercado, concorrentes, APIs, custos publicados, riscos e uma recomendação de subsegmento; **não comprova** a primeira venda nem o mercado endereçável.
- **Não fecha** #24, não muda PM01-D01 amplo já aprovado, não altera escopo de #25..#35, não aprova subsegmento sem clique do fundador.
- Fonte original/tempo, segmento/planos, riscos e lacunas estão registrados. URLs podem mudar; releitura obrigatória antes de qualquer piloto/contratação.
- Sem merge, código, custo, clientes, dados pessoais, contatos externos ou dependência ECC. A `main` permanece protegida.
