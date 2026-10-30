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
