# KOR-DISC-002-01 | Matriz de fornecedores oficiais, competição e acesso por plano
**Estado:** PUBLIC_DOC_VERIFIED para fatos abaixo; CLIENT_ACCOUNT_ACCESS=UNKNOWN; no calls, signup, gastos ou SDK. Pesquisa em 2026-10-29. **Nenhum fornecedor foi escolhido para a implementação.**

## CRMs prioritários e condições publicadas
| Fornecedor CRM | Plano e API documentados (não prova acesso de cliente específico) | APIs/uso previsto | Risco para primeiro piloto | Classificação |
|---|---|---|---|---|
| **Agendor** | Free R$0 até 3 usuários, API aberta inclusive no Free; Pro anunciado R$59/usuário/mês. Free com limites de 10k pessoas, 10k empresas, 1.500 negócios; sem campos customizados. | Contatos/negócios: confirmar documentação de endpoint, auth, rate limit e permissões antes de construir. | Plano Free sem campos customizados limita mapeamento; quota de API não auditada. | **Candidato A de integração de baixo atrito**, condicionado a teste autorizado |
| **HubSpot** | Conta developer gratuita e dados de teste/API oficial. Conta cliente de produção pode exigir features/assentos/licença próprios. | API de contatos e negócios, integração de app com escopos; blog oficial demonstra POST /crm/v3/objects/contacts. | Diferenciar app de teste, OAuth/multi-portal e permissões do cliente; API/limites mudam. | **Candidato B de homologação em sandbox**, não escolhido |
| **RD Station CRM v2** | Free até 4 usuários, **API v2 somente Basic/Pro/Advanced**; Basic R$65,70/usuário/mês na oferta anual divulgada; API v2 até 120 req/min em planos pagos. | Negócios, contatos, CRM REST v2; requer token/autenticação, plano habilitado. | Entitlement pago necessário, cliente Free não satisfaz critério zero upgrade. | **Compatibilidade futura condicional**, não piloto Free |
| **Pipedrive** | API REST disponível com conta elegível; precificação por assento/contrato, trial não é Free permanente. | Persons/organizations/deals, API v2; SDK e autorização depois de comprovar escopo. | Conta e plano reais desconhecidos, custo cliente, concorrência com automações nativas. | **Futuro/condicional** |

**Fontes primárias:** https://www.agendor.com.br/planos-precos/crm ; https://ajuda.agendor.com.br/pt-BR/articles/5371555-o-agendor-tem-plano-gratuito ; https://developers.hubspot.com/developer-platform-basics ; https://developers.hubspot.com/blog/a-developers-guide-to-hubspot-crm-objects-contacts-object ; https://developers.rdstation.com/reference/crm-v2-introduction ; https://www.rdstation.com/planos/crm/ ; https://pipedrive.readme.io/docs/pipedrive-api-v2 ; https://www.pipedrive.com/pt/pricing

## Concorrentes de automação e risco de licença
| Plataforma | Capacidade/preço oficial verificado | Decisão conceitual |
|---|---|---|
| **Make** | Free até 1.000 créditos/mês, dois cenários ativos, polling mínimo 15 min; Core US$12/mês para 10k créditos conforme opção de cobrança apresentada. | Concorrente de baixo custo; comparar fluxo com gate humano e trilha de auditoria, sem alegar superioridade sem teste |
| **Zapier** | Free 100 tarefas/mês, automações de duas etapas; Professional a partir de US$19,99/mês. | Bastante competitivo para simples entrada→CRM; KOROS deve provar governança/fluxo que justifique adoção |
| **n8n Community/SUL** | Pode ser usado internamente e para alguns serviços de automação sem acesso do cliente ao editor; **clientes construindo/configurando workflows no produto, inclusive via UI/API/IA, exigem licença comercial** segundo FAQ atualizado 06/out/2026. | **NÃO embutir n8n Community como backend de editor SaaS multitenant** sem clearance de licença. Uso opcional em instalações/consultoria deve ser analisado separadamente, sem assumir proibição universal |

**Fontes oficiais:** https://www.make.com/en/pricing ; https://zapier.com/pricing ; https://support.n8n.io/article/can-i-use-your-license-for-my-use-case

## Contrato de homologação futura, uma integração por vez
Antes de cada conector, obter e registrar:
1. Página oficial vigente do entitlement **na conta e no plano do cliente**, sem guardar tokens em GitHub.
2. Terms/developer policy e permissões de escrita de contatos/negócios; escopo least-privilege, consentimento e retenção LGPD.
3. OAuth/app/private token e restrições cross-tenant; API endpoint/method/schemas e versionamento de acordo com documentação atual.
4. Cotas e limites de burst, 429/backoff, timeout, reconciliação após falha com resposta incerta, idempotência do KOROS independentemente do suporte do provedor.
5. Sandbox/conta de teste com dados sintéticos e sem custo; caso não disponível, mock de contrato até autorização de teste.
6. Comparativo com automação nativa que o cliente já paga; registrar o que KOROS acrescenta e ROI medido.
7. Erro de recurso pago ou não autorizado => marcar conector BLOCKED, **nunca** fazer upgrade, scrape, bypass ou fingir que a API funciona.

## Matriz de seleção condicional do primeiro CRM
- **Se cliente elegível já usa Agendor Free com API funcional para os endpoints exigidos:** primeira via para piloto sintético; não forçar upgrade por campos personalizados.
- **Se usar HubSpot com escopos e conta developer/test disponíveis:** boa alternativa de teste oficial e integração posteriormente por OAuth conforme licença.
- **Se usar RD Station Free sem API v2:** não abrir integração real; usar mock e classificar dependência paga ou migrar ICP sem impor custo.
- **Se a conta possui Pipedrive elegível:** integração possível, mas preço/escopo concretos UNKNOWN.
**Nenhuma destas escolhas foi autorizada como fornecedor final; a issue #24 é somente ICP/comparação.**

## Deltas verificados na pesquisa de micro-ICP (2026-10-29)
**Importante:** documentação de API aberta ≠ prova automática de entitlement da conta do cliente. O Agendor publica API REST V3 e limite de **4 requisições/segundo**, mas diferencia integrações nativas Pluga/automação que exigem planos pagos; revalidar direito de API específica no Free antes de escolher piloto.
- Agendor API e limites: https://ajuda.agendor.com.br/pt-BR/articles/2660512-o-agendor-pode-ser-integrado-ao-meu-sistema-atual
- Agendor Free e recursos: https://ajuda.agendor.com.br/pt-BR/articles/5371555-o-agendor-tem-plano-gratuito
- Agendor Pluga NÃO Free: https://ajuda.agendor.com.br/pt-BR/articles/2691414-como-fazer-integracoes-atraves-da-pluga
- HubSpot workflows Professional/Enterprise: https://knowledge.hubspot.com/get-started/automate-your-processes ; duplicidades avançadas por assinatura: https://knowledge.hubspot.com/pt/records/manage-duplicate-records
- Zapier **Human in the Loop** com Request Approval exige plano pago: https://help.zapier.com/hc/en-us/articles/38731463206029-Request-approval-to-keep-your-workflow-running-with-Human-in-the-Loop
- Zapier Free duas etapas/100 tasks: https://help.zapier.com/hc/en-us/articles/32337438839565-What-s-included-in-Zapier-s-Free-plan
- Google Forms push: requer Cloud Pub/Sub e renovação semanal da watch, com custo cloud a verificar: https://developers.google.com/workspace/forms/api/guides/push-notifications
Esses fatos **não** provam superioridade do KOROS. O recurso de aprovação humana já existe em outras ferramentas, de modo que o diferencial deve ser mensurado por custo total, UX, segurança/trace e confiabilidade no caso concreto. Nenhum fornecedor foi escolhido.
[Contrato de integração/entrada](consultoria-b2b-manual-process-and-sources.md) e [matriz competitiva](consultoria-b2b-validation-go-nogo.md).
