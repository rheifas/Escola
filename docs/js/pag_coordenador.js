const API = 'http://localhost:8080';
const token = localStorage.getItem('token');
const nome = localStorage.getItem('nome');

const perfil = localStorage.getItem('perfil');
if (!token || perfil !== 'COORDENADOR') window.location.href = 'login.html';

if (!token) window.location.href = 'login.html';
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

let debounceTimer;
function debounce(fn, delay = 300) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fn, delay);
}

// ==================== SIDEBAR ====================
const btn = document.getElementById('toggleBtn');
const sidebar = document.getElementById('sidebar');
const navItems = document.querySelectorAll('.nav-item');
const paginas = document.querySelectorAll('.pagina');

btn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    btn.setAttribute('aria-label', sidebar.classList.contains('collapsed') ? 'Expandir menu' : 'Minimizar menu');
});

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const target = item.getAttribute('data-target');
        paginas.forEach(p => p.classList.remove('active'));
        document.getElementById(target).classList.add('active');
        fecharPainelAluno();
        fecharPainelTurma();
        carregarSecao(target);
    });
});

function carregarSecao(secao) {
    if (secao === 'alunos') carregarAlunos();
    if (secao === 'professores') carregarProfessores();
    if (secao === 'turmas') carregarTurmas();
    if (secao === 'disciplinas') carregarDisciplinas();
    if (secao === 'alocacoes') carregarAlocacoes();
    if (secao === 'boletins') carregarBoletins();
    if (secao === 'atendimentos') carregarAtendimentos();
}

// ==================== MODAL ====================
function abrirModal(id) {
    document.getElementById(id).style.display = 'flex';
    if (id === 'modalAlocacao') preencherSelects();
    if (id === 'modalBoletim') preencherSelectBoletim();
}

function fecharModal(id) {
    document.getElementById(id).style.display = 'none';
    document.querySelectorAll(`#${id} input:not([type=hidden])`).forEach(i => i.value = '');
    document.querySelectorAll(`#${id} select`).forEach(s => s.value = '');
    document.querySelectorAll(`#${id} input[type=hidden]`).forEach(i => i.value = '');
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) fecharModal(overlay.id); });
});

// ==================== TOAST ====================
function toast(msg, tipo = 'sucesso') {
    let t = document.getElementById('toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        t.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:8px;font-weight:500;z-index:9999;transition:opacity 0.3s;';
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
    v = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    input.value = v;
}
function mascaraTel(input) {
    let v = input.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
    input.value = v;
}
function limparCpf(cpf) {
    return cpf.replace(/\D/g, ''); // remove tudo que não for dígito
}
function formatarCpf(cpf) {
    if (!cpf) return '—';
    const d = cpf.replace(/\D/g, '');
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
function limparNumero(tel) {
    return tel.replace(/\D/g, '');
}
function formatarTelefone(tel) {
    if (!tel) return '—';
    const d = tel.replace(/\D/g, '');
    if (d.length === 11)
        return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (d.length === 10)
        return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return tel;
}
document.getElementById('alunoCpf').addEventListener('input', function () { mascaraCpf(this); });
document.getElementById('alunoTel').addEventListener('input', function () { mascaraTel(this); });
document.getElementById('professorCpf').addEventListener('input', function () { mascaraCpf(this); });
document.getElementById('professorTel').addEventListener('input', function () { mascaraTel(this); });

// ==================== PAINEL ALUNO ====================
async function abrirPainelAluno(id) {
    const [resAluno, resBoletins] = await Promise.all([
        authFetch(`${API}/alunos/${id}`),
        authFetch(`${API}/boletins/aluno/${id}`)
    ]);
    const aluno = await resAluno.json();
    const boletins = await resBoletins.json();

    document.getElementById('painelAluno').style.display = 'flex';
    document.getElementById('painelAlunoNome').textContent = aluno.nome;

    // Botão de matrícula
    document.getElementById('btnMatricularAluno').onclick = () => abrirModalMatricula(aluno);

    // Botão de boletim
    document.getElementById('btnNovoBoletimAluno').onclick = () => abrirModalBoletimParaAluno(aluno);

    // Dados pessoais
    document.getElementById('painelAlunoInfo').innerHTML = `
        <div class="info-linha"><span class="info-label">CPF: </span><span>${formatarCpf(aluno.cpf) || '—'}</span></div>
        <div class="info-linha"><span class="info-label">Telefone: </span><span>${formatarTelefone(aluno.telefone) || '—'}</span></div>
        <div class="info-linha"><span class="info-label">Endereço: </span><span>${aluno.endereco || '—'}</span></div>
        <div class="info-linha"><span class="info-label">Data de Nascimento: </span><span>${aluno.dataNascimento || '—'}</span></div>
    `;

    // Turma
    document.getElementById('painelAlunoTurma').innerHTML = aluno.turma
        ? `<div class="info-linha"><span class="info-label">Turma: </span><span><strong>${aluno.turma.nome}</strong></span></div>
           <div class="info-linha"><span class="info-label">Ano: </span><span>${aluno.turma.anoLetivo || '—'}</span></div>
           <div class="info-linha"><span class="info-label">Turno: </span><span>${aluno.turma.turno || '—'}</span></div>`
        : `<p class="vazio" style="margin:0;">Aluno não matriculado em nenhuma turma.</p>`;

    // Boletim
    document.getElementById('painelAlunoBoletins').innerHTML = !boletins.length
        ? '<p class="vazio">Nenhum boletim cadastrado.</p>'
        : boletins.map(b => {
            const nota = b.nota != null ? b.nota.toFixed(1) : '—';
            const freq = b.frequencia != null ? b.frequencia.toFixed(1) + '%' : '—';
            const sit = b.nota >= 7 ? 'aprovado' : b.nota < 5 ? 'reprovado' : 'recuperacao';
            const label = b.nota >= 7 ? 'Aprovado' : b.nota < 5 ? 'Reprovado' : 'Recuperação';
            return `
                <div class="card">
                    <div class="card-info">
                        <strong>${b.alocacao?.disciplina || '—'}</strong>
                        <span>Professor: ${b.alocacao?.professor || '—'}</span>
                        <span>Turma: ${b.alocacao?.turma || '—'}</span>
                    </div>
                    <div class="card-boletim">
                        <div class="boletim-item"><span class="boletim-label">Nota</span><span class="boletim-valor">${nota}</span></div>
                        <div class="boletim-item"><span class="boletim-label">Freq.</span><span class="boletim-valor">${freq}</span></div>
                        <span class="badge ${sit}">${label}</span>
                    </div>
                </div>`;
        }).join('');
}

function fecharPainelAluno() {
    document.getElementById('painelAluno').style.display = 'none';
}

// ==================== MATRÍCULA ====================

// Abre modal de matrícula a partir do painel do aluno
async function abrirModalMatricula(aluno) {
    const res = await authFetch(`${API}/turmas`);
    const turmas = await res.json();
    document.getElementById('matriculaAlunoId').value = aluno.id;
    const sel = document.getElementById('matriculaTurmaSelect');
    sel.innerHTML = '<option value="">Sem turma (cancelar matrícula)</option>' +
        turmas.map(t => `<option value="${t.id}" ${aluno.turma?.id === t.id ? 'selected' : ''}>${t.nome} — ${t.turno}</option>`).join('');
    document.getElementById('modalMatricula').style.display = 'flex';
}

// Abre seleção de aluno para matricular a partir do painel da turma
async function abrirModalMatricularNaTurma() {
    if (!turmaSelecionada) return;
    const res = await authFetch(`${API}/alunos`);
    const todos = await res.json();
    const disponiveis = todos.filter(a => !a.turma || a.turma.id !== turmaSelecionada.id);
    if (!disponiveis.length) { toast('Todos os alunos já estão nesta turma.', 'erro'); return; }
    const opcoes = disponiveis.map(a => `${a.id}: ${a.nome}${a.turma ? ' (turma: ' + a.turma.nome + ')' : ''}`).join('');
    const input = prompt(`ID do aluno para matricular em "${turmaSelecionada.nome}": ${opcoes}`);
    if (!input) return;
    const aluno = disponiveis.find(a => a.id === parseInt(input));
    if (!aluno) { toast('ID inválido.', 'erro'); return; }
    await executarMatricula(aluno, turmaSelecionada.id);
    await abrirPainelTurma(turmaSelecionada.id, turmaSelecionada.nome);
}

// Salva matrícula vinda do modal do aluno
async function salvarMatricula() {
    const idAluno = parseInt(document.getElementById('matriculaAlunoId').value);
    const idTurma = document.getElementById('matriculaTurmaSelect').value;
    const res = await authFetch(`${API}/alunos/${idAluno}`);
    const aluno = await res.json();
    await executarMatricula(aluno, idTurma ? parseInt(idTurma) : null);
    fecharModal('modalMatricula');
    abrirPainelAluno(idAluno);
}

// Executa o PUT com idTurma atualizado
async function executarMatricula(aluno, idTurma) {
    const dados = {
        nome: aluno.nome,
        cpf: aluno.cpf,
        dataNascimento: aluno.dataNascimento,
        telefone: aluno.telefone,
        endereco: aluno.endereco,
        idTurma: idTurma
    };
    const res = await authFetch(`${API}/alunos/${aluno.id}`, { method: 'PUT', body: JSON.stringify(dados) });
    if (res.ok) {
        toast(idTurma ? 'Aluno matriculado!' : 'Matrícula cancelada.');
        carregarAlunos();
    } else {
        toast('Erro ao atualizar matrícula.', 'erro');
    }
}

// Abre modal de boletim para um aluno, filtrando alocações pela turma dele
async function abrirModalBoletimParaAluno(aluno) {
    let alocacoes;
    if (aluno.turma) {
        const res = await authFetch(`${API}/alocacoes/turma/${aluno.turma.id}`);
        alocacoes = await res.json();
    } else {
        const res = await authFetch(`${API}/alocacoes`);
        alocacoes = await res.json();
    }
    document.getElementById('boletimAluno').innerHTML = `<option value="${aluno.id}">${aluno.nome}</option>`;
    document.getElementById('boletimAlocacao').innerHTML =
        '<option value="">Selecione a disciplina</option>' +
        alocacoes.map(a => `<option value="${a.id}">${a.disciplina?.nome || '—'} — Prof. ${a.professor?.nome || '—'}</option>`).join('');
    document.getElementById('boletimId').value = '';
    document.getElementById('boletimNota').value = '';
    document.getElementById('boletimFrequencia').value = '';
    document.getElementById('boletimAluno').disabled = true;
    document.getElementById('modalBoletimTitulo').textContent = `Novo Boletim — ${aluno.nome}`;
    document.getElementById('modalBoletim').style.display = 'flex';
}

// ==================== ALUNOS ====================
async function carregarAlunos() {
    const res = await authFetch(`${API}/alunos`);
    renderAlunos(await res.json());
}
async function buscarAlunos() {
    const nome = document.getElementById('buscaAluno').value.trim();
    if (!nome) return carregarAlunos();
    const res = await authFetch(`${API}/alunos/nome-parcial?nome=${encodeURIComponent(nome)}`);
    renderAlunos(await res.json());
}
function renderAlunos(alunos) {
    fecharPainelAluno();
    const lista = document.getElementById('listaAlunos');
    if (!alunos.length) { lista.innerHTML = '<p class="vazio">Nenhum aluno encontrado.</p>'; return; }
    lista.innerHTML = alunos.map(a => `
        <div class="card card-clicavel" onclick="abrirPainelAluno(${a.id})">
            <div class="card-info">
                <strong>${a.nome}</strong>
                <span>CPF: ${formatarCpf(a.cpf) || '—'}</span>
                <span>Tel: ${formatarTelefone(a.telefone) || '—'}</span>
            </div>
            <div class="card-acoes" onclick="event.stopPropagation()">
                <button class="btn-editar" onclick="editarAluno(${a.id})">✏️</button>
                <button class="btn-deletar" onclick="deletarAluno(${a.id})">🗑️</button>
            </div>
        </div>`).join('');
}
async function editarAluno(id) {
    const res = await authFetch(`${API}/alunos/${id}`);
    const a = await res.json();
    document.getElementById('alunoId').value = a.id;
    document.getElementById('alunoNome').value = a.nome || '';
    document.getElementById('alunoCpf').value = formatarCpf(a.cpf) || '';
    document.getElementById('alunoNasc').value = a.dataNascimento || '';
    document.getElementById('alunoTel').value = formatarTelefone(a.telefone) || '';
    document.getElementById('alunoEndereco').value = a.endereco || '';
    document.getElementById('modalAlunoTitulo').textContent = 'Editar Aluno';
    abrirModal('modalAluno');
}
async function salvarAluno() {
    const id = document.getElementById('alunoId').value;
    const dados = {
        nome: document.getElementById('alunoNome').value,
        cpf: limparCpf(document.getElementById('alunoCpf').value) || null,
        dataNascimento: document.getElementById('alunoNasc').value || null,
        telefone: limparNumero(document.getElementById('alunoTel').value) || null,
        endereco: document.getElementById('alunoEndereco').value || null
    };
    if (!dados.nome) { toast('Nome é obrigatório!', 'erro'); return; }
    const res = await authFetch(id ? `${API}/alunos/${id}` : `${API}/alunos`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(dados) });
    if (res.ok) { toast(id ? 'Aluno atualizado!' : 'Aluno cadastrado!'); fecharModal('modalAluno'); carregarAlunos(); }
    else toast('Erro ao salvar aluno.', 'erro');
}
async function deletarAluno(id) {
    if (!confirm('Deseja deletar este aluno?')) return;
    const res = await authFetch(`${API}/alunos/${id}`, { method: 'DELETE' });
    if (res.ok) { toast('Aluno deletado!'); carregarAlunos(); }
    else toast('Erro ao deletar aluno.', 'erro');
}

// ==================== PROFESSORES ====================
async function carregarProfessores() {
    const res = await authFetch(`${API}/funcionarios/cargo?cargo=Professor`);
    renderProfessores(await res.json());
}
async function buscarProfessores() {
    const nome = document.getElementById('buscaProfessor').value.trim();
    if (!nome) return carregarProfessores();
    const res = await authFetch(`${API}/funcionarios/nome?nome=${encodeURIComponent(nome)}`);
    renderProfessores(await res.json());
}
function renderProfessores(profs) {
    const lista = document.getElementById('listaProfessores');
    if (!profs.length) { lista.innerHTML = '<p class="vazio">Nenhum professor encontrado.</p>'; return; }
    lista.innerHTML = profs.map(p => `
        <div class="card">
            <div class="card-info">
                <strong>${p.nome}</strong>
                <span>CPF: ${formatarCpf(p.cpf) || '—'}</span>
                <span>Formação: ${p.formacao || '—'}</span>
            </div>
            <div class="card-acoes">
                <button class="btn-editar" onclick="editarProfessor(${p.id})">✏️</button>
                <button class="btn-deletar" onclick="deletarProfessor(${p.id})">🗑️</button>
            </div>
        </div>`).join('');
}
async function editarProfessor(id) {
    const res = await authFetch(`${API}/funcionarios/${id}`);
    const p = await res.json();
    document.getElementById('professorId').value = p.id;
    document.getElementById('professorNome').value = p.nome || '';
    document.getElementById('professorCpf').value = formatarCpf(p.cpf) || '';
    document.getElementById('professorNasc').value = p.dataNascimento || '';
    document.getElementById('professorTel').value = formatarTelefone(p.telefone) || '';
    document.getElementById('professorEndereco').value = p.endereco || '';
    document.getElementById('professorFormacao').value = p.formacao || '';
    document.getElementById('modalProfessorTitulo').textContent = 'Editar Professor';
    abrirModal('modalProfessor');
}
async function salvarProfessor() {
    const id = document.getElementById('professorId').value;
    const dados = {
        nome: document.getElementById('professorNome').value,
        cpf: limparCpf(document.getElementById('professorCpf').value),
        dataNascimento: document.getElementById('professorNasc').value || null,
        telefone: limparNumero(document.getElementById('professorTel').value) || null,
        endereco: document.getElementById('professorEndereco').value || null,
        formacao: document.getElementById('professorFormacao').value || null,
        cargo: 'Professor'
    };
    if (!dados.nome || !dados.cpf) { toast('Nome e CPF são obrigatórios!', 'erro'); return; }
    const res = await authFetch(id ? `${API}/funcionarios/${id}` : `${API}/funcionarios`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(dados) });
    if (res.ok) { toast(id ? 'Professor atualizado!' : 'Professor cadastrado!'); fecharModal('modalProfessor'); carregarProfessores(); }
    else toast('Erro ao salvar professor.', 'erro');
}
async function deletarProfessor(id) {
    if (!confirm('Deseja deletar este professor?')) return;
    const res = await authFetch(`${API}/funcionarios/${id}`, { method: 'DELETE' });
    if (res.ok) { toast('Professor deletado!'); carregarProfessores(); }
    else toast('Erro ao deletar professor.', 'erro');
}

// ==================== TURMAS ====================
let turmaSelecionada = null; // guarda { id, nome } da turma aberta no painel

async function carregarTurmas() {
    const res = await authFetch(`${API}/turmas`);
    renderTurmas(await res.json());
}
async function buscarTurmas() {
    const nome = document.getElementById('buscaTurma').value.trim();
    if (!nome) return carregarTurmas();
    const res = await authFetch(`${API}/turmas/nome-parcial?nome=${encodeURIComponent(nome)}`);
    renderTurmas(await res.json());
}
function renderTurmas(turmas) {
    fecharPainelTurma();
    const lista = document.getElementById('listaTurmas');
    if (!turmas.length) { lista.innerHTML = '<p class="vazio">Nenhuma turma encontrada.</p>'; return; }
    lista.innerHTML = turmas.map(t => `
        <div class="card card-clicavel" onclick="abrirPainelTurma(${t.id}, '${t.nome}')">
            <div class="card-info">
                <strong>${t.nome}</strong>
                <span>Ano: ${t.anoLetivo}</span>
                <span>Turno: ${t.turno}</span>
            </div>
            <div class="card-acoes" onclick="event.stopPropagation()">
                <button class="btn-editar" onclick="editarTurma(${t.id})">✏️</button>
                <button class="btn-deletar" onclick="deletarTurma(${t.id})">🗑️</button>
            </div>
        </div>`).join('');
}

async function abrirPainelTurma(id, nome) {
    turmaSelecionada = { id, nome };
    document.getElementById('painelTurmaNome').textContent = nome;
    document.getElementById('painelTurma').style.display = 'block';
    document.getElementById('painelTurmaAlunos').innerHTML = '<p class="vazio">Carregando...</p>';
    document.getElementById('painelTurmaAlocacoes').innerHTML = '<p class="vazio">Carregando...</p>';

    // Busca alunos e alocações da turma em paralelo
    const [resAlunos, resAlocacoes] = await Promise.all([
        authFetch(`${API}/alunos/turma/${id}`),
        authFetch(`${API}/alocacoes/turma/${id}`)
    ]);
    const alunos = await resAlunos.json();
    const alocacoes = await resAlocacoes.json();

    // Renderiza alunos
    const listaAlunos = document.getElementById('painelTurmaAlunos');
    if (!alunos.length) {
        listaAlunos.innerHTML = '<p class="vazio">Nenhum aluno matriculado nesta turma.</p>';
    } else {
        listaAlunos.innerHTML = alunos.map(a => `
            <div class="card card-clicavel" onclick="abrirPainelAluno(${a.id})">
                <div class="card-info">
                    <strong>${a.nome}</strong>
                    <span>CPF: ${formatarCpf(a.cpf) || '—'}</span>
                    <span>Tel: ${formatarTelefone(a.telefone) || '—'}</span>
                </div>
            </div>`).join('');
    }

    // Renderiza alocações
    const listaAlocacoes = document.getElementById('painelTurmaAlocacoes');
    if (!alocacoes.length) {
        listaAlocacoes.innerHTML = '<p class="vazio">Nenhuma disciplina alocada nesta turma.</p>';
    } else {
        listaAlocacoes.innerHTML = alocacoes.map(a => `
            <div class="card">
                <div class="card-info">
                    <strong>${a.disciplina?.nome || '—'}</strong>
                    <span>Professor: ${a.professor?.nome || '—'}</span>
                </div>
            </div>`).join('');
    }

    // Rola até o painel
    document.getElementById('painelTurma').scrollIntoView({ behavior: 'smooth' });
}

function fecharPainelTurma() {
    turmaSelecionada = null;
    document.getElementById('painelTurma').style.display = 'none';
}

// Abre modal de boletim pré-filtrado pela turma selecionada
async function abrirModalBoletimTurma() {
    if (!turmaSelecionada) return;

    // Busca alunos e alocações apenas da turma atual
    const [resAlunos, resAlocacoes] = await Promise.all([
        authFetch(`${API}/alunos/turma/${turmaSelecionada.id}`),
        authFetch(`${API}/alocacoes/turma/${turmaSelecionada.id}`)
    ]);
    const alunos = await resAlunos.json();
    const alocacoes = await resAlocacoes.json();

    if (!alunos.length) { toast('Nenhum aluno matriculado nesta turma.', 'erro'); return; }
    if (!alocacoes.length) { toast('Nenhuma disciplina alocada nesta turma.', 'erro'); return; }

    // Preenche selects apenas com dados da turma
    document.getElementById('boletimAluno').innerHTML =
        '<option value="">Selecione o aluno</option>' +
        alunos.map(a => `<option value="${a.id}">${a.nome}</option>`).join('');

    document.getElementById('boletimAlocacao').innerHTML =
        '<option value="">Selecione a disciplina</option>' +
        alocacoes.map(a => `<option value="${a.id}">${a.disciplina?.nome || '—'} — Prof. ${a.professor?.nome || '—'}</option>`).join('');

    // Limpa campos e abre modal
    document.getElementById('boletimId').value = '';
    document.getElementById('boletimNota').value = '';
    document.getElementById('boletimFrequencia').value = '';
    document.getElementById('boletimAluno').disabled = false;
    document.getElementById('modalBoletimTitulo').textContent = `Novo Boletim — ${turmaSelecionada.nome}`;
    document.getElementById('modalBoletim').style.display = 'flex';
}

async function editarTurma(id) {
    const res = await authFetch(`${API}/turmas/${id}`);
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
    const dados = { nome: document.getElementById('turmaNome').value, anoLetivo: parseInt(document.getElementById('turmaAno').value), turno: document.getElementById('turmaTurno').value };
    if (!dados.nome || !dados.anoLetivo || !dados.turno) { toast('Preencha todos os campos!', 'erro'); return; }
    const res = await authFetch(id ? `${API}/turmas/${id}` : `${API}/turmas`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(dados) });
    if (res.ok) { toast(id ? 'Turma atualizada!' : 'Turma cadastrada!'); fecharModal('modalTurma'); carregarTurmas(); }
    else toast('Erro ao salvar turma.', 'erro');
}
async function deletarTurma(id) {
    if (!confirm('Deseja deletar esta turma?')) return;
    const res = await authFetch(`${API}/turmas/${id}`, { method: 'DELETE' });
    if (res.ok) { toast('Turma deletada!'); fecharPainelTurma(); carregarTurmas(); }
    else toast('Erro ao deletar turma.', 'erro');
}

// ==================== DISCIPLINAS ====================
async function carregarDisciplinas() {
    const res = await authFetch(`${API}/disciplinas`);
    renderDisciplinas(await res.json());
}
async function buscarDisciplinas() {
    const nome = document.getElementById('buscaDisciplina').value.trim();
    if (!nome) return carregarDisciplinas();
    const res = await authFetch(`${API}/disciplinas/buscar?nome=${encodeURIComponent(nome)}`);
    renderDisciplinas(await res.json());
}
function renderDisciplinas(disciplinas) {
    const lista = document.getElementById('listaDisciplinas');
    if (!disciplinas.length) { lista.innerHTML = '<p class="vazio">Nenhuma disciplina encontrada.</p>'; return; }
    lista.innerHTML = disciplinas.map(d => `
        <div class="card">
            <div class="card-info"><strong>${d.nome}</strong></div>
            <div class="card-acoes">
                <button class="btn-editar" onclick="editarDisciplina(${d.id})">✏️</button>
                <button class="btn-deletar" onclick="deletarDisciplina(${d.id})">🗑️</button>
            </div>
        </div>`).join('');
}
async function editarDisciplina(id) {
    const res = await authFetch(`${API}/disciplinas/${id}`);
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
    const res = await authFetch(id ? `${API}/disciplinas/${id}` : `${API}/disciplinas`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(dados) });
    if (res.ok) { toast(id ? 'Disciplina atualizada!' : 'Disciplina cadastrada!'); fecharModal('modalDisciplina'); carregarDisciplinas(); }
    else toast('Erro ao salvar disciplina.', 'erro');
}
async function deletarDisciplina(id) {
    if (!confirm('Deseja deletar esta disciplina?')) return;
    const res = await authFetch(`${API}/disciplinas/${id}`, { method: 'DELETE' });
    if (res.ok) { toast('Disciplina deletada!'); carregarDisciplinas(); }
    else toast('Erro ao deletar disciplina.', 'erro');
}

// ==================== ALOCAÇÕES ====================
async function carregarAlocacoes() {
    const res = await authFetch(`${API}/alocacoes`);
    renderAlocacoes(await res.json());
}
function renderAlocacoes(alocacoes) {
    const lista = document.getElementById('listaAlocacoes');
    if (!alocacoes.length) { lista.innerHTML = '<p class="vazio">Nenhuma alocação encontrada.</p>'; return; }
    lista.innerHTML = alocacoes.map(a => `
        <div class="card">
            <div class="card-info">
                <strong>${a.disciplina?.nome || '—'}</strong>
                <span>Professor: ${a.professor?.nome || '—'}</span>
                <span>Turma: ${a.turma?.nome || '—'}</span>
            </div>
            <div class="card-acoes">
                <button class="btn-editar" onclick="editarAlocacao(${a.id})">✏️</button>
                <button class="btn-deletar" onclick="deletarAlocacao(${a.id})">🗑️</button>
            </div>
        </div>`).join('');
}
async function preencherSelects() {
    const [r1, r2, r3] = await Promise.all([authFetch(`${API}/funcionarios/cargo?cargo=Professor`), authFetch(`${API}/turmas`), authFetch(`${API}/disciplinas`)]);
    const [profs, turmas, discs] = await Promise.all([r1.json(), r2.json(), r3.json()]);
    document.getElementById('alocacaoProfessor').innerHTML = '<option value="">Selecione</option>' + profs.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
    document.getElementById('alocacaoTurma').innerHTML = '<option value="">Selecione</option>' + turmas.map(t => `<option value="${t.id}">${t.nome} - ${t.turno}</option>`).join('');
    document.getElementById('alocacaoDisciplina').innerHTML = '<option value="">Selecione</option>' + discs.map(d => `<option value="${d.id}">${d.nome}</option>`).join('');
}
async function editarAlocacao(id) {
    const res = await authFetch(`${API}/alocacoes/${id}`);
    const a = await res.json();
    await preencherSelects();
    document.getElementById('alocacaoId').value = a.id;
    document.getElementById('alocacaoProfessor').value = a.professor?.id || '';
    document.getElementById('alocacaoTurma').value = a.turma?.id || '';
    document.getElementById('alocacaoDisciplina').value = a.disciplina?.id || '';
    document.getElementById('modalAlocacaoTitulo').textContent = 'Editar Alocação';
    document.getElementById('modalAlocacao').style.display = 'flex';
}
async function salvarAlocacao() {
    const id = document.getElementById('alocacaoId').value;
    const dados = { idProfessor: parseInt(document.getElementById('alocacaoProfessor').value), idTurma: parseInt(document.getElementById('alocacaoTurma').value), idDisciplina: parseInt(document.getElementById('alocacaoDisciplina').value) };
    if (!dados.idProfessor || !dados.idTurma || !dados.idDisciplina) { toast('Preencha todos os campos!', 'erro'); return; }
    const res = await authFetch(id ? `${API}/alocacoes/${id}` : `${API}/alocacoes`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(dados) });
    if (res.ok) { toast(id ? 'Alocação atualizada!' : 'Alocação cadastrada!'); fecharModal('modalAlocacao'); carregarAlocacoes(); }
    else toast('Erro ao salvar alocação.', 'erro');
}
async function deletarAlocacao(id) {
    if (!confirm('Deseja deletar esta alocação?')) return;
    const res = await authFetch(`${API}/alocacoes/${id}`, { method: 'DELETE' });
    if (res.ok) { toast('Alocação deletada!'); carregarAlocacoes(); }
    else toast('Erro ao deletar alocação.', 'erro');
}

// ==================== BOLETINS ====================
async function carregarBoletins() {
    const res = await authFetch(`${API}/boletins`);
    renderBoletins(await res.json());
}
async function buscarBoletins() {
    const nome = document.getElementById('buscaBoletimAluno').value.trim();
    if (!nome) return carregarBoletins();
    const res = await authFetch(`${API}/boletins`);
    const todos = await res.json();
    renderBoletins(todos.filter(b => (b.aluno?.nome || '').toLowerCase().includes(nome.toLowerCase())));
}
function renderBoletins(boletins) {
    const lista = document.getElementById('listaBoletins');
    if (!boletins.length) { lista.innerHTML = '<p class="vazio">Nenhum boletim encontrado.</p>'; return; }
    lista.innerHTML = boletins.map(b => {
        const nota = b.nota != null ? b.nota.toFixed(1) : '—';
        const freq = b.frequencia != null ? b.frequencia.toFixed(1) + '%' : '—';
        return `
        <div class="card">
            <div class="card-info">
                <strong>${b.aluno?.nome || '—'}</strong>
                <span>Disciplina: ${b.alocacao?.disciplina || '—'}</span>
                <span>Turma: ${b.alocacao?.turma || '—'}</span>
            </div>
            <div class="card-boletim">
                <div class="boletim-item"><span class="boletim-label">Nota</span><span class="boletim-valor">${nota}</span></div>
                <div class="boletim-item"><span class="boletim-label">Freq.</span><span class="boletim-valor">${freq}</span></div>
            </div>
            <div class="card-acoes">
                <button class="btn-editar" onclick="editarBoletim(${b.id})">✏️</button>
                <button class="btn-deletar" onclick="deletarBoletim(${b.id})">🗑️</button>
            </div>
        </div>`}).join('');
}
async function preencherSelectBoletim() {
    const [r1, r2] = await Promise.all([authFetch(`${API}/alunos`), authFetch(`${API}/alocacoes`)]);
    const [alunos, alocacoes] = await Promise.all([r1.json(), r2.json()]);
    document.getElementById('boletimAluno').innerHTML = '<option value="">Selecione o aluno</option>' + alunos.map(a => `<option value="${a.id}">${a.nome}</option>`).join('');
    document.getElementById('boletimAlocacao').innerHTML = '<option value="">Selecione a alocação</option>' + alocacoes.map(a => `<option value="${a.id}">${a.disciplina?.nome || '—'} - ${a.turma?.nome || '—'}</option>`).join('');
}
async function editarBoletim(id) {
    await preencherSelectBoletim();
    const res = await authFetch(`${API}/boletins/${id}`);
    const b = await res.json();
    document.getElementById('boletimId').value = b.id;
    document.getElementById('boletimAluno').value = b.aluno?.id || '';
    document.getElementById('boletimAlocacao').value = b.alocacao?.id || '';
    document.getElementById('boletimNota').value = b.nota ?? '';
    document.getElementById('boletimFrequencia').value = b.frequencia ?? '';
    document.getElementById('modalBoletimTitulo').textContent = 'Editar Boletim';
    document.getElementById('modalBoletim').style.display = 'flex';
}
async function salvarBoletim() {
    const id = document.getElementById('boletimId').value;
    const dados = { idAluno: parseInt(document.getElementById('boletimAluno').value), idAlocacao: parseInt(document.getElementById('boletimAlocacao').value), nota: parseFloat(document.getElementById('boletimNota').value) || null, frequencia: parseFloat(document.getElementById('boletimFrequencia').value) || null };
    if (!dados.idAluno || !dados.idAlocacao) { toast('Selecione aluno e alocação!', 'erro'); return; }
    const res = await authFetch(id ? `${API}/boletins/${id}` : `${API}/boletins`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(dados) });
    if (res.ok) { toast(id ? 'Boletim atualizado!' : 'Boletim cadastrado!'); fecharModal('modalBoletim'); carregarBoletins(); }
    else toast('Erro ao salvar boletim.', 'erro');
}
async function deletarBoletim(id) {
    if (!confirm('Deseja deletar este boletim?')) return;
    const res = await authFetch(`${API}/boletins/${id}`, { method: 'DELETE' });
    if (res.ok) { toast('Boletim deletado!'); carregarBoletins(); }
    else toast('Erro ao deletar boletim.', 'erro');
}

// ==================== ATENDIMENTOS ====================
async function carregarAtendimentos() {
    const res = await authFetch(`${API}/atendimentos`);
    renderAtendimentos(await res.json());
}
async function buscarAtendimentos() {
    const nome = document.getElementById('buscaAtendimentoAluno').value.trim();
    if (!nome) return carregarAtendimentos();
    const res = await authFetch(`${API}/atendimentos/buscar/nome?nome=${encodeURIComponent(nome)}`);
    renderAtendimentos(await res.json());
}
function renderAtendimentos(atendimentos) {
    const lista = document.getElementById('listaAtendimentos');
    if (!atendimentos.length) { lista.innerHTML = '<p class="vazio">Nenhum atendimento encontrado.</p>'; return; }
    lista.innerHTML = atendimentos.map(a => `
        <div class="card">
            <div class="card-info">
                <strong>${a.aluno?.nome || '—'}</strong>
                <span>Assunto: ${a.assunto || '—'}</span>
                <span>Data: ${a.data || '—'}</span>
                <span>Funcionário: ${a.funcionario?.nome || 'Não atribuído'}</span>
            </div>
            <div class="card-acoes">
                <button class="btn-editar" onclick="atribuirFuncionario(${a.id}, ${a.aluno?.id}, '${a.assunto}', '${a.data}')">👤 Atribuir</button>
            </div>
        </div>`).join('');
}
async function atribuirFuncionario(id, idAluno, assunto, data) {
    const res = await authFetch(`${API}/funcionarios`);
    const funcionarios = await res.json();
    const opcoes = funcionarios.map(f => `${f.id}: ${f.nome}`).join('\n');
    const input = prompt(`Digite o ID do funcionário:\n\n${opcoes}`);
    if (!input) return;
    const resSave = await authFetch(`${API}/atendimentos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ assunto, data, idAluno, idFuncionario: parseInt(input) })
    });
    if (resSave.ok) { toast('Funcionário atribuído!'); carregarAtendimentos(); }
    else toast('Erro ao atribuir funcionário.', 'erro');
}

// Carrega seção inicial
carregarAlunos();