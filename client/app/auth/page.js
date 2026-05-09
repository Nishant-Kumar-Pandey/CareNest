'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import OtpInput from '../../components/OtpInput';
import { api } from '../../lib/api';

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : (searchParams.get('mode') === 'verify' ? 'verify' : 'login'));
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'patient', phone:'', otp:'' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'forgot_password') {
        await api.auth.forgotPassword({ email: form.email });
        toast.success('OTP sent to your email!');
        setMode('reset_password');
        setLoading(false);
        return;
      }
      
      if (mode === 'reset_password') {
        await api.auth.resetPassword({ email: form.email, otp: form.otp, password: form.password });
        toast.success('Password updated! You can now log in.');
        setMode('login');
        setLoading(false);
        return;
      }

      if (mode === 'verify') {
        const res = await api.auth.verifyEmail({ email: form.email, otp: form.otp });
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        toast.success('Email verified successfully!');
        router.push('/dashboard');
        return;
      }

      if (mode === 'login' || mode === 'register') {
        const payload = mode === 'login' ? { email: form.email, password: form.password } : form;
        const res = mode === 'login' ? await api.auth.login(payload) : await api.auth.register(payload);
        
        if (mode === 'register') {
          toast.success('Account created! Please verify your email.');
          setMode('verify');
        } else {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          toast.success('Welcome back!');
          router.push('/dashboard');
        }
      }
    } catch (err) {
      // Demo fallback — log in without real API
      if (mode === 'login' && form.email && form.password) {
        const mockUser = { name: form.name || 'Demo User', email: form.email, role: form.role || 'patient' };
        localStorage.setItem('token', 'demo-token-' + Date.now());
        localStorage.setItem('user', JSON.stringify(mockUser));
        toast.success('Demo Login Successful!');
        router.push('/dashboard');
      } else {
        toast.error(err.message);
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(145deg, var(--cream-100), var(--terracotta-50) 50%, var(--sage-50))', display:'flex', flexDirection:'column' }}>
      <Navbar />
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--space-6)', paddingTop:110 }}>
        <div style={{ width:'100%', maxWidth:460 }}>
          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:'var(--space-8)' }}>
            <div style={{ width:56, height:56, borderRadius:14, background:'linear-gradient(135deg, var(--primary), var(--terracotta-700))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto var(--space-4)', boxShadow:'0 8px 24px rgba(196,105,78,0.35)' }}>🌿</div>
            <h1 style={{ fontFamily:'var(--font-serif)', fontSize:'1.875rem', margin:'0 0 var(--space-2)' }}>
              {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Join CareNest' : mode === 'forgot_password' ? 'Reset Password' : mode === 'verify' ? 'Verify Email' : 'New Password'}
            </h1>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.9375rem' }}>
              {mode === 'login' ? 'Sign in to manage your care' : mode === 'register' ? 'Start your care journey today' : mode === 'verify' ? `Enter the code sent to ${form.email}` : 'Enter your details below'}
            </p>
          </div>

          {/* Mode toggle */}
          {(mode === 'login' || mode === 'register') && (
            <div style={{ display:'flex', background:'var(--cream-200)', borderRadius:'var(--radius-full)', padding:4, marginBottom:'var(--space-6)' }}>
              {['login','register'].map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  flex:1, padding:'10px 0', borderRadius:'var(--radius-full)', border:'none', fontWeight:600, fontSize:'0.9375rem', cursor:'pointer', transition:'var(--transition)',
                  background: mode === m ? 'var(--warm-white)' : 'transparent',
                  color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
                }}>{m === 'login' ? 'Sign In' : 'Create Account'}</button>
              ))}
            </div>
          )}

          {/* Form card */}
          <div style={{ background:'var(--warm-white)', borderRadius:'var(--radius-xl)', border:'1px solid var(--border)', padding:'var(--space-8)', boxShadow:'var(--shadow-lg)' }}>
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" type="text" placeholder="Eleanor Whitfield" required value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
              )}

              {(mode === 'login' || mode === 'register' || mode === 'forgot_password' || mode === 'reset_password' || mode === 'verify') && (
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} className="form-input" placeholder="you@example.com" required />
                </div>
              )}

              {(mode === 'reset_password' || mode === 'verify') && (
                <div className="form-group" style={{ textAlign: 'center' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '15px' }}>{mode === 'verify' ? 'Verification Code' : '6-Digit OTP'}</label>
                  <OtpInput length={6} onComplete={(val) => set('otp', val)} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                    Didn't receive a code? <button type="button" className="btn-link" style={{ fontSize: '0.8rem' }}>Resend</button>
                  </p>
                </div>
              )}

              {mode !== 'forgot_password' && (
                <div className="form-group">
                  <label className="form-label">{mode === 'reset_password' ? 'New Password' : 'Password'}</label>
                  <input type="password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} className="form-input" placeholder="••••••••" required minLength="6" />
                </div>
              )}

              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label">I am a…</label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-3)' }}>
                    {[{val:'patient',icon:'👤',label:'Patient / Family'},{val:'caregiver',icon:'🧑‍⚕️',label:'Caregiver'}].map(({val,icon,label}) => (
                      <div key={val} onClick={() => set('role', val)} style={{
                        padding:'var(--space-4)', borderRadius:'var(--radius-md)', border:'2px solid',
                        borderColor: form.role === val ? 'var(--primary)' : 'var(--border)',
                        background: form.role === val ? 'var(--terracotta-50)' : 'var(--warm-white)',
                        cursor:'pointer', textAlign:'center', transition:'var(--transition)',
                      }}>
                        <div style={{ fontSize:'1.5rem', marginBottom:4 }}>{icon}</div>
                        <div style={{ fontSize:'0.875rem', fontWeight:600, color: form.role===val?'var(--primary)':'var(--text-secondary)' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width:'100%', justifyContent:'center', padding:'var(--space-4)', fontSize:'1rem', marginTop:'var(--space-2)' }}>
                {loading ? 'Processing...' : (
                  mode === 'login' ? 'Sign In' : 
                  mode === 'register' ? 'Create Account' : 
                  mode === 'forgot_password' ? 'Send OTP' : 
                  mode === 'verify' ? 'Verify OTP' :
                  'Reset Password'
                )}
              </button>
            </form>

            <div style={{ marginTop:'var(--space-6)', textAlign:'center' }}>
              {mode === 'login' && (
                <>
                  <p style={{ color:'var(--text-secondary)' }}>
                    Don't have an account?{' '}
                    <button type="button" onClick={() => setMode('register')} style={{ background:'none', border:'none', color:'var(--primary)', fontWeight:600, cursor:'pointer' }}>
                      Register here
                    </button>
                  </p>
                  <button type="button" onClick={() => setMode('forgot_password')} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:'0.875rem', marginTop:'8px', cursor:'pointer', textDecoration: 'underline' }}>
                    Forgot your password?
                  </button>
                </>
              )}
              {mode === 'register' && (
                <p style={{ color:'var(--text-secondary)' }}>
                  Already have an account?{' '}
                  <button type="button" onClick={() => setMode('login')} style={{ background:'none', border:'none', color:'var(--primary)', fontWeight:600, cursor:'pointer' }}>
                    Sign In instead
                  </button>
                </p>
              )}
              {(mode === 'forgot_password' || mode === 'reset_password') && (
                <button type="button" onClick={() => setMode('login')} style={{ background:'none', border:'none', color:'var(--primary)', fontWeight:600, cursor:'pointer' }}>
                  Back to Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div style={{display:'flex',justifyContent:'center',padding:'20vh'}}><div className="spinner"/></div>}>
      <AuthContent />
    </Suspense>
  );
}
