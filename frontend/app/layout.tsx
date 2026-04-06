import type { Metadata }  from 'next';
import { AuthProvider }   from '@/context/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title:       'SISSEP – Sistema de Seguimiento de Servicios Escolares y Procesos',
  description: 'Plataforma de gestión documental para Servicio Social y Residencias Profesionales',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#111113] text-white antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
