'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export default function DashboardRedirect() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkState = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/auth');
        return;
      }

      try {
        const { user, profileStatus } = await api.auth.me();
        
        // Sync local storage user (optional but helpful)
        localStorage.setItem('user', JSON.stringify(user));

        if (user.role === 'admin') {
          router.replace('/dashboard/admin');
        } else if (user.role === 'caregiver') {
          if (!profileStatus.profileComplete) {
            router.replace('/dashboard/caregiver/setup');
          } else if (!profileStatus.isVerified) {
            router.replace('/dashboard/caregiver/under-review');
          } else {
            router.replace('/dashboard/caregiver');
          }
        } else if (user.role === 'patient') {
          if (!profileStatus.profileComplete) {
            router.replace('/dashboard/patient/setup');
          } else {
            router.replace('/dashboard/patient');
          }
        }
      } catch (err) {
        console.error('State check failed:', err);
        router.replace('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkState();
  }, [router]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--cream-50)' }}>
      <div className="spinner" style={{ width: 48, height: 48, border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <p style={{ marginTop: 'var(--space-6)', color: 'var(--text-secondary)', fontWeight: 500, fontFamily: 'var(--font-serif)', fontSize: '1.25rem' }}>Personalizing your workspace...</p>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
