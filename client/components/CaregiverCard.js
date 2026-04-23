'use client';

import Link from 'next/link';

function Stars({ rating, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= Math.round(rating) ? '#f59e0b' : '#d4bfb3' }}>★</span>
      ))}
    </span>
  );
}

export default function CaregiverCard({ cg, view = 'grid' }) {
  const initials = cg.user.name.split(' ').map(n => n[0]).join('');
  
  const VerifiedBadge = () => (
    <div style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '4px', 
      padding: '4px 8px', 
      background: 'var(--sage-50)', 
      color: 'var(--sage-700)', 
      borderRadius: 'var(--radius-full)', 
      fontSize: '0.75rem', 
      fontWeight: '600',
      border: '1px solid var(--sage-200)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <span style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>✓</span>
      <span>Verified</span>
    </div>
  );

  if (view === 'list') {
    return (
      <div className="card animate-fadeInUp" style={{ padding: 'var(--space-6)', display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start' }}>
        <div className="avatar" style={{ 
          width: 80, height: 80, fontSize: '1.5rem', flexShrink: 0, fontFamily: 'var(--font-serif)', position: 'relative',
          backgroundImage: cg.user.avatar ? `url(${cg.user.avatar})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          {!cg.user.avatar && initials}
          {cg.isVerified && (
            <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--secondary)', color: 'white', border: '2px solid white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>✓</div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
            <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)', fontWeight: 700 }}>{cg.user.name}</h3>
            {cg.isVerified && <VerifiedBadge />}
            {cg.backgroundCheck && <span className="badge badge-warm" style={{ fontSize: '0.65rem' }}>🛡 Background Checked</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
            <Stars rating={cg.rating} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{cg.rating}</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>({cg.totalReviews} reviews)</span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{cg.experience} yrs exp</span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>📍 {cg.location?.city}, {cg.location?.state}</span>
          </div>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-4)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {cg.bio}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {cg.specializations.map(s => <span key={s} className="badge badge-terracotta" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>{s}</span>)}
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-4)' }}>
          <div style={{ background: 'var(--cream-50)', padding: '12px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>${cg.hourlyRate}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>per hour</div>
          </div>
          <Link href={`/book?caregiverId=${cg._id}&name=${encodeURIComponent(cg.user.name)}`} className="btn btn-primary" style={{ width: '100%' }}>Book Session</Link>
          <Link href={`/caregivers/${cg._id}`} style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>View Full Profile</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-fadeInUp" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', transition: 'transform 0.3s var(--ease-smooth)', cursor: 'default' }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-6px)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div className="avatar" style={{ 
          width: 64, height: 64, fontSize: '1.25rem', flexShrink: 0, fontFamily: 'var(--font-serif)', position: 'relative',
          backgroundImage: cg.user.avatar ? `url(${cg.user.avatar})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          {!cg.user.avatar && initials}
          {cg.isVerified && (
            <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--secondary)', color: 'white', border: '2px solid white', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>✓</div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <h3 style={{ fontSize: '1.125rem', margin: 0, color: 'var(--text-primary)', fontWeight: 700 }}>{cg.user.name}</h3>
            {cg.isVerified && <span title="Verified Professional" style={{ color: 'var(--secondary)', fontSize: '1rem' }}>🛡️</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Stars rating={cg.rating} size={12} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{cg.rating}</span>
          </div>
        </div>
      </div>
      
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.88rem' }}>
        {cg.bio}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {cg.specializations.slice(0, 2).map(s => <span key={s} className="badge badge-terracotta" style={{ fontSize: '0.65rem' }}>{s}</span>)}
        {cg.specializations.length > 2 && <span className="badge badge-warm" style={{ fontSize: '0.65rem' }}>+{cg.specializations.length - 2}</span>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>${cg.hourlyRate}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/hr</span>
        </div>
        <Link href={`/book?caregiverId=${cg._id}&name=${encodeURIComponent(cg.user.name)}`} className="btn btn-primary btn-sm">Book Now</Link>
      </div>
    </div>
  );
}
