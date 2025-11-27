// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

// IMPORTAÇÃO CORRETA DO BANCO
const { sql, connect } = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

//Importante: CHAMAR A CONEXÃO AQUI
connect();

// Configuração via .env
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_HOST, // ex: localhost\\SQLEXPRESS ou IP
  database: process.env.DB_NAME,
  options: {
    encrypt: false, // true se Azure
    enableArithAbort: true
  },
  port: parseInt(process.env.DB_PORT || "1433")
};

async function getPool() {
  if (!getPool.pool) {
    getPool.pool = await sql.connect(dbConfig);
  }
  return getPool.pool;
}

/* ============================
   ROTAS CLIENTES
   ============================ */
// listar clientes
app.get('/clientes', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT Id, Nome, Telefone, Endereco FROM Clientes ORDER BY Id');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

// cadastrar cliente
app.post('/clientes', async (req, res) => {
  try {
    const { nome, telefone, endereco } = req.body;
    const pool = await getPool();
    const result = await pool.request()
      .input('nome', sql.NVarChar(150), nome)
      .input('telefone', sql.NVarChar(50), telefone)
      .input('endereco', sql.NVarChar(250), endereco)
      .query(`INSERT INTO Clientes (Nome, Telefone, Endereco) VALUES (@nome, @telefone, @endereco);
              SELECT SCOPE_IDENTITY() AS id;`);
    const insertedId = result.recordset[0].id;
    res.json({ id: insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar cliente' });
  }
});

// excluir cliente por id
app.delete('/clientes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const pool = await getPool();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM Clientes WHERE Id = @id');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir cliente' });
  }
});

/* ============================
   ROTAS PRODUTOS
   ============================ */
// listar produtos
app.get('/produtos', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT Id, Nome, Preco, Tipo FROM Produtos ORDER BY Id');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// cadastrar produto
app.post('/produtos', async (req, res) => {
  try {
    const { nome, preco, tipo } = req.body;
    const pool = await getPool();
    const result = await pool.request()
      .input('nome', sql.NVarChar(150), nome)
      .input('preco', sql.Decimal(10,2), preco)
      .input('tipo', sql.NVarChar(50), tipo)
      .query(`INSERT INTO Produtos (Nome, Preco, Tipo) VALUES (@nome, @preco, @tipo);
              SELECT SCOPE_IDENTITY() AS id;`);
    const insertedId = result.recordset[0].id;
    res.json({ id: insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar produto' });
  }
});

// excluir produto por id
app.delete('/produtos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const pool = await getPool();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM Produtos WHERE Id = @id');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir produto' });
  }
});

/* ============================
   ROTAS PEDIDOS
   ============================ */
// listar pedidos (com itens)
app.get('/pedidos', async (req, res) => {
  try {
    const pool = await getPool();
    const pedidosRes = await pool.request().query('SELECT Id, ClienteId, DataHora, Total FROM Pedidos ORDER BY DataHora DESC');
    const pedidos = pedidosRes.recordset;

    // buscar itens para cada pedido (pegar todos de uma vez é mais eficiente)
    const pedidoIds = pedidos.map(p => p.Id);
    if (pedidoIds.length === 0) {
      return res.json([]);
    }
    const itemsRes = await pool.request().query(`SELECT PedidoId, Produto, Quantidade, Preco, Tipo FROM ItensPedido WHERE PedidoId IN (${pedidoIds.join(',')})`);
    const items = itemsRes.recordset;

    // mapear
    const pedidosComItens = pedidos.map(p => {
      return {
        id: p.Id,
        clienteId: p.ClienteId,
        data: p.DataHora,
        total: parseFloat(p.Total),
        itens: items.filter(i => i.PedidoId === p.Id).map(it => ({
          produto: it.Produto,
          quantidade: it.Quantidade,
          preco: parseFloat(it.Preco),
          tipo: it.Tipo
        }))
      };
    });

    // também juntar dados do cliente (opcional)
    // buscar clientes usados
    const clientIds = Array.from(new Set(pedidos.map(p => p.ClienteId).filter(Boolean)));
    let clientesMap = {};
    if (clientIds.length > 0) {
      const clientsRes = await pool.request().query(`SELECT Id, Nome, Telefone, Endereco FROM Clientes WHERE Id IN (${clientIds.join(',')})`);
      clientsRes.recordset.forEach(c => clientesMap[c.Id] = c);
    }

    const final = pedidosComItens.map(p => ({
      id: p.id,
      data: new Date(p.data).toLocaleString('pt-BR'),
      total: p.total,
      itens: p.itens,
      cliente: clientesMap[p.clienteId] || { id: p.clienteId, nome: 'Visitante', telefone: '', endereco: '' }
    }));

    res.json(final);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// criar pedido (transação)
app.post('/pedidos', async (req, res) => {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    const { clienteId, itens, total } = req.body;

    await tx.begin();

    const request = tx.request();
    request.input('clienteId', sql.Int, clienteId || null);
    request.input('total', sql.Decimal(12,2), total || 0);

    const insertPedido = await request.query(`INSERT INTO Pedidos (ClienteId, Total) VALUES (@clienteId, @total);
                                             SELECT SCOPE_IDENTITY() AS id;`);
    const pedidoId = insertPedido.recordset[0].id;

    // inserir itens
    for (const item of itens) {
      const rq = tx.request();
      rq.input('pedidoId', sql.BigInt, pedidoId);
      rq.input('produto', sql.NVarChar(150), item.produto);
      rq.input('quantidade', sql.Int, item.quantidade);
      rq.input('preco', sql.Decimal(10,2), item.preco);
      rq.input('tipo', sql.NVarChar(50), item.tipo || null);
      await rq.query(`INSERT INTO ItensPedido (PedidoId, Produto, Quantidade, Preco, Tipo)
                      VALUES (@pedidoId, @produto, @quantidade, @preco, @tipo)`);
    }

    await tx.commit();
    res.json({ success: true, pedidoId });
  } catch (err) {
    console.error(err);
    try { await tx.rollback(); } catch(e) {}
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

/* ============================
   ROTAS LOGIN SIMPLES
   ============================ */
// login funcionário simples (hardcoded)
app.post('/login/funcionario', (req, res) => {
  const { login, senha } = req.body;
  // atenção: em produção, use banco e hash
  if (login === 'func' && senha === '1234') {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false, error: 'Credenciais inválidas' });
  }
});

// login cliente por nome/telefone
app.post('/login/cliente', async (req, res) => {
  try {
    const { nome, telefone } = req.body;
    const pool = await getPool();
    const result = await pool.request()
      .input('nome', sql.NVarChar(150), nome)
      .input('telefone', sql.NVarChar(50), telefone)
      .query('SELECT Id, Nome, Telefone, Endereco FROM Clientes WHERE LOWER(Nome) = LOWER(@nome) AND Telefone = @telefone');
    if (result.recordset.length === 0) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no login do cliente' });
  }
});

/* ============================
   ROTA RELATÓRIO (por data)
   ============================ */
// exemplo: ?data=2025-11-04 (YYYY-MM-DD)
app.get('/relatorio', async (req, res) => {
  try {
    const data = req.query.data; // "YYYY-MM-DD"
    if (!data) return res.status(400).json({ error: 'data query required' });

    const pool = await getPool();
    const start = `${data}T00:00:00`;
    const end = `${data}T23:59:59`;

    const pedidosRes = await pool.request()
      .input('start', sql.DateTime2, start)
      .input('end', sql.DateTime2, end)
      .query('SELECT Id, ClienteId, DataHora, Total FROM Pedidos WHERE DataHora BETWEEN @start AND @end ORDER BY DataHora');

    const pedidos = pedidosRes.recordset;
    const pedidoIds = pedidos.map(p => p.Id);
    let items = [];
    if (pedidoIds.length > 0) {
      const itemsRes = await pool.request().query(`SELECT PedidoId, Produto, Quantidade, Preco, Tipo FROM ItensPedido WHERE PedidoId IN (${pedidoIds.join(',')})`);
      items = itemsRes.recordset;
    }

    // agregação por tipo
    const vendidosPorTipo = { pizza: 0, pizzaDoce: 0, bebida: 0 };
    let totalDia = 0;
    pedidos.forEach(p => {
      totalDia += parseFloat(p.Total);
      items.filter(it => it.PedidoId === p.Id).forEach(it => {
        const tipo = it.Tipo;
        if (tipo && vendidosPorTipo.hasOwnProperty(tipo)) vendidosPorTipo[tipo] += it.Quantidade;
      });
    });

    res.json({ data, totalDia, vendidosPorTipo, pedidosCount: pedidos.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

/* ============================
   START
   ============================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
