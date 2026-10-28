# 18 — Pilot Validation
## Hipótese
Serviços com leads de formulário/CRM, volume suficiente e processos claros. Ainda não há entrevistas, clientes, prazo ou taxas validados.

## Descoberta
Verificar dores, custos manuais, taxa de leads repetidos, APIs e regras de privacidade com cliente piloto voluntário. Não solicitar credenciais nem dados reais nessa fase.

## Demonstração sintética
Casos: válido, inválido, duplicado, prompt injection, rejeitado, aprovação expirada, CRM timeout e CRM success. Comparar saída do agente e operador; não apresentar demonstração como produção.

## Critérios para negociar com o cliente
Zero escrita sem aprovação, zero duplicação nos cenários cobertos, zero vazamento em testes de isolamento, orçamento máximo verificável, medição do tempo/custo reais, direito de pausa e rollback/restore. SLA, meta de acurácia, tempo e preço só depois de baseline e contrato.

## Go/No-Go
Somente GO após licença, marca, contrato, LGPD, DoD, métricas e autorização explícita. Sem prova: NO_GO. Não substituir trabalho humano sensível ou prometer 100% de autonomia.
