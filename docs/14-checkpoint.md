# 14 — Checkpoint
**Data:** 2026-10-28; **Fase:** FOUNDATION DOCUMENTAL; **Status:** PENDING AUDIT.
**Repositório:** KayzenRoot/koros. **Base main:** `57dd78a6eb2b39c1d07fdf2728de2cde20fda3b8`. **Tree:** `7b224899e8118500c0356902528070c53190f2ab`. README inicial `# koros`. **WO:** KOR-PLAN-001, branch `docs/KOR-PLAN-001-source-pack`.

## Evidência observada
GitHub retornou somente README na main inicial; `main` com `protected=false` e `/rulesets` com `[]`. Leitura detalhada de `/branches/main/protection` retornou `403 Resource not accessible by integration`; portanto, o diagnóstico se limita às consultas acessíveis. PR #1 foi lida como Draft e não mesclada no HEAD inicial `0ac7c203f38550f0534d68d819e416067148091d`; após Correction Delta, exigir nova leitura do HEAD final. Source Pack está proposto em branch, NÃO incorporado à main até merge.

## Estados
- Documentação: DRAFT / auditoria pendente.
- Código, testes, build, CI, deploy: NOT_RUN ou NOT_STARTED.
- VPS: NOT_INSPECTED; dados reais: NONE; custos: NONE AUTHORIZED.
- Marca: KOROS para planejamento, clearance NÃO VERIFICADO.
- Upstream OpenBot: referência MIT; direitos de Intelligence PENDING.
- Issues: backlog documental, issues de implementação NOT_CREATED.

## Gates
G0 aprovar fundação documental; G1 configurar proteção GitHub/checks antes de código; G2 validar marca antes de comercializar; G3 licenciamento e arquitetura; G4 isolamento e LGPD; G5 VPS benchmark; G6 contrato do piloto. Falha G0: Correction Delta no mesmo PR e STOP. Após G0, merge normal só com revisão e controles reais, depois KOR-DISC-002.

## Proposta de controles GitHub (NÃO IMPLEMENTADA; G1 pendente)
- **Ruleset da main:** exigir pull request e resolução de conversas; bloquear force-push, exclusão de branch e pushes diretos; sem bypass silencioso, preservando alterações só por PR.
- **Merge:** preferir somente squash NORMAL depois de veredito e autorização; tornar os demais métodos indisponíveis se compatível com os controles da conta. PR Draft não é elegível para merge.
- **Reviews:** definir requisito de aprovação compatível com conta individual e revisor independente disponível, sem criar bloqueio impossível; preferir aprovação externa real, nunca aprovação fictícia ou dismissal como substituto de revisão.
- **Checks:** primeiro instalar e validar produtores estáveis de testes documentais (links internos, estrutura, segredos) e depois, quando houver código, unit/lint/typecheck/build/SAST/SCA conforme risco. Só então marcar nomes exatos como required. Os checks Socket observados são informativos: PR Alerts reportou **sem mudanças de dependências**; não equiparar ao teste de segurança do produto.
- **Verificação posterior:** ler regras efetivas e bypass actors, criar PR de teste que deve ser recusada ao falhar, conferir que merge normal obedece ao gate. Sem permissões de leitura administrativa, marcar as propriedades detalhadas NÃO VERIFICADAS.
