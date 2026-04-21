-- Schema inicial de SISSEP para PostgreSQL 16
-- TypeORM con synchronize:true actualiza esto en desarrollo,
-- pero este archivo sirve como referencia y para el contenedor Docker.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tipos enumerados
DO $$ BEGIN
  CREATE TYPE user_role    AS ENUM ('estudiante', 'encargado');
  CREATE TYPE program_type AS ENUM ('servicio_social', 'residencias');
  CREATE TYPE doc_status   AS ENUM ('pendiente', 'aprobado', 'rechazado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tabla de usuarios (estudiantes y encargados)
CREATE TABLE IF NOT EXISTS users (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  control_number    VARCHAR(30)  UNIQUE NOT NULL,
  name              VARCHAR(140) NOT NULL,
  password_hash     TEXT         NOT NULL,
  role              user_role    NOT NULL DEFAULT 'estudiante',
  carrera           VARCHAR(140) DEFAULT '',
  encargado_section VARCHAR(80)  DEFAULT '',
  created_at        TIMESTAMPTZ  DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_control ON users(control_number);
CREATE INDEX IF NOT EXISTS idx_users_role    ON users(role);

-- Tabla de documentos del expediente
-- Cada fila representa un documento requerido de un estudiante.
-- La combinacion (student_id, program_type, category) es unica.
CREATE TABLE IF NOT EXISTS documents (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_type  program_type NOT NULL,
  category      VARCHAR(120) NOT NULL,
  description   TEXT         DEFAULT '',
  status        doc_status   NOT NULL DEFAULT 'pendiente',
  file_name     VARCHAR(260),
  file_path     TEXT,
  file_size     INTEGER,
  external_url  TEXT,
  observations  TEXT         DEFAULT '',
  reviewed_by   UUID         REFERENCES users(id),
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW(),
  CONSTRAINT uq_student_doc UNIQUE (student_id, program_type, category)
);

CREATE INDEX IF NOT EXISTS idx_docs_student ON documents(student_id);
CREATE INDEX IF NOT EXISTS idx_docs_status  ON documents(status);
CREATE INDEX IF NOT EXISTS idx_docs_program ON documents(program_type);

-- Trigger para actualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at     ON users;
DROP TRIGGER IF EXISTS trg_documents_updated_at ON documents;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
