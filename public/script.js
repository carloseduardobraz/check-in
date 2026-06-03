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

  // Tenta obter localização antes de enviar (timeout para não bloquear)
  let location = null;
  try {
    location = await getLocationWithTimeout(8000); // 8s
  } catch (e) {
    console.warn('Erro ao obter localização antes de confirmar:', e);
  }

  try {
    const payload = {
      nome,
      email,
      status,
      lat: location ? location.lat : null,
      lon: location ? location.lon : null,
      location_source: location ? location.source : null
    };

    const resposta = await fetch("/confirmar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
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

// ==============================
// Geolocalização (apenas ao confirmar)
// ==============================
function getLocationWithTimeout(timeoutMs = 8000) {
  return new Promise((resolve) => {
    let settled = false;

    function finish(result) {
      if (settled) return;
      settled = true;
      resolve(result);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        finish({ lat: pos.coords.latitude, lon: pos.coords.longitude, source: 'geolocation' });
      }, async () => {
        const ip = await fallbackByIP();
        finish(ip);
      }, { enableHighAccuracy: true, timeout: timeoutMs });

      // Timeout fallback
      setTimeout(async () => {
        const ip = await fallbackByIP();
        finish(ip);
      }, timeoutMs + 200);
    } else {
      (async () => finish(await fallbackByIP()))();
    }
  });
}

async function fallbackByIP() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) throw new Error('IP lookup failed');
    const data = await res.json();
    const lat = data.latitude || data.lat;
    const lon = data.longitude || data.lon;
    console.log('Geolocation (IP):', lat, lon);
    return { lat, lon, source: 'ip' };
  } catch (e) {
    console.warn('Fallback IP failed:', e);
    return null;
  }
}