const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

/**
 * @swagger
 * /api/vacantes:
 *   get:
 *     summary: Listar todas las vacantes activas
 *     tags: [Vacantes]
 *     responses:
 *       200:
 *         description: Lista de vacantes
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM vacantes WHERE estado = $1",
      ["activa"],
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error vacantes:", error.message);
    res
      .status(500)
      .json({ mensaje: "Error al obtener vacantes", detalle: error.message });
  }
});

/**
 * @swagger
 * /api/vacantes/{id}:
 *   get:
 *     summary: Ver detalle de una vacante
 *     tags: [Vacantes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle de la vacante
 *       404:
 *         description: Vacante no encontrada
 */
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM vacantes WHERE id_vacante = $1",
      [req.params.id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ mensaje: "Vacante no encontrada" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error vacante:", error.message);
    res
      .status(500)
      .json({ mensaje: "Error al obtener vacante", detalle: error.message });
  }
});

/**
 * @swagger
 * /api/vacantes:
 *   post:
 *     summary: Crear una nueva vacante
 *     tags: [Vacantes]
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
 *               titulo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               requisitos:
 *                 type: string
 *               sueldo:
 *                 type: number
 *               tipo_contrato:
 *                 type: string
 *               ubicacion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vacante creada exitosamente
 */
router.post("/", auth, async (req, res) => {
  const {
    id_empresa,
    titulo,
    descripcion,
    requisitos,
    sueldo,
    tipo_contrato,
    ubicacion,
  } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO vacantes (id_empresa, titulo, descripcion, requisitos, sueldo, tipo_contrato, ubicacion) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      [
        id_empresa,
        titulo,
        descripcion,
        requisitos,
        sueldo,
        tipo_contrato,
        ubicacion,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ mensaje: "Error al crear vacante", detalle: error.message });
  }
});

/**
 * @swagger
 * /api/vacantes/{id}:
 *   delete:
 *     summary: Eliminar una vacante
 *     tags: [Vacantes]
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
 *         description: Vacante eliminada
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM vacantes WHERE id_vacante = $1", [
      req.params.id,
    ]);
    res.json({ mensaje: "Vacante eliminada" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar vacante" });
  }
});

module.exports = router;
