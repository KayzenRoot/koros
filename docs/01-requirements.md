# 01 — Requirements
IDs estáveis. [N] NECESSARY, [I] IMPORTANT, [F] FUTURE. Requisitos são **propostos** e ainda não implementados.

| ID | Classe | Requisito e critério verificável |
|---|---|---|
| R-01 | N | Login e RBAC. Negar acesso cruzado por usuário/empresa em testes negativos. |
| R-02 | N | Uma automação versionada por piloto com configuração validada e auditada. |
| R-03 | N | Receber lead somente de fonte oficial/autorizada; validar schema/autenticidade. |
| R-04 | N | Normalizar e classificar em saída estruturada com justificativa e incerteza explícitas. |
| R-05 | N | Aprovação humana ANTES de gravar no CRM; recusa, expiração e replay não executam escrita. |
| R-06 | N | Integração API CRM em sandbox oficial; retries com idempotência, reconciliação. |
| R-07 | N | Dashboard da empresa: fila, status, aprovações, histórico e erros. |
| R-08 | N | Auditoria append-only por run e ator, redaction de segredos e PII desnecessária. |
| R-09 | N | Controles de orçamento/tokens, cotas e pausa auditada de execução. |
| R-10 | N | Backups, restauração e rollback/roll-forward verificáveis. |
| R-11 | N | Segregação de rede, banco, segredos, perfis do navegador e volumes entre empresas. |
| R-12 | N | Licenças e termos compatíveis com prestação comercial de serviço. |
| R-13 | N | LGPD, retenção e direito de exportação/exclusão de dados tratados por contrato. |
| R-14 | N | Estados de trabalho distinguem IA/humano, concluído/pendente/falha. |
| R-15 | I | Portal fornecedor agregando clientes, suporte e cobrança. |
| R-16 | I | Provisionamento e faturamento automático. |
| R-17 | F | Designer visual, marketplace e múltiplos conectores genéricos. |

## NFR
Deny-by-default, TLS e criptografia, menor privilégio, logs correlacionados, recursos e custos limitados, testes de segurança, suporte pt-BR e UI responsiva/acessível. SLO numérico, capacidade e latência **pendentes de benchmark e contrato**. Nenhuma especificação de API externa deve ser inventada.
