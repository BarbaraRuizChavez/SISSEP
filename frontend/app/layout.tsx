import type { Metadata } from 'next';
import { AuthProvider }  from '@/context/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title:       'SISSEP',
  description: 'Sistema de Seguimiento de Servicios Escolares y Procesos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
