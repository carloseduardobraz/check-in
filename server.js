const express = require("express");
const { Pool } = require("pg"); // Mudou para pg
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// ==============================
// 🐘 CONEXÃO COM NEON.TECH (POSTGRES)
// ==============================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Você pegará essa URL no painel do Neon
  ssl: {
    rejectUnauthorized: false // Obrigatório para o Neon/Render
  }
});

// Criar tabela (Sintaxe Postgres é levemente diferente)
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS confirmacoes (
        id SERIAL PRIMARY KEY,
        nome TEXT,
        email TEXT,
        status TEXT,
        data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Banco de dados pronto!");
  } catch (err) {
    console.error("Erro ao criar tabela:", err);
  }
};
initDb();

// Rota /admin
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Rota para salvar confirmação
app.post("/confirmar", async (req, res) => {
  const { nome, email, status } = req.body;

  if (!nome || !email) {
    return res.status(400).json({ erro: "Preencha todos os campos" });
  }

  try {
    await pool.query(
      "INSERT INTO confirmacoes (nome, email, status) VALUES ($1, $2, $3)",
      [nome, email, status]
    );
    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao salvar" });
  }
});

// Listar confirmações
app.get("/lista", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM confirmacoes ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao listar" });
  }
});

// Deletar confirmação
app.delete("/deletar/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM confirmacoes WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Item não encontrado" });
    }
    res.json({ sucesso: true, mensagem: "Item deletado com sucesso" });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao deletar" });
  }
});

// Exportar CSV
app.get("/exportar-csv", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM confirmacoes ORDER BY id DESC");
    let csv = "ID,Nome,Email,Status,Data\n";
    result.rows.forEach((row) => {
      csv += `${row.id},"${row.nome}","${row.email}","${row.status}","${row.data}"\n`;
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="confirmacoes.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).send("Erro ao gerar CSV");
  }
});

// Exportar JSON
app.get("/exportar-json", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM confirmacoes ORDER BY id DESC");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="confirmacoes.json"');
    res.send(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    res.status(500).send("Erro ao gerar JSON");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});