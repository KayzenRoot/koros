# 17 — Risk Register
| ID | Nível | Risco / controle de STOP |
|---|---|---|
| RK-01 | HIGH | KOROS conflita com marca existente → clearance antes de venda |
| RK-02 | HIGH | Entitlement Intelligence não confirmado → licença antes de adoção |
| RK-03 | CRITICAL | Vazamento entre empresas → isolamento comprovado e teste negativo |
| RK-04 | CRITICAL | Escrita indevida CRM → aprovação humana e hash de payload |
| RK-05 | HIGH | Acesso Docker socket/host pelo agente → supervisor restrito e sandbox |
| RK-06 | HIGH | Prompt injection/SSRF/exfiltração → policy e egress deny |
| RK-07 | HIGH | Custo LLM sem teto → cotas, budget e kill switch |
| RK-08 | HIGH | VPS sem memória suficiente → benchmark real |
| RK-09 | HIGH | Falha de backup → teste restore |
| RK-10 | HIGH | LGPD/contrato ausente → DPA e dados sintéticos |
| RK-11 | MEDIUM | Upstream alpha/mudanças rápidas → commit pin e revisão |
| RK-12 | HIGH (residual de revisão humana) | **Histórico:** main não protegida no baseline. **Agora:** ruleset #26074776 ativo, PR obrigatório, sem bypass, squash-only e `governance-docs` required (App 15368) comprovados na main `943f634797122473b56e7190f8c5cc1aa8fdd9f5`. **Residual:** 0 aprovações required, revisão independente COMMENTED não é APPROVED; novos testes de código devem ter produtores/checks próprios antes de implementar. |
| RK-13 | MEDIUM | ROI sem baseline → piloto mensurável |

Riscos documentais não são controles implementados. Nenhuma mitigação marcada DONE sem Evidence Bundle. Se HIGH/CRITICAL conhecido na implementação: BLOCKED para release.
