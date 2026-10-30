const LOGIN_PAGE = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>Entrar · KOROS</title>
  <link rel="stylesheet" href="/assets/dashboard.css">
  <script src="/assets/login.js" defer></script>
</head>
<body class="auth-page">
  <a class="skip-link" href="#login-main">Ir para o formulário</a>
  <main id="login-main" class="auth-shell">
    <section class="panel auth-card" aria-labelledby="login-title">
      <p class="eyebrow">KOROS · ambiente sintético</p>
      <h1 id="login-title">Entrar na operação</h1>
      <p class="muted">Use uma conta sintética do tenant para acessar a fila, os runs e os limites.</p>
      <form id="login-form" class="stack" method="post" action="/v1/auth/login">
        <label for="email">E-mail</label>
        <input id="email" name="email" type="email" autocomplete="username" required>
        <label for="password">Senha</label>
        <input id="password" name="password" type="password" autocomplete="current-password" minlength="12" required>
        <button id="login-submit" type="submit">Entrar</button>
        <p id="login-error" class="alert" role="alert" hidden></p>
      </form>
      <p class="meta">Acesso local, dados sintéticos. Nenhuma credencial real é usada.</p>
    </section>
  </main>
</body>
</html>`;

const DASHBOARD_PAGE = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>Operações · KOROS</title>
  <link rel="stylesheet" href="/assets/dashboard.css">
  <script type="module" src="/assets/dashboard.js"></script>
</head>
<body>
  <a class="skip-link" href="#main">Ir para o conteúdo</a>
  <header class="topbar">
    <div>
      <p class="eyebrow">KOROS · operações</p>
      <h1 id="tenant-name">Carregando…</h1>
      <p id="tenant-meta" class="muted"></p>
    </div>
    <div class="topbar-actions">
      <button id="refresh" type="button" class="secondary">Atualizar</button>
      <button id="logout" type="button" class="secondary">Sair</button>
    </div>
  </header>

  <main id="main" class="layout">
    <p id="status" class="status" role="status" aria-live="polite">Carregando dados…</p>
    <p id="error" class="alert" role="alert" hidden></p>

    <section aria-labelledby="overview-title">
      <h2 id="overview-title">Visão geral</h2>
      <div class="metrics">
        <article class="metric"><span>Total de runs</span><strong id="metric-total">—</strong></article>
        <article class="metric"><span>Na fila</span><strong id="metric-queue">—</strong></article>
        <article class="metric"><span>Falhas</span><strong id="metric-failures">—</strong></article>
        <article class="metric"><span>Concluídos</span><strong id="metric-completed">—</strong></article>
        <article class="metric"><span>Pausados</span><strong id="metric-paused">—</strong></article>
      </div>
    </section>

    <section aria-labelledby="limits-title">
      <h2 id="limits-title">Limites e controles</h2>
      <div id="limits" class="panel limits"></div>
    </section>

    <section id="approvals-section" aria-labelledby="approvals-title" hidden>
      <div class="section-heading">
        <h2 id="approvals-title">Aprovações pendentes</h2>
        <span id="approvals-status" class="muted" role="status" aria-live="polite"></span>
      </div>
      <p id="approvals-empty" class="muted" hidden>Nenhuma aprovação pendente.</p>
      <div id="approvals-list" class="approval-list"></div>
      <h3>Histórico de decisões</h3>
      <div class="table-wrap">
        <table>
          <caption class="visually-hidden">Histórico de aprovações</caption>
          <thead><tr><th scope="col">Run</th><th scope="col">Escopo</th><th scope="col">Decisão</th><th scope="col">Data</th></tr></thead>
          <tbody id="approval-history-body"><tr><td colspan="4" class="empty">Sem decisões registradas.</td></tr></tbody>
        </table>
      </div>
    </section>

    <section aria-labelledby="queue-title">
      <div class="section-heading">
        <h2 id="queue-title">Fila</h2>
        <span class="muted">Aguardando aprovação, execução ou reconciliação</span>
      </div>
      <div class="table-wrap">
        <table>
          <caption class="visually-hidden">Runs na fila</caption>
          <thead><tr><th scope="col">Run</th><th scope="col">Estado</th><th scope="col">Chave</th><th scope="col">Atualizado</th></tr></thead>
          <tbody id="queue-body"><tr><td colspan="4" class="empty">Nenhum run na fila.</td></tr></tbody>
        </table>
      </div>
    </section>

    <section aria-labelledby="failures-title">
      <div class="section-heading">
        <h2 id="failures-title">Falhas</h2>
        <span class="muted">Falhas terminais e expirações</span>
      </div>
      <div class="table-wrap">
        <table>
          <caption class="visually-hidden">Runs com falha</caption>
          <thead><tr><th scope="col">Run</th><th scope="col">Estado</th><th scope="col">Chave</th><th scope="col">Atualizado</th></tr></thead>
          <tbody id="failures-body"><tr><td colspan="4" class="empty">Nenhuma falha registrada.</td></tr></tbody>
        </table>
      </div>
    </section>

    <section aria-labelledby="runs-title">
      <div class="section-heading">
        <h2 id="runs-title">Runs recentes</h2>
        <span class="muted">Últimos 20 registros do tenant</span>
      </div>
      <div class="table-wrap">
        <table>
          <caption class="visually-hidden">Runs recentes</caption>
          <thead><tr><th scope="col">Run</th><th scope="col">Estado</th><th scope="col">Chave</th><th scope="col">Criado</th><th scope="col">Atualizado</th></tr></thead>
          <tbody id="runs-body"><tr><td colspan="5" class="empty">Nenhum run encontrado.</td></tr></tbody>
        </table>
      </div>
    </section>

    <section aria-labelledby="permissions-title" class="panel">
      <h2 id="permissions-title">Permissões da sessão</h2>
      <p id="permissions" class="permissions">—</p>
    </section>
  </main>
  <footer class="footer">Ambiente local sintético · sem CRM, LLM ou cobrança reais</footer>
</body>
</html>`;

export function loginPage() {
  return LOGIN_PAGE;
}

export function dashboardPage() {
  return DASHBOARD_PAGE;
}
