export interface CatalogItem {
  category:     string;
  description:  string;
  periodNumber: number;
}

const SERVICIO_SOCIAL: CatalogItem[] = [
  // Período 1: 23 Ene – 3 Feb
  { periodNumber: 1, category: 'SOLICITUD DE SERVICIO SOCIAL',       description: 'Formato oficial de solicitud de servicio social' },
  { periodNumber: 1, category: 'CARTA COMPROMISO',                   description: 'Carta compromiso del prestador de servicio' },
  { periodNumber: 1, category: 'PLAN DE TRABAJO',                    description: 'Plan detallado de actividades a realizar' },
  // Período 2: 18 Feb – 3 Mar
  { periodNumber: 2, category: 'CARTA DE PRESENTACION',              description: 'Carta de presentacion ante la institucion receptora' },
  { periodNumber: 2, category: 'CARTA DE ACEPTACION',                description: 'Carta de aceptacion por parte de la institucion' },
  // Período 3: 13 Abr – 24 Abr
  { periodNumber: 3, category: 'REPORTE BIMESTRAL 1',                description: 'Primer reporte bimestral de actividades' },
  { periodNumber: 3, category: 'EVALUACION CUALITATIVA 1',           description: 'Primera evaluacion cualitativa del prestador (Formato XXII)' },
  { periodNumber: 3, category: 'AUTOEVALUACION CUALITATIVA 1',       description: 'Primera autoevaluacion cualitativa (Formato XXIII)' },
  { periodNumber: 3, category: 'EVALUACION DE LAS ACTIVIDADES 1',    description: 'Primera evaluacion de actividades realizadas (Formato XXIV)' },
  // Período 4: 11 May – 22 May
  { periodNumber: 4, category: 'REPORTE BIMESTRAL 2',                description: 'Segundo reporte bimestral de actividades' },
  { periodNumber: 4, category: 'EVALUACION CUALITATIVA 2',           description: 'Segunda evaluacion cualitativa del prestador (Formato XXII)' },
  { periodNumber: 4, category: 'AUTOEVALUACION CUALITATIVA 2',       description: 'Segunda autoevaluacion cualitativa (Formato XXIII)' },
  { periodNumber: 4, category: 'EVALUACION DE LAS ACTIVIDADES 2',    description: 'Segunda evaluacion de actividades realizadas (Formato XXIV)' },
  // Período 5: 8 Jun – 19 Jun
  { periodNumber: 5, category: 'REPORTE BIMESTRAL 3',                description: 'Tercer reporte bimestral de actividades' },
  { periodNumber: 5, category: 'EVALUACION CUALITATIVA 3',           description: 'Tercera evaluacion cualitativa del prestador (Formato XXII)' },
  { periodNumber: 5, category: 'AUTOEVALUACION CUALITATIVA 3',       description: 'Tercera autoevaluacion cualitativa (Formato XXIII)' },
  { periodNumber: 5, category: 'EVALUACION DE LAS ACTIVIDADES 3',    description: 'Tercera evaluacion de actividades realizadas (Formato XXIV)' },
  // Período 6: 22 Jun – 30 Jun
  { periodNumber: 6, category: 'CARTA DE TERMINACION',               description: 'Carta de terminacion del servicio social' },
];

const RESIDENCIAS: CatalogItem[] = [
  { periodNumber: 1, category: 'SOLICITUD DE RESIDENCIAS',           description: 'Formato oficial de solicitud de residencias profesionales' },
  { periodNumber: 1, category: 'CARTA DE ACEPTACION',                description: 'Carta de aceptacion de la empresa receptora' },
  { periodNumber: 1, category: 'ANTEPROYECTO',                       description: 'Documento de anteproyecto aprobado' },
  { periodNumber: 1, category: 'CARTA DE PRESENTACION',              description: 'Carta de presentacion del estudiante' },
  { periodNumber: 2, category: 'REPORTE PARCIAL 1',                  description: 'Primer reporte de avance de residencias' },
  { periodNumber: 2, category: 'REPORTE PARCIAL 2',                  description: 'Segundo reporte de avance de residencias' },
  { periodNumber: 3, category: 'REPORTE PARCIAL 3',                  description: 'Tercer reporte de avance de residencias' },
  { periodNumber: 3, category: 'REPORTE FINAL',                      description: 'Reporte final de la residencia profesional' },
  { periodNumber: 3, category: 'CARTA DE TERMINACION',               description: 'Carta de terminacion emitida por la empresa' },
  { periodNumber: 3, category: 'EVALUACION DEL RESIDENTE',           description: 'Evaluacion del estudiante por la empresa' },
];

export const getCatalog = (programType: string): CatalogItem[] =>
  programType === 'servicio_social' ? SERVICIO_SOCIAL : RESIDENCIAS;
