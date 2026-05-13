const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

/**
 * @swagger
 * /api/entrevistas:
 *   post:
 *     summary: Programar una entrevista
 *     tags: [Entrevistas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_postulacion:
 *                 type: integer
 *               fecha:
 *                 type: string
 *               hora:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [virtual, presencial]
 *               enlace:
 *                 type: string
 *     responses:
 *       201:
 *         description: Entrevista programada
 */
router.post("/", auth, async (req, res) => {
  const { id_postulacion, fecha, hora, tipo, enlace } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO entrevistas (id_postulacion, fecha, hora, tipo, enlace) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [id_postulacion, fecha, hora, tipo, enlace],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al programar entrevista" });
  }
});

/**
 * @swagger
 * /api/entrevistas/mis-entrevistas:
 *   get:
 *     summary: Ver mis entrevistas
 *     tags: [Entrevistas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de entrevistas del candidato
 */
router.get("/mis-entrevistas", auth, async (req, res) => {
  const id_usuario = req.usuario.id_usuario;
  try {
    const result = await pool.query(
      `SELECT e.*, v.titulo, v.ubicacion
       FROM entrevistas e
       JOIN postulaciones p ON e.id_postulacion = p.id_postulacion
       JOIN vacantes v ON p.id_vacante = v.id_vacante
       WHERE p.id_usuario = $1
       ORDER BY e.fecha ASC`,
      [id_usuario],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener entrevistas" });
  }
});

/**
 * @swagger
 * /api/entrevistas/postulacion/{id_postulacion}:
 *   get:
 *     summary: Ver entrevistas de una postulacion
 *     tags: [Entrevistas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_postulacion
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de entrevistas
 */
router.get("/postulacion/:id_postulacion", auth, async (req, res) => {
  const { id_postulacion } = req.params;
  try {
    const result = await pool.query(
      `SELECT e.*, p.id_usuario, v.titulo 
       FROM entrevistas e
       JOIN postulaciones p ON e.id_postulacion = p.id_postulacion
       JOIN vacantes v ON p.id_vacante = v.id_vacante
       WHERE e.id_postulacion = $1`,
      [id_postulacion],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener entrevistas" });
  }
});

module.exports = router;
