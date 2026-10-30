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

## Baseline executável de RUNTIME apenas (proposta na PR #69, 2026-10-30)
A [ADR-016](architecture/ADR-016-runtime-baseline.md) descreve a decisão **limitada à WO KOR-PM02-WO-001**, com código original Node.js ESM, HTTP apenas loopback, três GET de leitura, verificação estrutural de envelope tenant e CI/testes de baseline. **Não** é arquitetura completa do MVP, nem implementa autorização, bancos, migrations, workflow, LLM, CRM ou isolamento entre clientes. ADR-006 e ADR-009 continuam PENDING; OpenBot/Intelligence não foram incorporados. Conteúdo desta seção é **PROPOSED_IN_PR**, não canônico da main enquanto sem merge protegido.
