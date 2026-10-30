# KOR-DISC-002-01 | Micro-ICP prioritário: consultorias comerciais B2B
**Startup:** Nexlabs Technology · **Produto:** KOROS · **Issue:** [#24](https://github.com/KayzenRoot/koros/issues/24) · **Aprovação:** PM01-D01-S1-C1 = APPROVED_FOR_PLANNING (2026-10-29) · **Estado comercial:** NOT_VALIDATED.
**Escopo:** exclusivamente pesquisa/planejamento, sem contato com empresas, contas, preços aprovados, código, deploy, gastos ou ECC obrigatório.

## 1. Identidade do cliente e o que já foi decidido
O fundador aprovou dar **prioridade de planejamento** a **consultorias comerciais B2B que já utilizam CRM ativo e têm leads próprios**. Subsegmento de primeiro estudo dentro da escolha ampla PM01-D01-S1 (agências B2B e consultorias comerciais com CRM). Não é autorização para contatar clientes, escolher CRM, executar software ou iniciar piloto.
**Produto vendido futuramente:** camada de governança/validação de leads antes da escrita no CRM, via SaaS gerenciado, sem trocar CRM e com controle humano. O core KOROS permanece reutilizável para outros segmentos.

## 2. Perfil organizacional e exclusões (filtros PROPOSTOS, não dados medidos)
| Filtro | Preferência inicial de prospecção FUTURA | Como seria comprovado | Exceções |
|---|---|---|---|
| Natureza | Consultoria de vendas B2B, terceirização de SDR/inside sales com **leads próprios da consultoria**, treinamento comercial que capta seus próprios clientes | Site/contrato e resposta do responsável | Consultoria de CRM/RevOps como possível parceiro, não primeiro comprador |
| Porte | Equipe comercial com 2–10 pessoas **como hipótese operacional**, não corte definitivo | Entrevista/observação futura | Equipes maiores elegíveis se processo simples |
| Ferramentas | CRM ativo (Agendor, HubSpot, RD, Pipedrive ou outro com **entitlement API comprovado na conta**) | Plano, tela de recursos, termos, teste sintético futuro autorizado | Se já usa automação nativa completa, exigir ganho incremental medido |
| Origem dos leads | Formulários, landing page, e-mails recebidos legitimamente, cadastro próprio, APIs/webhooks autorizados | Inventário de consentimentos e finalidade | Base comprada/scraping sem direitos: INELEGÍVEL |
| Quem decide | Sócio, diretor comercial, líder de operações ou Head of Sales com autoridade de contratação | Buyer confirmado futuramente | Operador pode influenciar, mas não aprova orçamento |
| Quem aprova CRM | Sales Ops, líder SDR ou gestor com permissão do tenant | Matriz RBAC e tempo de disponibilidade | Sem aprovador humano disponível: NÃO ELEGÍVEL ao primeiro fluxo |
| Volume | A partir de **30 leads/mês** e **4 min de retrabalho manual/lead** como hipóteses de triagem | CRM e medição consentida | Não transformar números em dados de mercado nem requisitos fechados |
| Compra | Empresa pode pagar implantação + recorrência se ROI líquido comprovado | Entrevista e proposta futura | Valores ainda UNKNOWN |
| Dados | Consultoria controladora dos próprios leads, finalidade legítima documentada | Mapa de dados e contrato jurídico futuro | Dados de muitos clientes da consultoria: fase posterior e novas fronteiras de controlador/operador |

### Quatro personas
**B1 Buyer econômico, sócio/diretor comercial.** Objetivo: aumentar previsibilidade e qualidade do pipeline sem empilhar software. Medo: custo de ferramenta que não gera venda, vazamento de contatos, indisponibilidade do CRM, implementação longa. Critério de compra: prova de tempo líquido economizado, controle de erros, operação fácil e custo previsível.
**B2 Sponsor de processo, Head of Sales/RevOps.** Objetivo: padrão de campos, revisão rastreável, dedupe e SLA da fila. Medo: duplicação e atribuição incorreta de leads. Critério de aceite: demonstração comparativa com processo atual, trilha por responsável, fluxo de exceções.
**B3 Usuário operador, SDR/analista.** Objetivo: menos copiar/colar, corrigir uma vez, saber o que foi gravado. Medo: fila de aprovação pior que a rotina atual. Critério de usabilidade: preview inteligível e um clique controlado para aprovar/rejeitar, sem scripts.
**B4 Gatekeeper técnico/jurídico, admin CRM/TI/privacidade.** Objetivo: API oficial, menor privilégio, segregação de credenciais, finalidade LGPD, revogação, auditoria e recuperação. Tem poder de vetar mesmo sem comprar; sem aprovação legítima, STOP.

## 3. Mapa de necessidades e hipóteses testáveis
| ID | Problema a verificar | Indício observável FUTURO | Refutação/STOP |
|---|---|---|---|
| H01 | Leads próprios chegam em canais diversos | ≥2 fontes autorizadas inventariadas | Fonte única e integração nativa suficiente |
| H02 | Há retrabalho manual de CRM | tempo por lead medido, separando qualificação e revisão | Trabalho já é baixo ou inexiste |
| H03 | Erros/duplicações geram custo | amostra consentida com contagem de duplicatas/correções | Zero erro e esforço mínimo |
| H04 | Aprovação humana cabe no SLA | disponibilidade e medição de tempo de fila | Aprovação destrói o benefício |
| H05 | CRM nativo/Make/Zapier deixa lacuna | teste de equivalência funcional contra solução existente | Se equivalente e mais barato, NO_GO |
| H06 | API e permissão existem na conta | prova de plano/scopes/quotas e sandbox oficial | API requer upgrade não aceito |
| H07 | Buyer aceita implantação+recorrência | declaração comercial/LOI futura não vinculante | Sem disposição demonstrável a pagar |
| H08 | Segurança e LGPD podem ser atendidas | consentimento/finalidade, retenção, DPA e RBAC | Origem ilegítima ou cross-tenant |
| H09 | Processo é replicável | segundo lead ou segundo cliente com mesmo contrato de template | Solução sob medida demais |
| H10 | Custo unitário é previsível | infraestrutura, LLM, suporte e API por execução | Margem negativa no volume mínimo |

Todas as hipóteses acima estão **UNKNOWN/NOT_RUN**, não se inferem de tamanho de mercado nem de documentação de fornecedor.

## 4. Jornada de compra hipotética (sem contato executado)
| Etapa | Ator e questão | Evidência que precisará existir | GO/STOP |
|---|---|---|---|
| 0 Diagnóstico | Founder da consultoria: 'tenho leads perdidos/retrabalho?' | Descrição espontânea e baseline | Se não, NO_GO |
| 1 Descoberta | Head of Sales demonstra como o lead entra hoje | Processo e fontes autorizadas | Sem fonte legal, STOP |
| 2 Concorrência | RevOps prova o que CRM/Make/Zapier já executam | Comparativo de features **no plano real** | Se equivalente, pivotar |
| 3 Pré-viabilidade | Admin confirma API/escopo e aprovador | Docs, entitlement, política de dados | Bloqueio técnico/jurídico => STOP |
| 4 Demonstração FUTURA | Operador vê dry-run com leads sintéticos | Tempo, clareza, dedupe e approval | Se piorar rotina, NO_GO |
| 5 Business case | Buyer calcula benefício líquido e custo total | Variáveis e evidências reais | Se negativo, NO_GO |
| 6 Piloto FUTURO | Buyer e gatekeeper aceitam contrato/escopo | Consentimento, critérios e autorização própria | Sem autorização, não executar |
| 7 Compra FUTURA | Decisor aprova setup+assinatura | Valor, SLA, retenção, renovação | Nenhuma cobrança nesta etapa |

## 5. Objeções e método de resposta verificável
| Objeção provável, ainda não confirmada | Resposta de produto a TESTAR, não alegação atual |
|---|---|
| 'Meu CRM já faz isso' | Abrir matriz do plano real e comparar aprovação com payload, reconciliação, dedupe e auditoria. Se equivalente, retirar a proposta |
| 'Uso Make/Zapier' | Demonstrar vantagem em tempo de configuração, auditoria, política e suporte; custo total comparado |
| 'Aprovação humana é lenta' | Medir tempo de revisão e fila; reduzir campos/mostrar diffs, mas jamais retirar a aprovação do primeiro MVP |
| 'Não quero dar token admin' | Solicitar scopes mínimos e segregação por empresa; se API exigir token amplo, tratar risco e não ocultar |
| 'Isso vai expor meus leads à IA' | Minimização, redaction, política, contratos/retention e seletividade de dados; termos de LLM ainda não aprovados |
| 'Eu tenho poucos leads' | Comparar economia líquida. Para baixo volume, recomendar processo manual/automação já incluída |
| 'Não tenho TI' | Wizard SaaS com conexão guiada e dry-run (proposta não construída) |
| 'E se o CRM cair?' | Estado UNCERTAIN, reconciliação antes de retry, monitoramento e pausa (somente projeto) |
| 'Atendo múltiplos clientes' | Primeiro piloto foca leads próprios; uso com clientes de terceiros exige tenancy/contratos adicionais |
| 'Quanto custa?' | Valor ainda UNKNOWN; só será proposto após custos e disposição a pagar validados na fase comercial autorizada |

## 6. Resultado deste aprofundamento
**PM01-D01-S1-C1:** consultorias comerciais B2B com CRM e leads próprios = APPROVED_FOR_PLANNING, não mais pendente; buyer, usuários, tarefas e proposta de compra definidos **como hipóteses de pesquisa**. Próxima decisão legítima: escolher primeira **fonte autorizada** e primeiro **CRM de referência para planejamento de contrato**, sem implementar nem criar contas, preferencialmente na issue #24 até concluir ICP. Demais issues #25..#35 fora de escopo.
