# PRODUCT-M01 | Definição do KOROS multissetorial (KOR-DISC-002)
**Startup:** Nexlabs Technology | **Produto:** KOROS (nome provisório) | **Epic:** [#23](https://github.com/KayzenRoot/koros/issues/23) | **Estado:** PLANNING / NOT_IMPLEMENTED | **Base:** main `30819b2622d5dc865931d5c55e9e9e9586648276` (2026-10-29).

## 1. Visão aprovada de direção
O KOROS será um produto B2B para automatizar processos de **comércios e serviços diferentes**, sem exigir uma cópia do código para cada setor. Permitir que empresas conectem sistemas oficiais, escolham templates adequados, configurem regras e supervisão humana e vejam execuções, custos e histórico num dashboard. **Integração e instalação simples no ambiente do cliente** são objetivos do produto, a demonstrar em um módulo específico de onboarding. A origem de qualquer skill de desenvolvimento é irrelevante para o funcionamento do produto.

## 2. Cinco camadas propostas (não arquitetura final)
1. **CORE:** empresa/tenant, login e RBAC, catálogo de processos, execução versionada, políticas, auditoria, limites e segurança.
2. **AUTOMAÇÕES:** jobs e agentes plugáveis por tipo de tarefa, aprovações humanas para ações sensíveis, filas e idempotência.
3. **CONECTORES:** drivers por API/webhook oficial (ERP, CRM, mensageria autorizada, e-commerce), consentimento, escopos, validação, retry e revogação.
4. **TEMPLATES:** soluções reutilizáveis para diferentes segmentos, sem lógica privilegiada nem dados de um cliente embutidos.
5. **ENTREGA:** instalador/onboarding guiado, healthcheck, atualizações, backups e rollback; opções de SaaS gerenciado, dedicado ou self-host conforme ADR.

Cada camada será detalhada como módulo autônomo após as decisões do M01. Não supor que um template ou `tenant_id` sozinho entrega isolamento efetivo.

## 3. Regras fundamentais do negócio
- **Nexlabs Technology** é dona da marca institucional; KOROS é o nome do produto sujeito a verificação comercial/jurídica.
- O cliente deverá entender o valor e conseguir começar sem contratar uma equipe de desenvolvimento; interfaces e integrações exigem APIs/credenciais autorizadas.
- Mesmo com IA, controle de escrita e permissões ficam no servidor e fora do modelo; auditabilidade, privacidade e possibilidade de pausa são requisitos NECESSARY.
- Estrutura comercial de setup + mensal/trimestral/semestral/anual está aceita, **preços ainda não**.
- Cada novo cliente deve poder configurar fluxos e templates, não requerer um fork da base de código.
- Para o primeiro MVP, reduzir escopo por caso de uso e validar repetibilidade em outros segmentos com contratos de extensão.
- Qualquer alegação de custo, benchmark, compatibilidade, direitos ou integração deve ter origem e status `VERIFIED/PROPOSED/UNKNOWN`.

## 4. Jornada de uso e fluxo inicial (direção aprovada, ainda não implementada)
`Cliente cadastra empresa → seleciona tipo de negócio → escolhe template → conecta canal/CRM/ERP autorizado → executa teste seco → liga automação sob cotas → recebe evento → policy/IA valida → aprovação humana quando exigida → API oficial executa ação → dashboard mostra execução, custo e auditoria.`

**Segmento escolhido para validação:** empresas de serviços com leads e agendamentos. Comércio e e-commerce continuam alvos futuros do mesmo core, sem prioridade inicial. Não automatizar pagamentos ou decisões reguladas sem autorização específica.

## 5. Como oferecer instalação simples
Direção **PM01-D02 A aprovada:** SaaS gerenciado primeiro, com isolamento efetivo e wizard de configuração; self-host fica como objetivo futuro de portabilidade. As demais opções seguem registradas em [decisões](decisions.md):
- **A (recomendado para validação inicial):** SaaS administrado com isolamento por empresa e wizard de integração; projetar desde já contrato portátil para futura instalação dedicada/self-host, sem prometer que já existe.
- **B:** primeira versão self-host por cliente com pacote Docker/Compose e wizard local, mais controle com mais pré-requisitos, manutenção e suporte.
- **C:** híbrido completo desde o MVP, combinando ambos; maior complexidade de instalação/upgrade, custo operacional e superfície de segurança.

A direção foi aprovada pelo fundador, mas requer benchmark antes da arquitetura física e da definição de custos. O core não deve exigir instalação do cliente quando usar SaaS gerenciado, mas deve suportar autenticação e integração segura com seus sistemas.

## 6. Separação em módulos futuros (SUGESTÃO)
| Identificador de produto | Capacidade | Gate antes do código |
|---|---|---|
| **PRODUCT-M01 · KOR-DISC-002** | Mercado, caso de uso, fluxo, modelos de instalação, arquitetura lógica e decisão de MVP | **ATUAL — PLANNING** |
| PRODUCT-M02 | Identidade, tenants, RBAC, isolamento e contratos de dados | ADRs e R-01..R-14 |
| PRODUCT-M03 | Conectores, catálogo de APIs e autorização de canal | fontes/termos e fixtures oficiais |
| PRODUCT-M04 | Motor de execução e agentes com human-in-loop | policy, budget e contratos testáveis |
| PRODUCT-M05 | Dashboard, UX e templates de automação | personas e jornada M01 |
| PRODUCT-M06 | Setup guiado, instalador por cliente, backup/upgrade/rollback | modo de entrega escolhido |
| PRODUCT-M07 | Segurança, auditoria, testes, CI gratuito, observabilidade e recuperação | ameaças e requerimentos aprovados |
| PRODUCT-M08 | Planos, medições, suporte e cobrança | preços/contratos e unit economics |
| PRODUCT-M09 | Piloto, lançamento e documentação para novos clientes | gates de direitos, LGPD e qualidade |

Os IDs do backlog `KOR-LEGAL-003` até `KOR-STUDIO-024` **não mudam**; estes módulos agregam requisitos antigos sem substituí-los, mediante decisão do fundador.

## 7. Fluxo de trabalho do planejamento, sem burocracia ECC
1. **Chat:** propor alternativas de um componente por vez com botões; o fundador decide ou solicita ajuste.
2. **GitHub:** decisões, Epic/issues, riscos, critérios e caminhos de teste entram em branch com PR Draft; fonte da verdade após merge protegido, sem alterar diretamente a main.
3. **Engenharia:** quando houver código, adicionar apenas testes/linters/scanners realmente necessários e gratuitos; `governance-docs` permanece required, Socket é informativo; NÃO depender de ECC Tools/hook/MCP/skills para aprovação.
4. **Aceite:** distinguir `PLAN_APPROVED` de `IMPLEMENTED_VERIFIED`; issue só termina após evidência e read-back, nunca por mera descrição.
5. **Próximo módulo:** abrir somente após a decisão sobre escopo de produto; construir em WOs específicas e não inventar 100% de implementação.

## 8. O que será medido
Candidatos: tempo de setup real, tempo até primeira automação, integração autorizada completada, volume de execuções, intervenção humana, qualidade por cenário, custos mensais por tenant, erros/retries, tempo recuperado e intenção de pagar. Não atribuir benchmarks ou metas inventadas.

## 9. Próximos artefatos
[Decisões](decisions.md) · [Matriz de issues](issue-matrix.md) · [Evidence Bundle](../../evidence/KOR-DISC-002/README.md) · [Backlog](../11-backlog.md).

**STOP:** sem ECC obrigatório, sem novo workflow nesta PR, sem mudança de ruleset, pagamentos, acesso a clientes, dados reais, deploy, instalação de produto, licenciamento presumido ou merge não autorizado.

## 10. Baseline de produto aprovado no chat (2026-10-29)
Cinco decisões A: **PM01-D01..D05 APPROVED_FOR_PLANNING**. O primeiro **MVP candidato** é o fluxo **lead autorizado → validação → deduplicação → classificação por IA → aprovação humana → escrita no CRM por API oficial → auditoria**. Clientes iniciais de validação: **empresas de serviços que lidam com leads e agendamentos**. Instalação inicial prevista: **SaaS gerenciado**, com núcleo desenhado para possível self-host depois. A IA não autoriza ações.

**Fase corrente:** especificação e descoberta. Ainda não existe CRM escolhido, contato com clientes, API homologada, preço, código de produto, deployment ou comprovação de ROI. O fundador não aprovou merge da PR #36.

Leituras de execução conceitual:
- [Contrato do fluxo leads → CRM](lead-to-crm-contract.md)
- [Arquitetura genérica, isolamento e onboarding](architecture-onboarding-security.md)
- [ICP, validação comercial e preços pendentes](commercial-discovery.md)
- [Matriz de rastreabilidade das issues](issue-matrix.md)
