import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

/* ==============================
   CONFIGURACIÓN DE UPLOADS
============================== */

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

/* ==============================
   CONFIGURACIÓN MULTER
============================== */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${req.params.id}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos PDF"));
    }
  },
});

/* ==============================
   BASE DE DATOS TEMPORAL
============================== */

let documentos = [
  { id: 1, nombre: "Solicitud de Servicio Social", estado: "Aprobado" },
  { id: 2, nombre: "Carta de Aceptacion", estado: "Aprobado" },
  { id: 3, nombre: "Carta de Presentacion", estado: "Aprobado" },
  { id: 4, nombre: "Carta de Asignacion", estado: "Aprobado" },
  { id: 5, nombre: "Plan de Trabajo", estado: "Rechazado", observaciones: "Falta firma oficial" },
  { id: 6, nombre: "Cronograma de Actividades", estado: "Pendiente" },
  { id: 7, nombre: "Reporte Mensual 1", estado: "Aprobado" },
  { id: 8, nombre: "Reporte Mensual 3", estado: "Pendiente" },
  { id: 9, nombre: "Reporte Mensual 4", estado: "Pendiente" },
  { id: 10, nombre: "Reporte Mensual 5", estado: "Pendiente" },
  { id: 11, nombre: "Reporte Mensual 6", estado: "Pendiente" },
  { id: 12, nombre: "Informe Final", estado: "Pendiente" },
  { id: 13, nombre: "Carta de Terminacion", estado: "Pendiente" },
  { id: 14, nombre: "Carta de Liberacion", estado: "Pendiente" },
  { id: 15, nombre: "Evaluacion del Prestador", estado: "Pendiente" },
  { id: 16, nombre: "Evaluacion de la Institucion", estado: "Pendiente" },
  { id: 17, nombre: "Constancia de Servicio Social", estado: "Pendiente" },
];

/* ==============================
   SUBIR ARCHIVO
============================== */

app.post("/api/documentos/:id/subir", upload.single("file"), (req, res) => {
  try {
    const docId = Number(req.params.id);
    const documento = documentos.find((d) => d.id === docId);

    if (!documento) {
      return res.status(404).json({ error: "Documento no encontrado" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No se recibió archivo" });
    }

    documento.nombreArchivo = req.file.filename; // nombre interno
    documento.nombreOriginal = req.file.originalname; // nombre real
    documento.tamano = `${(req.file.size / 1024).toFixed(2)} KB`;
    documento.estado = "Pendiente";

    res.json({
      message: "Archivo subido correctamente",
      documento,
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/* ==============================
   DESCARGAR ARCHIVO
============================== */

app.get("/api/documentos/:id/descargar", (req, res) => {
  const docId = Number(req.params.id);
  const documento = documentos.find((d) => d.id === docId);

  if (!documento || !documento.nombreArchivo) {
    return res.status(404).json({ error: "Archivo no encontrado" });
  }

  const filePath = path.join(UPLOADS_DIR, documento.nombreArchivo);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Archivo no existe en el servidor" });
  }

  res.download(filePath, documento.nombreOriginal);
});

/* ==============================
   LISTAR DOCUMENTOS
============================== */

app.get("/api/documentos", (req, res) => {
  const docs = documentos.map((d) => {
    const copia = { ...d };

    if (copia.nombreArchivo) {
      const filePath = path.join(UPLOADS_DIR, copia.nombreArchivo);
      if (!fs.existsSync(filePath)) {
        copia.nombreArchivo = undefined;
        copia.nombreOriginal = undefined;
        copia.tamano = undefined;
      }
    }

    return copia;
  });

  res.json(docs);
});

/* ==============================
   INICIAR SERVIDOR
============================== */

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});