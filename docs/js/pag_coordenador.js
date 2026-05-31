const API = 'http://localhost:8080';

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
    if (secao === 'alunos') carregarAlunos();
    if (secao === 'professores') carregarProfessores();
    if (secao === 'turmas') carregarTurmas();
    if (secao === 'disciplinas') carregarDisciplinas();
    if (secao === 'alocacoes') carregarAlocacoes();
}

// ==================== MODAL ====================
function abrirModal(id) {
    document.getElementById(id).style.display = 'flex';
    if (id === 'modalAlocacao') preencherSelects();
}

function fecharModal(id) {
    document.getElementById(id).style.display = 'none';
    document.querySelectorAll(`#${id} input:not([type=hidden])`).forEach(i => i.value = '');
    document.querySelectorAll(`#${id} select`).forEach(s => s.value = '');
    document.querySelectorAll(`#${id} input[type=hidden]`).forEach(i => i.value = '');
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) fecharModal(overlay.id);
    });
});

// ==================== TOAST ====================
function toast(msg, tipo = 'sucesso') {
    let t = document.getElementById('toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        t.style.cssText = `
            position: fixed; bottom: 24px; right: 24px;
            padding: 12px 20px; border-radius: 8px;
            font-weight: 500; z-index: 9999;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.backgroundColor = tipo === 'sucesso' ? '#c6f6d5' : '#fed7d7';
    t.style.color = tipo === 'sucesso' ? '#276749' : '#9b2c2c';
    t.style.opacity = '1';
    setTimeout(() => t.style.opacity = '0', 3000);
}

// ==================== MÁSCARAS ====================
function mascaraCpf(input) {
    let v = input.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    input.value = v;
}

function mascaraTel(input) {
    let v = input.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{2})(\d)/, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    input.value = v;
}

document.getElementById('alunoCpf').addEventListener('input', function () { mascaraCpf(this); });
document.getElementById('alunoTel').addEventListener('input', function () { mascaraTel(this); });
document.getElementById('professorCpf').addEventListener('input', function () { mascaraCpf(this); });
document.getElementById('professorTel').addEventListener('input', function () { mascaraTel(this); });

// ==================== ALUNOS ====================
async function carregarAlunos() {
    const res = await fetch(`${API}/alunos`);
    const alunos = await res.json();
    renderAlunos(alunos);
}

async function buscarAlunos() {
    const nome = document.getElementById('buscaAluno').value.trim();
    if (!nome) return carregarAlunos();
    const res = await fetch(`${API}/alunos/nome-parcial?nome=${encodeURIComponent(nome)}`);
    const alunos = await res.json();
    renderAlunos(alunos);
}

function renderAlunos(alunos) {
    const lista = document.getElementById('listaAlunos');
    if (!alunos.length) { lista.innerHTML = '<p class="vazio">Nenhum aluno encontrado.</p>'; return; }
    lista.innerHTML = alunos.map(a => `
        <div class="card">
            <div class="card-info">
                <strong>${a.nome}</strong>
                <span>CPF: ${a.cpf || '—'}</span>
                <span>Tel: ${a.telefone || '—'}</span>
            </div>
            <div class="card-acoes">
                <button class="btn-editar" onclick="editarAluno(${a.id})">✏️</button>
                <button class="btn-deletar" onclick="deletarAluno(${a.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

async function editarAluno(id) {
    const res = await fetch(`${API}/alunos/${id}`);
    const a = await res.json();
    document.getElementById('alunoId').value = a.id;
    document.getElementById('alunoNome').value = a.nome || '';
    document.getElementById('alunoCpf').value = a.cpf || '';
    document.getElementById('alunoNasc').value = a.dataNascimento || '';
    document.getElementById('alunoTel').value = a.telefone || '';
    document.getElementById('alunoEndereco').value = a.endereco || '';
    document.getElementById('modalAlunoTitulo').textContent = 'Editar Aluno';
    abrirModal('modalAluno');
}

async function salvarAluno() {
    const id = document.getElementById('alunoId').value;
    const dados = {
        nome: document.getElementById('alunoNome').value,
        cpf: document.getElementById('alunoCpf').value || null,
        dataNascimento: document.getElementById('alunoNasc').value || null,
        telefone: document.getElementById('alunoTel').value || null,
        endereco: document.getElementById('alunoEndereco').value || null
    };
    if (!dados.nome) { toast('Nome é obrigatório!', 'erro'); return; }

    const res = await fetch(id ? `${API}/alunos/${id}` : `${API}/alunos`, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });

    if (res.ok) {
        toast(id ? 'Aluno atualizado!' : 'Aluno cadastrado!');
        fecharModal('modalAluno');
        carregarAlunos();
    } else {
        toast('Erro ao salvar aluno.', 'erro');
    }
}

async function deletarAluno(id) {
    if (!confirm('Deseja deletar este aluno?')) return;
    const res = await fetch(`${API}/alunos/${id}`, { method: 'DELETE' });
    if (res.ok) { toast('Aluno deletado!'); carregarAlunos(); }
    else toast('Erro ao deletar aluno.', 'erro');
}

// ==================== PROFESSORES ====================
async function carregarProfessores() {
    const res = await fetch(`${API}/funcionarios/cargo?cargo=Professor`);
    const profs = await res.json();
    renderProfessores(profs);
}

async function buscarProfessores() {
    const nome = document.getElementById('buscaProfessor').value.trim();
    if (!nome) return carregarProfessores();
    const res = await fetch(`${API}/funcionarios/nome?nome=${encodeURIComponent(nome)}`);
    const profs = await res.json();
    renderProfessores(profs);
}

function renderProfessores(profs) {
    const lista = document.getElementById('listaProfessores');
    if (!profs.length) { lista.innerHTML = '<p class="vazio">Nenhum professor encontrado.</p>'; return; }
    lista.innerHTML = profs.map(p => `
        <div class="card">
            <div class="card-info">
                <strong>${p.nome}</strong>
                <span>CPF: ${p.cpf || '—'}</span>
                <span>Formação: ${p.formacao || '—'}</span>
                <span>Tel: ${p.telefone || '—'}</span>
            </div>
            <div class="card-acoes">
                <button class="btn-editar" onclick="editarProfessor(${p.id})">✏️</button>
                <button class="btn-deletar" onclick="deletarProfessor(${p.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

async function editarProfessor(id) {
    const res = await fetch(`${API}/funcionarios/${id}`);
    const p = await res.json();
    document.getElementById('professorId').value = p.id;
    document.getElementById('professorNome').value = p.nome || '';
    document.getElementById('professorCpf').value = p.cpf || '';
    document.getElementById('professorNasc').value = p.dataNascimento || '';
    document.getElementById('professorTel').value = p.telefone || '';
    document.getElementById('professorEndereco').value = p.endereco || '';
    document.getElementById('professorFormacao').value = p.formacao || '';
    document.getElementById('modalProfessorTitulo').textContent = 'Editar Professor';
    abrirModal('modalProfessor');
}

async function salvarProfessor() {
    const id = document.getElementById('professorId').value;
    const dados = {
        nome: document.getElementById('professorNome').value,
        cpf: document.getElementById('professorCpf').value,
        dataNascimento: document.getElementById('professorNasc').value || null,
        telefone: document.getElementById('professorTel').value || null,
        endereco: document.getElementById('professorEndereco').value || null,
        formacao: document.getElementById('professorFormacao').value || null,
        cargo: 'Professor'
    };
    if (!dados.nome || !dados.cpf) { toast('Nome e CPF são obrigatórios!', 'erro'); return; }

    const res = await fetch(id ? `${API}/funcionarios/${id}` : `${API}/funcionarios`, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });

    if (res.ok) {
        toast(id ? 'Professor atualizado!' : 'Professor cadastrado!');
        fecharModal('modalProfessor');
        carregarProfessores();
    } else {
        toast('Erro ao salvar professor.', 'erro');
    }
}

async function deletarProfessor(id) {
    if (!confirm('Deseja deletar este professor?')) return;
    const res = await fetch(`${API}/funcionarios/${id}`, { method: 'DELETE' });
    if (res.ok) { toast('Professor deletado!'); carregarProfessores(); }
    else toast('Erro ao deletar professor.', 'erro');
}

// ==================== TURMAS ====================
async function carregarTurmas() {
    const res = await fetch(`${API}/turmas`);
    const turmas = await res.json();
    renderTurmas(turmas);
}

async function buscarTurmas() {
    const nome = document.getElementById('buscaTurma').value.trim();
    if (!nome) return carregarTurmas();
    const res = await fetch(`${API}/turmas/nome-parcial?nome=${encodeURIComponent(nome)}`);
    const turmas = await res.json();
    renderTurmas(turmas);
}

function renderTurmas(turmas) {
    const lista = document.getElementById('listaTurmas');
    if (!turmas.length) { lista.innerHTML = '<p class="vazio">Nenhuma turma encontrada.</p>'; return; }
    lista.innerHTML = turmas.map(t => `
        <div class="card">
            <div class="card-info">
                <strong>${t.nome}</strong>
                <span>Ano: ${t.anoLetivo}</span>
                <span>Turno: ${t.turno}</span>
            </div>
            <div class="card-acoes">
                <button class="btn-editar" onclick="editarTurma(${t.id})">✏️</button>
                <button class="btn-deletar" onclick="deletarTurma(${t.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

async function editarTurma(id) {
    const res = await fetch(`${API}/turmas/${id}`);
    const t = await res.json();
    document.getElementById('turmaId').value = t.id;
    document.getElementById('turmaNome').value = t.nome || '';
    document.getElementById('turmaAno').value = t.anoLetivo || '';
    document.getElementById('turmaTurno').value = t.turno || '';
    document.getElementById('modalTurmaTitulo').textContent = 'Editar Turma';
    abrirModal('modalTurma');
}

async function salvarTurma() {
    const id = document.getElementById('turmaId').value;
    const dados = {
        nome: document.getElementById('turmaNome').value,
        anoLetivo: parseInt(document.getElementById('turmaAno').value),
        turno: document.getElementById('turmaTurno').value
    };
    if (!dados.nome || !dados.anoLetivo || !dados.turno) { toast('Preencha todos os campos!', 'erro'); return; }

    const res = await fetch(id ? `${API}/turmas/${id}` : `${API}/turmas`, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });

    if (res.ok) {
        toast(id ? 'Turma atualizada!' : 'Turma cadastrada!');
        fecharModal('modalTurma');
        carregarTurmas();
    } else {
        toast('Erro ao salvar turma.', 'erro');
    }
}

async function deletarTurma(id) {
    if (!confirm('Deseja deletar esta turma?')) return;
    const res = await fetch(`${API}/turmas/${id}`, { method: 'DELETE' });
    if (res.ok) { toast('Turma deletada!'); carregarTurmas(); }
    else toast('Erro ao deletar turma.', 'erro');
}

// ==================== DISCIPLINAS ====================
async function carregarDisciplinas() {
    const res = await fetch(`${API}/disciplinas`);
    const disciplinas = await res.json();
    renderDisciplinas(disciplinas);
}

async function buscarDisciplinas() {
    const nome = document.getElementById('buscaDisciplina').value.trim();
    if (!nome) return carregarDisciplinas();
    const res = await fetch(`${API}/disciplinas/buscar?nome=${encodeURIComponent(nome)}`);
    const disciplinas = await res.json();
    renderDisciplinas(disciplinas);
}

function renderDisciplinas(disciplinas) {
    const lista = document.getElementById('listaDisciplinas');
    if (!disciplinas.length) { lista.innerHTML = '<p class="vazio">Nenhuma disciplina encontrada.</p>'; return; }
    lista.innerHTML = disciplinas.map(d => `
        <div class="card">
            <div class="card-info">
                <strong>${d.nome}</strong>
            </div>
            <div class="card-acoes">
                <button class="btn-editar" onclick="editarDisciplina(${d.id})">✏️</button>
                <button class="btn-deletar" onclick="deletarDisciplina(${d.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

async function editarDisciplina(id) {
    const res = await fetch(`${API}/disciplinas/${id}`);
    const d = await res.json();
    document.getElementById('disciplinaId').value = d.id;
    document.getElementById('disciplinaNome').value = d.nome || '';
    document.getElementById('modalDisciplinaTitulo').textContent = 'Editar Disciplina';
    abrirModal('modalDisciplina');
}

async function salvarDisciplina() {
    const id = document.getElementById('disciplinaId').value;
    const dados = { nome: document.getElementById('disciplinaNome').value };
    if (!dados.nome) { toast('Nome é obrigatório!', 'erro'); return; }

    const res = await fetch(id ? `${API}/disciplinas/${id}` : `${API}/disciplinas`, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });

    if (res.ok) {
        toast(id ? 'Disciplina atualizada!' : 'Disciplina cadastrada!');
        fecharModal('modalDisciplina');
        carregarDisciplinas();
    } else {
        toast('Erro ao salvar disciplina.', 'erro');
    }
}

async function deletarDisciplina(id) {
    if (!confirm('Deseja deletar esta disciplina?')) return;
    const res = await fetch(`${API}/disciplinas/${id}`, { method: 'DELETE' });
    if (res.ok) { toast('Disciplina deletada!'); carregarDisciplinas(); }
    else toast('Erro ao deletar disciplina.', 'erro');
}

// ==================== ALOCAÇÕES ====================
async function carregarAlocacoes() {
    const res = await fetch(`${API}/alocacoes`);
    const alocacoes = await res.json();
    renderAlocacoes(alocacoes);
}

function renderAlocacoes(alocacoes) {
    const lista = document.getElementById('listaAlocacoes');
    if (!alocacoes.length) { lista.innerHTML = '<p class="vazio">Nenhuma alocação encontrada.</p>'; return; }
    lista.innerHTML = alocacoes.map(a => `
        <div class="card">
            <div class="card-info">
                <strong>${a.nomeDisciplina || a.disciplina?.nome || '—'}</strong>
                <span>Professor: ${a.nomeProfessor || a.professor?.nome || '—'}</span>
                <span>Turma: ${a.nomeTurma || a.turma?.nome || '—'}</span>
            </div>
            <div class="card-acoes">
                <button class="btn-editar" onclick="editarAlocacao(${a.id})">✏️</button>
                <button class="btn-deletar" onclick="deletarAlocacao(${a.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

async function preencherSelects() {
    const [resProfessores, resTurmas, resDisciplinas] = await Promise.all([
        fetch(`${API}/funcionarios/cargo?cargo=Professor`),
        fetch(`${API}/turmas`),
        fetch(`${API}/disciplinas`)
    ]);

    const professores = await resProfessores.json();
    const turmas = await resTurmas.json();
    const disciplinas = await resDisciplinas.json();

    document.getElementById('alocacaoProfessor').innerHTML =
        '<option value="">Selecione</option>' +
        professores.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');

    document.getElementById('alocacaoTurma').innerHTML =
        '<option value="">Selecione</option>' +
        turmas.map(t => `<option value="${t.id}">${t.nome} - ${t.turno}</option>`).join('');

    document.getElementById('alocacaoDisciplina').innerHTML =
        '<option value="">Selecione</option>' +
        disciplinas.map(d => `<option value="${d.id}">${d.nome}</option>`).join('');
}

async function editarAlocacao(id) {
    const res = await fetch(`${API}/alocacoes/${id}`);
    const a = await res.json();
    await preencherSelects();
    document.getElementById('alocacaoId').value = a.id;
    document.getElementById('alocacaoProfessor').value = a.idProfessor || a.professor?.id || '';
    document.getElementById('alocacaoTurma').value = a.idTurma || a.turma?.id || '';
    document.getElementById('alocacaoDisciplina').value = a.idDisciplina || a.disciplina?.id || '';
    document.getElementById('modalAlocacaoTitulo').textContent = 'Editar Alocação';
    document.getElementById('modalAlocacao').style.display = 'flex';
}

async function salvarAlocacao() {
    const id = document.getElementById('alocacaoId').value;
    const dados = {
        idProfessor: parseInt(document.getElementById('alocacaoProfessor').value),
        idTurma: parseInt(document.getElementById('alocacaoTurma').value),
        idDisciplina: parseInt(document.getElementById('alocacaoDisciplina').value)
    };
    if (!dados.idProfessor || !dados.idTurma || !dados.idDisciplina) {
        toast('Preencha todos os campos!', 'erro'); return;
    }

    const res = await fetch(id ? `${API}/alocacoes/${id}` : `${API}/alocacoes`, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });

    if (res.ok) {
        toast(id ? 'Alocação atualizada!' : 'Alocação cadastrada!');
        fecharModal('modalAlocacao');
        carregarAlocacoes();
    } else {
        toast('Erro ao salvar alocação.', 'erro');
    }
}

async function deletarAlocacao(id) {
    if (!confirm('Deseja deletar esta alocação?')) return;
    const res = await fetch(`${API}/alocacoes/${id}`, { method: 'DELETE' });
    if (res.ok) { toast('Alocação deletada!'); carregarAlocacoes(); }
    else toast('Erro ao deletar alocação.', 'erro');
}

// Carrega seção inicial
carregarAlunos();