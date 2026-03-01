export default function BotonSubir() {
  const manejarClick = () => {
    alert("Función subir archivo próximamente...");
  };

  return (
    <button className="btn-subir" onClick={manejarClick}>
      Subir Archivo
    </button>
  );
}