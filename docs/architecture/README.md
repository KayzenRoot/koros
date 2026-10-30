# Decisões técnicas por incremento
- [ADR-016: runtime/baseline isolado da WO #45](ADR-016-runtime-baseline.md) (scope limitado, proposta na PR; ADR-006 original continua pendente)

## Executar apenas localmente
Requer Node.js >=22 e <27 (a matriz do CI usa Node 24). Sem `npm install`, sem dependências npm de terceiros:

```sh
npm run check
npm run build
npm run smoke
npm start
```

O comando `build` nesta WO executa somente validação de sintaxe, **não** empacotamento ou compilação para deploy. A API abre exclusivamente em `127.0.0.1:3030` (porta ajustável por `KOROS_PORT`). As únicas rotas GET são `/healthz`, `/version` e `/config` pública e sanitizada. O contrato de tenant é estrutural, sem autenticação, banco, CRM, IA, clientes ou escrita externa. Não expor em rede pública nem usar em produção.
