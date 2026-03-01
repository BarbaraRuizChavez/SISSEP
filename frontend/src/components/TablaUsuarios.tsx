import { useEffect, useState } from "react";

interface Usuario {
  id: number;
  name: string;
  email: string;
}

const TablaUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/users")
      .then(res => res.json())
      .then((data: Usuario[]) => {
        console.log("Datos recibidos:", data); // 🔍 para depuración
        setUsuarios(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetch:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <table border={1} cellPadding={5}>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        {usuarios.map(u => (
          <tr key={u.id}>
            <td>{u.id}</td>
            <td>{u.name}</td>
            <td>{u.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TablaUsuarios;