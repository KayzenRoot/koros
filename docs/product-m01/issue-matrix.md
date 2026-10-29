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
