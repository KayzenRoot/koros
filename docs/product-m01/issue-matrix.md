# PRODUCT-M01 | Issue map completo de descoberta
**Epic:** [#23](https://github.com/KayzenRoot/koros/issues/23) · **Status:** PLANNED / nenhum entregável de produto implementado.

## Doze Work Orders de planejamento
| ID | Issue | Responsabilidade | Estado |
|---|---|---|---|
| KOR-DISC-002-01 | [#24](https://github.com/KayzenRoot/koros/issues/24) | Segmentos/ICP e estratégia de entrada | PLANNED |
| KOR-DISC-002-02 | [#25](https://github.com/KayzenRoot/koros/issues/25) | Processos e automações vendáveis | PLANNED |
| KOR-DISC-002-03 | [#26](https://github.com/KayzenRoot/koros/issues/26) | Primeiro caso de uso e fronteiras MVP | PLANNED |
| KOR-DISC-002-04 | [#27](https://github.com/KayzenRoot/koros/issues/27) | Core genérico e templates plugáveis | PLANNED |
| KOR-DISC-002-05 | [#28](https://github.com/KayzenRoot/koros/issues/28) | Modalidades de instalação e onboarding | PLANNED |
| KOR-DISC-002-06 | [#29](https://github.com/KayzenRoot/koros/issues/29) | Empresas, RBAC, isolamento e LGPD | PLANNED |
| KOR-DISC-002-07 | [#30](https://github.com/KayzenRoot/koros/issues/30) | Contratos de conectores e APIs | PLANNED |
| KOR-DISC-002-08 | [#31](https://github.com/KayzenRoot/koros/issues/31) | IA, workflows e aprovação humana | PLANNED |
| KOR-DISC-002-09 | [#32](https://github.com/KayzenRoot/koros/issues/32) | Dashboard, UX e configuração sem código | PLANNED |
| KOR-DISC-002-10 | [#33](https://github.com/KayzenRoot/koros/issues/33) | Preços, setup e unit economics | PLANNED |
| KOR-DISC-002-11 | [#34](https://github.com/KayzenRoot/koros/issues/34) | Entrevistas, testes e piloto | PLANNED |
| KOR-DISC-002-12 | [#35](https://github.com/KayzenRoot/koros/issues/35) | Source Pack, CI Free e DoD final | PLANNED |

Cada issue tem: motivação, tarefas detalhadas, testes negativos a desenhar, evidência esperada, dependências e critérios de aceite. A aprovação de plano é **separada da implementação**. Os artefatos sugeridos nas issues só existirão depois da respectiva investigação, sem inventar entrevistas realizadas, APIs, custos ou testes.

## Ordem de trabalho proposta
1. **Primeiro:** decidir PM01-D01 (público) e D02 (instalação) e confirmar PM01-D03 (core); abre trilhas #24, #28, #27.
2. **Segundo:** comparar problemas #25 e fechar primeiro caso #26; ligar arquitetura lógica e segurança #29.
3. **Terceiro:** conectores #30, fluxo IA/política #31 e UX #32, com requisitos e restrições.
4. **Quarto:** preços #33, validação #34, consolidação #35 e gate para M02.

## Contratos mínimos para chamar o PLANEJAMENTO 100%
- Personas, dores, fluxo escolhido e opções de instalação com decisão explícita e riscos.
- Core/templates/conectores desacoplados; ACL, privacidade e licenças não presumidas.
- Interfaces, esquema de eventos, limites e cenários negativos definidos conceitualmente.
- Plano comercial com hipóteses de margem e variáveis, sem número sem fonte.
- Evidências de descoberta (ou UNKNOWN) separadas de afirmações comerciais.
- Rastreabilidade de R-01..R-17, KOR-DISC-002 e ADM/ADR; nenhuma issue necessária sem diagnóstico.
- CI `governance-docs` validado na PR de documentação; software nunca chamado de entregue por um check documental.

**STOP:** decisões pendentes são bloqueio à implementação, não à conversa/planejamento. Nenhuma obrigação ECC ou dependência de instalação local.

## Status de decisão após aceite explícito (2026-10-29)
**PM01-D01..D05: APPROVED_FOR_PLANNING; nenhuma issue foi IMPLEMENTADA ou encerrada.** A direção está definida, mas todas as pesquisas, requisitos detalhados, testes e contratos de integração continuam pendentes.

| Issue | O que deve ser especificado AGORA | Critério do planejamento | Prova futura / NÃO EXECUTADA |
|---|---|---|---|
| #24 ICP | Serviços com leads/agendamentos; comparar 4 subsegmentos | Scorecard risco × demanda × frequência × API × acesso ao cliente, decisão do fundador | Entrevistas autorizadas; baseline |
| #25 Automações | 12 processos candidatos; distinguir lead→CRM primeiro de outros | Checklist trigger/entrada/saída/custo/consentimento/aprovação para cada fluxo | Pesquisa e demanda reais |
| #26 MVP | Lead→CRM supervisionado; estados, dedupe, idempotência, limites | Contrato do [fluxo](lead-to-crm-contract.md) e cenários positivos/negativos | API oficial sandbox e testes |
| #27 Core | Núcleo multissetorial + templates + conectores versionados | Matriz de domínios, interfaces, estado, compatibilidade e ADR | Código e testes cross-segment |
| #28 Instalação | SaaS gerenciado primeiro; wizard + portabilidade self-host futura | [Contrato de onboarding](architecture-onboarding-security.md) e tradeoff de isolamento/custos | Benchmark e teste de setup real |
| #29 Segurança | RBAC/tenant, LGPD, autorização server-side | Threat model e matriz de papéis, consentimento e retenção | Testes negativos de isolamento |
| #30 Integrações | Fonte e CRM oficial a escolher; versionamento e quotas | API contract + capability/pin/retry + read/write scopes, sem inventar fornecedor | Sandbox/termos/provedor |
| #31 Automação/IA | IA propõe; approval gate servidor + payload_hash | Máquina de estados e invariantes, fail-closed | Testes de injection/approval/replay |
| #32 UX | Dashboard, conexão de provedores, template, aprovações | Jornada por papel, wireframes e cenários de erro | Testes de usabilidade |
| #33 Comercial | Setup + assinaturas 1/3/6/12 meses (estrutura já aceita) | Hipóteses e unit economics sem preços presumidos | Cotações, preços, margem |
| #34 Validação | Entrevistas/protocolo piloto futuro sem dados reais | [Roteiro](commercial-discovery.md), indicadores, GO/NO_GO e consentimento | Prospeção e entrevistas não autorizadas nesta etapa |
| #35 Fechamento | Matriz completa, Source Pack, risco e versionamento | 12 issues alinhadas, ADRs, CI docs e aprovação explícita | Implementação em PRs futuras |

## Dependency DAG de planejamento
`#24 (ICP) → #25 (problemas) → #26 (fluxo)`;
`#26 → #27 (core) → #28 (entrega)`;
`#27/#28 → #29 (segurança) → #30 (APIs) → #31 (IA/gate) → #32 (UX)`;
`#24/#26/#28 → #33 (economia) → #34 (validação)`;
`#24..#34 → #35 (aceite)`.
A ordem pode ser paralelizada em pesquisa sem apagar dependências. **Nenhuma decisão comercial substitui prova negativa técnica.**

## Conjunto mínimo de testes futuros T-01..T-12 (todos NOT_RUN)
| Test ID | Cenário | Resultado esperado |
|---|---|---|
| T-01 | Webhook legítimo assinado + dado válido | Um run VALIDATED, sem CRM ainda |
| T-02 | Origem sem autenticação ou assinatura inválida | Rejeitar, auditar |
| T-03 | Lead duplicado, replay, duas entregas concorrentes | Uma única operação lógica por tenant/external_id |
| T-04 | Payload malicioso/prompt injection no texto | Não altera política nem adquire permissões |
| T-05 | Aprovação rejeitada, expirada ou de outro tenant | Nenhuma escrita no CRM |
| T-06 | Aprovação de payload v1 e tentativa de v2 | Invalidação, nova aprovação exigida |
| T-07 | Timeout depois de possível escrita no CRM | RECONCILE antes de qualquer retry |
| T-08 | Quota/segredo expirado/provedor indisponível | Pause/BLOCK, sem falsas confirmações |
| T-09 | Operador sem RBAC suficiente | Negação server-side, mesmo com UI manipulada |
| T-10 | Template de setor A no tenant B | Sem acesso cruzado nem credenciais compartilhadas |
| T-11 | Setup novo cliente e cancelamento | Dados isolados, exportação e revogação planejadas |
| T-12 | Restore/rollback/update com migração incompatível | STOP seguro e integridade preservada |

**Observação:** nenhum teste foi executado. `governance-docs` valida documentos, não fornece segurança de produção.
