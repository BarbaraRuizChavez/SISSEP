'use client';
import { useAuth }   from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user }  = useAuth();
  const router    = useRouter();
  useEffect(() => {
    if (!user) return;
    router.replace(user.role === 'estudiante' ? '/dashboard/student' : '/dashboard/admin');
  }, [user]);
  return null;
}
