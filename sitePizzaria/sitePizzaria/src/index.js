document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:3000";

  // ==========================
  // ===== MENU CLIENTES ======
  // ==========================
  const listaClientesUL = document.getElementById("listaClientes");
  const btnCadastrar = document.getElementById("cadastrarCliente");
  const inputNome = document.getElementById("nome");
  const inputTelefone = document.getElementById("telefone");
  const inputEndereco = document.getElementById("endereco");
  const inputExcluirCodigo = document.getElementById("codigoExcluir");
  const btnExcluir = document.getElementById("excluirCliente");

  let listaClientes = [];

  async function carregarClientes() {
    try {
      const res = await fetch(`${API_BASE}/clientes`);
      listaClientes = await res.json();
      atualizarListaClientes();
      atualizarSelectClientes();
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar clientes do servidor.");
    }
  }

  function atualizarListaClientes() {
    if (!listaClientesUL) return;
    listaClientesUL.innerHTML = "";
    listaClientes.forEach((cliente, index) => {
      const li = document.createElement("li");
      li.textContent = `Código: ${index + 1} - Nome: ${cliente.Nome || cliente.nome} - Telefone: ${cliente.Telefone || cliente.telefone} - Endereço: ${cliente.Endereco || cliente.endereco}`;
      listaClientesUL.appendChild(li);
    });
  }

  btnCadastrar?.addEventListener("click", async () => {
    const nome = inputNome.value.trim();
    const telefone = inputTelefone.value.trim();
    const endereco = inputEndereco.value.trim();

    if (!nome || !telefone || !endereco) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      await fetch(`${API_BASE}/clientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone, endereco })
      });
      inputNome.value = "";
      inputTelefone.value = "";
      inputEndereco.value = "";
      await carregarClientes();
    } catch (err) {
      console.error(err);
      alert("Erro ao cadastrar cliente");
    }
  });

  btnExcluir?.addEventListener("click", async () => {
    const codigo = parseInt(inputExcluirCodigo.value);
    if (isNaN(codigo) || codigo < 1 || codigo > listaClientes.length) {
      alert("Código inválido!");
      return;
    }
    const cliente = listaClientes[codigo - 1];
    if (!cliente || !cliente.Id && !cliente.id) {
      alert("Cliente inválido.");
      return;
    }
    const id = cliente.Id ?? cliente.id;
    try {
      await fetch(`${API_BASE}/clientes/${id}`, { method: "DELETE" });
      inputExcluirCodigo.value = "";
      await carregarClientes();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir cliente");
    }
  });

  // carregar inicialmente
  carregarClientes();

  // ==========================
  // ===== MENU PRODUTOS ======
  // ==========================
  const inputNomeProduto = document.getElementById("nomeProduto");
  const inputPrecoProduto = document.getElementById("precoProduto");
  const selectTipoProduto = document.getElementById("tipoProduto");
  const btnCadastrarProduto = document.getElementById("cadastrarProduto");
  const inputCodigoExcluirProduto = document.getElementById("codigoExcluirProduto");
  const btnExcluirProduto = document.getElementById("excluirProduto");
  const listaProdutosUL = document.getElementById("listaProdutos");
  let produtos = [];

  async function carregarProdutos() {
    try {
      const res = await fetch(`${API_BASE}/produtos`);
      produtos = await res.json();
      atualizarProdutosPedido();
      atualizarListaProdutos();
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar produtos");
    }
  }

  function atualizarProdutosPedido() {
    const containerBebida = document.getElementById("produtosBebida");
    const containerPizza = document.getElementById("produtosPizza");
    const containerPizzaDoce = document.getElementById("produtosPizzaDoce");

    [containerBebida, containerPizza, containerPizzaDoce].forEach(container => {
      if (container) container.innerHTML = "";
    });

    produtos.forEach(produto => {
      const box = document.createElement("div");
      box.className = "item";
      box.style.marginBottom = "10px";

      const label = document.createElement("span");
      label.textContent = `${produto.Nome || produto.nome} - R$ ${parseFloat(produto.Preco ?? produto.preco).toFixed(2)}`;

      const inputQtd = document.createElement("input");
      inputQtd.type = "number";
      inputQtd.value = 0;
      inputQtd.min = 0;

      const btnAdd = document.createElement("button");
      btnAdd.className = "add-btn";
      btnAdd.textContent = "Adicionar";

      btnAdd.addEventListener("click", () => {
        const quantidade = parseInt(inputQtd.value) || 0;
        if (quantidade <= 0) {
          alert("Digite uma quantidade maior que 0!");
          return;
        }

        const existente = carrinho.find(item => item.produto === (produto.Nome || produto.nome));
        if (existente) {
          existente.quantidade += quantidade;
        } else {
          carrinho.push({
            produto: produto.Nome || produto.nome,
            quantidade,
            preco: parseFloat(produto.Preco ?? produto.preco),
            tipo: produto.Tipo || produto.tipo
          });
        }

        atualizarCarrinho();
        inputQtd.value = 0;
      });

      box.appendChild(label);
      box.appendChild(inputQtd);
      box.appendChild(btnAdd);

      if ((produto.Tipo || produto.tipo) === "bebida" && containerBebida) containerBebida.appendChild(box);
      if ((produto.Tipo || produto.tipo) === "pizza" && containerPizza) containerPizza.appendChild(box);
      if ((produto.Tipo || produto.tipo) === "pizzaDoce" && containerPizzaDoce) containerPizzaDoce.appendChild(box);
    });
  }

  function atualizarListaProdutos() {
    if (!listaProdutosUL) return;
    listaProdutosUL.innerHTML = "";
    if (!Array.isArray(produtos) || produtos.length === 0) {
      const liEmpty = document.createElement("li");
      liEmpty.textContent = "Nenhum produto cadastrado.";
      listaProdutosUL.appendChild(liEmpty);
      return;
    }
    produtos.forEach((produto, index) => {
      const preco = parseFloat(produto.Preco ?? produto.preco).toFixed(2);
      const tipo = produto.Tipo ?? produto.tipo;
      const nome = produto.Nome ?? produto.nome;
      const li = document.createElement("li");
      li.textContent = `Código: ${index + 1} — ${nome} — R$ ${preco} — ${tipo}`;
      li.style.background = "#fff3ee";
      li.style.border = "1px solid #f0c2b3";
      li.style.borderRadius = "8px";
      li.style.padding = "6px";
      li.style.marginBottom = "6px";
      listaProdutosUL.appendChild(li);
    });
  }

  btnCadastrarProduto?.addEventListener("click", async () => {
    const nome = inputNomeProduto.value.trim();
    const preco = parseFloat(inputPrecoProduto.value);
    const tipo = selectTipoProduto.value;

    if (!nome || isNaN(preco) || preco <= 0 || !tipo) {
      alert("Preencha todos os campos corretamente!");
      return;
    }

    try {
      await fetch(`${API_BASE}/produtos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, preco, tipo })
      });
      inputNomeProduto.value = "";
      inputPrecoProduto.value = "";
      selectTipoProduto.value = "bebida";
      await carregarProdutos();
    } catch (err) {
      console.error(err);
      alert("Erro ao cadastrar produto");
    }
  });

  btnExcluirProduto?.addEventListener("click", async () => {
    const codigo = parseInt(inputCodigoExcluirProduto.value);
    if (isNaN(codigo) || codigo < 1 || codigo > produtos.length) {
      alert("Código inválido!");
      return;
    }
    const produto = produtos[codigo - 1];
    const id = produto.Id ?? produto.id;
    try {
      await fetch(`${API_BASE}/produtos/${id}`, { method: "DELETE" });
      inputCodigoExcluirProduto.value = "";
      await carregarProdutos();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir produto");
    }
  });

  // iniciar produtos
  carregarProdutos();

  // ==========================
  // ===== MENU PEDIDOS ======
  // ==========================
  const listaCarrinhoUL = document.getElementById("listaCarrinho");
  const btnFinalizar = document.getElementById("finalizarPedido");
  const totalCarrinhoSpan = document.getElementById("totalCarrinho");
  const selectCliente = document.getElementById("selectCliente");

  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  function atualizarSelectClientes() {
    if (!selectCliente) return;
    selectCliente.innerHTML = '<option value="">-- Escolha um cliente --</option>';
    listaClientes.forEach((cliente, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = `${index + 1} - ${cliente.Nome || cliente.nome}`;
      selectCliente.appendChild(option);
    });
  }

  function atualizarCarrinho() {
    if (!listaCarrinhoUL) return;
    listaCarrinhoUL.innerHTML = "";
    let total = 0;

    carrinho.forEach(item => {
      const li = document.createElement("li");
      const subtotal = item.quantidade * item.preco;
      total += subtotal;
      li.textContent = `${item.produto} - Quantidade: ${item.quantidade} - Subtotal: R$ ${subtotal.toFixed(2)}`;
      listaCarrinhoUL.appendChild(li);
    });

    if (totalCarrinhoSpan)
      totalCarrinhoSpan.textContent = `Total: R$ ${total.toFixed(2)}`;

    // salvamos o carrinho localmente enquanto usuário não finalizar
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
  }

  atualizarCarrinho();
  atualizarProdutosPedido();
  atualizarSelectClientes();

  btnFinalizar?.addEventListener("click", async () => {
    if (carrinho.length === 0) {
      alert("O carrinho está vazio!");
      return;
    }

    // Determinar cliente
    let clienteSelecionado = null;
    const selectClienteElement = document.getElementById("selectCliente");
    if (selectClienteElement && selectClienteElement.value !== "") {
      const idx = parseInt(selectClienteElement.value);
      clienteSelecionado = listaClientes[idx];
    } else {
      const clienteLogado = JSON.parse(localStorage.getItem("clienteLogado"));
      if (!clienteLogado) {
        alert("Nenhum cliente selecionado. Faça login ou selecione um cliente.");
        return;
      }
      clienteSelecionado = clienteLogado;
    }

    // Se clienteSelecionado não tem Id (visitante), cria no banco primeiro
    let clienteId = clienteSelecionado.Id ?? clienteSelecionado.id;
    if (!clienteId) {
      try {
        const resp = await fetch(`${API_BASE}/clientes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: clienteSelecionado.nome || clienteSelecionado.Nome || "Visitante",
            telefone: clienteSelecionado.telefone || clienteSelecionado.Telefone || "",
            endereco: clienteSelecionado.endereco || clienteSelecionado.Endereco || ""
          })
        });
        const data = await resp.json();
        clienteId = data.id;
      } catch (err) {
        console.error(err);
        alert("Erro ao criar cliente temporário.");
        return;
      }
    }

    // calcula total
    let total = 0;
    carrinho.forEach(item => total += (item.quantidade || 0) * (item.preco || 0));

    const novoPedido = {
      clienteId,
      itens: carrinho.map(item => ({
        produto: item.produto,
        quantidade: item.quantidade,
        preco: item.preco,
        tipo: item.tipo
      })),
      total
    };

    try {
      await fetch(`${API_BASE}/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoPedido)
      });
      alert("Pedido finalizado com sucesso!");
      carrinho = [];
      localStorage.removeItem("carrinho");
      atualizarCarrinho();
      // atualiza notas se houver
      if (typeof atualizarNotas === "function") atualizarNotas();
    } catch (err) {
      console.error(err);
      alert("Erro ao finalizar pedido");
    }
  });

  // ==========================
  // ===== MENU EMISSÃO =======
  // ==========================
  const listaNotasUL = document.getElementById("listaNotas");
  const btnLimparNotas = document.getElementById("limparNotas");

  async function atualizarNotas() {
    try {
      const res = await fetch(`${API_BASE}/pedidos`);
      const pedidos = await res.json();
      if (!listaNotasUL) return;
      listaNotasUL.innerHTML = "";

      if (!Array.isArray(pedidos) || pedidos.length === 0) {
        listaNotasUL.innerHTML = "<li>Nenhuma nota fiscal emitida ainda.</li>";
        return;
      }

      pedidos.forEach(pedido => {
        const li = document.createElement("li");
        li.style.background = "#fff3ee";
        li.style.border = "1px solid #f0c2b3";
        li.style.borderRadius = "10px";
        li.style.padding = "10px";
        li.style.marginBottom = "10px";

        li.innerHTML = `
          <strong>ID:</strong> ${pedido.id} <br>
          <strong>Data:</strong> ${pedido.data} <br>
          <strong>Cliente:</strong> ${pedido.cliente.nome || pedido.cliente.Nome}<br>
          <strong>Telefone:</strong> ${pedido.cliente.telefone || pedido.cliente.Telefone || ""}<br>
          <strong>Endereço:</strong> ${pedido.cliente.endereco || pedido.cliente.Endereco || ""}<br>
          <strong>Itens:</strong><br>
          ${pedido.itens.map(item =>
            `• ${item.produto} (x${item.quantidade}) - R$ ${(item.preco * item.quantidade).toFixed(2)}`
          ).join("<br>")}
          <br><strong>Total:</strong> R$ ${pedido.total.toFixed(2)}
        `;
        listaNotasUL.appendChild(li);
      });
    } catch (err) {
      console.error(err);
      if (listaNotasUL) listaNotasUL.innerHTML = "<li>Erro ao carregar notas.</li>";
    }
  }

  if (document.title.includes("Emissão")) {
    atualizarNotas();
    btnLimparNotas?.addEventListener("click", async () => {
      if (!confirm("Deseja realmente limpar todas as notas fiscais?")) return;
      // limpeza completa: excluir todas as linhas (atenção: operação destrutiva)
      try {
        // API não tem rota DELETE /pedidos/all para segurança; podemos remover no banco manualmente.
        alert("Para segurança, a limpeza de pedidos deve ser feita diretamente no banco.");
      } catch (err) {
        console.error(err);
        alert("Erro ao limpar notas");
      }
    });
  }

  // ==========================
  // ===== MENU RELATÓRIOS ====
  // ==========================
  const btnGerarRelatorio = document.getElementById("gerarRelatorio");
  const inputDataRelatorio = document.getElementById("dataRelatorio");
  const resultadoRelatorio = document.getElementById("resultadoRelatorio");

  if (btnGerarRelatorio) {
    btnGerarRelatorio.addEventListener("click", async () => {
      const dataSelecionada = inputDataRelatorio.value;
      if (!dataSelecionada) {
        alert("Selecione uma data para gerar o relatório!");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/relatorio?data=${dataSelecionada}`);
        const json = await res.json();
        resultadoRelatorio.innerHTML = `
          <h3> Relatório de ${new Date(dataSelecionada).toLocaleDateString("pt-BR")}</h3>
          <p><strong>Pizzas vendidas:</strong> ${json.vendidosPorTipo.pizza}</p>
          <p><strong>Pizzas doces vendidas:</strong> ${json.vendidosPorTipo.pizzaDoce}</p>
          <p><strong>Bebidas vendidas:</strong> ${json.vendidosPorTipo.bebida}</p>
          <hr>
          <p><strong>Total do dia:</strong> R$ ${json.totalDia.toFixed(2)}</p>
          <p><strong>Pedidos no dia:</strong> ${json.pedidosCount}</p>
        `;
      } catch (err) {
        console.error(err);
        alert("Erro ao gerar relatório");
      }
    });
  }

  // ==========================
  // ===== LOGINS / CADASTROS ==
  // ==========================
  const btnLoginFunc = document.getElementById('btnLoginFunc');
  if (btnLoginFunc) {
    btnLoginFunc.addEventListener('click', async () => {
      const login = document.getElementById('loginFunc').value.trim();
      const senha = document.getElementById('senhaFunc').value.trim();
      const erro = document.getElementById('erroLogin');

      try {
        const res = await fetch(`${API_BASE}/login/funcionario`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login, senha })
        });
        if (res.ok) {
          erro.style.display = 'none';
          window.location.href = 'pedido.html';
        } else {
          erro.style.display = 'block';
        }
      } catch (err) {
        console.error(err);
        erro.style.display = 'block';
      }
    });
  }

  // cadastro de cliente na tela inicial
  const btnCadastrarCliente = document.getElementById('btnCadastrarCliente');
  if (btnCadastrarCliente) {
    btnCadastrarCliente.addEventListener('click', async () => {
      const nome = document.getElementById('nomeCliente').value.trim();
      const fone = document.getElementById('foneCliente').value.trim();
      const endereco = document.getElementById('enderecoCliente').value.trim();

      if (!nome || !fone || !endereco) {
        alert('Preencha todos os campos!');
        return;
      }

      try {
        await fetch(`${API_BASE}/clientes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, telefone: fone, endereco })
        });
        alert('Cliente cadastrado com sucesso!');
        document.getElementById('nomeCliente').value = '';
        document.getElementById('foneCliente').value = '';
        document.getElementById('enderecoCliente').value = '';
        await carregarClientes();
      } catch (err) {
        console.error(err);
        alert('Erro ao cadastrar cliente');
      }
    });
  }

  // login cliente
  const btnLoginCliente = document.getElementById("btnLoginCliente");
  btnLoginCliente?.addEventListener("click", async () => {
    const nome = document.getElementById("loginNomeCliente").value.trim();
    const telefone = document.getElementById("loginFoneCliente").value.trim();
    const erro = document.getElementById("erroLoginCliente");

    try {
      const res = await fetch(`${API_BASE}/login/cliente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, telefone })
      });
      if (!res.ok) {
        erro.style.display = "block";
        return;
      }
      const cliente = await res.json();
      localStorage.setItem("clienteLogado", JSON.stringify({ id: cliente.Id ?? cliente.id, nome: cliente.Nome ?? cliente.nome, telefone: cliente.Telefone ?? cliente.telefone, endereco: cliente.Endereco ?? cliente.endereco }));
      window.location.href = "pedidoCliente.html";
    } catch (err) {
      console.error(err);
      erro.style.display = "block";
    }
  });

  // visitante
  const btnEntrarVisitante = document.getElementById("btnEntrarVisitante");
  btnEntrarVisitante?.addEventListener("click", () => {
    const visitante = {
      nome: "Visitante",
      telefone: "0000-0000",
      endereco: "------------"
    };
    localStorage.setItem("clienteLogado", JSON.stringify(visitante));
    window.location.href = "pedidoCliente.html";
  });

});
