'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';

export default function UnderReviewPage() {
  const router = useRouter();

  const handleRefresh = () => {
    // Redirecting to /dashboard will trigger the DashboardRedirect logic to check current status
    router.push('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, var(--cream-50), var(--terracotta-50))',
      padding: 'var(--space-6)'
    }}>
      <div className="card animate-fadeIn" style={{ maxWidth: '600px', padding: 'var(--space-10)', textAlign: 'center', boxShadow: 'var(--shadow-2xl)' }}>
        <div style={{ 
          fontSize: '4rem', 
          marginBottom: 'var(--space-6)', 
          animation: 'pulse 2s infinite' 
        }}>⏳</div>
        
        <h1 style={{ 
          fontFamily: 'var(--font-serif)', 
          fontSize: '2.25rem', 
          color: 'var(--primary)', 
          marginBottom: 'var(--space-4)' 
        }}>
          Profile Under Review
        </h1>
        
        <p style={{ 
          fontSize: '1.125rem', 
          lineHeight: 1.6, 
          color: 'var(--text-secondary)', 
          marginBottom: 'var(--space-8)' 
        }}>
          Thank you for joining CareNest! Your professional caregiver profile is currently being vetted by our clinical administration team.
        </p>
        
        <div style={{ 
          background: 'white', 
          padding: '24px', 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid var(--border)',
          textAlign: 'left',
          marginBottom: 'var(--space-8)'
        }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '12px', fontWeight: 700 }}>Next Steps:</h3>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Our team will verify your certifications and background check.</li>
            <li>This process typically takes <strong>24-48 business hours</strong>.</li>
            <li>You will receive an email once your profile is activated.</li>
          </ul>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={handleRefresh} className="btn btn-primary" style={{ width: '100%', padding: '16px' }}>
            Check My Status
          </button>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/" className="btn btn-outline" style={{ flex: 1 }}>Home</Link>
            <button onClick={handleLogout} className="btn btn-ghost" style={{ flex: 1 }}>Logout</button>
          </div>
        </div>

        <p style={{ marginTop: 'var(--space-8)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Need urgent assistance? <a href="mailto:support@carenest.com" style={{ color: 'var(--primary)', fontWeight: 600 }}>Contact Support</a>
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
