'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { api } from '../../lib/api';



function Stars({ rating }) {
  return <span>{[1,2,3,4,5].map(i=><span key={i} style={{color:i<=Math.round(rating)?'#f59e0b':'#d4bfb3',fontSize:14}}>★</span>)}</span>;
}

/* ── STEP INDICATOR ── */
function StepIndicator({ current }) {
  const steps = [
    { n:1, label:'Select Service' },
    { n:2, label:'Schedule & Details' },
    { n:3, label:'Review & Confirm' },
  ];
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0, marginBottom:'var(--space-12)' }}>
      {steps.map(({ n, label }, i) => (
        <div key={n} style={{ display:'flex', alignItems:'center' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            <div style={{
              width:44, height:44, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:700, fontSize:'1rem', transition:'all 0.3s ease',
              background: n < current ? 'var(--secondary)' : n === current ? 'var(--primary)' : 'var(--cream-200)',
              color: n <= current ? '#fff' : 'var(--text-muted)',
              boxShadow: n === current ? '0 0 0 4px var(--terracotta-100)' : 'none',
            }}>
              {n < current ? '✓' : n}
            </div>
            <span style={{ fontSize:'0.8125rem', fontWeight: n===current ? 600 : 400, color: n===current ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace:'nowrap' }}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width:80, height:2, background: n < current ? 'var(--secondary)' : 'var(--border)', marginBottom:26, transition:'all 0.3s ease' }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────── STEP 1 — Select Service & Caregiver ─────────────── */
function Step1({ booking, setBooking, services, caregivers, onNext }) {
  const selSvc = services.find(s => s._id === booking.serviceId);
  const selCg  = caregivers.find(c => c._id === booking.caregiverId);

  return (
    <div style={{ animation:'fadeInUp 0.4s var(--ease-smooth) both' }}>
      <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'1.75rem', marginBottom:'var(--space-2)' }}>Choose Your Service</h2>
      <p style={{ color:'var(--text-secondary)', marginBottom:'var(--space-8)' }}>Select the type of care your loved one needs.</p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:'var(--space-4)', marginBottom:'var(--space-10)' }}>
        {services.map(svc => (
          <div key={svc._id} onClick={() => setBooking(b => ({...b, serviceId: svc._id}))} style={{
            padding:'var(--space-5)', borderRadius:'var(--radius-lg)', border:'2px solid',
            borderColor: booking.serviceId === svc._id ? 'var(--primary)' : 'var(--border)',
            background: booking.serviceId === svc._id ? 'var(--terracotta-50)' : 'var(--warm-white)',
            cursor:'pointer', transition:'var(--transition)', position:'relative',
            boxShadow: booking.serviceId === svc._id ? 'var(--shadow-glow)' : 'none',
          }}>
            {booking.serviceId === svc._id && (
              <div style={{ position:'absolute', top:12, right:12, width:22, height:22, borderRadius:'50%', background:'var(--primary)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700 }}>✓</div>
            )}
            <div style={{ fontSize:'2rem', marginBottom:'var(--space-3)' }}>{svc.icon}</div>
            <span className="badge badge-warm" style={{ fontSize:'0.65rem', marginBottom:'var(--space-2)', display:'block', width:'fit-content' }}>{svc.category}</span>
            <h4 style={{ fontSize:'0.9375rem', margin:'0 0 var(--space-2)' }}>{svc.name}</h4>
            <p style={{ fontSize:'0.8125rem', color:'var(--text-secondary)', lineHeight:1.6, marginBottom:'var(--space-3)' }}>{svc.description}</p>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:'1.125rem', fontWeight:700, color:'var(--primary)' }}>
              From ${svc.basePrice}<span style={{ fontFamily:'var(--font-sans)', fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:400 }}>/hr</span>
            </div>
          </div>
        ))}
      </div>

      {selSvc && (
        <>
          <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'1.75rem', marginBottom:'var(--space-2)' }}>Select a Caregiver</h2>
          <p style={{ color:'var(--text-secondary)', marginBottom:'var(--space-6)' }}>All caregivers are verified and background-checked.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-3)', marginBottom:'var(--space-8)' }}>
            {caregivers.map(cg => (
              <div key={cg._id} onClick={() => setBooking(b => ({...b, caregiverId: cg._id}))} style={{
                padding:'var(--space-4) var(--space-5)', borderRadius:'var(--radius-md)', border:'2px solid',
                borderColor: booking.caregiverId === cg._id ? 'var(--primary)' : 'var(--border)',
                background: booking.caregiverId === cg._id ? 'var(--terracotta-50)' : 'var(--warm-white)',
                cursor:'pointer', transition:'var(--transition)',
                display:'flex', alignItems:'center', gap:'var(--space-4)',
              }}>
                <div className="avatar" style={{ width:52, height:52, fontSize:'1rem', fontFamily:'var(--font-serif)', flexShrink:0 }}>
                  {cg.user.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <strong>{cg.user.name}</strong>
                    <span className="badge badge-sage" style={{ fontSize:'0.6rem' }}>✓ Verified</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                    <Stars rating={cg.rating} /><span style={{ fontSize:'0.8125rem', color:'var(--text-secondary)' }}>{cg.rating} ({cg.totalReviews})</span>
                    <span style={{ color:'var(--border)' }}>·</span>
                    <span style={{ fontSize:'0.8125rem', color:'var(--text-muted)' }}>{cg.experience} yrs exp</span>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:6 }}>
                    {cg.specializations.slice(0,3).map(s => <span key={s} className="badge badge-terracotta" style={{ fontSize:'0.6rem' }}>{s}</span>)}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:'1.375rem', fontWeight:700, color:'var(--primary)' }}>${cg.hourlyRate}<span style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:400 }}>/hr</span></div>
                  {booking.caregiverId === cg._id && <div style={{ fontSize:'0.8125rem', color:'var(--secondary)', fontWeight:600, marginTop:4 }}>✓ Selected</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button className="btn btn-primary btn-lg" onClick={onNext} disabled={!booking.serviceId || !booking.caregiverId}
          style={{ opacity: (!booking.serviceId || !booking.caregiverId) ? 0.5 : 1 }}>
          Continue to Schedule →
        </button>
      </div>
    </div>
  );
}

/* ─────────────── STEP 2 — Schedule & Details ─────────────── */
function Step2({ booking, setBooking, onNext, onBack }) {
  const today = new Date().toISOString().split('T')[0];
  const set = (k, v) => setBooking(b => ({...b, [k]: v}));
  const hours = booking.startTime && booking.endTime
    ? (() => { const [sh,sm] = booking.startTime.split(':').map(Number); const [eh,em] = booking.endTime.split(':').map(Number); return Math.max(0, (eh*60+em - sh*60-sm)/60); })()
    : null;

  return (
    <div style={{ animation:'fadeInUp 0.4s var(--ease-smooth) both' }}>
      <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'1.75rem', marginBottom:'var(--space-2)' }}>Schedule Your Care Visit</h2>
      <p style={{ color:'var(--text-secondary)', marginBottom:'var(--space-8)' }}>Choose dates, times, and provide any important details.</p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-6)', marginBottom:'var(--space-6)' }}>
        <div className="form-group">
          <label className="form-label">Start Date *</label>
          <input className="form-input" type="date" min={today} value={booking.startDate || ''} onChange={e => set('startDate', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">End Date *</label>
          <input className="form-input" type="date" min={booking.startDate || today} value={booking.endDate || ''} onChange={e => set('endDate', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Start Time *</label>
          <input className="form-input" type="time" value={booking.startTime || ''} onChange={e => set('startTime', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">End Time *</label>
          <input className="form-input" type="time" value={booking.endTime || ''} onChange={e => set('endTime', e.target.value)} />
        </div>
      </div>

      {hours !== null && hours > 0 && (
        <div style={{ padding:'var(--space-4)', background:'var(--sage-50)', borderRadius:'var(--radius-md)', border:'1px solid var(--sage-100)', marginBottom:'var(--space-6)', display:'flex', alignItems:'center', gap:'var(--space-3)' }}>
          <span style={{ fontSize:'1.5rem' }}>⏱</span>
          <span style={{ color:'var(--sage-700)', fontWeight:600 }}>Session duration: {hours} hour{hours !== 1 ? 's' : ''}</span>
        </div>
      )}

      <div style={{ background:'var(--warm-white)', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)', padding:'var(--space-6)', marginBottom:'var(--space-6)' }}>
        <h3 style={{ fontSize:'1.0625rem', marginBottom:'var(--space-5)' }}>📍 Care Location</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Street Address *</label>
            <input className="form-input" placeholder="123 Main Street" value={booking.address?.street || ''} onChange={e => set('address', {...booking.address, street: e.target.value})} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'var(--space-3)' }}>
            <div className="form-group">
              <label className="form-label">City *</label>
              <input className="form-input" placeholder="Austin" value={booking.address?.city || ''} onChange={e => set('address', {...booking.address, city: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input className="form-input" placeholder="TX" value={booking.address?.state || ''} onChange={e => set('address', {...booking.address, state: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">ZIP</label>
              <input className="form-input" placeholder="78701" value={booking.address?.zipCode || ''} onChange={e => set('address', {...booking.address, zipCode: e.target.value})} />
            </div>
          </div>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom:'var(--space-8)' }}>
        <label className="form-label">Special Instructions or Medical Notes</label>
        <textarea className="form-input" rows={4} placeholder="Any important information your caregiver should know — medications, allergies, mobility needs, behavioral notes, gate codes…" value={booking.specialInstructions || ''} onChange={e => set('specialInstructions', e.target.value)} style={{ resize:'vertical' }} />
      </div>

      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <button className="btn btn-ghost btn-lg" onClick={onBack}>← Back</button>
        <button className="btn btn-primary btn-lg" onClick={onNext}
          disabled={!booking.startDate || !booking.endDate || !booking.startTime || !booking.endTime || !booking.address?.street}
          style={{ opacity:(!booking.startDate || !booking.endDate || !booking.startTime || !booking.endTime || !booking.address?.street) ? 0.5 : 1 }}>
          Review Booking →
        </button>
      </div>
    </div>
  );
}

/* ─────────────── STEP 3 — Review & Confirm ─────────────── */
function Step3({ booking, services, caregivers, onBack, onSubmit, submitting, submitted }) {
  const svc = services.find(s => s._id === booking.serviceId);
  const cg  = caregivers.find(c => c._id === booking.caregiverId);
  const router = useRouter();

  const hours = (booking.startTime && booking.endTime)
    ? (() => { const [sh,sm]=booking.startTime.split(':').map(Number); const [eh,em]=booking.endTime.split(':').map(Number); return Math.max(0,(eh*60+em-sh*60-sm)/60); })()
    : 4;
  const total = cg ? (hours * cg.hourlyRate).toFixed(2) : '--';

  if (submitted) return (
    <div style={{ textAlign:'center', padding:'var(--space-16) 0', animation:'scaleIn 0.5s var(--ease-smooth)' }}>
      <div style={{ width:96, height:96, borderRadius:'50%', background:'var(--sage-100)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem', margin:'0 auto var(--space-6)' }}>🎉</div>
      <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'2rem', marginBottom:'var(--space-4)', color:'var(--secondary)' }}>Booking Confirmed!</h2>
      <p style={{ color:'var(--text-secondary)', fontSize:'1.0625rem', marginBottom:'var(--space-8)', maxWidth:480, margin:'0 auto var(--space-8)' }}>
        Your booking with <strong>{cg?.user.name}</strong> has been submitted. You'll receive a confirmation once your caregiver accepts.
      </p>
      <div style={{ background:'var(--warm-white)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'var(--space-6)', maxWidth:400, margin:'0 auto var(--space-8)', textAlign:'left' }}>
        {[
          {icon:'🗓', label:'Dates', val:`${booking.startDate} → ${booking.endDate}`},
          {icon:'🕐', label:'Time',  val:`${booking.startTime} – ${booking.endTime}`},
          {icon:'🧑‍⚕️', label:'Caregiver', val:cg?.user.name},
          {icon:'🛎', label:'Service', val:svc?.name},
          {icon:'💰', label:'Est. Total', val:`$${total}`},
        ].map(({icon,label,val}) => (
          <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'var(--space-3) 0', borderBottom:'1px solid var(--border)' }}>
            <span style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>{icon} {label}</span>
            <span style={{ fontWeight:600, fontSize:'0.9rem' }}>{val}</span>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:'var(--space-4)', justifyContent:'center', flexWrap:'wrap' }}>
        <Link href="/dashboard" className="btn btn-primary btn-lg">View Dashboard</Link>
        <Link href="/caregivers" className="btn btn-outline btn-lg">Browse More</Link>
      </div>
    </div>
  );

  return (
    <div style={{ animation:'fadeInUp 0.4s var(--ease-smooth) both' }}>
      <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'1.75rem', marginBottom:'var(--space-2)' }}>Review Your Booking</h2>
      <p style={{ color:'var(--text-secondary)', marginBottom:'var(--space-8)' }}>Please verify all details before confirming.</p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'var(--space-8)', alignItems:'start' }}>
        {/* Details */}
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-5)' }}>
          {/* Caregiver */}
          <div style={{ background:'var(--warm-white)', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)', padding:'var(--space-6)' }}>
            <h4 style={{ fontSize:'0.875rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--primary)', marginBottom:'var(--space-4)' }}>🧑‍⚕️ Your Caregiver</h4>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--space-4)' }}>
              <div className="avatar" style={{ width:56, height:56, fontSize:'1.1rem', fontFamily:'var(--font-serif)' }}>
                {cg?.user.name.split(' ').map(n=>n[0]).join('')}
              </div>
              <div>
                <strong style={{ fontSize:'1.0625rem' }}>{cg?.user.name}</strong>
                <div><Stars rating={cg?.rating || 5} /></div>
                <p style={{ color:'var(--text-muted)', fontSize:'0.8125rem', margin:0 }}>{cg?.experience} yrs exp · ${cg?.hourlyRate}/hr</p>
              </div>
            </div>
          </div>

          {/* Service */}
          <div style={{ background:'var(--warm-white)', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)', padding:'var(--space-6)' }}>
            <h4 style={{ fontSize:'0.875rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--primary)', marginBottom:'var(--space-4)' }}>🛎 Service</h4>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)' }}>
              <span style={{ fontSize:'2rem' }}>{svc?.icon}</span>
              <div>
                <strong>{svc?.name}</strong>
                <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', margin:0 }}>{svc?.category} · From ${svc?.basePrice}/hr</p>
              </div>
            </div>
            {svc?.features && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:'var(--space-4)' }}>
                {svc.features.map(f => <span key={f} className="badge badge-warm">{f}</span>)}
              </div>
            )}
          </div>

          {/* Schedule */}
          <div style={{ background:'var(--warm-white)', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)', padding:'var(--space-6)' }}>
            <h4 style={{ fontSize:'0.875rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--primary)', marginBottom:'var(--space-4)' }}>📅 Schedule</h4>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-3)' }}>
              {[{l:'Start Date',v:booking.startDate},{l:'End Date',v:booking.endDate},{l:'Start Time',v:booking.startTime},{l:'End Time',v:booking.endTime},{l:'Duration',v:`~${hours} hours`},{l:'Location',v:`${booking.address?.city || ''}, ${booking.address?.state || ''}`}].map(({l,v}) => (
                <div key={l} style={{ padding:'var(--space-3)', background:'var(--cream-100)', borderRadius:'var(--radius-sm)' }}>
                  <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', margin:'0 0 2px' }}>{l}</p>
                  <p style={{ fontWeight:600, margin:0, fontSize:'0.9rem' }}>{v}</p>
                </div>
              ))}
            </div>
          </div>

          {booking.specialInstructions && (
            <div style={{ background:'var(--cream-100)', borderRadius:'var(--radius-md)', border:'1px solid var(--border)', padding:'var(--space-5)' }}>
              <h4 style={{ fontSize:'0.875rem', color:'var(--text-secondary)', marginBottom:'var(--space-2)' }}>📝 Special Instructions</h4>
              <p style={{ color:'var(--text-primary)', fontSize:'0.9rem', lineHeight:1.7, margin:0 }}>{booking.specialInstructions}</p>
            </div>
          )}
        </div>

        {/* Cost summary */}
        <div style={{ background:'var(--warm-white)', borderRadius:'var(--radius-xl)', border:'1px solid var(--terracotta-200)', padding:'var(--space-6)', position:'sticky', top:88, boxShadow:'var(--shadow-md)' }}>
          <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.25rem', marginBottom:'var(--space-5)' }}>Cost Summary</h3>
          {[
            { l:`Rate (${cg?.user.name?.split(' ')[0]})`, v:`$${cg?.hourlyRate}/hr` },
            { l:`Duration`, v:`~${hours} hrs` },
            { l:'Service', v:svc?.name },
          ].map(({l,v}) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'var(--space-3) 0', borderBottom:'1px solid var(--border)', fontSize:'0.9rem' }}>
              <span style={{ color:'var(--text-secondary)' }}>{l}</span>
              <span style={{ fontWeight:500 }}>{v}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', padding:'var(--space-4) 0', marginTop:'var(--space-2)' }}>
            <span style={{ fontFamily:'var(--font-serif)', fontSize:'1rem', fontWeight:700 }}>Estimated Total</span>
            <span style={{ fontFamily:'var(--font-serif)', fontSize:'1.5rem', fontWeight:700, color:'var(--primary)' }}>${total}</span>
          </div>
          <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', lineHeight:1.6, marginBottom:'var(--space-5)' }}>
            Final cost based on confirmed hours. Payment collected after service completion.
          </p>
          <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', fontSize:'1rem', padding:'var(--space-4)' }}
            onClick={onSubmit} disabled={submitting}>
            {submitting ? '⏳ Submitting…' : '✅ Confirm Booking'}
          </button>
          <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', textAlign:'center', marginTop:'var(--space-3)' }}>🔒 Secure · Free cancellation 24h before</p>
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'flex-start', marginTop:'var(--space-8)' }}>
        <button className="btn btn-ghost btn-lg" onClick={onBack}>← Edit Details</button>
      </div>
    </div>
  );
}

/* ─────────────── MAIN BOOKING PAGE ─────────────── */
function BookingContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [services, setServices]   = useState([]);
  const [caregivers, setCaregivers] = useState([]);

  const [booking, setBooking] = useState({
    serviceId: searchParams.get('service') || '',
    caregiverId: searchParams.get('caregiverId') || '',
    startDate: '', endDate: '', startTime: '', endTime: '',
    address: { street:'', city:'', state:'TX', zipCode:'' },
    specialInstructions: '',
  });

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    fetch(`${API}/services`).then(r=>r.json()).then(d=>{ if(d.data?.length) setServices(d.data); }).catch(e=>console.error(e));
    fetch(`${API}/caregivers?limit=10`).then(r=>r.json()).then(d=>{ if(d.data?.caregivers?.length) setCaregivers(d.data.caregivers); }).catch(e=>console.error(e));
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...booking,
        service: booking.serviceId,
        caregiver: booking.caregiverId,
      };
      delete payload.serviceId;
      delete payload.caregiverId;

      await api.bookings.create(payload);
      setSubmitted(true);
      toast.success('Booking successfully submitted!');
    } catch (err) {
      toast.error(`Booking failed: ${err.message}`);
    }
    setSubmitting(false);
  };

  return (
    <div>
      <Navbar />
      <div style={{ background:'linear-gradient(135deg, var(--terracotta-50), var(--cream-100))', paddingTop:130, paddingBottom:'var(--space-8)', borderBottom:'1px solid var(--border)' }}>
        <div className="container">
          <div className="section-label">Easy Booking</div>
          <h1 className="section-heading">Book Your Care Session</h1>
          <p className="section-subheading">Three simple steps to connect your loved one with the perfect caregiver.</p>
        </div>
      </div>

      <div className="container" style={{ paddingBlock:'var(--space-12)', maxWidth:980 }}>
        {!submitted && <StepIndicator current={step} />}
        {step === 1 && <Step1 booking={booking} setBooking={setBooking} services={services} caregivers={caregivers} onNext={() => setStep(2)} />}
        {step === 2 && <Step2 booking={booking} setBooking={setBooking} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <Step3 booking={booking} services={services} caregivers={caregivers} onBack={() => setStep(2)} onSubmit={handleSubmit} submitting={submitting} submitted={submitted} />}
      </div>

      <Footer />
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div style={{display:'flex',justifyContent:'center',padding:'20vh'}}><div className="spinner"/></div>}>
      <BookingContent />
    </Suspense>
  );
}
