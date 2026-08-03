const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

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
