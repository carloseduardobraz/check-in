// Verificar autenticação
window.addEventListener('load', () => {
  const autenticado = sessionStorage.getItem('admin_autenticado');
  if (!autenticado) {
    window.location.href = '/login.html';
    return;
  }
  carregarDados();
  setupModalExclusao();
});

// Setup do Modal de Exclusão
let idParaDeletar = null;

function setupModalExclusao() {
  document.getElementById('btnCancelarExclusao').addEventListener('click', () => {
    fecharModalExclusao();
  });

  document.getElementById('btnConfirmarExclusao').addEventListener('click', () => {
    confirmarExclusao();
  });

  // Fechar modal ao clicar fora dele
  document.getElementById('modalExcluir').addEventListener('click', (e) => {
    if (e.target.id === 'modalExcluir') {
      fecharModalExclusao();
    }
  });
}

function abrirModalExclusao(id) {
  idParaDeletar = id;
  document.getElementById('modalExcluir').classList.add('show');
}

function fecharModalExclusao() {
  document.getElementById('modalExcluir').classList.remove('show');
  idParaDeletar = null;
}

async function confirmarExclusao() {
  if (!idParaDeletar) return;

  try {
    const resposta = await fetch(`/deletar/${idParaDeletar}`, { method: 'DELETE' });
    const dados = await resposta.json();

    if (resposta.ok) {
      fecharModalExclusao();
      await carregarDados();
      // Mostrar notificação de sucesso
      alert('✅ Item deletado com sucesso!');
    } else {
      alert('❌ Erro ao deletar: ' + (dados.erro || resposta.statusText));
      console.error('Erro:', dados);
    }
  } catch (erro) {
    console.error('Erro ao deletar:', erro);
    alert('❌ Erro de comunicação com o servidor');
  }
}

// Carregar dados
async function carregarDados() {
  try {
    const resposta = await fetch('/lista');
    const dados = await resposta.json();

    // Atualizar estatísticas
    document.getElementById('totalConfirmacoes').textContent = dados.length;
    const confirmados = dados.filter(d => d.status === 'Confirmado').length;
    document.getElementById('totalConfirmados').textContent = confirmados;

    // Preencher tabela
    const tbody = document.getElementById('tbody-dados');
    tbody.innerHTML = '';

    dados.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.id}</td>
        <td>${item.nome}</td>
        <td>${item.email}</td>
        <td><span class="status-${item.status.toLowerCase()}">${item.status}</span></td>
        <td>${new Date(item.data).toLocaleDateString('pt-BR')}</td>
        <td>
          <button class="btn-deletar" onclick="deletarItem(${item.id})">Deletar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (erro) {
    console.error('Erro ao carregar dados:', erro);
  }
}

// Deletar item
function deletarItem(id) {
  abrirModalExclusao(id);
}

// Exportar como CSV
document.getElementById('btnExportarCSV').addEventListener('click', async () => {
  try {
    const resposta = await fetch('/exportar-csv');
    const blob = await resposta.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `confirmacoes_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (erro) {
    console.error('Erro ao exportar CSV:', erro);
    alert('Erro ao exportar CSV');
  }
});

// Exportar como JSON
document.getElementById('btnExportarJSON').addEventListener('click', async () => {
  try {
    const resposta = await fetch('/exportar-json');
    const blob = await resposta.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `confirmacoes_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (erro) {
    console.error('Erro ao exportar JSON:', erro);
    alert('Erro ao exportar JSON');
  }
});

// Sair
document.getElementById('btnSair').addEventListener('click', () => {
  sessionStorage.removeItem('admin_autenticado');
  window.location.href = '/';
});
