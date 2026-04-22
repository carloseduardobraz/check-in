const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// Servir HTML
app.use(express.static(path.join(__dirname, "public")));

// Banco de dados
const db = new sqlite3.Database("banco.db");

// Criar tabela
db.run(`
CREATE TABLE IF NOT EXISTS confirmacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  email TEXT,
  status TEXT,
  data TEXT
)
`);

// Rota para salvar confirmação
app.post("/confirmar", (req, res) => {
  const { nome, email, status } = req.body;

  if (!nome || !email) {
    return res.status(400).json({ erro: "Preencha todos os campos" });
  }

  db.run(
    "INSERT INTO confirmacoes (nome, email, status, data) VALUES (?, ?, ?, datetime('now'))",
    [nome, email, status],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ sucesso: true });
    }
  );
});

// Listar confirmações
app.get("/lista", (req, res) => {
  db.all("SELECT * FROM confirmacoes ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// Deletar confirmação
app.delete("/deletar/:id", (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ erro: "ID inválido" });
  }

  db.run(
    "DELETE FROM confirmacoes WHERE id = ?",
    [parseInt(id)],
    function (err) {
      if (err) {
        console.error("Erro ao deletar:", err);
        return res.status(500).json({ erro: "Erro ao deletar item" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ erro: "Item não encontrado" });
      }
      res.json({ sucesso: true, mensagem: "Item deletado com sucesso" });
    }
  );
});

// Exportar como CSV
app.get("/exportar-csv", (req, res) => {
  db.all("SELECT * FROM confirmacoes ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json(err);

    // Criar CSV
    let csv = "ID,Nome,Email,Status,Data\n";
    rows.forEach((row) => {
      csv += `${row.id},"${row.nome}","${row.email}","${row.status}","${row.data}"\n`;
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="confirmacoes.csv"`);
    res.send(csv);
  });
});

// Exportar como JSON
app.get("/exportar-json", (req, res) => {
  db.all("SELECT * FROM confirmacoes ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json(err);

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="confirmacoes.json"`);
    res.send(JSON.stringify(rows, null, 2));
  });
});

// Iniciar servidor
app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
  console.log("Painel admin: http://localhost:3000/admin.html");
  console.log("Senha padrão: admin123");
});