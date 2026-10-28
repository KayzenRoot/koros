# 03 — Architecture
**Nenhuma arquitetura foi implementada ou aprovada de forma irreversível.** OpenBot é referência/candidato, não código incorporado.

## Alternativas e ADR pendente
A: derivação do OpenBot MIT + CopilotKit Intelligence gerenciado (mais rápida POC, risco comercial de licença/retention).  
B: OpenBot + Intelligence self-hosted licenciado (controle, custo e operação maiores).  
C: derivação com substituição do subsistema de threads/memória (maior esforço e risco).  
D: base independente construída internamente.  
**ADR-006: PENDING.** Comparar TCO, licença white-label/revenda, segurança, portabilidade e benchmark antes de escolher.

## Topologia candidata para piloto
```text
HTTPS → Dashboard → API/Auth/RBAC → Orquestração → Policy / Approval Gate
                                        ↘ LLM abstrato
                                        ↘ Worker/outbox → CRM API sandbox
                                        ↘ Audit + Usage → Postgres isolado
                                       [Secrets + Observabilidade + Backups]
```
Se OpenBot for escolhido, validar app, server, worker, supervisor de containers, agent-computer, Postgres, CopilotKit Intelligence e dependências reais; implantação em imagem única NÃO prova isolamento nem execução de rotinas.

## Separação
Isolamento por deployment, DB, segredos, rede, profiles, armazenamento e identificador de ambiente. Não compartilhar browser entre empresas. Supervisor com socket Docker é componente privilegiado: nunca expor; sandbox e network policy obrigatórias quando houver shell. `tenant_id` de YAML não cria fronteira de segurança.

## Invariantes
Autorização no servidor, fora do LLM; payload de escrita associado ao hash aprovado; nenhum fluxo se autoaprova; idempotência mesmo com retry; ações e identidades auditadas; fail-closed para provedor, rede ou política indisponíveis.

## Não decididos
LLM, CRM, canal, VPS, custo, dados, desenho físico, billing e modalidade Intelligence. Nunca fingir capacidade existente.
