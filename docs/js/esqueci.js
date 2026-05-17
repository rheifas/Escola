/*bagunça*/

const btnEsqueci = document.getElementById('btnEsqueci');
const modalOverlay = document.getElementById('modalOverlay');
const btnCancelar = document.getElementById('btnCancelar');
const btnEnviarCodigo = document.getElementById('btnEnviarCodigo');
const btnFechar = document.getElementById('btnFechar');
const etapa1 = document.getElementById('etapa1');
const etapa2 = document.getElementById('etapa2');
const emailInput = document.getElementById('emailRecupera');
const erroEmail = document.getElementById('erroEmail');
const emailConfirmado = document.getElementById('emailConfirmado');

btnEsqueci.addEventListener('click', function (e) {
    e.preventDefault();
    modalOverlay.classList.add('ativo');
    etapa1.classList.remove('hidden');
    etapa2.classList.add('hidden');
    emailInput.value = '';
    erroEmail.textContent = '';
});

function fecharModal() {
    modalOverlay.classList.remove('ativo');
}

btnCancelar.addEventListener('click', fecharModal);
btnFechar.addEventListener('click', fecharModal);

modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) fecharModal();
});

btnEnviarCodigo.addEventListener('click', function () {
    const email = emailInput.value.trim();
    const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!email) {
        erroEmail.textContent = 'Por favor, informe seu e-mail.';
        emailInput.focus();
        return;
    }
    if (!valido) {
        erroEmail.textContent = 'Informe um e-mail válido.';
        emailInput.focus();
        return;
    }

    erroEmail.textContent = '';
    emailConfirmado.textContent = email;
    etapa1.classList.add('hidden');
    etapa2.classList.remove('hidden');
});