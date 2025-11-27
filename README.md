# 🍕Projeto Pizzaria — Sistema Web em TypeScript
## Disciplina: Programação TypeScript
### Professor(a): Eduardo Popovici
Alunos: 
- Alexandre Comparone - RA: 2500621
- Arthur lima bezerra - RA: 2500315
- Henrique Rossi - RA: 2511641
- Henrique Bernardo Stela - RA: 2502079
- Matheus Bolsanello Marangon - RA: 2509468



## 📌 Descrição do Projeto

Este projeto consiste no desenvolvimento de um site para uma pizzaria fictícia, criado com o objetivo de praticar conceitos de TypeScript aplicado ao desenvolvimento Web, além de simular funcionalidades de um sistema real, como:

- Cadastro de clientes
- Cadastro de produtos (pizzas, bebidas etc.)
- Registro de pedidos
- Itens do pedido
- Cálculo automático de totais
- Integração com banco de dados SQL Server

Todo o site foi desenvolvido com HTML, CSS, JavaScript/TypeScript e comunicação com um banco de dados SQL Server através de scripts SQL fornecidos pelo SQL Server Management Studio.

## 📦 Estrutura do Projeto

O repositório contém:

- Código fonte do site
- Arquivos HTML das páginas
- CSS para layout
- Scripts TypeScript/JavaScript para interação
- Banco de dados SQL (script incluso abaixo)

## 🖥 Pré-requisitos

Antes de executar o projeto localmente, é necessário ter instalado:

- Node.js (versão recomendada: LTS)
- TypeScript (global ou local no projeto)
- SQL Server
- SQL Server Management Studio (SSMS)
- Navegador atualizado (Chrome, Edge ou Firefox)

Não é necessário instalar dependências via npm, pois todos os arquivos já estão incluídos no repositório.

## ⚙️ Como Executar o Projeto

### Clone o repositório:
```
git clone https://github.com/Hiquezinhu/SitePizzaria
```

Abra o projeto em qualquer editor, como Visual Studio Code.

### Compile o TypeScript (caso faça alterações):
```
tsc
```

Abra o arquivo index.html no navegador para visualizar o site.

## 🗄 Configuração do Banco de Dados (SQL Server)

Abaixo está o script completo utilizado para criar o banco de dados PIZZARIA, tabelas, relacionamentos e índices.

Basta colar este script no SQL Server Management Studio e executar:
 ```
-- Cria DB
CREATE DATABASE PIZZARIA;
GO
USE PIZZARIA;
GO

-- Tabela clientes
CREATE TABLE Clientes (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  Nome NVARCHAR(150) NOT NULL,
  Telefone NVARCHAR(50) NULL,
  Endereco NVARCHAR(250) NULL
);

-- Tabela produtos
CREATE TABLE Produtos (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  Nome NVARCHAR(150) NOT NULL,
  Preco DECIMAL(10,2) NOT NULL,
  Tipo NVARCHAR(50) NOT NULL
);

-- Tabela pedidos
CREATE TABLE Pedidos (
  Id BIGINT IDENTITY(1,1) PRIMARY KEY,
  ClienteId INT NULL,
  DataHora DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  Total DECIMAL(12,2) NOT NULL,
  CONSTRAINT FK_Pedidos_Clientes FOREIGN KEY (ClienteId) REFERENCES Clientes(Id) ON DELETE SET NULL
);

-- Itens do pedido
CREATE TABLE ItensPedido (
  Id BIGINT IDENTITY(1,1) PRIMARY KEY,
  PedidoId BIGINT NOT NULL,
  Produto NVARCHAR(150) NOT NULL,
  Quantidade INT NOT NULL,
  Preco DECIMAL(10,2) NOT NULL,
  Tipo NVARCHAR(50) NULL,
  CONSTRAINT FK_Itens_Pedido FOREIGN KEY (PedidoId) REFERENCES Pedidos(Id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IX_Produtos_Tipo ON Produtos (Tipo);
CREATE INDEX IX_Pedidos_DataHora ON Pedidos (DataHora);
GO

-- Consultas
SELECT * FROM dbo.Pedidos;
SELECT * FROM dbo.Clientes;
SELECT * FROM dbo.ItensPedido;
SELECT * FROM dbo.Produtos;
```


## 📂 Estrutura do Projeto
```sitePizzaria/

├── styles/                  # CSS do sistema
│   └── style.css
│
├── backend/                
│   ├── backend.json          
│   ├── db.js        
│   ├── server.js  
│   └── sl.env
│
├── node_modules/
│
├── src/                
│   ├── clientes.htm        
│   ├── emissão.html       
│   ├── index.css 
│   ├── index.d.ts
│   ├── index.d.ts.map       
│   ├── index.html       
│   ├── index.js
│   ├── index.js.map
│   ├── index.ts        
│   ├── mammamia.png       
│   ├── pedido.html
│   ├── pedidoCliente.html
│   ├── produtos.html         
│   └── ralatorio.html
│
├── package-lock.json
├── package.json            
└── tsconfig.json     
```

## 📚 Funcionalidades Implementadas

Cadastro de clientes

Cadastro de produtos (com categoria/tipo)

Registro de pedidos

Itens vinculados aos pedidos

Cálculo automático de totais

Interface simples e intuitiva para navegação

## 📝 Considerações Finais

O projeto demonstra a aplicação prática de conceitos de TypeScript, modelagem de dados, interação com banco SQL e organização de um sistema Web.
O objetivo foi criar uma estrutura que simula um cenário real de pizzaria, permitindo manipulação de clientes, produtos e pedidos
