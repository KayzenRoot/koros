# 16 — Migration & Recovery
**Especificação futura; nada implementado.**

Schema versionado, banco backup antes de migração, migrator exclusivo, teste staging, estratégia expand/contract, rollback ou roll-forward com critérios. Ações externas no CRM não podem ser desfeitas por rollback de DB: usar outbox, chaves idempotentes, consulta de external_id e eventual compensação humana.

Backups cifrados do PostgreSQL, configurações, volumes necessários e material de recuperação em cofre fora do host; restauração testada periodicamente em ambiente isolado. RPO/RTO e retenção precisam de aceite comercial/privacidade (PENDING). Não guardar chaves no Git nem misturar backups de empresas.

Testar falhas de worker, banco, CRM, LLM, token revogado, resposta incerta, webhook duplicado, migração falha e perda de host. Offboarding: exportar o que o contrato exigir, revogar segredos/acessos, excluir dados ao fim da retenção legal e manter trilha justificável. Restore não pode reintroduzir dados excluídos sem política formal.
