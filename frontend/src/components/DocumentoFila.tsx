import type { Documento } from "../data/documentos";
import BotonSubir from "./BotonSubir";

interface Props {
  documento: Documento;
}

export default function DocumentoFila({ documento }: Props) {
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
    if (documento.observaciones) {
      alert(documento.observaciones);
    } else {
      alert("No hay observaciones.");
    }
  };

  return (
    <tr>
      <td>
          {documento.nombre}
          {documento.requerido && (
            <span style={{ color: "red", marginLeft: "6px" }}>
              (Requerido)
            </span>
        )}
      </td>
      <td>{documento.descripcion}</td>

      <td>
        <span className={getEstadoClass(documento.estado)}>
          {documento.estado}
        </span>
      </td>

      <td>
        <button onClick={verObservacion}>💬 Ver</button>
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
    <button className="btn-subir">Subir Archivo</button>
  )}
</td>
    </tr>
  );
}