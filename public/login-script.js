document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const senha = document.getElementById('senha').value;
  const erroDiv = document.getElementById('erro');

  // Validar senha (pode ser alterada ou validada no servidor)
  if (senha === 'admin123') {
    // Armazenar autenticação
    sessionStorage.setItem('admin_autenticado', 'true');
    erroDiv.textContent = '';
    
    // Redirecionar para admin
    window.location.href = '/admin.html';
  } else {
    erroDiv.textContent = '❌ Senha incorreta!';
    document.getElementById('senha').value = '';
    document.getElementById('senha').focus();
  }
});

// Se já está autenticado, redireciona para admin
window.addEventListener('load', () => {
  if (sessionStorage.getItem('admin_autenticado')) {
    window.location.href = '/admin.html';
  }
});
