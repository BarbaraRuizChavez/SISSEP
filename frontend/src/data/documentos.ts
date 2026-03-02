export interface Documento {
  id: number;
  nombre: string;
  estado: "Aprobado" | "Rechazado" | "Pendiente";
  nombreArchivo?: string;
  tamano?: string;
  observaciones?: string;
}

export const documentos: Documento[] = [];