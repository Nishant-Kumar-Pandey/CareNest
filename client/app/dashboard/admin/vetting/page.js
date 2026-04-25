'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { api } from '../../../../lib/api';

export default function AdminVettingGateway() {
  const router = useRouter();
  const [pendingProfiles, setPendingProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State to handle the micro-animations of exiting cards
  const [animatingId, setAnimatingId] = useState(null);
  const [animationType, setAnimationType] = useState(null); // 'verify' | 'reject'

  useEffect(() => {
    fetchPendingCaregivers();
  }, []);

  const fetchPendingCaregivers = async () => {
    try {
      const { data } = await api.admin.pendingCaregivers();
      setPendingProfiles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, type) => {
    // 1. Trigger the micro-animation lock
    setAnimatingId(id);
    setAnimationType(type);

    try {
      if (type === 'verify') await api.admin.verifyCaregiver(id);
      else await api.admin.rejectCaregiver(id);

      // 2. Wait for animation to finish before unmounting the card
      setTimeout(() => {
        setPendingProfiles(prev => prev.filter(profile => profile._id !== id));
        setAnimatingId(null);
        setAnimationType(null);
        toast.success(type === 'verify' ? 'Profile Verified!' : 'Profile Rejected');
      }, 600); // 600ms exit animation

    } catch (err) {
      toast.error(`Action failed: ${err.message}`);
      setAnimatingId(null);
      setAnimationType(null);
    }
  };

  if (loading) return <div className="container section-sm" style={{ textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  if (error) return <div className="container section-sm" style={{ color: 'red' }}>Error loading vetting gateway: {error}</div>;

  return (
    <div className="container section-sm animate-fadeIn">
      
      <div style={{ marginBottom: 'var(--space-12)', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
          <Link href="/dashboard/admin" className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>← Back to Command Center</Link>
        </div>
        <h1 className="section-heading" style={{ color: 'var(--text-primary)' }}>Intelligence Grid</h1>
        <p className="section-subheading" style={{ margin: '0 auto', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 700 }}>
          {pendingProfiles.length} Profiles Pending Verification
        </p>
      </div>

      {pendingProfiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-16)', background: 'var(--cream-100)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--text-secondary)' }}>Inbox Zero</h3>
          <p style={{ color: 'var(--text-muted)' }}>All caregiver profiles have been vetted and processed.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          {pendingProfiles.map(profile => {
            const isAnimating = animatingId === profile._id;
            
            // Dynamic animation mapping
            let exitTransform = 'none';
            if (isAnimating) {
              if (animationType === 'verify') {
                exitTransform = 'scale(0.9) translateY(-20px)';
              } else {
                exitTransform = 'scale(0.95) translateX(40px)';
              }
            }

            return (
              <div 
                key={profile._id}
                style={{
                  background: isAnimating 
                    ? (animationType === 'verify' ? 'var(--sage-50)' : '#fef2f2') 
                    : 'rgba(255, 253, 249, 0.7)', // Glassmorphic base
                  backdropFilter: 'blur(12px)',
                  borderRadius: 'var(--radius-xl)',
                  border: isAnimating 
                    ? (animationType === 'verify' ? '2px solid var(--secondary)' : '2px solid #ef4444')
                    : '1px solid var(--border)',
                  padding: 'var(--space-6)',
                  boxShadow: isAnimating
                    ? (animationType === 'verify' ? '0 0 40px rgba(77,132,82,0.2)' : '0 0 40px rgba(239,68,68,0.15)')
                    : 'var(--shadow-md)',
                  transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                  transform: exitTransform,
                  opacity: isAnimating ? 0 : 1,
                  // Layout structured for data density
                  display: 'grid',
                  gridTemplateColumns: '1fr 300px',
                  gap: 'var(--space-8)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Zone A & C: Profile Data */}
                <div>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--secondary-light)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 600 }}>
                      {profile.user.name.charAt(0)}
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{profile.user.name}</h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>ID: {profile._id.toString().substring(18)} • {profile.location.city}, {profile.location.state}</p>
                    </div>
                  </div>

                  <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 'var(--space-6)', fontStyle: 'italic' }}>
                    "{profile.bio}"
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: 'var(--space-4)' }}>
                    {profile.specializations.map(spec => (
                      <span key={spec} className="badge badge-sage">{spec}</span>
                    ))}
                  </div>

                  {profile.certifications.length > 0 && (
                    <div style={{ background: 'var(--cream-100)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                      <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '8px' }}>Verified Credentials</h4>
                      {profile.certifications.map(cert => (
                        <div key={cert._id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '4px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cert.name}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{cert.issuer} ({cert.year})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Zone B: Action Matrix */}
                <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border)', paddingLeft: 'var(--space-8)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Requested Rate:</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>${profile.hourlyRate}/hr</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Experience:</span>
                    <span style={{ fontWeight: 700 }}>{profile.experience} Years</span>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button 
                      onClick={() => handleAction(profile._id, 'verify')}
                      disabled={animatingId !== null}
                      style={{
                        padding: '16px',
                        background: 'var(--secondary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 600,
                        fontSize: '1rem',
                        cursor: animatingId !== null ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(77,132,82,0.3)',
                        transition: 'transform 0.2s',
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      Verify Profile
                    </button>
                    
                    <button 
                      onClick={() => handleAction(profile._id, 'reject')}
                      disabled={animatingId !== null}
                      style={{
                        padding: '16px',
                        background: 'transparent',
                        color: '#ef4444',
                        border: '2px solid #fee2e2',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 600,
                        fontSize: '1rem',
                        cursor: animatingId !== null ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s',
                      }}
                      onMouseOver={(e) => e.target.style.background = '#fee2e2'}
                      onMouseOut={(e) => e.target.style.background = 'transparent'}
                    >
                      Reject Origin
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
