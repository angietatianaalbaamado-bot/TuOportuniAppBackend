const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

/**
 * @swagger
 * /api/notificaciones:
 *   get:
 *     summary: Ver mis notificaciones
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 */
router.get("/", auth, async (req, res) => {
  const id_usuario = req.usuario.id_usuario;
  try {
    const result = await pool.query(
      "SELECT * FROM notificaciones WHERE id_usuario = $1 ORDER BY fecha DESC",
      [id_usuario],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener notificaciones" });
  }
});

/**
 * @swagger
 * /api/notificaciones/{id}/leida:
 *   put:
 *     summary: Marcar notificacion como leida
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notificacion marcada como leida
 */
router.put("/:id/leida", auth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE notificaciones SET leida = true WHERE id_notificacion = $1 RETURNING *",
      [id],
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar notificacion" });
  }
});

/**
 * @swagger
 * /api/notificaciones:
 *   post:
 *     summary: Crear una notificacion
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_usuario:
 *                 type: integer
 *               mensaje:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notificacion creada
 */
router.post("/", auth, async (req, res) => {
  const { id_usuario, mensaje } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO notificaciones (id_usuario, mensaje) VALUES ($1, $2) RETURNING *",
      [id_usuario, mensaje],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear notificacion" });
  }
});

module.exports = router;
