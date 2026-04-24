'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth }   from '@/context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const router   = useRouter();

  useEffect(() => {
    if (!user) return;
    router.replace(user.role === 'estudiante' ? '/dashboard/student' : '/dashboard/admin');
  }, [user]);

  return null;
}
