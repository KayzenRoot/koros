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
| RK-12 | HIGH | `main` returned `protected=false`, `/rulesets=[]` e leitura detalhada `403` → propor ruleset de PR, sem force-push/bypass, checks validados e teste de enforcement antes de software |
| RK-13 | MEDIUM | ROI sem baseline → piloto mensurável |

Riscos documentais não são controles implementados. Nenhuma mitigação marcada DONE sem Evidence Bundle. Se HIGH/CRITICAL conhecido na implementação: BLOCKED para release.
