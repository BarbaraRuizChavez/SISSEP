import Sidebar from "../components/Sidebar";
import PerfilUsuario from "../components/PerfilUsuario";
import TablaDocumentos from "../components/TablaDocumentos";
import { documentos } from "../data/documentos";
import "../styles/dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="dashboard-content">
        <PerfilUsuario />
        <TablaDocumentos documentos={documentos} />
      </div>
    </div>
  );
}