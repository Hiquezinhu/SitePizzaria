// ============================================================================
//                            DEFINIÇÕES DE TIPOS (INTERFACES)
// ============================================================================
// As interfaces abaixo servem para tipar os objetos usados no sistema.
// Isso ajuda o TypeScript a verificar se estamos usando os dados corretamente
// (por exemplo, não tentar acessar uma propriedade que não existe).

interface Cliente {
  // Em alguns lugares ou no backend o ID pode vir como "Id" (primeira maiúscula)
  Id?: number;
  // Em outros casos pode vir como "id" (minúscula). Por isso temos os dois.
  id?: number;
  // Mesmo raciocínio para Nome/nome
  Nome?: string;
  nome?: string;
  // Telefone/telefone
  Telefone?: string;
  telefone?: string;
  // Endereco/endereco
  Endereco?: string;
  endereco?: string;
}

interface Produto {
  // Mesma ideia de duplicidade de propriedades (Id/id, Nome/nome etc.)
  Id?: number;
  id?: number;
  Nome?: string;
  nome?: string;
  Preco?: number;
  preco?: number;
  Tipo?: string; // Ex.: "pizza", "pizzaDoce", "bebida"
  tipo?: string;
}

// Estrutura de um item que está no carrinho (antes de virar pedido)
interface ItemCarrinho {
  produto: string;    // Nome do produto
  quantidade: number; // Quantidade escolhida pelo cliente
  preco: number;      // Preço unitário do produto
  tipo: string;       // Tipo do produto (pizza, bebida, etc.)
}

// Estrutura de cada item quando o pedido é finalizado
interface ItemPedido {
  produto: string;
  quantidade: number;
  preco: number;
  tipo: string;
}

// Estrutura do objeto que será enviado ao backend ao finalizar um pedido
interface NovoPedido {
  clienteId: number;     // ID do cliente no banco
  itens: ItemPedido[];   // Lista de itens do pedido
  total: number;         // Valor total do pedido
}

// Estrutura que representa um pedido completo vindo do backend
interface PedidoCompleto {
  id: number;            // ID do pedido
  data: string;          // Data/hora da emissão (como string)
  cliente: Cliente;      // Dados do cliente associado
  itens: ItemPedido[];   // Lista de itens do pedido
  total: number;         // Total do pedido
}

// Estrutura esperada da resposta da rota de relatório
interface RelatorioResponse {
  vendidosPorTipo: {
    pizza: number;       // Quantidade de pizzas comuns vendidas
    pizzaDoce: number;   // Quantidade de pizzas doces vendidas
    bebida: number;      // Quantidade de bebidas vendidas
  };
  totalDia: number;      // Soma em R$ de todos os pedidos do dia
  pedidosCount: number;  // Quantidade de pedidos no dia
}

// Estrutura esperada quando criamos um cliente e o backend retorna o ID
interface ClienteResponse {
  id: number;
}

// ============================================================================
//                    INÍCIO DO CÓDIGO – APÓS O DOM SER CARREGADO
// ============================================================================
// Usamos DOMContentLoaded para ter certeza de que TODOS os elementos HTML
// já existem na página antes de tentarmos acessá-los com document.getElementById.
document.addEventListener("DOMContentLoaded", (): void => {
  // Base da URL da API. Se o backend mudar de porta ou host, é só mudar aqui.
  const API_BASE: string = "http://localhost:3000";

  // ==========================================================================
  // =============================== MENU CLIENTES =============================
  // ==========================================================================

  // Seleciona a UL onde a lista de clientes será exibida na tela.
  const listaClientesUL: HTMLUListElement | null =
    document.getElementById("listaClientes") as HTMLUListElement | null;

  // Botão que, quando clicado, cadastra um novo cliente (no painel admin).
  const btnCadastrar: HTMLButtonElement | null =
    document.getElementById("cadastrarCliente") as HTMLButtonElement | null;

  // Inputs dos campos de cadastro de cliente no painel admin.
  const inputNome: HTMLInputElement | null =
    document.getElementById("nome") as HTMLInputElement | null;

  const inputTelefone: HTMLInputElement | null =
    document.getElementById("telefone") as HTMLInputElement | null;

  const inputEndereco: HTMLInputElement | null =
    document.getElementById("endereco") as HTMLInputElement | null;

  // Campo onde o administrador digita o "código" do cliente para excluir.
  // Esse código é o índice da lista (1, 2, 3...) e NÃO o ID do banco.
  const inputExcluirCodigo: HTMLInputElement | null =
    document.getElementById("codigoExcluir") as HTMLInputElement | null;

  // Botão para excluir um cliente com base no código informado.
  const btnExcluir: HTMLButtonElement | null =
    document.getElementById("excluirCliente") as HTMLButtonElement | null;

  // Array que mantém em memória a lista de clientes carregados do backend.
  let listaClientes: Cliente[] = [];

  // --------------------------------------------------------------------------
  // Função assíncrona que faz a requisição para buscar os clientes no backend.
  // Ela também atualiza a lista na tela e o select de clientes (usado nos pedidos).
  async function carregarClientes(): Promise<void> {
    try {
      // Faz uma requisição GET para a rota /clientes do backend.
      const res: Response = await fetch(`${API_BASE}/clientes`);

      // Converte a resposta para JSON e garante que o tipo é Cliente[].
      listaClientes = (await res.json()) as Cliente[];

      // Atualiza a lista que aparece no painel de clientes.
      atualizarListaClientes();

      // Atualiza o dropdown usado na parte de pedidos para selecionar um cliente.
      atualizarSelectClientes();
    } catch (err) {
      // Se algo der errado (erro de conexão, backend parado, etc), cai aqui.
      console.error(err);
      alert("Erro ao carregar clientes do servidor.");
    }
  }

  // --------------------------------------------------------------------------
  // Função responsável por reconstruir visualmente a lista de clientes na UL.
  function atualizarListaClientes(): void {
    // Se não existe o elemento na página atual, simplesmente aborta a função.
    if (!listaClientesUL) return;

    // Limpa todo o conteúdo da UL para evitar duplicação.
    listaClientesUL.innerHTML = "";

    // Percorre o array listaClientes e cria um <li> para cada cliente.
    listaClientes.forEach((cliente: Cliente, index: number): void => {
      const li: HTMLLIElement = document.createElement("li");

      // Monta uma string com o "código" (index + 1) e as informações do cliente.
      // Usamos || para pegar a propriedade que estiver preenchida (Nome ou nome, etc).
      li.textContent = `Código: ${index + 1} - Nome: ${cliente.Nome || cliente.nome} - Telefone: ${
        cliente.Telefone || cliente.telefone
      } - Endereço: ${cliente.Endereco || cliente.endereco}`;

      // Adiciona o <li> na lista UL.
      listaClientesUL.appendChild(li);
    });
  }

  // --------------------------------------------------------------------------
  // Evento de clique do botão de cadastro de cliente.
  // Quando o usuário clica, pegamos os valores dos inputs e enviamos para a API.
  btnCadastrar?.addEventListener("click", async (): Promise<void> => {
    // .trim() remove espaços extras no começo e fim.
    const nome: string = inputNome!.value.trim();
    const telefone: string = inputTelefone!.value.trim();
    const endereco: string = inputEndereco!.value.trim();

    // Validação simples para garantir que todos os campos foram preenchidos.
    if (!nome || !telefone || !endereco) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      // Faz um POST para /clientes com os dados do novo cliente.
      await fetch(`${API_BASE}/clientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // Diz que o corpo é JSON.
        body: JSON.stringify({ nome, telefone, endereco }) // Converte o objeto para JSON.
      });

      // Se chegou até aqui, significa que o cadastro deu certo.
      // Agora limpamos os campos do formulário.
      inputNome!.value = "";
      inputTelefone!.value = "";
      inputEndereco!.value = "";

      // E recarregamos a lista de clientes para exibir o novo.
      await carregarClientes();
    } catch (err) {
      // Em caso de erro (backend fora do ar, erro interno, etc).
      console.error(err);
      alert("Erro ao cadastrar cliente");
    }
  });

  // --------------------------------------------------------------------------
  // Evento de clique do botão de exclusão de cliente.
  // O usuário digita um código (posição na lista) e o sistema converte isso
  // para o ID real do cliente e manda a requisição DELETE para o backend.
  btnExcluir?.addEventListener("click", async (): Promise<void> => {
    // Converte o valor do input para número.
    const codigo: number = parseInt(inputExcluirCodigo!.value);

    // Validação: precisa ser um número válido dentro do intervalo da lista.
    if (isNaN(codigo) || codigo < 1 || codigo > listaClientes.length) {
      alert("Código inválido!");
      return;
    }

    // Pega o cliente correspondente ao código (índice = código - 1).
    const cliente: Cliente = listaClientes[codigo - 1];

    // Se por algum motivo não encontrar um cliente ou ele não tiver Id/id,
    // mostramos um alerta e paramos.
    if (!cliente || (!cliente.Id && !cliente.id)) {
      alert("Cliente inválido.");
      return;
    }

    // Pega o ID real do cliente, preferindo Cliente.Id, e se não existir, Cliente.id.
    // O operador ?? significa: "se não for null/undefined, use esse valor, senão use o outro".
    const id: number = cliente.Id ?? cliente.id!;

    try {
      // Envia uma requisição DELETE para /clientes/:id.
      await fetch(`${API_BASE}/clientes/${id}`, { method: "DELETE" });

      // Limpa o campo de código.
      inputExcluirCodigo!.value = "";

      // Recarrega a lista de clientes para refletir a exclusão.
      await carregarClientes();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir cliente");
    }
  });

  // Chamamos carregarClientes assim que a página carrega para ter a lista inicial.
  carregarClientes();

  // ==========================================================================
  // =============================== MENU PRODUTOS =============================
  // ==========================================================================

  // Inputs/elementos do módulo de produtos (cadastro, listagem, exclusão).
  const inputNomeProduto: HTMLInputElement | null =
    document.getElementById("nomeProduto") as HTMLInputElement | null;

  const inputPrecoProduto: HTMLInputElement | null =
    document.getElementById("precoProduto") as HTMLInputElement | null;

  const selectTipoProduto: HTMLSelectElement | null =
    document.getElementById("tipoProduto") as HTMLSelectElement | null;

  const btnCadastrarProduto: HTMLButtonElement | null =
    document.getElementById("cadastrarProduto") as HTMLButtonElement | null;

  const inputCodigoExcluirProduto: HTMLInputElement | null =
    document.getElementById("codigoExcluirProduto") as HTMLInputElement | null;

  const btnExcluirProduto: HTMLButtonElement | null =
    document.getElementById("excluirProduto") as HTMLButtonElement | null;

  const listaProdutosUL: HTMLUListElement | null =
    document.getElementById("listaProdutos") as HTMLUListElement | null;

  // Array que vai armazenar todos os produtos vindos do backend.
  let produtos: Produto[] = [];

  // --------------------------------------------------------------------------
  // Função que carrega os produtos do backend e atualiza as duas visões:
  // 1) A visão para cadastrar/excluir (lista textual bonita)
  // 2) A visão de produtos disponíveis para o pedido (com botões "Adicionar")
  async function carregarProdutos(): Promise<void> {
    try {
      const res: Response = await fetch(`${API_BASE}/produtos`);
      produtos = (await res.json()) as Produto[];

      // Atualiza os produtos disponíveis na tela de pedido.
      atualizarProdutosPedido();

      // Atualiza a lista textual de produtos cadastrados no painel admin.
      atualizarListaProdutos();
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar produtos");
    }
  }

  // --------------------------------------------------------------------------
  // Função que monta os produtos na tela de pedido (divididos em categorias).
  // Aqui criamos dinamicamente elementos HTML para cada produto e
  // adicionamos os inputs de quantidade e o botão "Adicionar".
  function atualizarProdutosPedido(): void {
    // Containers onde os produtos serão exibidos, separados por tipo.
    const containerBebida: HTMLElement | null = document.getElementById("produtosBebida");
    const containerPizza: HTMLElement | null = document.getElementById("produtosPizza");
    const containerPizzaDoce: HTMLElement | null = document.getElementById("produtosPizzaDoce");

    // Primeiro limpamos todos os containers para evitar duplicações.
    [containerBebida, containerPizza, containerPizzaDoce].forEach(
      (container: HTMLElement | null): void => {
        if (container) container.innerHTML = "";
      }
    );

    // Percorremos todos os produtos.
    produtos.forEach((produto: Produto): void => {
      // Cria uma caixa (div) para representar visualmente o produto.
      const box: HTMLDivElement = document.createElement("div");
      box.className = "item";
      box.style.marginBottom = "10px";

      // Cria o rótulo com nome e preço formatado.
      const label: HTMLSpanElement = document.createElement("span");
      label.textContent = `${produto.Nome || produto.nome} - R$ ${parseFloat(
        String(produto.Preco ?? produto.preco)
      ).toFixed(2)}`;

      // Cria o input de quantidade.
      const inputQtd: HTMLInputElement = document.createElement("input");
      inputQtd.type = "number";
      inputQtd.value = "0";
      inputQtd.min = "0";

      // Botão "Adicionar" para colocar o produto no carrinho.
      const btnAdd: HTMLButtonElement = document.createElement("button");
      btnAdd.className = "add-btn";
      btnAdd.textContent = "Adicionar";

      // Evento de clique do botão "Adicionar".
      btnAdd.addEventListener("click", (): void => {
        // Converte valor do input para número. Se der NaN, cai para 0.
        const quantidade: number = parseInt(inputQtd.value) || 0;

        // Valida se a quantidade é maior que 0.
        if (quantidade <= 0) {
          alert("Digite uma quantidade maior que 0!");
          return;
        }

        // Verifica se o produto já existe no carrinho.
        const existente: ItemCarrinho | undefined = carrinho.find(
          (item: ItemCarrinho): boolean =>
            item.produto === (produto.Nome || produto.nome)
        );

        if (existente) {
          // Se já existe, apenas soma a quantidade escolhida.
          existente.quantidade += quantidade;
        } else {
          // Se não existe, criamos um novo objeto ItemCarrinho e colocamos no array.
          carrinho.push({
            produto: produto.Nome || produto.nome!, // usa o valor que existir
            quantidade,
            preco: parseFloat(String(produto.Preco ?? produto.preco)), // garante número
            tipo: produto.Tipo || produto.tipo! // pega o tipo correto
          });
        }

        // Atualiza a lista do carrinho na tela e o total.
        atualizarCarrinho();

        // Reseta o campo de quantidade para "0" para evitar reuso sem querer.
        inputQtd.value = "0";
      });

      // Monta a estrutura visual: label + inputQtd + botão.
      box.appendChild(label);
      box.appendChild(inputQtd);
      box.appendChild(btnAdd);

      // Descobre o tipo do produto para saber em qual container inserir.
      const tipoProduto: string | undefined = produto.Tipo || produto.tipo;

      // Insere o box no container correspondente ao tipo do produto.
      if (tipoProduto === "bebida" && containerBebida) containerBebida.appendChild(box);
      if (tipoProduto === "pizza" && containerPizza) containerPizza.appendChild(box);
      if (tipoProduto === "pizzaDoce" && containerPizzaDoce) containerPizzaDoce.appendChild(box);
    });
  }

  // --------------------------------------------------------------------------
  // Lista de produtos exibida no painel admin.
  // Aqui mostramos um resumo com código, nome, preço e tipo.
  function atualizarListaProdutos(): void {
    if (!listaProdutosUL) return;

    // Limpa lista antes de reconstruir.
    listaProdutosUL.innerHTML = "";

    // Se não houver produtos, mostra uma mensagem padrão.
    if (!Array.isArray(produtos) || produtos.length === 0) {
      const liEmpty: HTMLLIElement = document.createElement("li");
      liEmpty.textContent = "Nenhum produto cadastrado.";
      listaProdutosUL.appendChild(liEmpty);
      return;
    }

    // Para cada produto, criamos um <li> com um estilo visual agradável.
    produtos.forEach((produto: Produto, index: number): void => {
      // Formata o preço com 2 casas decimais.
      const preco: string = parseFloat(String(produto.Preco ?? produto.preco)).toFixed(2);
      // Pega o tipo, considerando ambos Tipo/tipo.
      const tipo: string = produto.Tipo ?? produto.tipo!;
      // Pega o nome, considerando ambos Nome/nome.
      const nome: string = produto.Nome ?? produto.nome!;

      const li: HTMLLIElement = document.createElement("li");
      li.textContent = `Código: ${index + 1} — ${nome} — R$ ${preco} — ${tipo}`;

      // Aplica alguns estilos diretamente via JS (poderia ser via CSS também).
      li.style.background = "#fff3ee";
      li.style.border = "1px solid #f0c2b3";
      li.style.borderRadius = "8px";
      li.style.padding = "6px";
      li.style.marginBottom = "6px";

      listaProdutosUL.appendChild(li);
    });
  }

  // --------------------------------------------------------------------------
  // Evento para cadastrar um produto novo.
  btnCadastrarProduto?.addEventListener("click", async (): Promise<void> => {
    const nome: string = inputNomeProduto!.value.trim();
    const preco: number = parseFloat(inputPrecoProduto!.value);
    const tipo: string = selectTipoProduto!.value;

    // Validação: nome não pode ser vazio, preço precisa ser número > 0, tipo não pode ser vazio.
    if (!nome || isNaN(preco) || preco <= 0 || !tipo) {
      alert("Preencha todos os campos corretamente!");
      return;
    }

    try {
      // Envia o novo produto para o backend via POST.
      await fetch(`${API_BASE}/produtos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, preco, tipo })
      });

      // Limpa os campos e volta o tipo padrão para "bebida" (pode ser qualquer default).
      inputNomeProduto!.value = "";
      inputPrecoProduto!.value = "";
      selectTipoProduto!.value = "bebida";

      // Recarrega os produtos na interface.
      await carregarProdutos();
    } catch (err) {
      console.error(err);
      alert("Erro ao cadastrar produto");
    }
  });

  // --------------------------------------------------------------------------
  // Evento para excluir um produto com base no "código" (posição na lista).
  btnExcluirProduto?.addEventListener("click", async (): Promise<void> => {
    const codigo: number = parseInt(inputCodigoExcluirProduto!.value);

    // Valida o código: precisa estar dentro do intervalo de produtos.
    if (isNaN(codigo) || codigo < 1 || codigo > produtos.length) {
      alert("Código inválido!");
      return;
    }

    const produto: Produto = produtos[codigo - 1];

    // Pega o ID real do produto, considerando Id/id.
    const id: number = produto.Id ?? produto.id!;

    try {
      // Envia DELETE para /produtos/:id.
      await fetch(`${API_BASE}/produtos/${id}`, { method: "DELETE" });

      // Limpa o campo e recarrega a lista.
      inputCodigoExcluirProduto!.value = "";
      await carregarProdutos();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir produto");
    }
  });

  // Logo que o DOM carrega, buscamos os produtos para listar na UI.
  carregarProdutos();

  // ==========================================================================
  // =============================== MENU PEDIDOS ==============================
  // ==========================================================================

  // Elemento UL que lista os itens do carrinho.
  const listaCarrinhoUL: HTMLUListElement | null =
    document.getElementById("listaCarrinho") as HTMLUListElement | null;

  // Botão para finalizar o pedido (enviar ao backend).
  const btnFinalizar: HTMLButtonElement | null =
    document.getElementById("finalizarPedido") as HTMLButtonElement | null;

  // Span que exibe o total do carrinho.
  const totalCarrinhoSpan: HTMLSpanElement | null =
    document.getElementById("totalCarrinho") as HTMLSpanElement | null;

  // Select que permite selecionar um cliente existente para o pedido.
  const selectCliente: HTMLSelectElement | null =
    document.getElementById("selectCliente") as HTMLSelectElement | null;

  // O carrinho é salvo no localStorage para persistir mesmo se a página recarregar.
  // Se não existir nada, usamos "[]" como valor padrão.
  let carrinho: ItemCarrinho[] = JSON.parse(localStorage.getItem("carrinho") || "[]") as ItemCarrinho[];

  // --------------------------------------------------------------------------
  // Atualiza o <select> de clientes na tela de pedidos.
  function atualizarSelectClientes(): void {
    if (!selectCliente) return;

    // Começa com uma opção padrão "Escolha um cliente".
    selectCliente.innerHTML = '<option value="">-- Escolha um cliente --</option>';

    // Para cada cliente, cria uma <option> com o índice e o nome.
    listaClientes.forEach((cliente: Cliente, index: number): void => {
      const option: HTMLOptionElement = document.createElement("option");
      // O value guarda o índice do cliente dentro do array listaClientes.
      option.value = String(index);
      option.textContent = `${index + 1} - ${cliente.Nome || cliente.nome}`;
      selectCliente.appendChild(option);
    });
  }

  // --------------------------------------------------------------------------
  // Atualiza a listagem do carrinho na tela e calcula o total.
  function atualizarCarrinho(): void {
    if (!listaCarrinhoUL) return;

    // Limpa a lista de itens na UI.
    listaCarrinhoUL.innerHTML = "";

    // Variável para acumular o valor total.
    let total: number = 0;

    // Percorre todos os itens do carrinho.
    carrinho.forEach((item: ItemCarrinho): void => {
      const li: HTMLLIElement = document.createElement("li");

      // Subtotal = quantidade * preço unitário.
      const subtotal: number = item.quantidade * item.preco;
      total += subtotal;

      li.textContent = `${item.produto} - Quantidade: ${item.quantidade} - Subtotal: R$ ${subtotal.toFixed(
        2
      )}`;

      listaCarrinhoUL.appendChild(li);
    });

    // Atualiza o span de total, se ele existir.
    if (totalCarrinhoSpan)
      totalCarrinhoSpan.textContent = `Total: R$ ${total.toFixed(2)}`;

    // Salva o carrinho atualizado no localStorage para persistência.
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
  }

  // Atualiza a UI do carrinho e os produtos (caso ainda não estejam atualizados).
  atualizarCarrinho();
  atualizarProdutosPedido();
  atualizarSelectClientes();

  // --------------------------------------------------------------------------
  // Evento de finalização de pedido.
  // Essa função:
  // 1) Verifica se o carrinho tem itens
  // 2) Determina qual cliente está fazendo o pedido (select ou clienteLogado)
  // 3) Garante que o cliente tenha ID (criando no banco se for visitante)
  // 4) Monta o objeto NovoPedido
  // 5) Envia para /pedidos
  btnFinalizar?.addEventListener("click", async (): Promise<void> => {
    // Se não há itens no carrinho, não faz sentido finalizar.
    if (carrinho.length === 0) {
      alert("O carrinho está vazio!");
      return;
    }

    // Armazenará o cliente escolhido ou logado.
    let clienteSelecionado: Cliente | null = null;

    // Pega o select de cliente de novo (por segurança).
    const selectClienteElement: HTMLSelectElement | null =
      document.getElementById("selectCliente") as HTMLSelectElement | null;

    // Se o select existe e o usuário escolheu algum (value != "").
    if (selectClienteElement && selectClienteElement.value !== "") {
      // O value é o índice no array listaClientes.
      const idx: number = parseInt(selectClienteElement.value);
      clienteSelecionado = listaClientes[idx];
    } else {
      // Se não escolheu pelo select, tentamos pegar o clienteLogado do localStorage.
      const clienteLogado: Cliente | null = JSON.parse(
        localStorage.getItem("clienteLogado") || "null"
      ) as Cliente | null;

      if (!clienteLogado) {
        // Se também não tem clienteLogado, não tem como continuar.
        alert("Nenhum cliente selecionado. Faça login ou selecione um cliente.");
        return;
      }

      clienteSelecionado = clienteLogado;
    }

    // Agora garantimos que esse cliente tenha um ID de verdade no banco.
    // Se for um cliente visitante, ele costuma não ter ID.
    let clienteId: number | undefined = clienteSelecionado.Id ?? clienteSelecionado.id;

    // Se o cliente não tem id, precisamos criar o registro dele no banco.
    if (!clienteId) {
      try {
        const resp: Response = await fetch(`${API_BASE}/clientes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Aproveitamos os dados que existem, caindo em "Visitante" e strings vazias se faltar algo.
            nome: clienteSelecionado.nome || clienteSelecionado.Nome || "Visitante",
            telefone: clienteSelecionado.telefone || clienteSelecionado.Telefone || "",
            endereco: clienteSelecionado.endereco || clienteSelecionado.Endereco || ""
          })
        });

        // Espera que a API responda com pelo menos { id: number }.
        const data: ClienteResponse = (await resp.json()) as ClienteResponse;
        clienteId = data.id; // salva o novo ID
      } catch (err) {
        console.error(err);
        alert("Erro ao criar cliente temporário.");
        return;
      }
    }

    // Agora calculamos o total do carrinho para garantir um valor consistente.
    let total: number = 0;
    carrinho.forEach((item: ItemCarrinho): void => {
      total += (item.quantidade || 0) * (item.preco || 0);
    });

    // Montamos o objeto do novo pedido no formato esperado pela API.
    const novoPedido: NovoPedido = {
      clienteId: clienteId!, // aqui já temos certeza que existe um ID
      itens: carrinho.map(
        (item: ItemCarrinho): ItemPedido => ({
          produto: item.produto,
          quantidade: item.quantidade,
          preco: item.preco,
          tipo: item.tipo
        })
      ),
      total
    };

    try {
      // Envia o pedido finalizado para o backend.
      await fetch(`${API_BASE}/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoPedido)
      });

      alert("Pedido finalizado com sucesso!");

      // Zera carrinho em memória e no localStorage.
      carrinho = [];
      localStorage.removeItem("carrinho");

      // Atualiza a UI do carrinho.
      atualizarCarrinho();

      // Se a função atualizarNotas existir (na página de emissão), chamamos.
      // typeof atualizarNotas === "function" evita erro se a função não estiver disponível.
      if (typeof atualizarNotas === "function") atualizarNotas();
    } catch (err) {
      console.error(err);
      alert("Erro ao finalizar pedido");
    }
  });

  // ==========================================================================
  // ============================ MENU EMISSÃO (NOTAS) =========================
  // ==========================================================================

  // UL onde as notas fiscais (pedidos) serão listadas.
  const listaNotasUL: HTMLUListElement | null =
    document.getElementById("listaNotas") as HTMLUListElement | null;

  // Botão para "limpar" notas. Aqui, pela segurança, não faz um DELETE real.
  const btnLimparNotas: HTMLButtonElement | null =
    document.getElementById("limparNotas") as HTMLButtonElement | null;

  // --------------------------------------------------------------------------
  // Função responsável por buscar todos os pedidos e exibir em formato de "nota fiscal".
  async function atualizarNotas(): Promise<void> {
    try {
      // Busca todos os pedidos no backend.
      const res: Response = await fetch(`${API_BASE}/pedidos`);
      const pedidos: PedidoCompleto[] = (await res.json()) as PedidoCompleto[];

      // Se não tiver UL na página atual, não há o que atualizar.
      if (!listaNotasUL) return;

      // Limpa qualquer conteúdo anterior.
      listaNotasUL.innerHTML = "";

      // Se não há pedidos, mostra uma mensagem padrão.
      if (!Array.isArray(pedidos) || pedidos.length === 0) {
        listaNotasUL.innerHTML = "<li>Nenhuma nota fiscal emitida ainda.</li>";
        return;
      }

      // Para cada pedido, criamos um <li> com informações formatadas.
      pedidos.forEach((pedido: PedidoCompleto): void => {
        const li: HTMLLIElement = document.createElement("li");

        // Aplica um estilo de "cartão" de nota fiscal.
        li.style.background = "#fff3ee";
        li.style.border = "1px solid #f0c2b3";
        li.style.borderRadius = "10px";
        li.style.padding = "10px";
        li.style.marginBottom = "10px";

        // Monta o HTML interno com as informações do pedido.
        // Usamos template string para montar tudo em um bloco.
        li.innerHTML = `
          <strong>ID:</strong> ${pedido.id} <br>
          <strong>Data:</strong> ${pedido.data} <br>
          <strong>Cliente:</strong> ${pedido.cliente.nome || pedido.cliente.Nome}<br>
          <strong>Telefone:</strong> ${pedido.cliente.telefone || pedido.cliente.Telefone || ""}<br>
          <strong>Endereço:</strong> ${pedido.cliente.endereco || pedido.cliente.Endereco || ""}<br>
          <strong>Itens:</strong><br>
          ${pedido.itens
            .map(
              (item: ItemPedido): string =>
                `• ${item.produto} (x${item.quantidade}) - R$ ${(item.preco * item.quantidade).toFixed(
                  2
                )}`
            )
            .join("<br>")}
          <br><strong>Total:</strong> R$ ${pedido.total.toFixed(2)}
        `;

        listaNotasUL.appendChild(li);
      });
    } catch (err) {
      console.error(err);
      if (listaNotasUL) listaNotasUL.innerHTML = "<li>Erro ao carregar notas.</li>";
    }
  }

  // Se o título da página contém a palavra "Emissão",
  // entendemos que estamos na tela de emissão de notas e executamos a lógica específica.
  if (document.title.includes("Emissão")) {
    // Carrega as notas assim que a página abre.
    atualizarNotas();

    // Botão de "limpar notas" (mas aqui não limpa de verdade no banco, é apenas um aviso).
    btnLimparNotas?.addEventListener("click", async (): Promise<void> => {
      if (!confirm("Deseja realmente limpar todas as notas fiscais?")) return;

      // Por segurança, o sistema não oferece rota para apagar todos os pedidos via UI.
      alert("Para segurança, a limpeza de pedidos deve ser feita diretamente no banco.");
    });
  }

  // ==========================================================================
  // ============================== MENU RELATÓRIOS ============================
  // ==========================================================================

  // Botão que dispara a geração do relatório para uma data específica.
  const btnGerarRelatorio: HTMLButtonElement | null =
    document.getElementById("gerarRelatorio") as HTMLButtonElement | null;

  // Campo do tipo date onde o usuário escolhe a data do relatório.
  const inputDataRelatorio: HTMLInputElement | null =
    document.getElementById("dataRelatorio") as HTMLInputElement | null;

  // Div/elemento onde o resultado do relatório será exibido.
  const resultadoRelatorio: HTMLElement | null =
    document.getElementById("resultadoRelatorio");

  // --------------------------------------------------------------------------
  // Evento de clique do botão "Gerar Relatório".
  if (btnGerarRelatorio) {
    btnGerarRelatorio.addEventListener("click", async (): Promise<void> => {
      const dataSelecionada: string = inputDataRelatorio!.value;

      // Se o usuário não escolheu uma data, avisamos.
      if (!dataSelecionada) {
        alert("Selecione uma data para gerar o relatório!");
        return;
      }

      try {
        // Chama a rota /relatorio com query string ?data=YYYY-MM-DD.
        const res: Response = await fetch(`${API_BASE}/relatorio?data=${dataSelecionada}`);
        const json: RelatorioResponse = (await res.json()) as RelatorioResponse;

        // Monta o HTML do relatório com base na resposta.
        resultadoRelatorio!.innerHTML = `
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

  // ==========================================================================
  // ============================ LOGINS / CADASTROS ===========================
  // ==========================================================================

  // ------------------------- LOGIN FUNCIONÁRIO -------------------------------

  // Botão de login do funcionário (painel admin).
  const btnLoginFunc: HTMLButtonElement | null =
    document.getElementById("btnLoginFunc") as HTMLButtonElement | null;

  if (btnLoginFunc) {
    btnLoginFunc.addEventListener("click", async (): Promise<void> => {
      // Pegamos login e senha dos campos.
      const login: string = (document.getElementById("loginFunc") as HTMLInputElement).value.trim();
      const senha: string = (document.getElementById("senhaFunc") as HTMLInputElement).value.trim();

      // Elemento onde vamos mostrar erro de login (ex: "Login inválido").
      const erro: HTMLElement | null = document.getElementById("erroLogin");

      try {
        // Envia login e senha para a rota de autenticação do funcionário.
        const res: Response = await fetch(`${API_BASE}/login/funcionario`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ login, senha })
        });

        if (res.ok) {
          // Se o backend respondeu 200 OK, escondemos a mensagem de erro.
          erro!.style.display = "none";

          // Redireciona para a página de pedidos do funcionário (admin).
          window.location.href = "pedido.html";
        } else {
          // Se não for OK (401, 403, etc), mostramos o erro.
          erro!.style.display = "block";
        }
      } catch (err) {
        console.error(err);
        // Em caso de erro de rede ou backend, também mostra erro.
        erro!.style.display = "block";
      }
    });
  }

  // ---------------------- CADASTRO DE CLIENTE (TELA INICIAL) -----------------

  // Botão que cadastra cliente na tela inicial (site público).
  const btnCadastrarCliente: HTMLButtonElement | null =
    document.getElementById("btnCadastrarCliente") as HTMLButtonElement | null;

  if (btnCadastrarCliente) {
    btnCadastrarCliente.addEventListener("click", async (): Promise<void> => {
      // Captura dados dos inputs dessa tela.
      const nome: string = (document.getElementById("nomeCliente") as HTMLInputElement).value.trim();
      const fone: string = (document.getElementById("foneCliente") as HTMLInputElement).value.trim();
      const endereco: string = (document.getElementById("enderecoCliente") as HTMLInputElement).value.trim();

      // Validação simples: não permite campos vazios.
      if (!nome || !fone || !endereco) {
        alert("Preencha todos os campos!");
        return;
      }

      try {
        // Envia os dados para /clientes, criando um novo cliente no banco.
        await fetch(`${API_BASE}/clientes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, telefone: fone, endereco })
        });

        alert("Cliente cadastrado com sucesso!");

        // Limpa os campos de cadastro da tela inicial.
        (document.getElementById("nomeCliente") as HTMLInputElement).value = "";
        (document.getElementById("foneCliente") as HTMLInputElement).value = "";
        (document.getElementById("enderecoCliente") as HTMLInputElement).value = "";

        // Atualiza lista de clientes (por exemplo, para o painel admin).
        await carregarClientes();
      } catch (err) {
        console.error(err);
        alert("Erro ao cadastrar cliente");
      }
    });
  }

  // -------------------------- LOGIN CLIENTE ----------------------------------

  // Botão de login do cliente (para acessar a área de pedidos).
  const btnLoginCliente: HTMLButtonElement | null =
    document.getElementById("btnLoginCliente") as HTMLButtonElement | null;

  // Se o botão existir, adicionamos o evento.
  btnLoginCliente?.addEventListener("click", async (): Promise<void> => {
    // Lê os campos de login do cliente.
    const nome: string = (document.getElementById("loginNomeCliente") as HTMLInputElement).value.trim();
    const telefone: string = (document.getElementById("loginFoneCliente") as HTMLInputElement).value.trim();

    const erro: HTMLElement | null = document.getElementById("erroLoginCliente");

    try {
      // Envia nome e telefone para autenticação do cliente.
      const res: Response = await fetch(`${API_BASE}/login/cliente`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone })
      });

      // Se a resposta não for OK (por exemplo, cliente não encontrado), mostramos erro.
      if (!res.ok) {
        erro!.style.display = "block";
        return;
      }

      // Se for OK, o backend deve devolver os dados do cliente.
      const cliente: Cliente = (await res.json()) as Cliente;

      // Salvamos os dados principais no localStorage para saber quem está logado.
      localStorage.setItem(
        "clienteLogado",
        JSON.stringify({
          id: cliente.Id ?? cliente.id,
          nome: cliente.Nome ?? cliente.nome,
          telefone: cliente.Telefone ?? cliente.telefone,
          endereco: cliente.Endereco ?? cliente.endereco
        })
      );

      // Redireciona o cliente para a página de pedidos do cliente.
      window.location.href = "pedidoCliente.html";
    } catch (err) {
      console.error(err);
      erro!.style.display = "block";
    }
  });

  // -------------------------- ENTRAR COMO VISITANTE -------------------------

  // Botão "Entrar como visitante" (sem cadastro e sem login).
  const btnEntrarVisitante: HTMLButtonElement | null =
    document.getElementById("btnEntrarVisitante") as HTMLButtonElement | null;

  btnEntrarVisitante?.addEventListener("click", (): void => {
    // Criamos um objeto simples representando um "cliente genérico".
    const visitante: Partial<Cliente> = {
      nome: "Visitante",
      telefone: "0000-0000",
      endereco: "------------"
    };

    // Salvamos esse visitante como se fosse um cliente logado.
    localStorage.setItem("clienteLogado", JSON.stringify(visitante));

    // Redirecionamos para a página de pedido do cliente.
    window.location.href = "pedidoCliente.html";
  });

}); // Fim do DOMContentLoaded
