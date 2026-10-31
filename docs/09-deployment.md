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

## Ambiente local isolado da M06-WO-002 (2026-10-30; PROPOSED_IN_PR)

`npm run local:start|status|restart|stop` sobe PostgreSQL 17 e o app somente em loopback, aplica migrations/seed sintéticos e espera `/healthz`. O estado, logs e credenciais locais ficam em `.koros/local/` (gitignored); a senha sintética é gerada e gravada apenas nesse arquivo, nunca no Git/log.

O runner recusa `NODE_ENV=production`, hosts não-loopback, portas iguais, `KOROS_DOCKER_SOCKET`, `KOROS_ALLOW_NON_LOOPBACK=1` e cookies Secure em HTTP. Não há Docker socket nem porta administrativa exposta. O data dir precisa ficar dentro do workspace. Divergência de checksum de migration aborta em vez de reescrever o ledger.

**Limites:** local-only, sem TLS, staging público, provedor real, backup/restore automatizado ou deploy gerenciado. Runbook em [deploy/local/README.md](../deploy/local/README.md).

## Onboarding e provisionamento da M06-WO-001 (2026-10-30; PROPOSED_IN_PR)

O onboarding opera em tenant já autenticado e usa apenas dados sintéticos. O provisionamento de um tenant novo é uma função ops/local protegida por `KOROS_ALLOW_TENANT_PROVISIONING=1`, sem rota HTTP pública; cria organização, owner, membership, kill switch inativo e template inicial. Plano/API real permanece UNKNOWN; signup, e-mail, cobrança e provider real estão fora do escopo. Evidência em [KOR-PM06-WO-001](../evidence/KOR-PM06-WO-001/README.md).

## Backup/restore da M06-WO-003 (2026-10-30; PROPOSED_IN_PR)

`npm run backup` gera snapshot `KOROSBAK1` com AES-256-GCM, chave externa (`KOROS_BACKUP_KEY`/`KOROS_BACKUP_KEY_FILE`), metadados de migrations/tenants/row counts e retenção configurável. `backup:verify` valida a autenticidade; `backup:restore` exige `KOROS_ALLOW_RESTORE=1`, cria apenas banco `koros_restore_*` e compara tenant set, migrations/checksums e contagens antes de declarar sucesso; qualquer divergência remove o alvo e falha. Snapshot corrompido, chave errada, versão incompatível e tenant errado são recusados.

**Limites:** local/sintético, sem storage off-host, failover automático, WORM, escrow de chave, RPO/RTO ou dados reais. Rollback no nível do snapshot está provado; rollback de binário/aplicação e failover gerenciado permanecem PENDING. Runbook em [deploy/local/BACKUP.md](../deploy/local/BACKUP.md). Evidência em [KOR-PM06-WO-003](../evidence/KOR-PM06-WO-003/README.md).
