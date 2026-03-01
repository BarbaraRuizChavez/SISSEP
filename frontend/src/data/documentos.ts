export interface Documento {
  id: number;
  nombre: string;
  descripcion: string;
  estado: "Aprobado" | "Rechazado" | "Pendiente";
  nombreArchivo?: string;
  tamano?: string;
  observaciones?: string;
}

export const documentos: Documento[] = [
  {
    id: 1,
    nombre: "Solicitud de Servicio Social",
    descripcion: "Formato de solicitud oficial",
    estado: "Aprobado",
    nombreArchivo: "solicitud_de_servicio_social.pdf",
    tamano: "680 KB",
  },
  {
    id: 2,
    nombre: "Carta de Aceptacion",
    descripcion: "Carta de aceptación de la institución",
    estado: "Aprobado",
    nombreArchivo: "carta_de_aceptacion.pdf",
    tamano: "1.1 MB",
  },
  {
    id: 3,
    nombre: "Carta de Presentacion",
    descripcion: "Carta de presentación del estudiante",
    estado: "Aprobado",
    nombreArchivo: "carta_de_presentacion.pdf",
    tamano: "920 KB",
  },
  {
    id: 4,
    nombre: "Carta de Asignacion",
    descripcion: "Carta de asignación oficial",
    estado: "Aprobado",
    nombreArchivo: "carta_de_asignacion.pdf",
    tamano: "1.0 MB",
  },
  {
    id: 5,
    nombre: "Plan de Trabajo",
    descripcion: "Plan detallado de actividades",
    estado: "Rechazado",
    observaciones: "El documento no contiene firma oficial.",
  },
  {
    id: 6,
    nombre: "Cronograma de Actividades",
    descripcion: "Calendario de actividades programadas",
    estado: "Pendiente",
  },
  {
    id: 7,
    nombre: "Reporte Mensual 1",
    descripcion: "Primer reporte mensual de actividades",
    estado: "Aprobado",
  },
  {
    id: 8,
    nombre: "Reporte Mensual 3",
    descripcion: "Tercer reporte mensual de actividades",
    estado: "Pendiente",
  },
  {
    id: 9,
    nombre: "Reporte Mensual 4",
    descripcion: "Cuarto reporte mensual de actividades",
    estado: "Pendiente",
  },
  {
    id: 10,
    nombre: "Reporte Mensual 5",
    descripcion: "Quinto reporte mensual de actividades",
    estado: "Pendiente",
  },
  {
    id: 11,
    nombre: "Reporte Mensual 6",
    descripcion: "Sexto reporte mensual de actividades",
    estado: "Pendiente",
  },
  {
    id: 12,
    nombre: "Informe Final",
    descripcion: "Informe final del servicio social",
    estado: "Pendiente",
  },
  {
    id: 13,
    nombre: "Carta de Terminacion",
    descripcion: "Carta de terminación del servicio",
    estado: "Pendiente",
  },
  {
    id: 14,
    nombre: "Carta de Liberacion",
    descripcion: "Carta de liberación oficial",
    estado: "Pendiente",
  },
  {
    id: 15,
    nombre: "Evaluacion del Prestador",
    descripcion: "Evaluación del prestador de servicio",
    estado: "Pendiente",
  },
  {
    id: 16,
    nombre: "Evaluacion de la Institucion",
    descripcion: "Evaluación de la institución receptora",
    estado: "Pendiente",
  },
  {
    id: 17,
    nombre: "Constancia de Servicio Social",
    descripcion: "Constancia oficial de servicio social",
    estado: "Pendiente",
  },
];