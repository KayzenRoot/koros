# ADR-016 | KOR-PM02-WO-001: baseline independente sem dependências npm
**Data:** 2026-10-30 · **Estado:** PROPOSED_IN_PR / DECIDED_FOR_WO_ONLY (sujeito a auditoria) · **Base:** main `30819b2622d5dc865931d5c55e9e9e9586648276`.

## Contexto e hierarquia
A arquitetura canônica (docs/03-architecture.md) mantém **ADR-006 PENDING** quanto a OpenBot/Intelligence, derivação e direitos de distribuição. M01 (PR #36 Draft) aprovou apenas direção: core multissetorial, SaaS gerenciado primeiro, IA sem autoridade e aprovação humana antes de escrita CRM. Roadmap (PR #68 Draft) identifica #45 como primeiro incremento NECESSARY. Nenhuma das duas PRs foi incorporada à main. Esta ADR é **somente decisão mínima de baseline da WO #45** e NÃO revoga ADR-006/ADR-009 nem escolhe CRM, LLM, arquitetura física ou licença final de produto.

## Alternativas
1. **Derivar OpenBot + Intelligence:** aumenta risco de dependências e uso comercial de partes gerenciadas/sem entitlement verificado. Não incorporar nesta WO.
2. **Base própria independente com Node.js core:** mantém interfaces agnósticas, custo incremental de bibliotecas npm = R$0, nenhum componente OpenBot/CopilotKit; pequena superfície para validar código/CI antes de escolhas irreversíveis. **Escolhida para o escopo local desta WO**.
3. **Framework/ORM completo antecipadamente:** demanda pacotes, cadeia supply-chain e decisões de DB não necessárias para health/config/contrato; adiar.

## Escolhas limitadas
- Runtime Node.js LTS, JavaScript ESM, HTTP nativo, `node:test`, scripts nativos de sintaxe; sem dependências de terceiros em `package.json`. Node.js sob MIT para código base, com licenças de componentes embutidos próprias em [LICENSE upstream](https://github.com/nodejs/node/blob/main/LICENSE); action checkout/setup-node MIT publicadas e fixadas por SHA. Não incluir código ou assets de OpenBot/Intelligence.
- `package.json` marcado `private: true`, `UNLICENSED`: **não concede direito de cópia comercial a terceiros**; definição de licença própria futura é gate comercial. Isto não altera licenças de Node.js.
- API **somente local** em `127.0.0.1`, variável de porta `KOROS_PORT` estritamente validada. Rotas públicas apenas `GET /healthz`, `/version`, `/config` sanitizada. Nenhuma conexão de CRM, identidade, middleware auth ou persistência implementada.
- `src/tenant-envelope.mjs`: **somente verificação estrutural** do contrato futuro (`tenantId`, `subjectId`, `role`). NÃO é autenticação/autorização. Nenhuma rota tenant é disponibilizada; cabe à WO #46 derivar tenant de sessão verificada e provar isolamento negativo.
- Data model conceitual mantém PostgreSQL como opção de planejamento, **banco e migrations NÃO ESCOLHIDOS nem implementados**, reservados à WO #47. Worker/filas, integração CRM e agente não estão no scope.
- Sem Docker socket, shell, egress, hospedagem paga, conta externa ou dados pessoais. CI mínima `m02-baseline` da própria WO (unit, syntax, build validation e smoke), sem alterar required checks da main; ampliação da pipeline fica com WO #61.

## Tradeoffs e riscos
- Sem framework/TypeScript ou banco nesta primeira entrega: menos superfície de dependências, mas não prova arquitetura de produção. A próxima WO deve avaliar tipagem forte e contratos sem reescrever o básico sem necessidade.
- Node.js LTS usada em GitHub Actions 24; verificação local disponível em Node.js 22 LTS. Segurança e compatibilidade de bibliotecas embutidas são responsabilidade upstream; validação de licença e versão deve ser refeita antes de release comercial.
- Health retorna status do processo, **não** readiness de persistência, autenticação, tenant, filas ou CRM.

## Gates para sair da WO
Testes unit + smoke de rede loopback; métodos mutáveis 405; rotas internas não existentes; X-Tenant-Id e Authorization falsos ignorados; configuração não expõe credenciais; porta inválida rejeitada; check documental e job `m02-baseline` no HEAD exato; Evidence Bundle. Review não APPROVED e checkpoint ainda PROPOSTO até auditoria. Sem merge/deploy, inclusive em VPS de usuário.

## Pós-merge do baseline: evidência adicional (2026-10-30; delta PROPOSTO)
A implantação **do código local apenas** foi concluída via squash normal da [PR #69](https://github.com/KayzenRoot/koros/pull/69). HEAD de origem `56e006435531e5d596a22f52e3b52db59a4d3ade`, novo commit `main=e24d7cf458f61d1b98850f34a304023ee1d87ce1`, Git tree `319d7c0d91a3a1348d71f691aae52f76f16780d7` em ambos, com CI de pull request verde. **Status material: IMPLEMENTED_FOR_WO_ONLY;** decisão maior ADR-006 continua PENDING e nenhuma autorização comercial/produção foi inferida. Esta seção de read-back só se tornará canônica após eventual merge de sua PR documental.
