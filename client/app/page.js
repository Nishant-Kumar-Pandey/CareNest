'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';


const TESTIMONIALS = [
  { name:'Thomas Whitfield', relation:'Son of Eleanor', rating:5, text:'CareNest connected us with Sarah within 24 hours. She has become like family — mom lights up every time she visits. I sleep soundly knowing she\'s well cared for.' },
  { name:'Patricia Nguyen',  relation:'Daughter of George', rating:5, text:'After dad\'s hip surgery we were overwhelmed. James from CareNest guided the entire recovery process. His medical expertise made all the difference.' },
  { name:'Robert & Linda Kim', relation:'Children of Mei-Lin', rating:5, text:'Finding a caregiver who speaks Mandarin felt impossible. Maria was a miracle — she connects with mom in a way nobody else could. Forever grateful.' },
];
const STATS = [
  { value:'4,800+', label:'Families Served', icon:'👨‍👩‍👧' },
  { value:'650+',   label:'Verified Caregivers', icon:'✓' },
  { value:'98%',    label:'Satisfaction Rate', icon:'⭐' },
  { value:'24/7',   label:'Support Available', icon:'📞' },
];

function Stars({ rating, size = 14 }) {
  return (
    <span className="stars">
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= Math.round(rating) ? '#f59e0b' : '#d4bfb3' }}>★</span>
      ))}
    </span>
  );
}

function CaregiverCard({ cg }) {
  const initials = cg.user.name.split(' ').map(n => n[0]).join('');
  return (
    <div className="card" style={{ padding:'var(--space-6)', display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'var(--space-4)' }}>
        <div className="avatar" style={{ width:60, height:60, fontSize:'1.25rem', flexShrink:0 }}>
          {initials}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <h3 style={{ fontSize:'1.0625rem', margin:0 }}>{cg.user.name}</h3>
            {cg.isVerified && <span className="badge badge-sage" style={{ fontSize:'0.65rem' }}>✓ Verified</span>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
            <Stars rating={cg.rating} />
            <span style={{ fontSize:'0.875rem', color:'var(--text-secondary)' }}>{cg.rating} ({cg.totalReviews})</span>
          </div>
        </div>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {cg.specializations.slice(0,2).map(s => (
          <span key={s} className="badge badge-terracotta">{s}</span>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'var(--space-3)', borderTop:'1px solid var(--border)' }}>
        <div>
          <span style={{ fontSize:'1.25rem', fontWeight:700, fontFamily:'var(--font-serif)', color:'var(--primary)' }}>${cg.hourlyRate}</span>
          <span style={{ fontSize:'0.8125rem', color:'var(--text-muted)' }}>/hr</span>
          <p style={{ fontSize:'0.8125rem', color:'var(--text-muted)', margin:0 }}>{cg.experience} yrs exp · {cg.location.city}</p>
        </div>
        <Link href={`/book?caregiverId=${cg._id}`} className="btn btn-primary btn-sm">Book Now</Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [caregivers, setCaregivers] = useState([]);
  const [services, setServices]     = useState([]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    fetch(`${API}/caregivers?limit=3`).then(r=>r.json()).then(d=>{ if(d.data?.caregivers?.length) setCaregivers(d.data.caregivers); }).catch(e=>console.error(e));
    fetch(`${API}/services`).then(r=>r.json()).then(d=>{ if(d.data?.length) setServices(d.data); }).catch(e=>console.error(e));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(i => (i+1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <Navbar />

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        background: 'linear-gradient(145deg, var(--cream-100) 0%, var(--terracotta-50) 45%, var(--sage-50) 100%)',
        position: 'relative', overflow: 'hidden', paddingTop: 72,
      }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:'-10%', right:'-5%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(196,105,78,0.12) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-10%', left:'-5%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(77,132,82,0.10) 0%, transparent 70%)', pointerEvents:'none' }} />

        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-16)', alignItems:'center' }}>
            {/* Left — copy */}
            <div className="animate-fadeInUp">
              <div className="section-label" style={{ marginBottom:'var(--space-5)' }}>Trusted Senior Care</div>
              <h1 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(2.5rem, 5vw, 3.75rem)', lineHeight:1.15, marginBottom:'var(--space-6)', color:'var(--text-primary)' }}>
                Care That Feels Like{' '}
                <span style={{ color:'var(--primary)', fontStyle:'italic' }}>Family</span>
              </h1>
              <p style={{ fontSize:'1.125rem', color:'var(--text-secondary)', lineHeight:1.8, marginBottom:'var(--space-8)', maxWidth:480 }}>
                Connect your loved ones with verified, compassionate caregivers. From daily assistance to specialized medical support — we make finding trusted care simple, safe, and personal.
              </p>
              <div style={{ display:'flex', gap:'var(--space-4)', flexWrap:'wrap' }}>
                <Link href="/caregivers" className="btn btn-primary btn-lg">
                  🔍 Find a Caregiver
                </Link>
                <Link href="/book" className="btn btn-outline btn-lg">
                  📅 Book Care Now
                </Link>
              </div>
              <div style={{ display:'flex', gap:'var(--space-6)', marginTop:'var(--space-8)', flexWrap:'wrap' }}>
                {[{v:'4,800+',l:'Families Served'},{v:'650+',l:'Verified Caregivers'},{v:'98%',l:'Satisfaction'}].map(({v,l}) => (
                  <div key={l}>
                    <div style={{ fontFamily:'var(--font-serif)', fontSize:'1.625rem', fontWeight:700, color:'var(--primary)' }}>{v}</div>
                    <div style={{ fontSize:'0.8125rem', color:'var(--text-muted)', fontWeight:500 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — floating cards */}
            <div style={{ position:'relative', minHeight:480, display:'flex', alignItems:'center', justifyContent:'center' }} className="animate-scaleIn">
              {/* Main feature card */}
              <div style={{
                background:'var(--warm-white)', borderRadius:'var(--radius-xl)',
                padding:'var(--space-8)', boxShadow:'var(--shadow-xl)',
                border:'1px solid var(--terracotta-100)', maxWidth:360, width:'100%',
                animation:'float 4s ease-in-out infinite',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'var(--space-6)' }}>
                  <div>
                    <p style={{ fontSize:'0.8125rem', color:'var(--text-muted)', marginBottom:4 }}>Today's Care Visit</p>
                    <h3 style={{ fontSize:'1.125rem', margin:0 }}>Morning Check-In</h3>
                  </div>
                  <span style={{ background:'var(--sage-100)', color:'var(--sage-700)', padding:'4px 12px', borderRadius:'var(--radius-full)', fontSize:'0.75rem', fontWeight:700 }}>✓ Confirmed</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', marginBottom:'var(--space-5)', padding:'var(--space-4)', background:'var(--cream-100)', borderRadius:'var(--radius-md)' }}>
                  <div className="avatar" style={{ width:48, height:48, fontSize:'1rem', fontWeight:700, background:'var(--primary)', color:'#fff', border:'none' }}>SM</div>
                  <div>
                    <p style={{ fontWeight:600, margin:0 }}>Sarah Mitchell</p>
                    <p style={{ fontSize:'0.8125rem', color:'var(--text-muted)', margin:0 }}>Dementia Care Specialist</p>
                    <Stars rating={5} size={12} />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-3)' }}>
                  {[{icon:'🕘',label:'9:00 AM – 1:00 PM'},{icon:'📍',label:'123 Oak Street'},{icon:'💊',label:'Medications Due'},{icon:'🩺',label:'Vitals Normal'}].map(({icon,label}) => (
                    <div key={label} style={{ padding:'var(--space-3)', background:'var(--warm-white)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:16 }}>{icon}</span>
                      <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)', fontWeight:500 }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badge */}
              <div style={{ position:'absolute', top:'10%', right:'-5%', background:'var(--primary)', color:'#fff', borderRadius:'var(--radius-md)', padding:'var(--space-3) var(--space-4)', boxShadow:'var(--shadow-lg)', animation:'float 5s ease-in-out infinite 1s' }}>
                <div style={{ fontSize:'1.25rem', fontWeight:700, fontFamily:'var(--font-serif)' }}>4.9 ★</div>
                <div style={{ fontSize:'0.75rem', opacity:0.9 }}>Avg Rating</div>
              </div>

              <div style={{ position:'absolute', bottom:'12%', left:'-8%', background:'var(--secondary)', color:'#fff', borderRadius:'var(--radius-md)', padding:'var(--space-3) var(--space-4)', boxShadow:'var(--shadow-lg)', animation:'float 3.5s ease-in-out infinite 0.5s' }}>
                <div style={{ fontSize:'0.875rem', fontWeight:700 }}>🛡 Background Checked</div>
                <div style={{ fontSize:'0.75rem', opacity:0.9 }}>Every caregiver</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ background:'var(--primary)', padding:'var(--space-8) 0' }}>
        <div className="container">
          <div className="grid-4">
            {STATS.map(({ value, label, icon }) => (
              <div key={label} style={{ textAlign:'center', color:'#fff' }}>
                <div style={{ fontSize:'2rem', marginBottom:'var(--space-2)' }}>{icon}</div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:'2rem', fontWeight:700, lineHeight:1 }}>{value}</div>
                <div style={{ fontSize:'0.875rem', opacity:0.85, marginTop:4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="section" style={{ background:'var(--warm-white)' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:'var(--space-12)' }}>
            <div className="section-label" style={{ justifyContent:'center' }}>What We Offer</div>
            <h2 className="section-heading">Care Services Designed for Every Need</h2>
            <p className="section-subheading" style={{ margin:'0 auto' }}>Choose from a comprehensive range of personalized care services, each delivered by trained professionals who genuinely care.</p>
          </div>
          <div className="grid-3">
            {services.map((svc) => (
              <div key={svc._id} className="card" style={{ padding:'var(--space-6)', display:'flex', flexDirection:'column', gap:'var(--space-3)' }}>
                <div style={{ fontSize:'2.5rem', lineHeight:1, marginBottom:'var(--space-2)' }}>{svc.icon}</div>
                <span className="badge badge-warm" style={{ alignSelf:'flex-start' }}>{svc.category}</span>
                <h3 style={{ fontSize:'1.0625rem', margin:0 }}>{svc.name}</h3>
                <p style={{ fontSize:'0.9rem', color:'var(--text-secondary)', lineHeight:1.7, flex:1 }}>{svc.description}</p>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'var(--space-3)', borderTop:'1px solid var(--border)' }}>
                  <span style={{ fontFamily:'var(--font-serif)', fontSize:'1.25rem', fontWeight:700, color:'var(--primary)' }}>
                    From ${svc.basePrice}<span style={{ fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:400, fontFamily:'var(--font-sans)' }}>/hr</span>
                  </span>
                  <Link href={`/book?service=${svc.slug || svc._id}`} className="btn btn-outline btn-sm">Book</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section" style={{ background:'var(--bg-page)' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:'var(--space-12)' }}>
            <div className="section-label" style={{ justifyContent:'center' }}>Simple Process</div>
            <h2 className="section-heading">Care in 3 Easy Steps</h2>
          </div>
          <div className="grid-3" style={{ position:'relative' }}>
            {[
              { step:'01', icon:'🔍', title:'Browse Caregivers', desc:'Filter by specialization, availability, language, and budget. Read reviews from real families.' },
              { step:'02', icon:'📅', title:'Book a Session',    desc:'Our 3-step booking wizard makes scheduling effortless — choose dates, add special notes, and confirm.' },
              { step:'03', icon:'💚', title:'Care Begins',       desc:'Your caregiver arrives, logs care notes, tracks vitals, and keeps your family informed every step.' },
            ].map(({ step, icon, title, desc }, i) => (
              <div key={step} style={{ textAlign:'center', padding:'var(--space-8)', background:'var(--warm-white)', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)', position:'relative' }}>
                <div style={{ position:'absolute', top:-16, left:'50%', transform:'translateX(-50%)', width:44, height:44, borderRadius:'50%', background:'var(--primary)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem', boxShadow:'0 4px 12px rgba(196,105,78,0.4)' }}>{step}</div>
                <div style={{ fontSize:'3rem', marginTop:'var(--space-4)', marginBottom:'var(--space-4)' }}>{icon}</div>
                <h3 style={{ fontSize:'1.125rem', marginBottom:'var(--space-3)' }}>{title}</h3>
                <p style={{ color:'var(--text-secondary)', fontSize:'0.9375rem', lineHeight:1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center', marginTop:'var(--space-10)' }}>
            <Link href="/book" className="btn btn-primary btn-lg">Start Booking Now →</Link>
          </div>
        </div>
      </section>

      {/* ── CAREGIVERS PREVIEW ── */}
      <section className="section" style={{ background:'linear-gradient(to bottom, var(--terracotta-50), var(--warm-white))' }}>
        <div className="container">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'var(--space-10)', flexWrap:'wrap', gap:'var(--space-4)' }}>
            <div>
              <div className="section-label">Top Rated</div>
              <h2 className="section-heading" style={{ margin:0 }}>Meet Our Caregivers</h2>
            </div>
            <Link href="/caregivers" className="btn btn-outline">View All Caregivers →</Link>
          </div>
          <div className="grid-3">
            {caregivers.map(cg => <CaregiverCard key={cg._id} cg={cg} />)}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section" style={{ background:'var(--brown-800)' }}>
        <div className="container" style={{ textAlign:'center' }}>
          <div className="section-label" style={{ justifyContent:'center', color:'var(--terracotta-300)' }}>
            What Families Say
          </div>
          <h2 className="section-heading" style={{ color:'#fff', marginBottom:'var(--space-10)' }}>Stories of Trust & Comfort</h2>
          <div style={{ maxWidth:700, margin:'0 auto' }}>
            <div style={{ position:'relative', minHeight:200 }}>
              {TESTIMONIALS.map((t, i) => (
                <div key={i} style={{
                  position: i === activeTestimonial ? 'relative' : 'absolute',
                  top: 0, left: 0, right: 0,
                  opacity: i === activeTestimonial ? 1 : 0,
                  transform: i === activeTestimonial ? 'translateY(0)' : 'translateY(16px)',
                  transition: 'all 0.6s var(--ease-smooth)',
                  pointerEvents: i === activeTestimonial ? 'auto' : 'none',
                }}>
                  <div style={{ fontSize:'4rem', color:'var(--terracotta-400)', opacity:0.4, fontFamily:'Georgia', lineHeight:1, marginBottom:'var(--space-4)' }}>"</div>
                  <p style={{ fontSize:'1.125rem', color:'var(--cream-200)', lineHeight:1.9, fontStyle:'italic', marginBottom:'var(--space-6)', fontFamily:'var(--font-serif)' }}>{t.text}</p>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'var(--space-3)' }}>
                    <div className="avatar" style={{ width:44, height:44, background:'var(--primary)', color:'#fff', border:'none', fontSize:'0.9rem' }}>
                      {t.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                    </div>
                    <div style={{ textAlign:'left' }}>
                      <p style={{ fontWeight:600, color:'#fff', margin:0 }}>{t.name}</p>
                      <p style={{ fontSize:'0.8125rem', color:'var(--brown-400)', margin:0 }}>{t.relation}</p>
                    </div>
                    <Stars rating={t.rating} size={16} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'center', gap:'var(--space-2)', marginTop:'var(--space-8)' }}>
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => setActiveTestimonial(i)} style={{
                  width: i === activeTestimonial ? 28 : 10,
                  height: 10, borderRadius:'var(--radius-full)',
                  background: i === activeTestimonial ? 'var(--primary)' : 'rgba(255,255,255,0.25)',
                  border:'none', transition:'var(--transition)',
                }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST FEATURES ── */}
      <section className="section" style={{ background:'var(--warm-white)' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:'var(--space-12)' }}>
            <div className="section-label" style={{ justifyContent:'center' }}>Why CareNest</div>
            <h2 className="section-heading">Built on Trust, Verified by Standards</h2>
          </div>
          <div className="grid-4">
            {[
              { icon:'🛡', title:'Background Checked', desc:'Every caregiver passes a comprehensive federal background check before joining our platform.' },
              { icon:'🎓', title:'Certified Professionals', desc:'All caregivers hold relevant certifications: CNA, HHA, CPR/First Aid and more.' },
              { icon:'🔒', title:'HIPAA Compliant',    desc:'Your health information is encrypted and stored in compliance with federal HIPAA regulations.' },
              { icon:'⭐', title:'Verified Reviews',   desc:'Only families who have completed bookings can leave reviews — no fake testimonials.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ padding:'var(--space-6)', background:'var(--bg-page)', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)', textAlign:'center' }}>
                <div style={{ width:64, height:64, borderRadius:'var(--radius-md)', background:'var(--terracotta-50)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.875rem', margin:'0 auto var(--space-4)' }}>{icon}</div>
                <h4 style={{ fontFamily:'var(--font-serif)', fontSize:'1.0625rem', marginBottom:'var(--space-3)' }}>{title}</h4>
                <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', lineHeight:1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ background:'linear-gradient(135deg, var(--primary) 0%, var(--terracotta-700) 100%)', padding:'var(--space-16) 0' }}>
        <div className="container" style={{ textAlign:'center' }}>
          <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(1.875rem,4vw,2.75rem)', color:'#fff', marginBottom:'var(--space-4)' }}>
            Your Loved One Deserves the Best
          </h2>
          <p style={{ color:'rgba(255,255,255,0.85)', fontSize:'1.0625rem', marginBottom:'var(--space-8)', maxWidth:500, margin:'0 auto var(--space-8)' }}>
            Start your care journey today. Find the right caregiver in minutes, no commitment required.
          </p>
          <div style={{ display:'flex', gap:'var(--space-4)', justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/caregivers" style={{ background:'#fff', color:'var(--primary)', padding:'var(--space-4) var(--space-8)', borderRadius:'var(--radius-full)', fontWeight:700, fontSize:'1rem', transition:'var(--transition)', display:'inline-block' }}
              onMouseEnter={e => e.target.style.transform='translateY(-2px)'}
              onMouseLeave={e => e.target.style.transform='translateY(0)'}
            >🔍 Browse Caregivers</Link>
            <Link href="/auth?mode=register" style={{ background:'transparent', color:'#fff', padding:'var(--space-4) var(--space-8)', borderRadius:'var(--radius-full)', fontWeight:700, fontSize:'1rem', border:'2px solid rgba(255,255,255,0.6)', transition:'var(--transition)', display:'inline-block' }}
              onMouseEnter={e => { e.target.style.background='rgba(255,255,255,0.15)'; e.target.style.borderColor='#fff'; }}
              onMouseLeave={e => { e.target.style.background='transparent'; e.target.style.borderColor='rgba(255,255,255,0.6)'; }}
            >Create Free Account</Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
