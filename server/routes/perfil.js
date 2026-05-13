const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

/**
 * @swagger
 * /api/perfil:
 *   get:
 *     summary: Ver perfil del candidato
 *     tags: [Perfil]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del candidato
 */
router.get("/", auth, async (req, res) => {
  const id_usuario = req.usuario.id_usuario;
  try {
    const result = await pool.query(
      "SELECT * FROM perfil_candidato WHERE id_usuario = $1",
      [id_usuario],
    );
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener perfil" });
  }
});

/**
 * @swagger
 * /api/perfil:
 *   post:
 *     summary: Crear o actualizar perfil
 *     tags: [Perfil]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profesion:
 *                 type: string
 *               experiencia:
 *                 type: string
 *               habilidades:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *       201:
 *         description: Perfil creado
 */
router.post("/", auth, async (req, res) => {
  const id_usuario = req.usuario.id_usuario;
  const { profesion, experiencia, habilidades } = req.body;
  try {
    const existe = await pool.query(
      "SELECT * FROM perfil_candidato WHERE id_usuario = $1",
      [id_usuario],
    );
    if (existe.rows.length > 0) {
      const result = await pool.query(
        "UPDATE perfil_candidato SET profesion=$1, experiencia=$2, habilidades=$3 WHERE id_usuario=$4 RETURNING *",
        [profesion, experiencia, habilidades, id_usuario],
      );
      return res.json(result.rows[0]);
    }
    const result = await pool.query(
      "INSERT INTO perfil_candidato (id_usuario, profesion, experiencia, habilidades) VALUES ($1,$2,$3,$4) RETURNING *",
      [id_usuario, profesion, experiencia, habilidades],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al guardar perfil" });
  }
});

module.exports = router;
