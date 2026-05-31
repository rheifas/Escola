const API = 'http://localhost:8080';

document.querySelector('form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const cpf = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cpf, senha })
        });

        if (!res.ok) {
            mostrarErro('CPF ou senha inválidos.');
            return;
        }

        const data = await res.json();

        // Salva no localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('perfil', data.perfil);
        localStorage.setItem('idReferencia', data.idReferencia);
        localStorage.setItem('nome', data.nome);

        // Redireciona por perfil
        if (data.perfil === 'ALUNO') {
            window.location.href = 'pag_aluno.html';
        } else if (data.perfil === 'PROFESSOR') {
            window.location.href = 'pag_professor.html';
        } else if (data.perfil === 'COORDENADOR') {
            window.location.href = 'pag_coordenador.html';
        } else {
            mostrarErro('Perfil não reconhecido.');
        }

    } catch (err) {
        mostrarErro('Erro ao conectar com o servidor.');
    }
});

function mostrarErro(msg) {
    let erro = document.getElementById('erroLogin');
    if (!erro) {
        erro = document.createElement('p');
        erro.id = 'erroLogin';
        erro.style.cssText = 'color: #e53e3e; font-size: 14px; margin-top: 8px; text-align: center;';
        document.querySelector('form').appendChild(erro);
    }
    erro.textContent = msg;
}