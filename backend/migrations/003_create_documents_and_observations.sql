-- Migration: 003_create_documents_and_observations
-- Crear tablas de documentos y observaciones
-- Fecha: 2026-04-12

-- Enum para estados de documentos
CREATE TYPE document_status AS ENUM (
    'draft',           -- Sin archivo
    'pending',          -- Archivo subido, esperando revisión
    'under_review',     -- En proceso de revisión
    'approved',         -- Aprobado
    'rejected',         -- Rechazado, debe subir de nuevo
    'observed'          -- Con observaciones menores
);

-- Tabla documents
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
CREATE INDEX idx_documents_student_program ON documents(student_id, program_type);

-- Trigger para updated_at
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar timestamps según estado
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

CREATE TRIGGER document_timestamp_management
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_document_timestamps();

-- Tabla observations
CREATE TABLE observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    text TEXT NOT NULL CHECK (LENGTH(TRIM(text)) >= 10),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_creator_must_be_reviewer CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE id = created_by AND role IN ('encargado', 'admin')
        )
    ),
    CONSTRAINT chk_resolved_at_requires_flag CHECK (
        is_resolved = TRUE OR resolved_at IS NULL
    )
);

-- Índices
CREATE INDEX idx_observations_document_id ON observations(document_id);
CREATE INDEX idx_observations_created_by ON observations(created_by);
CREATE INDEX idx_observations_is_resolved ON observations(is_resolved);

-- Tabla para historial de estados
CREATE TABLE document_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    previous_status document_status NOT NULL,
    new_status document_status NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_status_history_document ON document_status_history(document_id);
