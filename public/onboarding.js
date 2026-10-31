const STEP_LABELS = {
  TENANT: 'Empresa',
  CONNECTOR: 'Conector mock',
  TEMPLATE: 'Template',
  INVITE: 'Convite',
  CONSENT: 'Consentimento',
  POLICY: 'Política',
  DRY_RUN: 'Dry-run',
  COMPLETED: 'Concluído',
};

const STEP_NUMBERS = {
  TENANT: 1,
  CONNECTOR: 2,
  TEMPLATE: 3,
  INVITE: 4,
  CONSENT: 5,
  POLICY: 6,
  DRY_RUN: 7,
};

const ERROR_MESSAGES = {
  MISSING_SCOPE: 'Selecione o escopo leads:read para o conector mock.',
  STEP_MISMATCH: 'O passo mudou. Recarregando o wizard.',
  TEMPLATE_NOT_FOUND: 'O template selecionado não pertence a este tenant.',
  DRY_RUN_FAILED: 'O dry-run falhou. Corrija os dados sintéticos e tente novamente.',
  FORBIDDEN: 'Seu papel não permite configurar o tenant.',
  INVALID_INPUT: 'Dados inválidos para este passo.',
};

let session = null;
let loading = false;

function byId(id) {
  return document.getElementById(id);
}

function readCookie(name) {
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const value = part.trim();
    if (value.startsWith(prefix)) return decodeURIComponent(value.slice(prefix.length));
  }
  return '';
}

async function fetchJson(path, options = {}) {
  const response = await fetch(path, { credentials: 'same-origin', ...options });
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

function showError(message) {
  const box = byId('onboarding-error');
  box.textContent = message;
  box.hidden = false;
}

function clearError() {
  byId('onboarding-error').hidden = true;
}

function makeField(labelText, input) {
  const wrapper = document.createElement('div');
  const label = document.createElement('label');
  label.htmlFor = input.id;
  label.textContent = labelText;
  wrapper.append(label, input);
  return wrapper;
}

function textInput(id, value = '', type = 'text') {
  const input = document.createElement('input');
  input.id = id;
  input.type = type;
  input.value = value;
  input.required = true;
  return input;
}

function option(value, label, selected = false) {
  const element = document.createElement('option');
  element.value = value;
  element.textContent = label;
  element.selected = selected;
  return element;
}

function selectInput(id, options) {
  const select = document.createElement('select');
  select.id = id;
  select.required = true;
  for (const item of options) select.append(item);
  return select;
}

function checkbox(id, labelText, checked = false) {
  const wrapper = document.createElement('label');
  wrapper.className = 'checkbox-row';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = id;
  input.checked = checked;
  const text = document.createElement('span');
  text.textContent = labelText;
  wrapper.append(input, text);
  return { input, wrapper };
}

function setStepChrome(step) {
  const number = STEP_NUMBERS[step];
  byId('step-progress').textContent = number ? `Passo ${number} de 7` : 'Concluído';
  byId('step-title').textContent = STEP_LABELS[step] || step;
}

function buildSubmit(label = 'Continuar') {
  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = label;
  return button;
}

async function buildTemplateSelect() {
  const data = await fetchJson('/v1/templates');
  const select = document.createElement('select');
  select.id = 'template-version';
  select.required = true;
  for (const template of data.templates) {
    for (const version of template.versions) {
      select.append(option(version.template_version_id, `${template.name} · v${version.version}`));
    }
  }
  if (select.options.length === 0) {
    const fallback = option('', 'Nenhum template disponível');
    select.append(fallback);
  }
  return select;
}

async function renderStep(nextSession) {
  session = nextSession;
  clearError();
  byId('onboarding-empty').hidden = true;
  byId('onboarding-complete').hidden = true;
  byId('onboarding-wizard').hidden = false;
  byId('onboarding-status').textContent = `Passo atual: ${STEP_LABELS[session.current_step] || session.current_step}`;
  setStepChrome(session.current_step);

  const form = byId('step-form');
  form.replaceChildren();
  byId('step-extra').replaceChildren();

  if (session.current_step === 'TENANT') {
    form.append(
      makeField('Nome da empresa', textInput('tenant-name', session.profile.name || '')),
      buildSubmit(),
    );
  } else if (session.current_step === 'CONNECTOR') {
    const provider = selectInput('connector-provider', [option('synthetic-webhook', 'synthetic-webhook')]);
    const account = textInput('connector-account', session.connector?.account || 'onboarding-default');
    const scope = checkbox('connector-scope', 'Escopo leads:read', session.connector?.scopes?.includes('leads:read') ?? true);
    form.append(
      makeField('Provedor mock', provider),
      makeField('Conta sintética', account),
      scope.wrapper,
      buildSubmit(),
    );
  } else if (session.current_step === 'TEMPLATE') {
    const select = await buildTemplateSelect();
    form.append(makeField('Template versionado', select), buildSubmit());
  } else if (session.current_step === 'INVITE') {
    const email = textInput('invite-email', '', 'email');
    const role = selectInput('invite-role', [
      option('operator', 'Operador'),
      option('approver', 'Aprovador'),
      option('viewer', 'Visualizador'),
    ]);
    form.append(makeField('E-mail do convidado', email), makeField('Papel', role), buildSubmit('Gerar convite'));
  } else if (session.current_step === 'CONSENT') {
    const group = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = 'Consentimento para uso futuro';
    group.append(legend);
    for (const [value, labelText] of [['GRANTED', 'Autorizado'], ['DENIED', 'Negado']]) {
      const label = document.createElement('label');
      label.className = 'checkbox-row';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'future-use';
      input.value = value;
      input.checked = value === 'GRANTED';
      const text = document.createElement('span');
      text.textContent = labelText;
      label.append(input, text);
      group.append(label);
    }
    form.append(group, buildSubmit());
  } else if (session.current_step === 'POLICY') {
    const accepted = checkbox('policy-accepted', 'Aceito a política sintética local-v1', false);
    form.append(accepted.wrapper, buildSubmit());
  } else if (session.current_step === 'DRY_RUN') {
    form.append(
      makeField('External ID sintético', textInput('dry-external-id', 'lead-onboarding')),
      makeField('E-mail sintético', textInput('dry-email', 'lead@example.invalid', 'email')),
      makeField('Nome sintético', textInput('dry-name', 'Lead Onboarding')),
      buildSubmit('Executar dry-run'),
    );
  }

  form.onsubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    loading = true;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    clearError();
    try {
      const data = buildStepData(session.current_step);
      const result = await fetchJson('/v1/onboarding/step', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': readCookie('koros_csrf'),
        },
        body: JSON.stringify({
          sessionId: session.session_id,
          step: session.current_step,
          data,
        }),
      });
      const token = result.invite_token;
      if (result.session.status === 'COMPLETED') {
        showCompleted(result.session);
      } else {
        await renderStep(result.session);
        if (token) showInviteToken(token);
      }
    } catch (error) {
      if (error.code === 'UNAUTHORIZED') return;
      if (error.code === 'STEP_MISMATCH') {
        await load();
        return;
      }
      showError(ERROR_MESSAGES[error.code] || 'Não foi possível concluir este passo.');
      button.disabled = false;
    } finally {
      loading = false;
    }
  };
}

function buildStepData(step) {
  if (step === 'TENANT') return { name: byId('tenant-name').value.trim() };
  if (step === 'CONNECTOR') {
    return {
      provider: byId('connector-provider').value,
      account: byId('connector-account').value.trim(),
      scopes: byId('connector-scope').checked ? ['leads:read'] : [],
    };
  }
  if (step === 'TEMPLATE') return { template_version_id: byId('template-version').value };
  if (step === 'INVITE') {
    return { email: byId('invite-email').value.trim(), role: byId('invite-role').value };
  }
  if (step === 'CONSENT') {
    return { future_use: document.querySelector('input[name="future-use"]:checked').value };
  }
  if (step === 'POLICY') return { accepted: byId('policy-accepted').checked, version: 'local-v1' };
  return {
    lead: {
      external_id: byId('dry-external-id').value.trim(),
      email: byId('dry-email').value.trim(),
      name: byId('dry-name').value.trim(),
    },
  };
}

function showInviteToken(token) {
  const box = byId('step-extra');
  const title = document.createElement('strong');
  title.textContent = 'Token de convite (exibido uma única vez)';
  const value = document.createElement('p');
  value.className = 'invite-token';
  value.textContent = token;
  box.append(title, value);
}

function showCompleted(completed) {
  session = completed;
  byId('onboarding-wizard').hidden = true;
  byId('onboarding-empty').hidden = true;
  byId('onboarding-complete').hidden = false;
  byId('onboarding-status').textContent = 'Onboarding concluído.';
  const box = byId('onboarding-complete');
  const existing = box.querySelector('.dry-run-preview');
  if (existing) existing.remove();
  if (completed.dry_run?.preview) {
    const pre = document.createElement('pre');
    pre.className = 'dry-run-preview';
    pre.textContent = JSON.stringify(completed.dry_run.preview.payload, null, 2);
    box.append(pre);
  }
}

async function load() {
  clearError();
  try {
    const data = await fetchJson('/v1/onboarding');
    if (!data.session) {
      byId('onboarding-empty').hidden = false;
      byId('onboarding-wizard').hidden = true;
      byId('onboarding-complete').hidden = true;
      byId('onboarding-status').textContent = 'Nenhuma sessão de onboarding.';
      return;
    }
    if (data.session.status === 'COMPLETED') {
      showCompleted(data.session);
      return;
    }
    await renderStep(data.session);
  } catch (error) {
    if (error.code === 'FORBIDDEN') {
      byId('onboarding-empty').hidden = true;
      byId('onboarding-wizard').hidden = true;
      byId('onboarding-complete').hidden = true;
      showError(ERROR_MESSAGES.FORBIDDEN);
      return;
    }
    if (error.code !== 'UNAUTHORIZED') {
      showError('Não foi possível carregar o onboarding.');
    }
  }
}

byId('onboarding-start')?.addEventListener('click', async () => {
  const button = byId('onboarding-start');
  button.disabled = true;
  clearError();
  try {
    const result = await fetchJson('/v1/onboarding/start', {
      method: 'POST',
      headers: { 'x-csrf-token': readCookie('koros_csrf') },
    });
    await renderStep(result.session);
  } catch (error) {
    if (error.code !== 'UNAUTHORIZED') showError(ERROR_MESSAGES[error.code] || 'Não foi possível iniciar.');
    button.disabled = false;
  }
});

await load();