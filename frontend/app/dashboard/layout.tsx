'use client';
import { useAuth }    from '@/context/AuthContext';
import { useRouter }  from 'next/navigation';
import { useEffect }  from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router           = useRouter();

  useEffect(() => { if (!user) router.push('/login'); }, [user]);
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#111113] text-white">
      {/* Topnav */}
      <nav className="fixed top-0 inset-x-0 h-[52px] bg-[#1a1a1e] border-b border-[#333340] flex items-center justify-between px-5 z-50">
        <span className="font-mono font-bold text-[15px] tracking-wider">
          SISSEP<span className="text-indigo-400">.</span>
        </span>
        <button onClick={() => { logout(); router.push('/login'); }}
          className="text-xs font-bold text-red-400 border border-red-500 bg-red-500/10 px-3.5 py-1.5 rounded-md hover:bg-red-500 hover:text-white transition">
          Cerrar Sesión
        </button>
      </nav>
      <div className="pt-[52px]">{children}</div>
    </div>
  );
}
