require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// Configuración Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TuOportuniApp API",
      version: "1.0.0",
      description:
        "API REST para la aplicación de búsqueda de empleo TuOportuniApp",
      contact: {
        name: "Angie Tatiana Alba Amado",
        email: "angie@tuoportuniapp.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor local",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./server/routes/*.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocs, {
    customCss: ".swagger-ui .topbar { background-color: #1e3a5f; }",
    customSiteTitle: "TuOportuniApp API Docs",
  }),
);

// Rutas
app.use("/api/auth", require("./routes/auth"));
app.use("/api/vacantes", require("./routes/vacantes"));
app.use("/api/postulaciones", require("./routes/postulaciones"));
app.use("/api/chats", require("./routes/chats"));
app.use("/api/notificaciones", require("./routes/notificaciones"));
app.use("/api/entrevistas", require("./routes/entrevistas"));
app.use("/api/perfil", require("./routes/perfil"));

app.get("/", (req, res) => {
  res.json({
    mensaje: "TuOportuniApp Backend corriendo ✅",
    documentacion: "http://localhost:3000/api-docs",
  });
});

app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS fecha_actual");
    res.json({
      status: "ok",
      db: "conectado",
      fecha_servidor: result.rows[0].fecha_actual,
    });
  } catch (error) {
    console.error("❌ Error conectando a PostgreSQL:", error.message);
    res.status(500).json({ status: "error", db: "desconectado" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Documentacion Swagger: http://localhost:${PORT}/api-docs`);

  try {
    await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL conectado correctamente");
  } catch (error) {
    console.error("❌ Error conectando a PostgreSQL:", error.message);
  }
});
