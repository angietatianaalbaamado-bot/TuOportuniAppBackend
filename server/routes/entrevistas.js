const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Entrevistas
 *   description: Servicios para la programación y consulta de entrevistas laborales
 */

/**
 * @swagger
 * /api/entrevistas:
 *   post:
 *     summary: Programar una entrevista
 *     description: Registra una entrevista asociada a una postulación. Requiere autenticación.
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
 *                 example: 1
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-11-15"
 *               hora:
 *                 type: string
 *                 example: "09:30"
 *               tipo:
 *                 type: string
 *                 example: "Virtual"
 *               enlace:
 *                 type: string
 *                 example: "https://meet.google.com/abc-defg-hij"
 *             required:
 *               - id_postulacion
 *               - fecha
 *               - hora
 *               - tipo
 *     responses:
 *       201:
 *         description: Entrevista programada correctamente
 *       401:
 *         description: Usuario no autenticado
 *       500:
 *         description: Error al programar la entrevista
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
    console.error("Error en POST /entrevistas:", error);
    res.status(500).json({ mensaje: "Error al programar entrevista" });
  }
});

/**
 * @swagger
 * /api/entrevistas/mis-entrevistas:
 *   get:
 *     summary: Consultar mis entrevistas
 *     description: Obtiene las entrevistas relacionadas con las postulaciones del usuario autenticado.
 *     tags: [Entrevistas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de entrevistas del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 additionalProperties: true
 *       401:
 *         description: Usuario no autenticado
 *       500:
 *         description: Error al obtener las entrevistas
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
    console.error("Error en GET /mis-entrevistas:", error);
    res.status(500).json({ mensaje: "Error al obtener entrevistas" });
  }
});

/**
 * @swagger
 * /api/entrevistas/postulacion/{id_postulacion}:
 *   get:
 *     summary: Consultar entrevistas de una postulación
 *     description: Obtiene las entrevistas asociadas al identificador de una postulación.
 *     tags: [Entrevistas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_postulacion
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identificador de la postulación
 *     responses:
 *       200:
 *         description: Lista de entrevistas asociadas a la postulación
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 additionalProperties: true
 *       401:
 *         description: Usuario no autenticado
 *       500:
 *         description: Error al obtener las entrevistas
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
    console.error("Error en GET /postulacion:", error);
    res.status(500).json({ mensaje: "Error al obtener entrevistas" });
  }
});

module.exports = router;
