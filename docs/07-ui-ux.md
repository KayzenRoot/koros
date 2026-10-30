# 07 — UI/UX (sem telas construídas)
## Papéis
Admin cliente gerencia acessos/cotas; Operador aprova e monitora; Auditor lê histórico autorizado; Operador Next Labs gerencia saúde técnica com privacidade e menor privilégio.

## Fluxos do dashboard MVP
1. Login e acesso ao ambiente isolado.
2. Visão geral: runs, status, erros, intervenções, custo **estimado**.
3. Entrada: leads com origem, classificação e incerteza.
4. Aprovações: comparar entrada, proposta, payload e destino antes de confirmar ou rejeitar.
5. Histórico: eventos, ator humano/IA, regra, status de execução real.
6. Integração: conexão verificada, escopos e revogação sem revelar tokens.
7. Controle: pausar fluxo, limites, budget e auditoria.

## Estados e acessibilidade
Empty, loading, stale, retry, blocked, error, success; feedback visual não confunde 'aprovado' com 'concluído'. Teclado, contraste objetivo WCAG AA, layout responsivo e pt-BR. Branding **KOROS by Next Labs** provisório, sem criação de assets, domínio ou alegação de registro.

## Dashboard da M05-WO-001 (2026-10-30; PROPOSED_IN_PR)

`/login` e `/dashboard` são HTML nativo com CSS/JS externos e sem framework. O login usa a API de sessão existente; o dashboard consome `GET /v1/dashboard/summary`, que deriva o tenant exclusivamente da sessão e nunca de query/header.

Telas: login; visão geral (total, fila, falhas, concluídos, pausados); limites/orçamento e kill switch; fila; falhas; runs recentes; permissões da sessão. A UI pt-BR mostra somente os agregados e campos retornados pela API, com estados vazios explícitos e mensagens de erro.

Acessibilidade inicial: `lang="pt-BR"`, skip link, landmarks, headings, labels, tabelas com caption/`scope`, `aria-live`, foco visível, alvos de 44 px, layout responsivo e `prefers-reduced-motion`. **Limites:** sem auditoria WCAG automatizada, navegador real/Playwright, testes de contraste instrumentados, ações de aprovação ou edição nesta WO. Evidência em [KOR-PM05-WO-001](../evidence/KOR-PM05-WO-001/README.md).

## Fila de aprovação da M05-WO-002 (2026-10-30; PROPOSED_IN_PR)

A seção de aprovações só aparece para papéis com `approval:decide`. Cada cartão mostra escopo, run, estado, versão, validade, campos e payload JSON; o histórico mostra decisão/data. Confirmar/rejeitar envia CSRF + sessão; a UI não carrega token, não altera payload e não decide localmente. Durante o envio os botões ficam desabilitados; `IDEMPOTENT`, `ALREADY_DECIDED`, `PAYLOAD_MISMATCH`, expiração e erros de sessão têm feedback explícito.

**Limites:** não há edição do payload, comentário, quórum, notificação em tempo real, aprovação por token na UI, Playwright ou auditoria WCAG. Evidência em [KOR-PM05-WO-002](../evidence/KOR-PM05-WO-002/README.md).

## Catálogo de templates da M05-WO-003 (2026-10-30; PROPOSED_IN_PR)

O dashboard mostra um catálogo read-only com nome, versão corrente, status, destino mock, campos obrigatórios, mapeamento, aprovação/TTL, limites e origem. Não exibe segredo nem permite editar policy; o preview dry-run é exposto pela API autenticada, não por editor visual.

**Limites:** sem editor/marketplace, criação pela UI, preview interativo no navegador, Playwright ou auditoria WCAG. Evidência em [KOR-PM05-WO-003](../evidence/KOR-PM05-WO-003/README.md).
