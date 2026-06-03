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
      location_source: location ? location.source : null,
      location_accuracy: location && typeof location.accuracy === 'number' ? location.accuracy : null
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
function getLocationWithTimeout(timeoutMs = 8000, desiredAccuracy = 30) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      (async () => resolve(await fallbackByIP()))();
      return;
    }

    let watchId = null;
    let best = null;
    let finished = false;

    function finish(result) {
      if (finished) return;
      finished = true;
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      resolve(result);
    }

    function onSuccess(pos) {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const accuracy = typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : Infinity;
      // Keep best (smallest) accuracy
      if (!best || accuracy < best.accuracy) {
        best = { lat, lon, accuracy };
      }

      // If we already have a sufficiently accurate reading, finish early
      if (accuracy <= desiredAccuracy) {
        finish({ lat, lon, source: 'geolocation', accuracy });
      }
    }

    async function onError(err) {
      // On error, fallback to IP
      const ip = await fallbackByIP();
      finish(ip);
    }

    // Start watching for positions to gather multiple samples
    try {
      watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: timeoutMs
      });
    } catch (e) {
      // If watchPosition throws, fall back
      (async () => finish(await fallbackByIP()))();
      return;
    }

    // After timeout, choose best sample (if any) or fallback
    setTimeout(async () => {
      if (best) {
        finish({ lat: best.lat, lon: best.lon, source: 'geolocation', accuracy: best.accuracy });
      } else {
        const ip = await fallbackByIP();
        finish(ip);
      }
    }, timeoutMs);
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