const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

/**
 * @swagger
 * /api/postulaciones:
 *   post:
 *     summary: Postularse a una vacante
 *     tags: [Postulaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_vacante:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Postulacion exitosa
 *       400:
 *         description: Ya te postulaste a esta vacante
 */
router.post("/", auth, async (req, res) => {
  const { id_vacante } = req.body;
  const id_usuario = req.usuario.id_usuario;
  try {
    const existe = await pool.query(
      "SELECT * FROM postulaciones WHERE id_vacante = $1 AND id_usuario = $2",
      [id_vacante, id_usuario],
    );
    if (existe.rows.length > 0)
      return res
        .status(400)
        .json({ mensaje: "Ya te postulaste a esta vacante" });
    const result = await pool.query(
      "INSERT INTO postulaciones (id_vacante, id_usuario) VALUES ($1,$2) RETURNING *",
      [id_vacante, id_usuario],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al postularse" });
  }
});

/**
 * @swagger
 * /api/postulaciones/mis-postulaciones:
 *   get:
 *     summary: Ver mis postulaciones
 *     tags: [Postulaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de postulaciones del usuario
 */
router.get("/mis-postulaciones", auth, async (req, res) => {
  const id_usuario = req.usuario.id_usuario;
  try {
    const result = await pool.query(
      `SELECT p.*, v.titulo, v.ubicacion, v.sueldo 
       FROM postulaciones p 
       JOIN vacantes v ON p.id_vacante = v.id_vacante 
       WHERE p.id_usuario = $1`,
      [id_usuario],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener postulaciones" });
  }
});

module.exports = router;
