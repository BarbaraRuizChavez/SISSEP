import bcrypt from "bcryptjs";

const usuarios = [
  {
    id: 1,
    usuario: "20230001",
    nombre: "Juan Pérez",
    password: bcrypt.hashSync("123456", 10),
    rol: "Estudiante",
  },
  {
    id: 2,
    usuario: "admin",
    nombre: "María López",
    password: bcrypt.hashSync("admin123", 10),
    rol: "Encargado",
  },
];

export default usuarios;