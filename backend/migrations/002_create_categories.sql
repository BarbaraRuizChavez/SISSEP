-- Migration: 002_create_categories
-- Crear tabla de categorías de documentos
-- Fecha: 2026-04-12

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

-- Trigger para updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Datos iniciales
INSERT INTO categories (code, name, description, program_type, is_required, sort_order) VALUES
('SS-SOL', 'Solicitud de Servicio Social', 'Formato oficial de solicitud debidamente llenado', 'servicio_social', TRUE, 1),
('SS-CARTA', 'Carta de Aceptación', 'Carta de la institución receptora firmada', 'servicio_social', TRUE, 2),
('SS-CONST', 'Constancia de Término', 'Constancia de horas cumplidas emitida por la institución', 'servicio_social', TRUE, 3),
('SS-EVAL', 'Evaluación del Servicio', 'Formato de evaluación final', 'servicio_social', TRUE, 4),
('RES-PROP', 'Propuesta de Proyecto', 'Documento técnico del proyecto de residencias', 'residencias', TRUE, 1),
('RES-ASES', 'Carta de Asesor', 'Designación de asesor interno y externo', 'residencias', TRUE, 2),
('RES-INFORME', 'Informe Final', 'Informe técnico completo del proyecto', 'residencias', TRUE, 3),
('RES-PRESENT', 'Presentación', 'Presentación final del proyecto', 'residencias', TRUE, 4);
