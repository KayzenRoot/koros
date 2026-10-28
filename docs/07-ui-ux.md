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
