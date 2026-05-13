const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * @swagger
 * /api/auth/registro:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, apellido, correo, contrasena, rol]
 *             properties:
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *               correo:
 *                 type: string
 *               contrasena:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [candidato, empresa, administrador]
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: El correo ya está registrado
 */
router.post("/registro", async (req, res) => {
  const { nombre, apellido, correo, contrasena, rol } = req.body;
  try {
    const existe = await pool.query(
      "SELECT * FROM usuarios WHERE correo = $1",
      [correo],
    );
    if (existe.rows.length > 0)
      return res.status(400).json({ mensaje: "El correo ya está registrado" });
    const hash = await bcrypt.hash(contrasena, 10);
    const result = await pool.query(
      "INSERT INTO usuarios (nombre, apellido, correo, contrasena, rol) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [nombre, apellido, correo, hash, rol],
    );
    res
      .status(201)
      .json({ mensaje: "Usuario registrado", usuario: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [correo, contrasena]
 *             properties:
 *               correo:
 *                 type: string
 *               contrasena:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso con token JWT
 *       400:
 *         description: Credenciales incorrectas
 */
router.post("/login", async (req, res) => {
  const { correo, contrasena } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE correo = $1",
      [correo],
    );
    if (result.rows.length === 0)
      return res
        .status(400)
        .json({ mensaje: "Correo o contraseña incorrectos" });
    const usuario = result.rows[0];
    const valido = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!valido)
      return res
        .status(400)
        .json({ mensaje: "Correo o contraseña incorrectos" });
    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.json({
      token,
      usuario: {
        id: usuario.id_usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

module.exports = router;
