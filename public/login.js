const form = document.getElementById('login-form');
const submit = document.getElementById('login-submit');
const errorBox = document.getElementById('login-error');

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.hidden = true;
  submit.disabled = true;
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/v1/auth/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (response.ok) {
      window.location.assign('/dashboard');
      return;
    }
    if (response.status === 401) {
      showError('E-mail ou senha inválidos.');
    } else if (response.status === 429) {
      showError('Muitas tentativas. Aguarde alguns minutos.');
    } else {
      showError('Não foi possível entrar. Tente novamente.');
    }
  } catch {
    showError('Falha de conexão com o servidor local.');
  } finally {
    submit.disabled = false;
  }
});
