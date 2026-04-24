'use client';
import { useEffect }  from 'react';
import { useRouter }  from 'next/navigation';
import { useAuth }    from '@/context/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router           = useRouter();

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user]);

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav className="topnav">
        <span className="topnav-logo">SISSEP<span>.</span></span>
        <div className="topnav-right">
          <span className="topnav-username">{user.name}</span>
          <span className={`role-badge ${user.role}`}>{user.role}</span>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => { logout(); router.push('/login'); }}
            type="button"
          >
            Salir
          </button>
        </div>
      </nav>
      <div style={{ paddingTop: 'var(--nav-height)' }}>{children}</div>
    </div>
  );
}
