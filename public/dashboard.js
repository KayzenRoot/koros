const ROLE_LABELS = {
  owner: 'Proprietário',
  admin: 'Administrador',
  approver: 'Aprovador',
  operator: 'Operador',
  viewer: 'Visualizador',
};

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function byId(id) {
  return document.getElementById(id);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

function shortId(value) {
  return typeof value === 'string' && value.length > 8 ? value.slice(0, 8) : value || '—';
}

function stateBadge(state) {
  const badge = document.createElement('span');
  badge.className = 'state-badge';
  badge.dataset.state = state;
  badge.textContent = state;
  return badge;
}

function emptyRow(columns, message) {
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = columns;
  cell.className = 'empty';
  cell.textContent = message;
  row.append(cell);
  return row;
}

function runCell(value) {
  const cell = document.createElement('td');
  const code = document.createElement('code');
  code.textContent = shortId(value);
  code.title = value || '';
  cell.append(code);
  return cell;
}

function renderRows(tbody, rows, columns, emptyMessage) {
  tbody.replaceChildren();
  if (!rows.length) {
    tbody.append(emptyRow(columns.length, emptyMessage));
    return;
  }
  for (const row of rows) {
    const tr = document.createElement('tr');
    for (const column of columns) {
      tr.append(column(row));
    }
    tbody.append(tr);
  }
}

function limitRow(label, used, max, formatter) {
  const row = document.createElement('div');
  row.className = 'limit-row';

  const head = document.createElement('div');
  head.className = 'limit-head';
  const name = document.createElement('span');
  name.textContent = label;
  const values = document.createElement('strong');
  values.textContent = `${formatter(used)} / ${formatter(max)}`;
  head.append(name, values);

  const bar = document.createElement('div');
  bar.className = 'bar';
  const fill = document.createElement('span');
  const percent = max > 0 ? Math.min(100, (used / max) * 100) : 0;
  fill.style.width = `${percent}%`;
  fill.dataset.over = String(used > max);
  bar.append(fill);
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-label', label);
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', String(max));
  bar.setAttribute('aria-valuenow', String(used));

  row.append(head, bar);
  return row;
}

function renderLimits(limits) {
  const container = byId('limits');
  container.replaceChildren();
  if (limits.budgetMaxTokens === null || limits.budgetMaxCost === null) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'Orçamento não configurado para este tenant.';
    container.append(empty);
  } else {
    container.append(
      limitRow('Tokens', limits.tokensUsed, limits.budgetMaxTokens, (value) =>
        new Intl.NumberFormat('pt-BR').format(value),
      ),
      limitRow(
        'Custo simulado',
        limits.costUsed,
        limits.budgetMaxCost,
        (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
      ),
    );
    const period = document.createElement('p');
    period.className = 'muted';
    period.textContent = `Período: ${formatDate(limits.periodStart)} até ${formatDate(limits.periodEnd)}`;
    container.append(period);
  }

  const control = document.createElement('div');
  control.className = 'control-line';
  const label = document.createElement('span');
  label.textContent = 'Kill switch';
  const state = document.createElement('strong');
  state.textContent = limits.killSwitchActive ? 'Ativo — operações bloqueadas' : 'Inativo';
  if (limits.killSwitchActive) state.style.color = 'var(--danger)';
  control.append(label, state);
  container.append(control);

  if (limits.killSwitchActive && limits.killSwitchReason) {
    const reason = document.createElement('p');
    reason.className = 'muted';
    reason.textContent = `Motivo: ${limits.killSwitchReason}`;
    container.append(reason);
  }
}

function textCell(value) {
  const cell = document.createElement('td');
  cell.textContent = value;
  return cell;
}

function badgeCell(state) {
  const cell = document.createElement('td');
  cell.append(stateBadge(state));
  return cell;
}

function renderRunTable(tbodyId, rows, emptyMessage) {
  renderRows(
    byId(tbodyId),
    rows,
    [
      (row) => runCell(row.run_id),
      (row) => badgeCell(row.state),
      (row) => textCell(row.idempotency_key),
      (row) => textCell(formatDate(row.updated_at)),
    ],
    emptyMessage,
  );
}

function render(data) {
  byId('tenant-name').textContent = data.tenant.name;
  byId('tenant-meta').textContent = `${ROLE_LABELS[data.role] || data.role} · tenant ${shortId(data.tenant.id)}`;
  byId('metric-total').textContent = String(data.counts.total);
  byId('metric-queue').textContent = String(data.counts.queue);
  byId('metric-failures').textContent = String(data.counts.failures);
  byId('metric-completed').textContent = String(data.counts.completed);
  byId('metric-paused').textContent = String(data.counts.paused);
  byId('permissions').textContent = data.permissions.length
    ? data.permissions.join(' · ')
    : 'Nenhuma permissão';

  renderRunTable('queue-body', data.queue, 'Nenhum run na fila.');
  renderRunTable('failures-body', data.failures, 'Nenhuma falha registrada.');

  renderRows(
    byId('runs-body'),
    data.runs,
    [
      (row) => runCell(row.run_id),
      (row) => badgeCell(row.state),
      (row) => textCell(row.idempotency_key),
      (row) => textCell(formatDate(row.created_at)),
      (row) => textCell(formatDate(row.updated_at)),
    ],
    'Nenhum run encontrado.',
  );

  renderLimits(data.limits);
}

async function fetchJson(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
  });
  if (response.status === 401) {
    window.location.assign('/login');
    const error = new Error('unauthorized');
    error.code = 'UNAUTHORIZED';
    throw error;
  }
  let body = {};
  try {
    body = await response.json();
  } catch {
    body = {};
  }
  if (!response.ok) {
    const error = new Error(body.error || 'api_error');
    error.code = body.error || 'API_ERROR';
    throw error;
  }
  return body;
}

let loading = false;

async function load() {
  if (loading) return;
  loading = true;
  const refresh = byId('refresh');
  const status = byId('status');
  const errorBox = byId('error');
  refresh.disabled = true;
  errorBox.hidden = true;
  status.textContent = 'Atualizando dados…';
  try {
    const data = await fetchJson('/v1/dashboard/summary');
    render(data);
    status.textContent = `Atualizado em ${formatDate(data.generatedAt)}.`;
  } catch (error) {
    if (error.code !== 'UNAUTHORIZED') {
      errorBox.textContent = 'Não foi possível carregar o painel. Verifique a API e tente novamente.';
      errorBox.hidden = false;
      status.textContent = 'Falha na atualização.';
    }
  } finally {
    loading = false;
    refresh.disabled = false;
  }
}

function readCookie(name) {
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const value = part.trim();
    if (value.startsWith(prefix)) return decodeURIComponent(value.slice(prefix.length));
  }
  return '';
}

async function logout() {
  const button = byId('logout');
  button.disabled = true;
  try {
    await fetchJson('/v1/auth/logout', {
      method: 'POST',
      headers: { 'x-csrf-token': readCookie('koros_csrf') },
    });
    window.location.assign('/login');
  } catch (error) {
    if (error.code !== 'UNAUTHORIZED') {
      const errorBox = byId('error');
      errorBox.textContent = 'Não foi possível encerrar a sessão.';
      errorBox.hidden = false;
    }
    button.disabled = false;
  }
}

byId('refresh')?.addEventListener('click', load);
byId('logout')?.addEventListener('click', logout);
await load();
