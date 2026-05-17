function toggleSenha(id, btn) {
    const input = document.getElementById(id);
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    btn.style.opacity = isText ? '0.5' : '1';
}

document.getElementById('senha').addEventListener('input', function () {
    const val = this.value;
    const barras = [document.getElementById('b1'), document.getElementById('b2'), document.getElementById('b3'), document.getElementById('b4')];
    const texto = document.getElementById('forcaTexto');
    let forca = 0;

    if (val.length >= 8) forca++;
    if (/[A-Z]/.test(val)) forca++;
    if (/[0-9]/.test(val)) forca++;
    if (/[^A-Za-z0-9]/.test(val)) forca++;

    const cores = ['#e53e3e', '#dd6b20', '#d69e2e', '#38a169'];
    const labels = ['Fraca', 'Razoável', 'Boa', 'Forte'];

    barras.forEach((b, i) => {
        b.style.backgroundColor = i < forca ? cores[forca - 1] : '#e2e8f0';
    });

    texto.textContent = val.length === 0 ? '' : labels[forca - 1] || 'Fraca';
    texto.style.color = val.length === 0 ? '' : cores[forca - 1];
});

document.getElementById('formCadastro').addEventListener('submit', function (e) {
    const senha = document.getElementById('senha').value;
    const confirmar = document.getElementById('confirmarSenha').value;
    const erro = document.getElementById('erroSenha');

    if (senha !== confirmar) {
        e.preventDefault();
        erro.textContent = 'As senhas não coincidem.';
        document.getElementById('confirmarSenha').style.borderColor = '#e53e3e';
    } else {
        erro.textContent = '';
        document.getElementById('confirmarSenha').style.borderColor = '';
    }
});

document.getElementById('cpf').addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    this.value = v;
});

document.getElementById('telefone').addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{2})(\d)/, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    this.value = v;
});