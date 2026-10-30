# PRODUCT-M01 | Core multissetorial, SaaS gerenciado e política de segurança
**Nexlabs Technology · KOROS** · **PM01-D02/D03/D05:** APPROVED_FOR_PLANNING · **Execução:** NOT_STARTED.

## Contratos de fronteira do core (proposta revisável)
| Camada | Responsabilidades NECESSARY | Não pode fazer |
|---|---|---|
| Identity/Tenant | Usuário, empresa, papéis, permissões efetivas, ambientes e quotas | Confiar em tenant_id de payload sem autenticação |
| Catalog/Templates | Templates versionados por segmento, schema de parâmetros, migração explícita | Incluir tokens/PII de clientes em template reutilizável |
| Workflows | Estados, reexecução, filas, pausa, idempotência e limites | Autorizar a própria escrita ou ignorar estado |
| AI Adapter | Modelos plugáveis e saída estruturada por schema | Acessar API privilegiada ou conceder scopes |
| Policy/Approval | RBAC, tenant, custo, payload_hash, expiração, revogação | Ser substituído por texto de resposta do LLM |
| Connector SDK | Contrato provider/capability, auth, verificação, rate-limit, reconciliação | Executar ação fora dos scopes ou sem política |
| Evidence/Operations | Logs, métricas, saúde, auditoria, backup, restauração, suporte | Vazamento de secrets/PII ou estado de outro tenant |
| Dashboard | Configuração guiada, fila de aprovação, execução e diagnóstico | Ignorar permissões do servidor; UI não é autorização |

**Independência setorial:** criar um template novo não implica alterar código do core. Integrações devem divulgar limites e capabilities reais; uma promessa de API inexistente é `UNKNOWN` até verificação.

## Decisão de entrega aprovada e escolhas ainda em aberto
**Aprovado:** começar por **SaaS gerenciado** com isolamento efetivo por cliente, assistente de configuração e desenho de interfaces portáveis para um **self-host futuro**. **Não está aprovado:** escolher já Kubernetes, Docker obrigatório no cliente, cloud paga, VPS específica, modelo de tenant físico, stack, forma de cobrança ou estimativas de custo. Isolamento físico dedicado é uma hipótese a avaliar por risco/custo; não confundir isolamento lógico com segregação comprovada.

### Jornada de onboarding proposta
1. Gestor cria conta de empresa e confirma identidade/organização.
2. Servidor provisiona fronteira do tenant e papéis mínimos sem compartilhar segredos.
3. Wizard apresenta template de atendimento de serviços, termos e escopos necessários.
4. Gestor seleciona provedor disponível e consente com conexão oficial, com OAuth/API key de escopo limitado guardado fora do template.
5. Sistema executa conexão de teste em sandbox/dry-run e mostra erros legíveis; nada de gravação no CRM real sem aprovação.
6. Gestor configura políticas (usuários aprovadores, tetos de uso, retenção), campos e janela de trabalho.
7. Executa fluxo com dados sintéticos para verificar chegada → proposta → aprovação → registro sandbox → auditoria.
8. Habilita operação autorizada somente após aceite, termos/privacidade e medição; fornece pausa, histórico e suporte.

Nenhum passo acima foi implementado; tempos/complexidade dependem do piloto e de API do provedor.

### Self-host planejado (não no MVP inicial)
Definir contratos independentes do provedor de hospedagem: configuração declarativa versionada, migrations controladas, secrets externos, readiness/health, backup criptografado, restore/rollback, conectores configuráveis, exportação de dados, telemetria opt-in, updates sem perda de estado. Criar ou prometer instalador só quando a modalidade for priorizada depois de testes comerciais.

## Segurança NECESSARY antes de qualquer dado real
- Deny-by-default com autorização no servidor e isolamento por tenant/empresa; ações humanas auditadas com payload_hash.
- Logs com redaction, retention definida e acesso por papéis; dados do cliente não treinam outros clientes sem base legal/contrato.
- Não compartilhar browser, credenciais, storage, filas ou escopo de API entre empresas; revisar segurança na topologia física definida posteriormente.
- Risco de prompt injection em descrição de lead: o texto é **dado não confiável**, jamais comando ou policy.
- Cada conexão revogável; trabalhador/LLM não usa chave de administrador; rate limits, quotas e kill switch.
- LGPD: mapear papéis controlador/operador conforme arranjo concreto, DPA, retenção, exportação/eliminação, bases legais e fornecedores; consultar profissional jurídico na comercialização.
- Releases precisam de threat model, teste negativo de acesso cruzado e restore/rollback, não apenas check de documentação.

## ADRs futuros, sem escolher tecnologia agora
- ADR-006: OpenBot/Intelligence vs construção independente, direitos de licença e manutenção.
- ADR-009: LLM, CRM e fonte oficial; credenciais e termos da API.
- ADR de runtime: filas, APIs, banco, orquestração, deploy por tenant e modos self-host futuros.
- ADR de segurança: fronteiras reais de tenant, KMS/secrets, observabilidade, backup, privacidade.

## Prova negativa a produzir antes da implementação
Tenant crossover; refresh token revogado; upgrade de template com schema incompatível; webhook replay; aprovação forjada; política alterada após aprovação; falha de provedor; deploy restaurado com secrets antigos. Todos **NOT_RUN**.
