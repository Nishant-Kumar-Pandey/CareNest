'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { api } from '../../../lib/api';
import { socket } from '../../../lib/socket';
import toast from 'react-hot-toast';

export default function AdminDashboardContent() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pulse, setPulse] = useState([]);
  const [priorityAlerts, setPriorityAlerts] = useState([]);

  useEffect(() => {
    fetchMetrics();
    
    // Connect to Admin-specific socket rooms
    if (!socket.connected) socket.connect();
    socket.emit('join_personal_room', 'admin'); // Admin global room

    const handlePulse = (data) => {
      if (data.priority === 'high' || ['VETTING_REQUIRED', 'CRISIS_ALERT', 'CANCELLATION'].includes(data.type)) {
        setPriorityAlerts(prev => [data, ...prev].slice(0, 10));
        toast.error(`Priority Alert: ${data.title}`, { position: 'top-right' });
      } else {
        setPulse(prev => [data, ...prev].slice(0, 10));
      }
      
      // Optionally refresh metrics if it was a booking
      if (data.type === 'NEW_BOOKING' || data.type === 'NEW_USER') {
        fetchMetrics();
      }
    };

    socket.on('admin_pulse', handlePulse);
    return () => {
      socket.off('admin_pulse', handlePulse);
    };
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await api.admin.metrics();
      setMetrics(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <Navbar />

      <main style={{ background: 'var(--cream-50)', minHeight: 'calc(100vh - 72px)', paddingTop: '100px', paddingBottom: 'var(--space-16)' }}>
        <div className="container">
          
          <header style={{ marginBottom: 'var(--space-8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="section-label">Centralized Command</div>
              <h1 className="section-heading" style={{ margin: 0, fontSize: '2.5rem', letterSpacing: '-0.02em' }}>{greeting}, Command</h1>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--sage-50)', padding: '8px 16px', borderRadius: 'var(--radius-full)', color: 'var(--sage-700)', fontWeight: 600, fontSize: '0.875rem', border: '1px solid var(--sage-200)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 10px #10b981' }}></span>
              Live Connection Active
            </div>
          </header>

          {/* Advanced Analytics Grid (KPIs) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
            <MetricCard title="Satisfaction" value={`${metrics?.avgSatisfaction || 0}/5`} icon="⭐" color="#f59e0b" loading={loading} />
            <MetricCard title="Completion Rate" value={`${metrics?.completionRate || 0}%`} icon="✅" color="#10b981" loading={loading} />
            <MetricCard title="Avg Response" value={`${metrics?.avgResponseTime || 0}m`} icon="⏱️" color="#3b82f6" loading={loading} />
            <MetricCard title="Active Users" value={metrics?.activeUsers || 0} icon="🔥" color="#ef4444" loading={loading} />
          </div>

          {/* Core Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-10)' }}>
            <MetricCard title="Total Patients" value={metrics?.totalPatients || 0} icon="👨‍🦳" color="var(--terracotta-500)" loading={loading} />
            <MetricCard title="Active Caregivers" value={metrics?.totalCaregivers || 0} icon="👩‍⚕️" color="var(--sage-600)" loading={loading} />
            <MetricCard title="Total Volume" value={metrics?.totalBookings || 0} icon="📊" color="var(--primary)" loading={loading} />
            <MetricCard title="Est. Revenue" value={`$${metrics?.totalRevenue?.toLocaleString() || 0}`} icon="💰" color="var(--brown-600)" loading={loading} />
          </div>

          {/* Mission Control Split View */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>
            
            {/* LEFT: OPERATION PULSE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <div className="card" style={{ padding: 'var(--space-6)', border: '1px solid var(--border)', background: 'white' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.125rem', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                  <span>🌊</span> Operational Pulse
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>Latest Traffic</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pulse.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <p>Monitoring platform traffic...</p>
                    </div>
                  ) : (
                    pulse.map((item, idx) => (
                      <div key={idx} className="animate-fadeIn" style={{ padding: '12px', background: 'var(--cream-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ background: 'white', padding: '8px', borderRadius: '8px', fontSize: '1.25rem' }}>{item.type === 'NEW_USER' ? '👤' : item.type === 'NEW_BOOKING' ? '📅' : '⚡'}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{item.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.message}</div>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Just now</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, var(--secondary), var(--sage-700))', color: 'white',
                  borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', boxShadow: 'var(--shadow-lg)',
                  position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <h3 style={{ fontSize: '1.25rem', margin: '0 0 10px', fontFamily: 'var(--font-serif)' }}>Vetting</h3>
                    <p style={{ opacity: 0.9, fontSize: '0.8rem', marginBottom: '15px' }}>Verify professional credentials.</p>
                    <Link href="/dashboard/admin/vetting" style={{ background: 'white', color: 'var(--secondary)', padding: '8px 20px', borderRadius: 'var(--radius-full)', fontWeight: 700, textDecoration: 'none', fontSize: '0.8rem' }}>Manage →</Link>
                  </div>
                  <div style={{ position: 'absolute', bottom: -10, right: -10, fontSize: '4rem', opacity: 0.1 }}>🛡️</div>
                </div>

                <div style={{ 
                  background: 'linear-gradient(135deg, var(--primary), var(--terracotta-700))', color: 'white',
                  borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', boxShadow: 'var(--shadow-lg)',
                  position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <h3 style={{ fontSize: '1.25rem', margin: '0 0 10px', fontFamily: 'var(--font-serif)' }}>Users</h3>
                    <p style={{ opacity: 0.9, fontSize: '0.8rem', marginBottom: '15px' }}>Manage platform accounts.</p>
                    <Link href="/dashboard/admin/users" style={{ background: 'white', color: 'var(--primary)', padding: '8px 20px', borderRadius: 'var(--radius-full)', fontWeight: 700, textDecoration: 'none', fontSize: '0.8rem' }}>Manage →</Link>
                  </div>
                  <div style={{ position: 'absolute', bottom: -10, right: -10, fontSize: '4rem', opacity: 0.1 }}>👤</div>
                </div>

                <div style={{ 
                  background: 'linear-gradient(135deg, var(--brown-600), var(--brown-800))', color: 'white',
                  borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', boxShadow: 'var(--shadow-lg)',
                  position: 'relative', overflow: 'hidden', gridColumn: 'span 2'
                }}>
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', margin: '0 0 5px', fontFamily: 'var(--font-serif)' }}>Service Catalog</h3>
                      <p style={{ opacity: 0.9, fontSize: '0.8rem', margin: 0 }}>Update pricing and service offerings.</p>
                    </div>
                    <Link href="/dashboard/admin/services" style={{ background: 'white', color: 'var(--brown-700)', padding: '8px 24px', borderRadius: 'var(--radius-full)', fontWeight: 700, textDecoration: 'none', fontSize: '0.8rem' }}>Manage Services →</Link>
                  </div>
                  <div style={{ position: 'absolute', top: -10, left: '40%', fontSize: '5rem', opacity: 0.05 }}>📋</div>
                </div>
              </div>
            </div>

            {/* RIGHT: PRIORITY QUES & ALERTS */}
            <div className="card" style={{ padding: 'var(--space-8)', background: 'var(--warm-white)', border: '1px solid var(--border)', minHeight: '500px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.125rem', color: 'var(--terracotta-700)' }}>
                  <span>🚨</span> Priority Alerts
                </h3>
                {priorityAlerts.length > 0 && (
                  <button onClick={() => setPriorityAlerts([])} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>Clear dashboard</button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {priorityAlerts.length === 0 && metrics?.pendingCaregivers === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
                    <p style={{ fontWeight: 600 }}>Zero Priority Issues</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>The system is operating within normal parameters.</p>
                  </div>
                ) : (
                  <>
                    {metrics?.pendingCaregivers > 0 && (
                      <div style={{ padding: '16px', background: 'rgba(188, 108, 92, 0.05)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--terracotta-200)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ fontSize: '1.5rem' }}>✍️</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: 'var(--terracotta-700)' }}>{metrics.pendingCaregivers} Vetting Requests Pending</div>
                          <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Caregivers are waiting for profile approval.</div>
                        </div>
                        <Link href="/dashboard/admin/vetting" className="btn btn-primary btn-sm">Process</Link>
                      </div>
                    )}
                    {priorityAlerts.map((alert, idx) => (
                      <div key={idx} style={{ padding: '16px', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', borderLeft: '4px solid var(--terracotta-500)', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>{alert.title}</div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{alert.message}</p>
                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost btn-sm">Investigate</button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

          </div>

        </div>
      </main>

      <Footer />
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

function MetricCard({ title, value, icon, color, loading }) {
  return (
    <div style={{ 
      background: 'white', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', 
      border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
      transition: 'transform 0.3s ease'
    }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
      {loading ? (
        <div style={{ width: '100%', height: '80px', background: 'var(--cream-100)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
      ) : (
        <>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: `${color}12`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>
            {icon}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {value}
          </div>
        </>
      )}
    </div>
  );
}
