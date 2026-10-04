const { Pool } = require("pg");
require("dotenv").config({ quiet: true });

// Si hay DATABASE_URL se usa Neon (nube, con SSL).
// Si no, se usa tu PostgreSQL local (sin SSL).
const config = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT) || 5432,
      ssl: false,
    };

const pool = new Pool(config);

pool
  .connect()
  .then((client) => {
    console.log(
      process.env.DATABASE_URL
        ? "✅ Conectado a PostgreSQL (Neon)"
        : "✅ Conectado a PostgreSQL (local)",
    );
    client.release();
  })
  .catch((err) =>
    console.error("❌ Error conectando a PostgreSQL:", err.message),
  );

module.exports = pool;
