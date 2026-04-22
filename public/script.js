document.getElementById("btnConfirmar").addEventListener("click", confirmar);

// Fechar modal de sucesso
document.getElementById("btnFecharModal").addEventListener("click", () => {
  fecharModal("modalSucesso");
});

// Fechar modal de erro
document.getElementById("btnFecharErro").addEventListener("click", () => {
  fecharModal("modalErro");
});

// Função para abrir modal
function abrirModal(id) {
  document.getElementById(id).classList.add("show");
}

// Função para fechar modal
function fecharModal(id) {
  document.getElementById(id).classList.remove("show");
}

// Função para validar email
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

async function confirmar() {
  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const status = document.getElementById("status").value;

  // Validar campos vazios
  if (!nome || !email) {
    document.getElementById("tituloErro").textContent = "Campos obrigatórios";
    document.getElementById("textoErro").textContent = "Por favor, preencha todos os campos!";
    abrirModal("modalErro");
    return;
  }

  // Validar email
  if (!validarEmail(email)) {
    document.getElementById("tituloErro").textContent = "Email inválido";
    document.getElementById("textoErro").textContent = "Por favor, insira um email válido! (ex: seu@email.com)";
    abrirModal("modalErro");
    return;
  }

  try {
    const resposta = await fetch("/confirmar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ nome, email, status })
    });

    if (resposta.ok) {
      abrirModal("modalSucesso");
      limparCampos();
    } else {
      document.getElementById("tituloErro").textContent = "Erro ao confirmar";
      document.getElementById("textoErro").textContent = "Houve um problema ao confirmar sua presença. Tente novamente!";
      abrirModal("modalErro");
    }

  } catch (erro) {
    document.getElementById("tituloErro").textContent = "Erro de conexão";
    document.getElementById("textoErro").textContent = "Não foi possível conectar ao servidor. Tente novamente!";
    abrirModal("modalErro");
  }
}

function limparCampos() {
  document.getElementById("nome").value = "";
  document.getElementById("email").value = "";
}