import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ background: 'var(--brown-800)', color: '#fff', paddingTop: 'var(--space-16)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 'var(--space-10)', paddingBottom: 'var(--space-12)' }}>
          {/* Brand */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'var(--space-4)' }}>
              <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,var(--primary),var(--terracotta-700))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🌿</div>
              <span style={{ fontFamily:'var(--font-serif)', fontSize:'1.375rem', fontWeight:700 }}>Care<span style={{ color:'var(--terracotta-300)' }}>Nest</span></span>
            </div>
            <p style={{ color:'var(--brown-200)', lineHeight:1.8, fontSize:'0.9375rem', marginBottom:'var(--space-6)', maxWidth:300 }}>
              Connecting families with compassionate, verified caregivers. Trusted by thousands of families across the country.
            </p>
            <div style={{ display:'flex', gap:12 }}>
              {['Facebook', 'Twitter', 'Instagram', 'LinkedIn'].map(s => (
                <a key={s} href="#" style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', color:'var(--brown-200)', transition:'var(--transition)' }}
                  onMouseEnter={e => { e.currentTarget.style.background='var(--primary)'; e.currentTarget.style.color='#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.color='var(--brown-200)'; }}
                >{s[0]}</a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 style={{ fontFamily:'var(--font-serif)', fontSize:'1rem', marginBottom:'var(--space-4)', color:'#fff' }}>Services</h4>
            <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'var(--space-3)' }}>
              {['Personal Care', 'Medication Management', 'Dementia Care', 'Post‑Surgery Recovery', 'Companionship', 'Household Help'].map(s => (
                <li key={s}><Link href="/caregivers" style={{ color:'var(--brown-200)', fontSize:'0.9rem', transition:'var(--transition)' }}
                  onMouseEnter={e => e.target.style.color='var(--terracotta-300)'}
                  onMouseLeave={e => e.target.style.color='var(--brown-200)'}
                >{s}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 style={{ fontFamily:'var(--font-serif)', fontSize:'1rem', marginBottom:'var(--space-4)', color:'#fff' }}>Company</h4>
            <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'var(--space-3)' }}>
              {['About Us', 'How It Works', 'For Caregivers', 'Safety & Trust', 'Blog', 'Careers'].map(s => (
                <li key={s}><a href="#" style={{ color:'var(--brown-200)', fontSize:'0.9rem', transition:'var(--transition)' }}
                  onMouseEnter={e => e.target.style.color='var(--terracotta-300)'}
                  onMouseLeave={e => e.target.style.color='var(--brown-200)'}
                >{s}</a></li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 style={{ fontFamily:'var(--font-serif)', fontSize:'1rem', marginBottom:'var(--space-4)', color:'#fff' }}>Support</h4>
            <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'var(--space-3)' }}>
              {['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service', 'Accessibility'].map(s => (
                <li key={s}><a href="#" style={{ color:'var(--brown-200)', fontSize:'0.9rem', transition:'var(--transition)' }}
                  onMouseEnter={e => e.target.style.color='var(--terracotta-300)'}
                  onMouseLeave={e => e.target.style.color='var(--brown-200)'}
                >{s}</a></li>
              ))}
            </ul>
            <div style={{ marginTop:'var(--space-6)', padding:'var(--space-4)', background:'rgba(255,255,255,0.06)', borderRadius:'var(--radius-md)', border:'1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize:'0.8125rem', color:'var(--brown-200)', marginBottom:'var(--space-2)' }}>24/7 Emergency Line</p>
              <p style={{ fontSize:'1.125rem', fontWeight:700, color:'var(--terracotta-300)' }}>1-800-CARENEST</p>
            </div>
          </div>
        </div>

        <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', padding:'var(--space-6) 0', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'var(--space-3)' }}>
          <p style={{ color:'var(--brown-400)', fontSize:'0.875rem' }}>
            © {year} CareNest Inc. All rights reserved. 
            <span style={{ marginLeft: 'var(--space-4)', opacity: 0.6 }}>|</span>
            <span style={{ marginLeft: 'var(--space-4)' }}>In collaboration with <strong>Unified Mentor</strong></span>
          </p>
          <div style={{ display:'flex', gap:'var(--space-2)' }}>
            <span className="badge-warm badge" style={{ background:'rgba(196,105,78,0.15)', color:'var(--terracotta-200)' }}>🔒 HIPAA Compliant</span>
            <span className="badge-warm badge" style={{ background:'rgba(196,105,78,0.15)', color:'var(--terracotta-200)' }}>✓ Verified Caregivers</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          footer .container > div:first-child { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          footer .container > div:first-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
