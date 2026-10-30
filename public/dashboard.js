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

let grantedPermissions = [];

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

function expiryText(value) {
  const expires = new Date(value);
  if (Number.isNaN(expires.getTime())) return 'Validade desconhecida';
  const remaining = expires.getTime() - Date.now();
  if (remaining <= 0) return 'Expirado';
  const minutes = Math.ceil(remaining / 60_000);
  return minutes <= 1 ? 'Expira em menos de 1 min' : `Expira em ${minutes} min`;
}

function decisionLabel(decision) {
  return {
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
    EXPIRED: 'Expirado',
    REVOKED: 'Revogado',
    PENDING: 'Pendente',
  }[decision] || decision;
}

function approvalCard(item) {
  const card = document.createElement('article');
  card.className = 'approval-card';
  card.dataset.approvalId = item.approval_id;

  const head = document.createElement('div');
  head.className = 'approval-head';
  const title = document.createElement('h3');
  title.textContent = item.scope;
  const expiry = document.createElement('span');
  expiry.textContent = expiryText(item.expires_at);
  if (expiry.textContent === 'Expirado') expiry.className = 'approval-expired';
  head.append(title, expiry);

  const meta = document.createElement('p');
  meta.className = 'approval-meta';
  meta.textContent = `Run ${shortId(item.run_id)} · estado ${item.run_state} · versão ${item.payload_version} · solicitado ${formatDate(item.created_at)}`;

  const fields = document.createElement('p');
  fields.className = 'approval-fields';
  fields.textContent = `Campos: ${(item.field_allowlist || []).join(', ')}`;

  const payload = document.createElement('pre');
  payload.className = 'approval-payload';
  payload.textContent = JSON.stringify(item.proposed_operation?.payload ?? {}, null, 2);

  const actions = document.createElement('div');
  actions.className = 'approval-actions';
  for (const [decision, label, className] of [
    ['APPROVED', 'Confirmar aprovação', ''],
    ['REJECTED', 'Rejeitar', 'reject secondary'],
  ]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset.decision = decision;
    button.dataset.approvalId = item.approval_id;
    if (className) button.className = className;
    actions.append(button);
  }

  const error = document.createElement('p');
  error.className = 'approval-error';
  error.hidden = true;

  card.append(head, meta, fields, payload, actions, error);
  return card;
}

function renderApprovals(data) {
  const list = byId('approvals-list');
  const empty = byId('approvals-empty');
  list.replaceChildren();
  empty.hidden = data.pending.length > 0;
  for (const item of data.pending) list.append(approvalCard(item));

  renderRows(
    byId('approval-history-body'),
    data.history,
    [
      (row) => runCell(row.run_id),
      (row) => textCell(row.scope),
      (row) => {
        const cell = document.createElement('td');
        const badge = stateBadge(row.decision);
        badge.textContent = decisionLabel(row.decision);
        cell.append(badge);
        return cell;
      },
      (row) => textCell(formatDate(row.decided_at)),
    ],
    'Sem decisões registradas.',
  );
}

async function loadApprovals() {
  const section = byId('approvals-section');
  if (!grantedPermissions.includes('approval:decide')) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  const status = byId('approvals-status');
  try {
    const data = await fetchJson('/v1/approvals');
    renderApprovals(data);
    status.textContent = `${data.pending.length} pendente(s)`;
  } catch (error) {
    if (error.code === 'FORBIDDEN' || error.code === 'UNAUTHORIZED') {
      section.hidden = true;
      return;
    }
    status.textContent = 'Falha ao carregar aprovações.';
  }
}

async function decideApproval(approvalId, decision, card) {
  const buttons = card.querySelectorAll('button[data-decision]');
  const errorBox = card.querySelector('.approval-error');
  errorBox.hidden = true;
  for (const button of buttons) button.disabled = true;
  try {
    const result = await fetchJson(`/v1/approvals/${approvalId}/decision`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': readCookie('koros_csrf'),
      },
      body: JSON.stringify({ decision }),
    });
    byId('approvals-status').textContent = `Decisão registrada: ${decisionLabel(result.decision)}.`;
    await load();
  } catch (error) {
    if (error.code === 'UNAUTHORIZED') return;
    const messages = {
      ALREADY_DECIDED: 'Outro aprovador já decidiu. Atualizando a fila.',
      PAYLOAD_MISMATCH: 'O payload mudou desde o pedido. Decisão bloqueada.',
      APPROVAL_EXPIRED: 'A aprovação expirou. Atualizando a fila.',
      FORGED_APPROVAL: 'Esta sessão não pode decidir a aprovação.',
      NOT_FOUND: 'A aprovação não existe mais.',
      FORBIDDEN: 'Seu papel não permite decidir aprovações.',
    };
    errorBox.textContent = messages[error.code] || 'Não foi possível registrar a decisão.';
    errorBox.hidden = false;
    await loadApprovals();
    for (const button of buttons) button.disabled = false;
  }
}

function render(data) {
  grantedPermissions = data.permissions;
  byId('approvals-section').hidden = !data.permissions.includes('approval:decide');
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
    await loadApprovals();
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
byId('approvals-list')?.addEventListener('click', async (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest('button[data-decision]');
  if (!button) return;
  const card = button.closest('.approval-card');
  if (!card) return;
  await decideApproval(button.dataset.approvalId, button.dataset.decision, card);
});
await load();
