import React, { useState } from "react";
import axios from "axios";

interface Props {
  documentoId: number;
  onUploadSuccess: () => void;
}

export default function BotonSubir({ documentoId, onUploadSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      console.log("Archivo seleccionado:", e.target.files[0].name);
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Selecciona un archivo primero");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const response = await axios.post(
        `http://127.0.0.1:4000/api/documentos/${documentoId}/subir`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert(response.data.message);
      setFile(null);
      onUploadSuccess();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al subir archivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={handleChange} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Subiendo..." : "Subir Archivo"}
      </button>
    </div>
  );
}