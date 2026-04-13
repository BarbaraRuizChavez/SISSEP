# 2.2 Esquema PostgreSQL

## Resumen

Este documento define el esquema físico de la base de datos PostgreSQL para SISSEP, incluyendo tablas, índices, constraints y relaciones.

## Diagrama ER (Entidad-Relación)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA                                        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│     users        │         │    documents     │         │   categories     │
├──────────────────┤         ├──────────────────┤         ├──────────────────┤
│ id UUID PK       │◄────────│ student_id FK    │         │ id UUID PK       │
│ control_number   │         │ category_id FK   │────────►│ code VARCHAR(50) │
│ password_hash    │         │ status VARCHAR   │         │ name VARCHAR(100)│
│ name VARCHAR     │         │ file_url TEXT    │         │ description TEXT │
│ email VARCHAR    │         │ file_name VARCHAR│         │ program_type     │
│ role VARCHAR     │         │ file_size INT    │         │ is_required BOOL │
│ career VARCHAR   │         │ mime_type VARCHAR│         │ sort_order INT   │
│ phone VARCHAR    │         │ uploaded_at      │         │ template_url     │
│ is_active BOOL   │         │ reviewed_at      │         │ created_at       │
│ created_at       │         │ reviewed_by FK   │────┐    │ updated_at       │
│ updated_at       │         │ program_type     │    │    └──────────────────┘
└──────────────────┘         │ created_at       │    │
         │                   │ updated_at       │    │
         │                   └──────────────────┘    │
         │                           │               │
         │                    ┌──────┘               │
         │                    │                      │
         │              ┌─────┴────┐                │
         │              │          │                │
         │              ▼          │                ▼
         │      ┌─────────────┐     │        ┌─────────────┐
         │      │observations │     │        │users (reviewer)│
         │      ├─────────────┤     │        ├─────────────┤
         └─────►│ id UUID PK  │     └────────│ id UUID PK  │
                │document_id FK│              │ ...         │
                │ text TEXT   │              └─────────────┘
                │ created_by FK│───────────────►
                │ is_resolved │
                │ resolved_at │
                │ created_at  │
                └─────────────┘
```

## Tablas

### 1. users

Almacena información de todos los usuarios del sistema.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    control_number VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('estudiante', 'encargado', 'admin')),
    career VARCHAR(50),
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_control_number_not_empty CHECK (LENGTH(TRIM(control_number)) > 0),
    CONSTRAINT chk_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_career_required_for_student CHECK (
        role != 'estudiante' OR career IS NOT NULL
    )
);

-- Índices
CREATE INDEX idx_users_control_number ON users(control_number);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Comentarios
COMMENT ON TABLE users IS 'Usuarios del sistema (estudiantes, encargados, administradores)';
COMMENT ON COLUMN users.control_number IS 'Número de control único de la institución';
COMMENT ON COLUMN users.role IS 'Rol: estudiante, encargado o admin';
```

### 2. categories

Define los tipos de documentos requeridos.

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    program_type VARCHAR(20) NOT NULL CHECK (program_type IN ('servicio_social', 'residencias', 'both')),
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    template_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_code_not_empty CHECK (LENGTH(TRIM(code)) > 0),
    CONSTRAINT chk_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Índices
CREATE INDEX idx_categories_program_type ON categories(program_type);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

-- Datos iniciales (seed)
INSERT INTO categories (code, name, description, program_type, is_required, sort_order) VALUES
('SS-SOL', 'Solicitud de Servicio Social', 'Formato oficial de solicitud', 'servicio_social', TRUE, 1),
('SS-CARTA', 'Carta de Aceptación', 'Carta de la institución receptora', 'servicio_social', TRUE, 2),
('SS-CONST', 'Constancia de Término', 'Constancia final de horas cumplidas', 'servicio_social', TRUE, 3),
('RES-PROP', 'Propuesta de Proyecto', 'Documento técnico del proyecto', 'residencias', TRUE, 1),
('RES-ASES', 'Carta de Asesor', 'Designación de asesor interno', 'residencias', TRUE, 2),
('RES-INFORME', 'Informe Final', 'Informe técnico del proyecto', 'residencias', TRUE, 3);

COMMENT ON TABLE categories IS 'Categorías de documentos requeridos por programa';
```

### 3. documents

Almacena los documentos subidos por los estudiantes.

```sql
CREATE TYPE document_status AS ENUM (
    'draft',           -- Sin archivo, no subido
    'pending',          -- Archivo subido, esperando revisión
    'under_review',     -- En proceso de revisión
    'approved',         -- Aprobado
    'rejected',         -- Rechazado, debe subir de nuevo
    'observed'          -- Con observaciones menores
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    status document_status NOT NULL DEFAULT 'draft',
    file_url TEXT,
    file_name VARCHAR(255),
    file_size INTEGER CHECK (file_size >= 0 AND file_size <= 10485760), -- Max 10MB
    mime_type VARCHAR(100) CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
    uploaded_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    program_type VARCHAR(20) NOT NULL CHECK (program_type IN ('servicio_social', 'residencias')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints de negocio
    CONSTRAINT chk_file_required_if_not_draft CHECK (
        status = 'draft' OR file_url IS NOT NULL
    ),
    CONSTRAINT chk_reviewer_must_be_encargado CHECK (
        reviewed_by IS NULL OR EXISTS (
            SELECT 1 FROM users WHERE id = reviewed_by AND role IN ('encargado', 'admin')
        )
    )
);

-- Índices
CREATE INDEX idx_documents_student_id ON documents(student_id);
CREATE INDEX idx_documents_category_id ON documents(category_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_program_type ON documents(program_type);
CREATE INDEX idx_documents_reviewed_by ON documents(reviewed_by);

-- Índice compuesto para queries comunes
CREATE INDEX idx_documents_student_program ON documents(student_id, program_type);

COMMENT ON TABLE documents IS 'Documentos subidos por estudiantes para servicio social o residencias';
COMMENT ON COLUMN documents.file_url IS 'Ruta relativa del archivo en el filesystem o URL de storage';
```

### 4. observations

Registra observaciones y retroalimentación sobre documentos.

```sql
CREATE TABLE observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    text TEXT NOT NULL CHECK (LENGTH(TRIM(text)) >= 10),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: solo encargados pueden crear observaciones
    CONSTRAINT chk_creator_must_be_reviewer CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE id = created_by AND role IN ('encargado', 'admin')
        )
    ),
    
    -- Constraint: resolved_at requiere is_resolved = TRUE
    CONSTRAINT chk_resolved_at_requires_flag CHECK (
        is_resolved = TRUE OR resolved_at IS NULL
    )
);

-- Índices
CREATE INDEX idx_observations_document_id ON observations(document_id);
CREATE INDEX idx_observations_created_by ON observations(created_by);
CREATE INDEX idx_observations_is_resolved ON observations(is_resolved);

COMMENT ON TABLE observations IS 'Observaciones realizadas por encargados sobre documentos';
```

## Vistas (Views)

### vista_documentos_estudiante

Vista consolidada para el panel del estudiante.

```sql
CREATE VIEW vista_documentos_estudiante AS
SELECT 
    d.id,
    d.student_id,
    d.status,
    d.file_url,
    d.file_name,
    d.program_type,
    c.code AS category_code,
    c.name AS category_name,
    c.description AS category_description,
    c.is_required,
    c.sort_order,
    o_count.total_observaciones,
    o_count.observaciones_pendientes,
    d.created_at,
    d.updated_at
FROM documents d
JOIN categories c ON d.category_id = c.id
LEFT JOIN (
    SELECT 
        document_id,
        COUNT(*) AS total_observaciones,
        COUNT(*) FILTER (WHERE NOT is_resolved) AS observaciones_pendientes
    FROM observations
    GROUP BY document_id
) o_count ON d.id = o_count.document_id;

COMMENT ON VIEW vista_documentos_estudiante IS 'Vista consolidada de documentos para el panel del estudiante';
```

### vista_progreso_estudiantes

Vista para el panel del administrador con progreso de cada estudiante.

```sql
CREATE VIEW vista_progreso_estudiantes AS
SELECT 
    u.id AS student_id,
    u.control_number,
    u.name AS student_name,
    u.career,
    d.program_type,
    COUNT(d.id) AS total_documentos,
    COUNT(d.id) FILTER (WHERE d.status = 'approved') AS aprobados,
    COUNT(d.id) FILTER (WHERE d.status = 'pending') AS pendientes,
    COUNT(d.id) FILTER (WHERE d.status IN ('rejected', 'observed')) AS con_problemas,
    COUNT(d.id) FILTER (WHERE d.status = 'draft') AS sin_subir,
    ROUND(
        COUNT(d.id) FILTER (WHERE d.status = 'approved') * 100.0 / NULLIF(COUNT(d.id), 0)
    , 0) AS porcentaje_completado
FROM users u
JOIN documents d ON u.id = d.student_id
WHERE u.role = 'estudiante'
GROUP BY u.id, u.control_number, u.name, u.career, d.program_type;

COMMENT ON VIEW vista_progreso_estudiantes IS 'Progreso de documentación por estudiante y programa';
```

## Funciones y Triggers

### Actualizar updated_at automáticamente

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Trigger: Actualizar timestamps de documento

```sql
CREATE OR REPLACE FUNCTION update_document_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualiza uploaded_at cuando se sube archivo
    IF NEW.file_url IS NOT NULL AND OLD.file_url IS NULL THEN
        NEW.uploaded_at = CURRENT_TIMESTAMP;
        NEW.status = 'pending';
    END IF;
    
    -- Actualiza reviewed_at cuando se revisa
    IF NEW.status IN ('approved', 'rejected') AND OLD.status NOT IN ('approved', 'rejected') THEN
        NEW.reviewed_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_timestamp_management BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_document_timestamps();
```

### Función: Generar documentos para nuevo estudiante

```sql
CREATE OR REPLACE FUNCTION create_documents_for_student(
    p_student_id UUID,
    p_program_type VARCHAR(20)
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO documents (student_id, category_id, program_type)
    SELECT 
        p_student_id,
        c.id,
        p_program_type
    FROM categories c
    WHERE c.program_type IN (p_program_type, 'both')
    AND NOT EXISTS (
        SELECT 1 FROM documents d 
        WHERE d.student_id = p_student_id 
        AND d.category_id = c.id
        AND d.program_type = p_program_type
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_documents_for_student IS 
'Genera automáticamente los documentos requeridos para un estudiante nuevo';
```

## Políticas de Seguridad (Row Level Security)

```sql
-- Habilitar RLS en tablas sensibles
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;

-- Política: Estudiantes solo ven sus propios documentos
CREATE POLICY student_documents_isolation ON documents
    FOR ALL
    USING (student_id = current_setting('app.current_user_id')::UUID);

-- Política: Encargados ven todos los documentos
CREATE POLICY encargado_documents_access ON documents
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE id = current_setting('app.current_user_id')::UUID 
        AND role IN ('encargado', 'admin')
    ));

-- Política: Observaciones visibles según permisos
CREATE POLICY observations_access ON observations
    FOR SELECT
    USING (
        -- Estudiante ve observaciones de sus documentos
        EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = observations.document_id 
            AND d.student_id = current_setting('app.current_user_id')::UUID
        )
        OR
        -- Encargado ve todas las observaciones
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role IN ('encargado', 'admin')
        )
    );
```

## Migraciones (Scripts)

### Migración Inicial

```sql
-- 001_initial_schema.sql
-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ejecutar creación de tablas en orden
-- 1. users
-- 2. categories (con datos seed)
-- 3. documents
-- 4. observations

-- Crear índices
-- Crear vistas
-- Crear funciones y triggers
-- Habilitar RLS

-- Verificar integridad
DO $$
BEGIN
    -- Verificar que las tablas existen
    ASSERT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users');
    ASSERT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents');
    ASSERT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories');
    ASSERT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'observations');
END $$;
```

## Estrategia de Backup

```sql
-- Backup diario completo
-- pg_dump sissep_db > backup_sissep_$(date +%Y%m%d).sql

-- Backup incremental de documentos (solo metadatos)
-- pg_dump --data-only --table=documents --table=observations sissep_db

-- Archivos deben respaldarse separadamente (rsync, S3 sync)
```

---

**Ver también:**
- [01. Modelo de Dominio](./01-domain-model.md) - Conceptos de negocio
- [03. Almacenamiento de Archivos](./03-file-storage.md) - Gestión de archivos
