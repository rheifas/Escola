const API = 'http://localhost:8080';

const token = localStorage.getItem('token');
const idReferencia = parseInt(localStorage.getItem('idReferencia'));
const nome = localStorage.getItem('nome');

const perfil = localStorage.getItem('perfil');
if (!token || perfil !== 'PROFESSOR') window.location.href = 'login.html';

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
    if (secao === 'turmas') carregarTurmas();
}

// ==================== INFORMAÇÕES ====================
async function carregarInformacoes() {
    const res = await authFetch(`${API}/professores/${idReferencia}`);
    const p = await res.json();

    document.getElementById('dadosProfessor').innerHTML = `
        <div class="info-linha"><span class="info-label">Nome</span><span>${p.nome || '—'}</span></div>
        <div class="info-linha"><span class="info-label">CPF</span><span>${p.cpf || '—'}</span></div>
        <div class="info-linha"><span class="info-label">Telefone</span><span>${p.telefone || '—'}</span></div>
        <div class="info-linha"><span class="info-label">Endereço</span><span>${p.endereco || '—'}</span></div>
        <div class="info-linha"><span class="info-label">Nascimento</span><span>${p.dataNascimento || '—'}</span></div>
        <div class="info-linha"><span class="info-label">Formação</span><span>${p.formacao || '—'}</span></div>
        <div class="info-linha"><span class="info-label">Cargo</span><span>${p.cargo || '—'}</span></div>
    `;
}

// ==================== TURMAS ====================
async function carregarTurmas() {
    const lista = document.getElementById('listaTurmas');
    const painelBoletins = document.getElementById('painelBoletins');
    painelBoletins.style.display = 'none';
    lista.innerHTML = '<p class="vazio">Carregando...</p>';

    const res = await authFetch(`${API}/alocacoes/professor/${idReferencia}`);
    const alocacoes = await res.json();

    if (!alocacoes.length) {
        lista.innerHTML = '<p class="vazio">Nenhuma turma alocada no momento.</p>';
        return;
    }

    lista.innerHTML = alocacoes.map(a => `
        <div class="card card-clicavel" onclick="abrirBoletins(${a.id}, '${a.disciplina?.nome || '—'}', '${a.turma?.nome || '—'}')">
            <div class="card-info">
                <strong>${a.disciplina?.nome || '—'}</strong>
                <span>Turma: ${a.turma?.nome || '—'}</span>
                <span>Ano Letivo: ${a.turma?.anoLetivo || '—'} — ${a.turma?.turno || '—'}</span>
            </div>
            <span class="ver-mais">Ver alunos →</span>
        </div>
    `).join('');
}

async function abrirBoletins(alocacaoId, disciplina, turma) {
    const painel = document.getElementById('painelBoletins');
    painel.style.display = 'block';
    painel.innerHTML = `
        <div class="painel-header">
            <div>
                <h3>${disciplina}</h3>
                <span class="painel-subtitulo">Turma: ${turma}</span>
            </div>
            <button class="btn-fechar" onclick="fecharBoletins()">✕</button>
        </div>
        <p class="vazio">Carregando alunos...</p>
    `;
    painel.scrollIntoView({ behavior: 'smooth' });

    const res = await authFetch(`${API}/boletins/alocacao/${alocacaoId}`);
    const boletins = await res.json();

    if (!boletins.length) {
        painel.querySelector('p.vazio').textContent = 'Nenhum aluno encontrado nesta alocação.';
        return;
    }

    const linhas = boletins.map(b => {
        const nota = b.nota !== null && b.nota !== undefined ? b.nota.toFixed(1) : '—';
        const freq = b.frequencia !== null && b.frequencia !== undefined ? b.frequencia.toFixed(1) + '%' : '—';
        const situacao = b.nota >= 7 ? 'aprovado' : b.nota < 5 ? 'reprovado' : 'recuperacao';
        const labelSit = b.nota >= 7 ? 'Aprovado' : b.nota < 5 ? 'Reprovado' : 'Em Recuperação';
        return `
            <tr>
                <td>${b.aluno?.nome || '—'}</td>
                <td>${b.aluno?.cpf || '—'}</td>
                <td>
                    <input class="input-nota" type="number" min="0" max="10" step="0.1"
                        value="${b.nota !== null && b.nota !== undefined ? b.nota : ''}"
                        placeholder="—"
                        onchange="salvarNota(${b.id}, this.value, ${b.frequencia})">
                </td>
                <td>
                    <input class="input-nota" type="number" min="0" max="100" step="0.1"
                        value="${b.frequencia !== null && b.frequencia !== undefined ? b.frequencia : ''}"
                        placeholder="—"
                        onchange="salvarNota(${b.id}, ${b.nota}, this.value)">
                </td>
                <td><span class="badge ${b.nota !== null ? situacao : ''}">${b.nota !== null ? labelSit : '—'}</span></td>
            </tr>
        `;
    }).join('');

    painel.innerHTML = `
        <div class="painel-header">
            <div>
                <h3>${disciplina}</h3>
                <span class="painel-subtitulo">Turma: ${turma}</span>
            </div>
            <button class="btn-fechar" onclick="fecharBoletins()">✕</button>
        </div>
        <div class="tabela-wrapper">
            <table class="tabela-boletins">
                <thead>
                    <tr>
                        <th>Aluno</th>
                        <th>CPF</th>
                        <th>Nota</th>
                        <th>Frequência (%)</th>
                        <th>Situação</th>
                    </tr>
                </thead>
                <tbody>${linhas}</tbody>
            </table>
        </div>
    `;
}

async function salvarNota(boletimId, nota, frequencia) {
    const notaNum = nota !== null && nota !== '' ? parseFloat(nota) : null;
    const freqNum = frequencia !== null && frequencia !== '' ? parseFloat(frequencia) : null;

    const res = await authFetch(`${API}/boletins/${boletimId}`, {
        method: 'PUT',
        body: JSON.stringify({ nota: notaNum, frequencia: freqNum })
    });

    if (!res.ok) alert('Erro ao salvar. Tente novamente.');
}

function fecharBoletins() {
    document.getElementById('painelBoletins').style.display = 'none';
}

// Carrega seção inicial
carregarInformacoes();