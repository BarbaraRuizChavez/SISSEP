import { useEffect, useState } from "react";
import DocumentoFila from "./DocumentoFila";
import type { Documento } from "../data/documentos";
import axios from "axios";
import "../styles/table.css";

interface Props {
  documentos?: Documento[];
}

export default function TablaDocumentos({ documentos: initDocs }: Props) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);

  const obtenerDocumentos = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:4000/api/documentos");
      setDocumentos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    obtenerDocumentos();
  }, []);

  return (
    <table className="tabla-documentos">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Estado</th>
          <th>Observaciones</th>
          <th>Archivo / Acciones</th>
        </tr>
      </thead>
      <tbody>
        {documentos.map((doc) => (
          <DocumentoFila key={doc.id} documento={doc} onUploadSuccess={obtenerDocumentos} />
        ))}
      </tbody>
    </table>
  );
}