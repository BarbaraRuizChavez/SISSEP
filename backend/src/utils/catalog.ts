import { ProgramType } from '../types';

// Catalogo de documentos requeridos para Servicio Social
const SERVICIO_SOCIAL = [
  { category: 'Solicitud de Servicio Social',    description: 'Formato de solicitud oficial' },
  { category: 'Carta de Aceptacion',             description: 'Carta de aceptacion de la institucion' },
  { category: 'Carta de Presentacion',           description: 'Carta de presentacion del estudiante' },
  { category: 'Carta de Asignacion',             description: 'Carta de asignacion oficial' },
  { category: 'Plan de Trabajo',                 description: 'Plan detallado de actividades' },
  { category: 'Cronograma de Actividades',       description: 'Calendario de actividades programadas' },
  { category: 'Reporte Mensual 1',               description: 'Primer reporte mensual de actividades' },
  { category: 'Reporte Mensual 2',               description: 'Segundo reporte mensual de actividades' },
  { category: 'Reporte Mensual 3',               description: 'Tercer reporte mensual de actividades' },
  { category: 'Reporte Mensual 4',               description: 'Cuarto reporte mensual de actividades' },
  { category: 'Reporte Mensual 5',               description: 'Quinto reporte mensual de actividades' },
  { category: 'Reporte Mensual 6',               description: 'Sexto reporte mensual de actividades' },
  { category: 'Informe Final',                   description: 'Informe final del servicio social' },
  { category: 'Carta de Terminacion',            description: 'Carta de terminacion del servicio' },
  { category: 'Carta de Liberacion',             description: 'Carta de liberacion oficial' },
  { category: 'Evaluacion del Prestador',        description: 'Evaluacion del prestador de servicio' },
  { category: 'Evaluacion de la Institucion',    description: 'Evaluacion de la institucion receptora' },
  { category: 'Constancia de Servicio Social',   description: 'Constancia oficial de servicio social' },
];

// Catalogo de documentos requeridos para Residencias Profesionales
const RESIDENCIAS = [
  { category: 'Solicitud de Residencias',        description: 'Formato de solicitud oficial' },
  { category: 'Carta de Aceptacion',             description: 'Carta de la empresa receptora' },
  { category: 'Anteproyecto',                    description: 'Documento de anteproyecto aprobado' },
  { category: 'Carta de Presentacion',           description: 'Carta de presentacion del estudiante' },
  { category: 'Reporte Parcial 1',               description: 'Primer reporte de avance' },
  { category: 'Reporte Parcial 2',               description: 'Segundo reporte de avance' },
  { category: 'Reporte Parcial 3',               description: 'Tercer reporte de avance' },
  { category: 'Reporte Final',                   description: 'Reporte final de la residencia' },
  { category: 'Carta de Terminacion',            description: 'Carta de la empresa al finalizar' },
  { category: 'Evaluacion del Residente',        description: 'Evaluacion del estudiante por la empresa' },
];

export const getCatalog = (programType: ProgramType) =>
  programType === 'servicio_social' ? SERVICIO_SOCIAL : RESIDENCIAS;
