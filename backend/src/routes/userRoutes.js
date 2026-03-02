import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import usuarios from "../data/usuarios.js";

const router = express.Router();
const SECRET = process.env.JWT_SECRET;

router.post("/login", async (req, res) => {
  const { usuario, password, rol } = req.body;

  const user = usuarios.find(
    (u) => u.usuario === usuario && u.rol === rol
  );

  if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

  const valido = await bcrypt.compare(password, user.password);
  if (!valido) return res.status(401).json({ error: "Contraseña incorrecta" });

  const token = jwt.sign(
    { id: user.id, nombre: user.nombre, rol: user.rol },
    SECRET,
    { expiresIn: "2h" }
  );

  res.json({
    token,
    usuario: {
      id: user.id,
      nombre: user.nombre,
      rol: user.rol,
    },
  });
});

export default router;