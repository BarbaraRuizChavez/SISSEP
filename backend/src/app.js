// backend/index.js (ejemplo simple)

const express = require("express");
const cors = require("cors");
const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// Datos simulados (puedes conectar a DB aquí)
const documentos = [
  {
    id: 1,
    nombre: "Solicitud de Servicio Social",
    descripcion: "Formato de solicitud oficial",
    estado: "Aprobado",
    requerido: true,
    nombreArchivo: "solicitud_de_servicio_social.pdf",
    tamano: "680 KB",
  },
  // ... todos los demás documentos aquí
];

// GET /api/documentos - obtener lista de documentos
app.get("/api/documentos", (req, res) => {
  res.json(documentos);
});

// POST /api/documentos/:id/subir - simulación subir archivo
app.post("/api/documentos/:id/subir", (req, res) => {
  // Aquí iría la lógica para subir archivos
  res.json({ message: "Archivo subido (simulado)" });
});

app.listen(port, () => {
  console.log(`Backend escuchando en http://localhost:${port}`);
});