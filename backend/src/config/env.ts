import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT:         Number(process.env.PORT)        || 4000,
  NODE_ENV:            process.env.NODE_ENV      || 'development',
  FRONTEND_URL:        process.env.FRONTEND_URL  || 'http://localhost:3000',
  JWT_SECRET:          process.env.JWT_SECRET    || 'dev_secret_inseguro',
  JWT_EXPIRES:         process.env.JWT_EXPIRES_IN || '8h',
  UPLOAD_BASE:         process.env.UPLOAD_BASE   || 'uploads',
  MAX_FILE_MB:  Number(process.env.MAX_FILE_MB)  || 20,
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: Number(process.env.DB_PORT) || 5432,
    USER: process.env.DB_USER || 'sissep_user',
    PASS: process.env.DB_PASS || 'sissep_pass',
    NAME: process.env.DB_NAME || 'sissep_db',
  },
};
