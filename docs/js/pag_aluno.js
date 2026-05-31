const API = 'http://localhost:8080';

const token = localStorage.getItem('token');
const idReferencia = parseInt(localStorage.getItem('idReferencia'));
const nome = localStorage.getItem('nome');

const perfil = localStorage.getItem('perfil');
if (!token || perfil !== 'ALUNO') window.location.href = 'login.html';

if (nome) document.getElementById('headerNome').textContent = `Olá, ${nome}`;

function authFetch(url, options = {}) {
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });
}

// ==================== SIDEBAR ====================
const btn = document.getElementById('toggleBtn');
const sidebar = document.getElementById('sidebar');
const navItems = document.querySelectorAll('.nav-item');
const paginas = document.querySelectorAll('.pagina');

btn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');
    btn.setAttribute('aria-label', isCollapsed ? 'Expandir menu' : 'Minimizar menu');
});

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const target = item.getAttribute('data-target');
        paginas.forEach(p => p.classList.remove('active'));
        document.getElementById(target).classList.add('active');
        carregarSecao(target);
    });
});

function carregarSecao(secao) {
    if (secao === 'informacoes') carregarInformacoes();
    if (secao === 'disciplinas') carregarDisciplinas();
    if (secao === 'agendamento') carregarAgendamentos();
}

// ==================== INFORMAÇÕES ====================
async function carregarInformacoes() {
    const res = await authFetch(`${API}/alunos/${idReferencia}`);
    const aluno = await res.json();
    document.getElementById('dadosAluno').innerHTML = `
        <div class="info-linha"><span class="info-label">Nome</span><span>${aluno.nome || '—'}</span></div>
        <div class="info-linha"><span class="info-label">CPF</span><span>${aluno.cpf || '—'}</span></div>
        <div class="info-linha"><span class="info-label">Telefone</span><span>${aluno.telefone || '—'}</span></div>
        <div class="info-linha"><span class="info-label">Endereço</span><span>${aluno.endereco || '—'}</span></div>
        <div class="info-linha"><span class="info-label">Nascimento</span><span>${aluno.dataNascimento || '—'}</span></div>
    `;
}

// ==================== DISCIPLINAS ====================
async function carregarDisciplinas() {
    const lista = document.getElementById('listaDisciplinas');
    const detalhe = document.getElementById('detalheBoletim');
    detalhe.style.display = 'none';
    lista.innerHTML = '<p class="vazio">Carregando...</p>';

    const res = await authFetch(`${API}/boletins/aluno/${idReferencia}`);
    const boletins = await res.json();

    if (!boletins.length) {
        lista.innerHTML = '<p class="vazio">Nenhuma disciplina encontrada. Aguarde sua alocação em uma turma.</p>';
        return;
    }

    lista.innerHTML = boletins.map(b => `
        <div class="card card-clicavel" onclick="abrirBoletim(${b.id})">
            <div class="card-info">
                <strong>${b.alocacao?.disciplina || '—'}</strong>
                <span>Professor: ${b.alocacao?.professor || '—'}</span>
                <span>Turma: ${b.alocacao?.turma || '—'}</span>
            </div>
            <span class="ver-mais">Ver boletim →</span>
        </div>
    `).join('');
}

async function abrirBoletim(id) {
    const res = await authFetch(`${API}/boletins/${id}`);
    const b = await res.json();

    const nota = b.nota !== null && b.nota !== undefined ? b.nota.toFixed(1) : '—';
    const freq = b.frequencia !== null && b.frequencia !== undefined ? b.frequencia.toFixed(1) + '%' : '—';
    const situacao = b.nota >= 7 ? 'aprovado' : b.nota < 5 ? 'reprovado' : 'recuperacao';
    const labelSit = b.nota >= 7 ? 'Aprovado' : b.nota < 5 ? 'Reprovado' : 'Em Recuperação';

    const detalhe = document.getElementById('detalheBoletim');
    detalhe.style.display = 'block';
    detalhe.innerHTML = `
        <div class="boletim-detalhe">
            <div class="boletim-detalhe-header">
                <h3>${b.alocacao?.disciplina || '—'}</h3>
                <button class="btn-fechar" onclick="fecharBoletim()">✕</button>
            </div>
            <div class="boletim-detalhe-info">
                <div class="info-linha"><span class="info-label">Professor</span><span>${b.alocacao?.professor || '—'}</span></div>
                <div class="info-linha"><span class="info-label">Turma</span><span>${b.alocacao?.turma || '—'}</span></div>
            </div>
            <div class="boletim-detalhe-notas">
                <div class="nota-card">
                    <span class="nota-label">Nota</span>
                    <span class="nota-valor">${nota}</span>
                </div>
                <div class="nota-card">
                    <span class="nota-label">Frequência</span>
                    <span class="nota-valor">${freq}</span>
                </div>
                <div class="nota-card">
                    <span class="nota-label">Situação</span>
                    <span class="badge ${situacao}">${labelSit}</span>
                </div>
            </div>
        </div>
    `;
    detalhe.scrollIntoView({ behavior: 'smooth' });
}

function fecharBoletim() {
    document.getElementById('detalheBoletim').style.display = 'none';
}

// ==================== AGENDAMENTO ====================
async function carregarAgendamentos() {
    const res = await authFetch(`${API}/atendimentos/aluno/${idReferencia}`);
    const atendimentos = await res.json();
    const lista = document.getElementById('listaAgendamentos');

    if (!atendimentos.length) {
        lista.innerHTML = '<p class="vazio">Nenhum agendamento encontrado.</p>';
        return;
    }

    lista.innerHTML = atendimentos.map(a => `
        <div class="card">
            <div class="card-info">
                <strong>${a.assunto || '—'}</strong>
                <span>Data: ${a.data || '—'}</span>
                <span>Funcionário: ${a.funcionario?.nome || 'Aguardando atribuição'}</span>
            </div>
        </div>
    `).join('');
}

async function salvarAgendamento() {
    const assunto = document.getElementById('agendamentoAssunto').value.trim();
    const data = document.getElementById('agendamentoData').value;

    if (!assunto || !data) {
        alert('Preencha o assunto e a data!');
        return;
    }

    const res = await authFetch(`${API}/atendimentos`, {
        method: 'POST',
        body: JSON.stringify({
            assunto,
            data,
            idAluno: idReferencia,
            idFuncionario: null
        })
    });

    if (res.ok) {
        document.getElementById('agendamentoAssunto').value = '';
        document.getElementById('agendamentoData').value = '';
        carregarAgendamentos();
        alert('Agendamento enviado com sucesso!');
    } else {
        alert('Erro ao enviar agendamento.');
    }
}

// Carrega seção inicial
carregarInformacoes();