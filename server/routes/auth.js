const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { enviarCorreo, escapar } = require("../mailer");

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
    const nuevo = result.rows[0];

    // Correo de bienvenida: se espera a que salga antes de responder
    // (necesario en Vercel). Si falla, el registro igual se completa.
    try {
      await enviarCorreo(
        nuevo.correo,
        "¡Bienvenido a TuOportuniApp!",
        `<h2>Hola ${escapar(nuevo.nombre)} 👋</h2>
         <p>Tu cuenta fue creada con éxito. Ya puedes buscar oportunidades.</p>`,
      );
    } catch (e) {
      console.error("No se pudo enviar el correo de bienvenida:", e.message);
    }

    res.status(201).json({
      mensaje: "Usuario registrado",
      usuario: {
        id: nuevo.id_usuario,
        nombre: nuevo.nombre,
        apellido: nuevo.apellido,
        correo: nuevo.correo,
        rol: nuevo.rol,
      },
    });
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

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Enviar enlace para recuperar la contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [correo]
 *             properties:
 *               correo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Respuesta genérica (exista o no el correo)
 */
router.post("/forgot-password", async (req, res) => {
  const { correo } = req.body;
  const respuesta = {
    mensaje:
      "Si el correo está registrado, te enviamos un enlace para recuperar tu contraseña.",
  };
  try {
    const result = await pool.query(
      "SELECT id_usuario, nombre, correo FROM usuarios WHERE correo = $1",
      [correo],
    );
    if (result.rows.length > 0) {
      const usuario = result.rows[0];
      const token = crypto.randomBytes(32).toString("hex");
      const hash = crypto.createHash("sha256").update(token).digest("hex");

      await pool.query(
        "UPDATE usuarios SET reset_token_hash = $1, reset_token_expira = NOW() + INTERVAL '1 hour' WHERE id_usuario = $2",
        [hash, usuario.id_usuario],
      );

      const enlace = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      await enviarCorreo(
        usuario.correo,
        "Recupera tu contraseña",
        `<h2>Hola ${escapar(usuario.nombre)}</h2>
         <p>Haz clic en el enlace para crear una nueva contraseña. Vence en 1 hora.</p>
         <p><a href="${enlace}">Restablecer contraseña</a></p>
         <p>Si no fuiste tú, ignora este correo.</p>`,
      );
    }
    // Misma respuesta exista o no el correo
    res.json(respuesta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Cambiar la contraseña con el token recibido por correo
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, contrasena]
 *             properties:
 *               token:
 *                 type: string
 *               contrasena:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       400:
 *         description: Enlace inválido o vencido
 */
router.post("/reset-password", async (req, res) => {
  const { token, contrasena } = req.body;
  if (!token || !contrasena || contrasena.length < 6)
    return res
      .status(400)
      .json({ mensaje: "La contraseña debe tener al menos 6 caracteres" });
  try {
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const result = await pool.query(
      "SELECT id_usuario FROM usuarios WHERE reset_token_hash = $1 AND reset_token_expira > NOW()",
      [hash],
    );
    if (result.rows.length === 0)
      return res
        .status(400)
        .json({ mensaje: "El enlace no es válido o venció" });

    const nueva = await bcrypt.hash(contrasena, 10);
    await pool.query(
      "UPDATE usuarios SET contrasena = $1, reset_token_hash = NULL, reset_token_expira = NULL WHERE id_usuario = $2",
      [nueva, result.rows[0].id_usuario],
    );
    res.json({ mensaje: "Contraseña actualizada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

module.exports = router;
