# KOR-DISC-002-01 | GO/NO_GO do ICP, concorrência nativa, métricas e piloto FUTURO
**Nexlabs Technology · KOROS** · **Issue #24** · **Status:** planejamento documental; contato, dados reais, contas, custos e pilotos `NOT_RUN`. O fundador aprovou micro-ICP de consultorias comerciais B2B com CRM ativo/leads próprios, não execução.

## 1. Risco competitivo específico, confirmado por documentação
| Alternativa que a consultoria já pode ter | Evidência pública de fornecedor | Teste de diferenciação do KOROS |
|---|---|---|
| **CRM puro, cadastro manual disciplinado** | Agendor Free já inclui contas/negócios, tarefas e relatórios; sua API REST v3 com limite 4 req/s é documentada, mas entitlement real da conta requer verificação. | Cronometrar inserção/checagem existente; KOROS só vale se reduzir erro/custo líquido |
| **Agendor Pro/integrações** | Integração nativa Pluga não está no Free; customização/integrações e automações são diferenciadas nos planos pagos. | Comparar custo total do CRM com KOROS e do CRM sozinho com automação licenciada |
| **HubSpot Professional/Enterprise** | Workflows avançados para criar/rotear registros e ferramenta de gestão de duplicados dependem de planos superiores. | Se o plano do cliente já contempla validação + revisão satisfatórias, **NO_GO** |
| **Zapier Human in the Loop** | **Human in the Loop / Request Approval é recurso pago**, com aprovação, rejeição ou alteração de dados antes do passo seguinte. Isso demonstra que **o recurso de aprovação não é exclusivo do KOROS**. | Comparar payload hash/revisão de versão, auditoria por tenant, rollback, integração e preço, sem afirmar superioridade |
| **Zapier Free** | 100 tarefas/mês, dois passos e polling a cada 15 min; pode bastar a operações pequenas, sem HITL premium. | Não vender a cliente cujo fluxo gratuito já atende |
| **Make Free/Core** | Free até 1.000 créditos/mês, 2 cenários ativos, polling mínimo 15 min; Core licenciado com mais capacidade. | Comparar configuração, erros de reconciliação e custo completo, sem prometer ser 'mais barato' |

**Fontes oficiais:** https://ajuda.agendor.com.br/pt-BR/articles/2653070-quais-sao-as-funcionalidades-do-plano-gratuito-do-agendor ; https://ajuda.agendor.com.br/pt-BR/articles/2691414-como-fazer-integracoes-atraves-da-pluga ; https://knowledge.hubspot.com/get-started/automate-your-processes ; https://knowledge.hubspot.com/pt/records/manage-duplicate-records ; https://help.zapier.com/hc/en-us/articles/38731463206029-Request-approval-to-keep-your-workflow-running-with-Human-in-the-Loop ; https://help.zapier.com/hc/en-us/articles/32337438839565-What-s-included-in-Zapier-s-Free-plan ; https://www.make.com/en/pricing .

## 2. Hipóteses do problema e métrica de falsificação
| Métrica | Fórmula/forma de apuração futura | Limite PROPOSTO de triagem, não objetivo aprovado |
|---|---|---|
| Leads mensais legítimos | contagem fonte/CRM em janela consentida | ≥30/mês como filtro fraco |
| Minutos manuais brutos por lead | tempo de entrada + conferência + dedupe + correções no AS-IS | ≥4 min para considerar automação de produtividade |
| Minutos totais TO-BE | ingestão/tarefas humanas residuais + revisões + correções + resolução de falhas | **deve** ser menor que AS-IS |
| Economia líquida por lead | `T_antes - (T_operador_depois + T_aprovação + T_erros_depois)` | positiva com margem; estudar variação por perfil |
| Duplicações por 100 eventos | pares duplicados no CRM confirmados, não apenas candidatos fuzzy | queda demonstrável sem merges automáticos perigosos |
| Precisão da classificação | decisões confirmadas em amostra sintética, depois consentida | não fixar % até volume/scope |
| Erro de aprovação | nº de gravações sem aceite exato/versão e cross-tenant | **0 nos testes negativos**, não promessa de erro zero em produção |
| Tempo de fila | entrada em PENDING_APPROVAL → decisão do responsável | SLA por operação a negociar, não estimado |
| Custo total marginal | LLM+hosting+storage+CRM+suporte+taxas por volume | ≤ benefício incremental demonstrado, senão NO_GO |
| Taxa de conversão/receita | vendas atribuíveis ao lead processado com consentimento | impacto da receita exige causalidade, não presumir |

**Regra de custo:** `beneficio_liquido = leads * economia_liquida_minutos/60 * custo_hora + perdas_efetivamente_evitadas_com_evidencia - mensalidade - custos_adicionais`. Cuidado com dupla contagem de tempo humano de aprovação e custos. Sem baseline, não há ROI ou preço de KOROS válido.

## 3. Duas simulações ficcionais para dimensionar decisão
- **Baixo volume, hipótese:** 60 leads/mês; 4 min de trabalho AS-IS; 2,5 min/lead incluindo aprovação e correções TO-BE; custo-hora R$45 ⇒ `60*(4-2.5)/60*45 = R$67,50` de ganho bruto estimado/mês, **antes de mensalidade/custos**. Pode não sustentar SaaS: NO_GO se cliente só ganhar isso.
- **Maior volume, hipótese:** 300 leads/mês; 6 min AS-IS; 1,5 min/lead incluindo aprovação e correção; custo-hora R$50 ⇒ `300*(6-1.5)/60*50 = R$1.125` bruto/mês, **antes de mensalidade/custos**. Não implica ticket real ou contratação.
- Nenhum número acima vem de empresa entrevistada. É apenas análise algébrica de sensibilidade.

## 4. Eligibility checklist de piloto FUTURO (somente planejar)
1. Cliente é consultoria comercial B2B, CRM ativo, leads próprios e decisor contratante identificado.
2. Processo manual e dores coletados de forma consentida, custos e volume medidos, no mínimo dois problemas que solução atual não resolve.
3. Fonte oficial/possibilidade de webhook ou entrada sintética autorizada; nenhum scraping, envio em massa ou base de terceiros sem mandato.
4. Conta e plano reais do CRM com API que cubra campos/objeto de escrita; licença/terms e escopos provados, custo do upgrade não presumido.
5. Aprovador humano disponível, papel com least privilege, payload hash/expiração/rejeição e direito de revogação.
6. Mapa LGPD: quem determina finalidade, papel controlador/operador, armazenamento, retenção, DPA, suboperadores e políticas de privacidade. Orientação jurídica futura se necessário.
7. NDA/termos e autorização de uso/teste assinados quando aplicáveis; prova de segregação de tenant e proteção de credenciais.
8. Aplicação somente após implementação autorizada, sandbox com dados sintéticos primeiro, testes de falha e recuperação, CI de app real.
9. Definir critérios de sucesso prévios: tempo líquido, taxa de erro/duplicidade, satisfação do operador, custo por lead e zero escrita não aprovada nos testes.
10. Plano de pausa, exportação, eliminação, backup/recovery, revogação de integração e suporte, sem prometer SLA não testado.

## 5. GO/NO_GO por estágio (não confundir direitos de planejamento)
| Estado | Condição suficiente/necessária | Ação |
|---|---|---|
| **GO_PLANNING** | decisão PM01-D01-S1-C1 do fundador (já dada) | Documentar ICP, buyers, fontes, concorrência e testes na issue #24/PR #36 |
| **GO_RESEARCH_CONTACTS** | autorização nova do fundador para contactar prospects e tratamento adequado de dados | Executar entrevistas e coletar evidência, separado desta WO |
| **GO_TECH_SANDBOX** | autorização explícita para criar conta/testar API e direitos/termos verificados | Homologar provedor/conector com dados sintéticos, nenhum pagamento automático |
| **GO_PILOT** | cliente interessado real, contrato/consentimento, custo/margem positiva e segurança/testes implementados | Propor piloto delimitado para autorização específica |
| **NO_GO** | CRM/Make/Zapier já resolve problema, ausência de processo manual mensurável, custo > valor, sem API, sem direito ou aprovador | Encerrar hipótese ou pivotar sem retirar controle humano |
| **BLOCKED** | risco LGPD, autorização inválida, cobrança/provedor não verificado, falha em cross-tenant/human approval | STOP até remediação legitimamente aprovada |

## 6. Entrevistas e objeções a preparar (NÃO executar)
Amostra **hipotética** de 5–10 conversas com decisor/operação, somente após autorização de contato. Perguntar volume e origem de leads, passos manuais, campos duplicados, recursos nativos do CRM, experiência com Make/Zapier, necessidade de aprovação, disposição de pagar e custos de integração/implantação. Documentar inclusive negativas e dados em fonte segura, não armazenar PII bruta em repositório público.

## 7. DoD da pesquisa documental de #24
- [x] Micro-ICP escolhido pelo fundador e fronteira de dados próprios.
- [x] Buyer / usuário / gatekeeper, jornada de compra, objeções, processo AS-IS e fontes autorizadas definidos como **hipóteses**.
- [x] Comparações oficiais CRM e automadores, lacunas de API/plano, diferenciação possível e limiares GO/NO_GO.
- [x] Scorecard, métricas, cálculos sintéticos, lista de elegibilidade de piloto.
- [ ] Pesquisa de campo/entrevistas, volume, custo, demanda real, API em conta, piloto, preço e ROI: **NOT_RUN/UNKNOWN**, não fechar como validação do mercado.
- [ ] Aceite futuro do critério de passagem #24 → #25, sem ampliar escopo nesta rodada.
**Encerramento legítimo da issue:** confirmar se DoD da issue #24 pode ser somente DOCUMENTAL ou se exigirá validação real posterior; não marcar como implementada nem encerrar sem governança do projeto.
