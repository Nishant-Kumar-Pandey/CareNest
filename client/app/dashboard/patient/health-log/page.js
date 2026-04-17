'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import { api } from '../../../../lib/api';

export default function HealthLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHealthLog();
  }, []);

  const fetchHealthLog = async () => {
    try {
      setLoading(true);
      const res = await api.patients.getHealthLog();
      setLogs(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine status color based on BP
  const getBPStatus = (bp) => {
    if (!bp) return { color: 'var(--text-muted)', label: 'N/A' };
    const [systolic] = bp.split('/').map(Number);
    if (systolic > 140) return { color: '#ef4444', label: 'High' };
    if (systolic < 90) return { color: '#3b82f6', label: 'Low' };
    return { color: 'var(--sage-600)', label: 'Normal' };
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}><div className="spinner"></div></div>;

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: 'var(--cream-100)', paddingTop: '100px', paddingBottom: 'var(--space-16)' }}>
        <div className="container">
          
          <div style={{ marginBottom: 'var(--space-12)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <Link href="/dashboard/patient" className="btn btn-ghost btn-sm" style={{ padding: '0', marginBottom: '8px' }}>← Back to Dashboard</Link>
              <h1 className="section-heading" style={{ margin: 0 }}>Family Health Log</h1>
              <p className="section-subheading" style={{ margin: 0 }}>Chronological history of care sessions and vitals.</p>
            </div>
            <button onClick={fetchHealthLog} className="btn btn-outline btn-sm">Refresh Data</button>
          </div>

          {error ? (
            <div style={{ padding: 'var(--space-8)', background: '#fee2e2', color: '#b91c1c', borderRadius: 'var(--radius-lg)' }}>
              ⚠️ {error}
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-16)', background: 'white', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📋</div>
              <h3>No health logs yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Care notes will appear here once your caregiver completes a session.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
              
              {/* Main Log Feed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {logs.map((note) => (
                  <div key={note._id} style={{ 
                    background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', 
                    boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
                    position: 'relative', overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                          {new Date(note.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <h3 style={{ margin: '4px 0', fontSize: '1.25rem' }}>{note.booking?.service?.name}</h3>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          Caregiver: <strong>{note.booking?.caregiver?.user?.name}</strong>
                        </div>
                      </div>
                      <div className="badge badge-sage" style={{ textTransform: 'capitalize' }}>{note.mood} Mood</div>
                    </div>

                    <p style={{ lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: 'var(--space-6)', whiteSpace: 'pre-wrap' }}>
                      {note.content}
                    </p>

                    {note.vitals && (
                      <div style={{ 
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', 
                        background: 'var(--cream-50)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Blood Pressure</div>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: getBPStatus(note.vitals.bloodPressure).color }}>
                            {note.vitals.bloodPressure || '--'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Heart Rate</div>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            {note.vitals.heartRate ? `${note.vitals.heartRate} bpm` : '--'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Body Temp</div>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            {note.vitals.temperature ? `${note.vitals.temperature}°F` : '--'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Sidebar Insights */}
              <aside style={{ position: 'sticky', top: '100px' }}>
                <div style={{ background: 'var(--secondary)', color: 'white', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', boxShadow: 'var(--shadow-lg)', marginBottom: 'var(--space-6)' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: 'var(--space-2)' }}>Health Summary</h3>
                  <p style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: 'var(--space-4)' }}>Last updated: {new Date().toLocaleDateString()}</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px' }}>
                      <span>Total Sessions</span>
                      <span style={{ fontWeight: 700 }}>{logs.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px' }}>
                      <span>Avg. Systolic</span>
                      <span style={{ fontWeight: 700 }}>
                        {Math.round(logs.reduce((acc, log) => acc + (parseInt(log.vitals?.bloodPressure) || 0), 0) / logs.filter(l => l.vitals?.bloodPressure).length) || '--'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 var(--space-4)', fontSize: '1rem' }}>Trend Indicators</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--sage-500)' }} />
                      <span>Positive mood trend</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }} />
                      <span>Stable vitals</span>
                    </div>
                  </div>
                </div>
              </aside>

            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
