import type { Documento } from "../data/documentos";
import DocumentoFila from "./DocumentoFila";
import "../styles/table.css";

interface Props {
  documentos: Documento[];
}

export default function TablaDocumentos({ documentos }: Props) {
  return (
    <div className="tabla-container">
      <table>
        <thead>
          <tr>
            <th>Categoría</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Observaciones</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {documentos.map((doc) => (
            <DocumentoFila key={doc.id} documento={doc} />
          ))}
        </tbody>
      </table>
    </div>
  );
}