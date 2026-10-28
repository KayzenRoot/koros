# 14 — Checkpoint
**Data:** 2026-10-28; **Fase:** FOUNDATION DOCUMENTAL; **Status:** AUDITORIA DOCUMENTAL TÉCNICA CONCLUÍDA; PR DRAFT; ACEITE HUMANO E REVISÃO EXTERNA PENDENTES.
**Repositório:** KayzenRoot/koros. **Base main:** `57dd78a6eb2b39c1d07fdf2728de2cde20fda3b8`. **Tree:** `7b224899e8118500c0356902528070c53190f2ab`. README inicial `# koros`. **WO:** KOR-PLAN-001, branch `docs/KOR-PLAN-001-source-pack`.

## Evidência observada
GitHub retornou somente README na main inicial; `main` com `protected=false` e `/rulesets` com `[]`. Leitura detalhada de `/branches/main/protection` retornou `403 Resource not accessible by integration`; portanto, o diagnóstico se limita às consultas acessíveis. PR #1 foi lida como Draft e não mesclada no HEAD inicial `0ac7c203f38550f0534d68d819e416067148091d`; após Correction Delta, exigir nova leitura do HEAD final. Source Pack está proposto em branch, NÃO incorporado à main até merge.

## Estados
- Documentação: validação técnica de estrutura, escopo, referências e evidências satisfatória no HEAD `03313701eb28543f637fc018803e90f84d66e4a5`; revisão humana/independente e eventual merge PENDENTES. Revalidar HEAD final da PR após este registro.
- Código, testes, build, CI, deploy: NOT_RUN ou NOT_STARTED.
- VPS: NOT_INSPECTED; dados reais: NONE; custos: NONE AUTHORIZED.
- Marca: KOROS para planejamento, clearance NÃO VERIFICADO.
- Upstream OpenBot: referência MIT; direitos de Intelligence PENDING.
- Issues: backlog documental, issues de implementação NOT_CREATED.

## Gates
G0 aprovar fundação documental; G1 configurar proteção GitHub/checks antes de código; G2 validar marca antes de comercializar; G3 licenciamento e arquitetura; G4 isolamento e LGPD; G5 VPS benchmark; G6 contrato do piloto. Falha G0: Correction Delta no mesmo PR e STOP. Após G0, merge normal só com revisão e controles reais, depois KOR-DISC-002.

## Proposta histórica de controles GitHub (levantamento anterior a KOR-GOV-002)
- **Ruleset da main:** exigir pull request e resolução de conversas; bloquear force-push, exclusão de branch e pushes diretos; sem bypass silencioso, preservando alterações só por PR.
- **Merge:** preferir somente squash NORMAL depois de veredito e autorização; tornar os demais métodos indisponíveis se compatível com os controles da conta. PR Draft não é elegível para merge.
- **Reviews:** definir requisito de aprovação compatível com conta individual e revisor independente disponível, sem criar bloqueio impossível; preferir aprovação externa real, nunca aprovação fictícia ou dismissal como substituto de revisão.
- **Checks:** primeiro instalar e validar produtores estáveis de testes documentais (links internos, estrutura, segredos) e depois, quando houver código, unit/lint/typecheck/build/SAST/SCA conforme risco. Só então marcar nomes exatos como required. Os checks Socket observados são informativos: PR Alerts reportou **sem mudanças de dependências**; não equiparar ao teste de segurança do produto.
- **Verificação posterior:** ler regras efetivas e bypass actors, criar PR de teste que deve ser recusada ao falhar, conferir que merge normal obedece ao gate. Sem permissões de leitura administrativa, marcar as propriedades detalhadas NÃO VERIFICADAS.

## Estado operacional após conciliação KOR-PLAN-001 (2026-10-28)
- Histórico acima é evidência do **baseline inicial**, não descrição das configurações atuais. Em `main=943f634797122473b56e7190f8c5cc1aa8fdd9f5`, o ruleset #26074776 está `active`, sem bypass, com PR obrigatório, resolução de threads, bloqueio de exclusão/force-push, histórico linear e squash-only.
- `governance-docs` é required check (`integration_id=15368`, App GitHub Actions), com produtor validado em `main` e PR de prova #3. O código/documentação da PR #1 foi reconciliado **somente na sua branch**, com merge commit de dois pais `8d54bb51bf9b6e9c4d9413fcfc4d2fb6396f06ab` (pais: HEAD anterior `ba166dc7fc69435c3905b8c3864749b6a5f8adec` e `main=943f634797122473b56e7190f8c5cc1aa8fdd9f5`); nenhuma alteração foi realizada na `main` por KOR-PLAN-001.
- G1 **proteção GitHub e check documental requerido: COMPROVADOS**; pendência de governança humana: `required_approving_review_count=0`, apenas revisão COMMENTED; revisão independente formal não substituída por CI.
- G0 **Source Pack:** auditoria documental prévia aceita pelo fundador; revalidação final após conciliação e checks do último HEAD ainda exigidos. Manter PR #1 Draft e sem merge até decisão humana separada; não iniciar implementação.
- Requisitos futuros de lint, testes, build e scanners para código continuam **NOT_RUN / NÃO CONFIGURADOS**. Nome KOROS, licença Intelligence, privacidade/LGPD, infraestrutura, custos e piloto permanecem condicionados a provas posteriores.
- Esta seção atualiza o estado dos gates sem apagar o histórico do baseline. Evidence Bundle e HEAD final precisam ser conferidos após o último commit da branch.
