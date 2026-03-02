import type { Documento } from "../data/documentos";
import BotonSubir from "./BotonSubir";
import "../styles/table.css";

interface Props {
  documento: Documento;
  onUploadSuccess: () => void;
}

export default function DocumentoFila({ documento, onUploadSuccess }: Props) {
  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case "Aprobado":
        return "estado aprobado";
      case "Rechazado":
        return "estado rechazado";
      default:
        return "estado pendiente";
    }
  };

  const verObservacion = () => {
    alert(documento.observaciones || "No hay observaciones.");
  };

  return (
    <tr>
      <td>{documento.nombre}</td>
      <td>
        <span className={getEstadoClass(documento.estado)}>{documento.estado}</span>
      </td>
      <td>
        {documento.estado === "Rechazado" && documento.observaciones ? (
          <button onClick={verObservacion} className="btn-ver">
            💬 Ver
          </button>
        ) : (
          "-"
        )}
      </td>
      <td>
        {documento.nombreArchivo ? (
          <>
            <button className="btn-ver">Ver</button>
            <div className="archivo-info">
              {documento.nombreArchivo} <br />
              {documento.tamano}
            </div>
          </>
        ) : (
          <BotonSubir documentoId={documento.id} onUploadSuccess={onUploadSuccess} />
        )}
      </td>
    </tr>
  );
}