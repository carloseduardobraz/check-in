const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Rotas de páginas
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// ==============================
// 🐘 CONEXÃO COM POSTGRES (Neon)
// ==============================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ==============================
// 🧠 FUNÇÃO DE FORMATAÇÃO DE DATA
// ==============================
const formatarData = (data) =>
  new Date(data).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo"
  });

// ==============================
// 📦 CRIAR TABELA
// ==============================
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS confirmacoes (
        id SERIAL PRIMARY KEY,
        nome TEXT,
        email TEXT,
        status TEXT,
        data TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Banco de dados pronto!");
  } catch (err) {
    console.error("Erro ao criar tabela:", err);
  }
};
initDb();

// ==============================
// 📌 SALVAR CONFIRMAÇÃO
// ==============================
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

// ==============================
// 📋 LISTAR CONFIRMAÇÕES
// ==============================
app.get("/lista", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM confirmacoes ORDER BY id DESC"
    );

    const dadosFormatados = result.rows.map((row) => ({
      ...row,
      data: formatarData(row.data)
    }));

    res.json(dadosFormatados);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao listar" });
  }
});

// ==============================
// ❌ DELETAR CONFIRMAÇÃO
// ==============================
app.delete("/deletar/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM confirmacoes WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Item não encontrado" });
    }

    res.json({ sucesso: true, mensagem: "Item deletado com sucesso" });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao deletar" });
  }
});

// ==============================
// 📤 EXPORTAR CSV
// ==============================
app.get("/exportar-csv", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM confirmacoes ORDER BY id DESC"
    );

    let csv = "ID,Nome,Email,Status,Data\n";

    result.rows.forEach((row) => {
      csv += `${row.id},"${row.nome}","${row.email}","${row.status}","${formatarData(row.data)}"\n`;
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="confirmacoes.csv"'
    );

    res.send(csv);
  } catch (err) {
    res.status(500).send("Erro ao gerar CSV");
  }
});

// ==============================
// 📤 EXPORTAR JSON
// ==============================
app.get("/exportar-json", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM confirmacoes ORDER BY id DESC"
    );

    const dadosFormatados = result.rows.map((row) => ({
      ...row,
      data: formatarData(row.data)
    }));

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="confirmacoes.json"'
    );

    res.send(JSON.stringify(dadosFormatados, null, 2));
  } catch (err) {
    res.status(500).send("Erro ao gerar JSON");
  }
});

// ==============================
// 🚀 INICIAR SERVIDOR
// ==============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});