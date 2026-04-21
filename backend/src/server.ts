import 'reflect-metadata';
import express from 'express';
import cors    from 'cors';
import helmet  from 'helmet';
import morgan  from 'morgan';
import path    from 'path';
import fs      from 'fs';

import { ENV }          from './config/env';
import { connectDB }    from './config/database';
import routes           from './routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

// Headers de seguridad HTTP
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS restringido al frontend
app.use(cors({ origin: ENV.FRONTEND_URL, credentials: true }));

// Logger de peticiones
app.use(morgan(ENV.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Parsers de body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Crear carpetas base de uploads al arrancar
['servicio_social', 'residencias'].forEach((program) =>
  fs.mkdirSync(path.resolve(ENV.UPLOAD_BASE, program), { recursive: true }),
);

// Servir archivos estaticos (PDFs, imagenes subidas por estudiantes)
app.use(
  '/uploads',
  express.static(path.resolve(ENV.UPLOAD_BASE), {
    setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
  }),
);

// API principal
app.use('/api/v1', routes);

// Health check para verificar que el servidor esta corriendo
app.get('/health', (_req, res) => {
  res.json({ ok: true, env: ENV.NODE_ENV, timestamp: new Date().toISOString() });
});

// 404 para rutas no encontradas
app.use((_req, res) => res.status(404).json({ ok: false, message: 'Ruta no encontrada' }));

// Manejador de errores global (debe ir al final)
app.use(errorHandler);

async function bootstrap(): Promise<void> {
  await connectDB();
  app.listen(ENV.PORT, () => {
    console.log(`\n  SISSEP API corriendo en http://localhost:${ENV.PORT}`);
    console.log(`  Health check: http://localhost:${ENV.PORT}/health\n`);
  });
}

bootstrap().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
