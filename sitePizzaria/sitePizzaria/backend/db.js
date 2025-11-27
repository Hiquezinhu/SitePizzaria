const sql = require("mssql");

// configure o SQL Server aqui
const dbConfig = {
    user: "sa",
    password: "senha1234",
    server: "localhost",
    database: "PIZZARIA",
    options: {
        trustServerCertificate: true
    }
};

async function connect() {
    try {
        await sql.connect(dbConfig);
        console.log("✔ Conectado ao SQL Server");
        } catch (err) {
        console.error("ERRO AO CONECTAR NO SQL SERVER:");
        console.error(err);
    }

}

module.exports = { sql, connect };
