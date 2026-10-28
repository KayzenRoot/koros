# 09 — Deployment (plano, NÃO executado)
## Ambientes
Local → staging privada com dados fictícios → piloto privado autorizado → produção somente após gates DoD. Nenhum serviço nem VPS foi modificado.

## Operação candidata
VPS Ubuntu, Docker/Compose, proxy HTTPS, PostgreSQL com volume persistente, secrets externos, redes segmentadas, monitoramento/alertas e backup cifrado fora do host. Deploy dedicado para cada cliente; dimensionamento depende de benchmark. A VPS existente não foi inspecionada para o KOROS e não se presume capacidade livre.

## Cuidado específico com OpenBot
Imagem única pode compartilhar browser e não fornecer worker de rotinas nem supervisor. CopilotKit Intelligence exige configuração/entitlement; não assumir licença de uso comercial. Fixar versões/digests e checar a infraestrutura do sandbox.

## Checklist de lançamento
Inventário e proteção dos serviços existentes; custos aprovados; provisionamento isolado; DNS/TLS; secrets; migration controlada; health/smoke; autorização CRM sandbox; testes de isolamento; backup e restore; observabilidade e alertas; rollback/roll-forward; aprovação explícita de go-live e verificação pós-deploy. Sem preenchimento desses gates o resultado é NO_GO.

## Estado atual
VPS: NOT_INSPECTED; CI: NOT_INSTALLED; migrations: NOT_RUN; deploy: NOT_RUN; smoke: NOT_RUN; SLA/RPO/RTO: PENDING.
