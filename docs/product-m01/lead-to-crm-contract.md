# KOR-DISC-002 | Contrato conceitual do fluxo inicial lead → CRM
**Startup:** Nexlabs Technology · **Produto:** KOROS · **Estado:** APPROVED_FOR_PLANNING (PM01-D04), NOT_IMPLEMENTED · **Issues:** [#25](https://github.com/KayzenRoot/koros/issues/25), [#26](https://github.com/KayzenRoot/koros/issues/26), [#30](https://github.com/KayzenRoot/koros/issues/30), [#31](https://github.com/KayzenRoot/koros/issues/31).

## Missão do primeiro MVP
Demonstrar, com dados sintéticos e sistemas autorizados, que um gestor de serviços consegue capturar e qualificar oportunidades, aprovar uma ação proposta, registrar o resultado em CRM e saber o que ocorreu sem retrabalho manual. Não vender como funcional até testes e piloto legítimo.

## Fluxo funcional proposto, sem execução atual
1. **Ingestão:** webhook/API de fornecedor oficialmente autorizado. Exigir autenticação/assinatura quando disponível, timestamp, id único da origem, tenant e finalidade autorizada. A escolha do canal ainda está PENDING.
2. **Validação:** verificar esquema, limites de tamanho, campos obrigatórios, política de consentimento, origem e permissão do tenant. Rejeitar payload inválido, replay e cross-tenant.
3. **Normalização:** estrutura canônica de lead com campos mínimos necessários (contato permitido, intenção, serviço, origem, timestamps, identificadores externos). Não transferir PII desnecessária à IA.
4. **Deduplicação:** chave tenant + source + external_id, com estratégia de resolução de leads repetidos dentro do tenant; não deduplicar entre empresas. Marcar ambiguidade para operador.
5. **Classificação:** IA recebe contexto mínimo e retorna objeto estruturado de intenção/categoria/prioridade sugerida, justificativa resumida e incerteza; resposta fora de esquema falha fechada. Não decidir aceite, crédito ou ato regulado.
6. **Revisão humana:** operador autorizado visualiza antes/depois, destino CRM, campos exatos e custos previstos. Pode aprovar, editar e submeter para nova aprovação, rejeitar ou deixar expirar. Uma aprovação cobre **um payload versionado**, não todas as versões posteriores.
7. **Dispatch:** servidor, não o LLM, verifica tenant, papel, estado, validade e hash da aprovação; outbox/worker envia **uma única operação lógica** via CRM sandbox oficial, com idempotency key e reconciliação em resposta incerta.
8. **Confirmação:** consultar status real/ID externo, marcar concluído somente com evidência e apresentar erro/ação pendente quando indisponível.
9. **Auditoria:** registrar run, timestamps, ator, decisões, mudanças de estado, CRM externo, custo/uso e motivo do bloqueio, com redaction e retenção definida.
10. **Controle:** cliente pausa/desativa integração e automação; novas entradas não provocam escritas, fila existente respeita política de revogação.

## Máquina de estados conceitual
`RECEIVED → VALIDATED → NORMALIZED → DEDUPED → CLASSIFIED → PENDING_APPROVAL → APPROVED → DISPATCHING → COMPLETED`.
Saídas laterais: `INVALID`, `DUPLICATE`, `REJECTED`, `EXPIRED`, `BLOCKED`, `FAILED`, `UNCERTAIN_EXTERNAL_RESULT` (reconciliação obrigatória). Qualquer transição não autorizada é negada; estado FAILED não implica reenvio cego.

## Objetos de contrato a especificar antes do código
| Entidade | Campos mínimos conceituais | Regra invariável |
|---|---|---|
| Tenant | id, status, política, limites | Nunca usar tenant declarado pelo cliente sem validar autoridade |
| Connection | provider, capability, scopes, status, secret ref | Nunca gravar credencial em log/workflow/LLM |
| InboundEvent | provider, external_id, signature, timestamp, body_hash | Replay/duplicata não cria execução extra |
| Lead | tenant, origem, campos permitidos, consent/status | PII mínima e retenção por contrato |
| WorkflowVersion | id, tenant, schema, política, versão | Execução aponta para versão imutável |
| Run | id, state, trace, idempotency, usage | Audit trail com timestamps e motivo de mudança |
| Classification | schema_version, labels, explanation, uncertainty | Não equivale a autorização do servidor |
| Approval | run, actor, payload_hash, expires_at, decision | Rejeição/expiração não habilita dispatch |
| Dispatch | operation_key, external_id, reconcile_status | Resultado incerto requer consulta antes de retry |

## Segurança e casos negativos obrigatórios antes de GO
| Cenário | Resultado obrigatório |
|---|---|
| Fonte inválida, evento alterado, replay | REJECT / auditado / nenhuma escrita |
| Campos faltantes, prompt injection no lead | BLOCKED ou revisão humana, instruções do lead não alteram policy |
| Lead duplicado no mesmo tenant | Deduplicação e sem segunda gravação |
| Lead de tenant A enviado como B | DENY, sem leitura/escrita cruzada |
| Classificação fora de JSON/schema ou baixa confiança | Fila humana/FAILED, nunca escrita automática |
| Payload editado após aprovação | Aprovação invalidada; solicitar nova decisão |
| Aprovação rejeitada, expirada ou ator sem permissão | Deny / nenhuma escrita |
| CRM indisponível/timeout após possível escrita | UNCERTAIN, reconciliar ID antes de tentar de novo |
| Rate limit, token revogado, quota de IA estourada | Pause/FAILED seguro, alertar operador |
| Workflow pausado durante dispatch | Respeitar checkpoint e política de cancelamento; auditar corrida |

## Fora do primeiro fluxo
Marcação automática de agenda, faturamento, cobrança, campanha de mensagens massivas, automação de browser, integração real sem API/contrato e escrita sem aprovação. Agendamento é caracterização do ICP, não um segundo MVP.

## Evidência que falta para decisão GO de implementação
Fonte oficial, CRM sandbox e termos de uso; campo por campo e OpenAPI versionada; matriz de papéis; matriz LGPD; regras exatas de idempotência/consentimento; avaliação de custo; fixtures sintéticas e cenário de recuperação; critérios de tempo/erro com baseline de piloto. Todos **PENDING/NOT_RUN**, não presumir implementados.
