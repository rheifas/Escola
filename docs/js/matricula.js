const API = 'http://localhost:8080';

// Máscaras
function mascaraCpf(input) {
    let v = input.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    input.value = v;
}

function mascaraTelefone(input) {
    let v = input.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{2})(\d)/, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    input.value = v;
}

function mascaraCep(input) {
    let v = input.value.replace(/\D/g, '').slice(0, 8);
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    input.value = v;
}

document.getElementById('cpfAluno').addEventListener('input', function () { mascaraCpf(this); });
document.getElementById('cpfResp').addEventListener('input', function () { mascaraCpf(this); });
document.getElementById('telefone').addEventListener('input', function () { mascaraTelefone(this); });
document.getElementById('telresp').addEventListener('input', function () { mascaraTelefone(this); });
document.getElementById('cep').addEventListener('input', function () { mascaraCep(this); });

// Feedback
function mostrarMensagem(texto, tipo) {
    let msg = document.getElementById('msgFeedback');
    if (!msg) {
        msg = document.createElement('div');
        msg.id = 'msgFeedback';
        msg.style.cssText = `
            padding: 12px 16px;
            border-radius: 6px;
            margin-top: 16px;
            font-weight: 500;
            text-align: center;
        `;
        document.querySelector('.btn-enviar').insertAdjacentElement('afterend', msg);
    }
    msg.textContent = texto;
    msg.style.backgroundColor = tipo === 'sucesso' ? '#c6f6d5' : '#fed7d7';
    msg.style.color = tipo === 'sucesso' ? '#276749' : '#9b2c2c';
    msg.style.display = 'block';
    window.scrollTo({ top: msg.offsetTop - 100, behavior: 'smooth' });
}

document.getElementById('formMatricula').addEventListener('submit', async function (e) {
    e.preventDefault();

    const btnEnviar = document.querySelector('.btn-enviar');
    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Enviando...';

    // Monta endereço
    const logradouro  = document.getElementById('logradouro').value;
    const numero      = document.getElementById('numero').value;
    const bairro      = document.getElementById('bairro').value;
    const cidade      = document.getElementById('cidade').value;
    const cep         = document.getElementById('cep').value;
    const complemento = document.getElementById('complemento').value;
    const endereco = `${logradouro}, ${numero} - ${bairro}, ${cidade} - CEP: ${cep}${complemento ? ', ' + complemento : ''}`;

    const dadosAluno = {
        nome: document.getElementById('nomeAluno').value,
        cpf: document.getElementById('cpfAluno').value || null,
        dataNascimento: document.getElementById('nascimento').value || null,
        endereco: endereco,
        telefone: document.getElementById('telefone').value
    };

    try {
        // 1. Cria o aluno
        const resAluno = await fetch(`${API}/alunos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAluno)
        });

        const textoAluno = await resAluno.text();
        if (!resAluno.ok) {
            let mensagem = 'Erro ao cadastrar aluno.';
            try { mensagem = JSON.parse(textoAluno).message || mensagem; } catch (_) {}
            throw new Error(mensagem);
        }

        const alunoCriado = JSON.parse(textoAluno);

        // 2. Cria o responsável vinculado ao aluno (com CPF)
        const dadosResponsavel = {
            nome: document.getElementById('nomeResp').value,
            cpf: document.getElementById('cpfResp').value,
            telefone: document.getElementById('telresp').value,
            dataNascimento: document.getElementById('nascresp').value || null,
            endereco: endereco,
            idAlunos: [alunoCriado.id]
        };

        const resResp = await fetch(`${API}/responsaveis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosResponsavel)
        });

        const textoResp = await resResp.text();
        if (!resResp.ok) {
            let mensagem = 'Erro ao cadastrar responsável.';
            try { mensagem = JSON.parse(textoResp).message || mensagem; } catch (_) {}
            throw new Error(mensagem);
        }

        mostrarMensagem('Matrícula enviada com sucesso! Em breve entraremos em contato.', 'sucesso');
        document.getElementById('formMatricula').reset();

    } catch (err) {
        mostrarMensagem(err.message || 'Erro ao enviar matrícula. Tente novamente.', 'erro');
    } finally {
        btnEnviar.disabled = false;
        btnEnviar.textContent = 'Enviar solicitação de matrícula';
    }
});