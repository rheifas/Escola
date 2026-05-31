const API = 'http://localhost:8080';
let professorAtual = null;

const perfil = localStorage.getItem('perfil');
if (!token || perfil !== 'PROFESSOR') window.location.href = 'login.html';

// ==================== SIDEBAR ====================
const btnToggle = document.getElementById('toggleBtn');
const sidebar = document.getElementById('sidebar');
const navItems = document.querySelectorAll('.nav-item');
const paginas = document.querySelectorAll('.pagina');

btnToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');
    btnToggle.setAttribute('aria-label', isCollapsed ? 'Expandir menu' : 'Minimizar menu');
});

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        if (!professorAtual) return;
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const target = item.getAttribute('data-target');
        paginas.forEach(p => p.classList.remove('active'));
        document.getElementById(target).classList.add('active');
        carregarSecao(target);
    });
});

function carregarSecao(secao) {
    if (secao === 'informacoes') renderInformacoes();
    if (secao === 'disciplinas') carregarDisciplinas();
    if (secao === 'turmas') carregarTurmas();
}

// ==================== BUSCA DO PROFESSOR ====================
async function buscarProfessor() {
    const nome = document.getElementById('inputBuscaProfessor').value.trim();
    if (!nome) return;

    const res = await fetch(`${API}/funcionarios/nome?nome=${encodeURIComponent(nome)}`);
    const lista = await res.json();

    const professores = lista.filter(f => f.cargo === 'Professor');
    const resultado = document.getElementById('resultadoBusca');

    if (!professores.length) {
        resultado.innerHTML = '<p class="vazio">Nenhum professor encontrado com esse nome.</p>';
        return;
    }

    resultado.innerHTML = `
        <p class="resultado-label">Selecione seu perfil:</p>
        ${professores.map(p => `
            <div class="resultado-item" onclick="selecionarProfessor(${p.id})">
                <strong>${p.nome}</strong>
                <span>CPF: ${p.cpf || '—'} | Formação: ${p.formacao || '—'}</span>
            </div>
        `).join('')}
    `;
}

async function selecionarProfessor(id) {
    const res = await fetch(`${API}/funcionarios/${id}`);
    professorAtual = await res.json();

    // Esconde busca e mostra conteúdo
    document.getElementById('buscaProfessorBox').style.display = 'none';
    document.getElementById('informacoes').classList.add('active');

    renderInformacoes();
}

// ==================== INFORMAÇÕES ====================
function renderInformacoes() {
    const p = professorAtual;
    document.getElementById('dadosProfessor').innerHTML = `
        <div class="info-linha"><span class="info-label">Nome</span><span>${p.nome || '—'}</span></div>
        <div class="info-linha"><span class="info-label">CPF</span><span>${p.cpf || '—'}</span></div>
        <div class="info-linha"><span class="info-label">Telefone</span><span>${p.telefone || '—'}</span></div>
        <div class="info-linha"><span class="info-label">Endereço</span><span>${p.endereco || '—'}</span></div>
        <div class="info-linha"><span class="info-label">Formação</span><span>${p.formacao || '—'}</span></div>
        <div class="info-linha"><span class="info-label">Cargo</span><span>${p.cargo || '—'}</span></div>
    `;
}

// ==================== DISCIPLINAS ====================
async function carregarDisciplinas() {
    const res = await fetch(`${API}/alocacoes/professor/${professorAtual.id}`);
    const alocacoes = await res.json();
    const lista = document.getElementById('listaDisciplinasProfessor');

    if (!alocacoes.length) {
        lista.innerHTML = '<p class="vazio">Nenhuma disciplina atribuída.</p>';
        return;
    }

    // Agrupa disciplinas únicas
    const disciplinas = [...new Map(alocacoes.map(a => [
        a.idDisciplina || a.disciplina?.id,
        { id: a.idDisciplina || a.disciplina?.id, nome: a.nomeDisciplina || a.disciplina?.nome }
    ])).values()];

    lista.innerHTML = disciplinas.map(d => `
        <div class="card">
            <div class="card-info">
                <strong>${d.nome || '—'}</strong>
            </div>
        </div>
    `).join('');
}

// ==================== TURMAS ====================
async function carregarTurmas() {
    const res = await fetch(`${API}/alocacoes/professor/${professorAtual.id}`);
    const alocacoes = await res.json();
    const lista = document.getElementById('listaTurmasProfessor');

    if (!alocacoes.length) {
        lista.innerHTML = '<p class="vazio">Nenhuma turma atribuída.</p>';
        return;
    }

    // Agrupa turmas únicas
    const turmas = [...new Map(alocacoes.map(a => [
        a.idTurma || a.turma?.id,
        {
            id: a.idTurma || a.turma?.id,
            nome: a.nomeTurma || a.turma?.nome,
            turno: a.turma?.turno || '—',
            disciplina: a.nomeDisciplina || a.disciplina?.nome
        }
    ])).values()];

    lista.innerHTML = turmas.map(t => `
        <div class="card">
            <div class="card-info">
                <strong>${t.nome || '—'}</strong>
                <span>Turno: ${t.turno}</span>
                <span>Disciplina: ${t.disciplina || '—'}</span>
            </div>
        </div>
    `).join('');
}

// Enter na busca
document.getElementById('inputBuscaProfessor').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') buscarProfessor();
});