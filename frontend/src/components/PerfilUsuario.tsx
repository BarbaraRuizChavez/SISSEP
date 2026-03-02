import { useEffect, useState } from "react";

export default function PerfilUsuario() {
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const userStorage = localStorage.getItem("usuario");
    if (userStorage) {
      setUsuario(JSON.parse(userStorage));
    }
  }, []);

  return (
    <div className="perfil-usuario">
      <h2>
        Bienvenido, {usuario ? usuario.nombre : "Usuario"}
      </h2>
      <p>Panel de gestión de documentos</p>
    </div>
  );
}