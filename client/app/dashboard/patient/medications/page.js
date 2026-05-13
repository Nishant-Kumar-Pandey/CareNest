'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import { api } from '../../../../lib/api';
import toast from 'react-hot-toast';

export default function MedicationsPage() {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, type: 'add', data: null });
  const [form, setForm] = useState({ name: '', dosage: '', frequency: 'daily', times: ['09:00'], instructions: '' });

  useEffect(() => {
    fetchMeds();
  }, []);

  const fetchMeds = async () => {
    try {
      const res = await api.medications.list();
      setMeds(res.data);
    } catch (err) {
      toast.error('Failed to load medications');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type, data = null) => {
    if (type === 'edit') {
      setForm({
        name: data.name,
        dosage: data.dosage,
        frequency: data.frequency,
        times: data.times,
        instructions: data.instructions || ''
      });
    } else {
      setForm({ name: '', dosage: '', frequency: 'daily', times: ['09:00'], instructions: '' });
    }
    setModal({ isOpen: true, type, data });
  };

  const handleAddTime = () => setForm(prev => ({ ...prev, times: [...prev.times, '12:00'] }));
  const handleRemoveTime = (idx) => setForm(prev => ({ ...prev, times: prev.times.filter((_, i) => i !== idx) }));
  const handleTimeChange = (idx, val) => setForm(prev => {
    const newTimes = [...prev.times];
    newTimes[idx] = val;
    return { ...prev, times: newTimes };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal.type === 'add') {
        await api.medications.create(form);
        toast.success('Medication added!');
      } else {
        await api.medications.update(modal.data._id, form);
        toast.success('Medication updated!');
      }
      setModal({ isOpen: false, type: 'add', data: null });
      fetchMeds();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this medication?')) return;
    try {
      await api.medications.delete(id);
      toast.success('Medication removed');
      fetchMeds();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

  return (
    <div style={{ background: 'var(--cream-50)', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ paddingTop: '110px', paddingBottom: 'var(--space-16)' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-8)' }}>
            <div>
              <Link href="/dashboard/patient" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                ← Back to Dashboard
              </Link>
              <h1 className="section-heading" style={{ margin: 0 }}>Medication Reminders</h1>
              <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>Manage daily medications and dosage schedules.</p>
            </div>
            <button onClick={() => handleOpenModal('add')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>+ Add Medication</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
            {meds.map(med => (
              <div key={med._id} className="card" style={{ padding: 'var(--space-6)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleOpenModal('edit', med)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.125rem' }}>✏️</button>
                  <button onClick={() => handleDelete(med._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.125rem' }}>🗑️</button>
                </div>

                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>💊</div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>{med.name}</h3>
                <p style={{ margin: '0 0 12px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{med.dosage} • {med.frequency.replace('_', ' ')}</p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {med.times.map(t => (
                    <span key={t} style={{ background: 'var(--sage-50)', color: 'var(--sage-700)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600 }}>
                      ⏰ {t}
                    </span>
                  ))}
                </div>

                {med.instructions && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', background: 'var(--cream-50)', padding: '8px', borderRadius: 'var(--radius-sm)', fontStyle: 'italic' }}>
                    "{med.instructions}"
                  </div>
                )}
              </div>
            ))}

            {meds.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', background: 'white', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌿</div>
                <h3>No medications added yet</h3>
                <p style={{ color: 'var(--text-muted)' }}>Stay on top of your health by adding your daily prescriptions.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ADD/EDIT MODAL */}
      {modal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--warm-white)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)', width: '100%', maxWidth: 500, boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: 'var(--space-6)' }}>{modal.type === 'add' ? 'Add Medication' : 'Edit Medication'}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Medication Name *</label>
                <input className="form-input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Metformin" />
              </div>

              <div className="form-group">
                <label className="form-label">Dosage *</label>
                <input className="form-input" required value={form.dosage} onChange={e => set('dosage', e.target.value)} placeholder="e.g. 500mg" />
              </div>

              <div className="form-group">
                <label className="form-label">Frequency</label>
                <select className="form-input" value={form.frequency} onChange={e => set('frequency', e.target.value)}>
                  <option value="daily">Daily</option>
                  <option value="twice_daily">Twice Daily</option>
                  <option value="thrice_daily">Thrice Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="as_needed">As Needed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  Reminder Times 
                  <button type="button" onClick={handleAddTime} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem' }}>+ Add Time</button>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {form.times.map((time, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '4px' }}>
                      <input type="time" className="form-input" value={time} onChange={(e) => handleTimeChange(idx, e.target.value)} />
                      {form.times.length > 1 && (
                        <button type="button" onClick={() => handleRemoveTime(idx)} style={{ background: 'none', border: 'none', color: 'var(--terracotta-500)', cursor: 'pointer' }}>×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Instructions</label>
                <textarea className="form-input" value={form.instructions} onChange={e => set('instructions', e.target.value)} placeholder="e.g. Take with food" rows={2} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal({ isOpen: false, type: 'add', data: null })}>Cancel</button>
                <button type="submit" className="btn btn-primary">{modal.type === 'add' ? 'Save Medication' : 'Update Medication'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
}
