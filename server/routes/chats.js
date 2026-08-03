const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

/**
 * @swagger
 * /api/chats:
 *   post:
 *     summary: Crear o obtener un chat
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_empresa:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Chat creado o existente
 */
router.post("/", auth, async (req, res) => {
  const { id_empresa } = req.body;
  const id_usuario = req.usuario.id_usuario;
  try {
    const existe = await pool.query(
      "SELECT * FROM chats WHERE id_empresa = $1 AND id_usuario = $2",
      [id_empresa, id_usuario],
    );
    if (existe.rows.length > 0) return res.json(existe.rows[0]);
    const result = await pool.query(
      "INSERT INTO chats (id_empresa, id_usuario) VALUES ($1, $2) RETURNING *",
      [id_empresa, id_usuario],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error en POST /chats:", error);
    res.status(500).json({ mensaje: "Error al crear chat" });
  }
});

/**
 * @swagger
 * /api/chats:
 *   get:
 *     summary: Listar mis chats
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de chats del usuario
 */
router.get("/", auth, async (req, res) => {
  const id_usuario = req.usuario.id_usuario;
  try {
    const result = await pool.query(
      `SELECT c.*, e.nombre_empresa 
       FROM chats c 
       JOIN empresas e ON c.id_empresa = e.id_empresa 
       WHERE c.id_usuario = $1`,
      [id_usuario],
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error en GET /chats:", error);
    res.status(500).json({ mensaje: "Error al obtener chats" });
  }
});

/**
 * @swagger
 * /api/chats/{id_chat}/mensajes:
 *   post:
 *     summary: Enviar mensaje en un chat
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_chat
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contenido:
 *                 type: string
 *               emisor:
 *                 type: string
 *     responses:
 *       201:
 *         description: Mensaje enviado
 */
router.post("/:id_chat/mensajes", auth, async (req, res) => {
  const { id_chat } = req.params;
  const { contenido, emisor } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO mensajes (id_chat, contenido, emisor) VALUES ($1, $2, $3) RETURNING *",
      [id_chat, contenido, emisor],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error en POST /mensajes:", error);
    res.status(500).json({ mensaje: "Error al enviar mensaje" });
  }
});

/**
 * @swagger
 * /api/chats/{id_chat}/mensajes:
 *   get:
 *     summary: Ver mensajes de un chat
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_chat
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de mensajes
 */
router.get("/:id_chat/mensajes", auth, async (req, res) => {
  const { id_chat } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM mensajes WHERE id_chat = $1 ORDER BY fecha_envio ASC",
      [id_chat],
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error en GET /mensajes:", error);
    res.status(500).json({ mensaje: "Error al obtener mensajes" });
  }
});

module.exports = router;
