'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import { api } from '../../../../lib/api';
import toast from 'react-hot-toast';

export default function ServiceManagementPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { id, name, ... }
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.admin.services();
      setServices(res.data);
    } catch (err) {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleUpsert = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      id: editing?._id,
      name: formData.get('name'),
      category: formData.get('category'),
      basePrice: parseFloat(formData.get('basePrice')),
      duration: formData.get('duration'),
      icon: formData.get('icon'),
      description: formData.get('description'),
      features: formData.get('features').split(',').map(f => f.trim()).filter(f => f)
    };

    try {
      await api.admin.upsertService(data);
      toast.success(editing ? 'Service updated' : 'Service created');
      setIsModalOpen(false);
      setEditing(null);
      fetchServices();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream-50)' }}>
      <Navbar />
      <main style={{ paddingTop: '110px', paddingBottom: 'var(--space-16)' }}>
        <div className="container">
          <div style={{ marginBottom: 'var(--space-8)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <Link href="/dashboard/admin" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                ← Back to Command
              </Link>
              <h1 className="section-heading" style={{ margin: 0 }}>Service Catalog</h1>
              <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>Define care offerings and pricing for the marketplace.</p>
            </div>

            <button 
              onClick={() => { setEditing(null); setIsModalOpen(true); }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>+</span> Create New Service
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-6)' }}>
            {loading ? (
              <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px' }}>Loading services...</p>
            ) : services.map(s => (
              <div key={s._id} className="card" style={{ padding: 'var(--space-6)', background: 'white', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                  <div style={{ fontSize: '2rem' }}>{s.icon || '🩹'}</div>
                  <button onClick={() => { setEditing(s); setIsModalOpen(true); }} style={{ background: 'var(--cream-100)', border: 'none', borderRadius: 'var(--radius-full)', width: 32, height: 32, cursor: 'pointer', color: 'var(--text-primary)' }}>✎</button>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="badge badge-warm" style={{ marginBottom: '8px', fontSize: '0.7rem' }}>{s.category}</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>{s.name}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 'var(--space-4)' }}>{s.description}</p>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary)' }}>
                    ${s.basePrice}<span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>/{s.duration}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.features?.length || 0} Features</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* UPSERT MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card animate-fadeIn" style={{ background: 'white', maxWidth: 500, width: '100%', padding: 'var(--space-8)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: 'var(--space-6)' }}>{editing ? 'Update Service' : 'Create New Service'}</h2>
            <form onSubmit={handleUpsert} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Service Name</label>
                <input name="name" className="form-input" defaultValue={editing?.name} required placeholder="e.g. Physical Therapy Assistance" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select name="category" className="form-input" defaultValue={editing?.category || 'Personal Care'}>
                    {['Personal Care', 'Medical Assistance', 'Companionship', 'Household Help', 'Transportation', 'Specialized Care'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Icon (Emoji)</label>
                  <input name="icon" className="form-input" defaultValue={editing?.icon} required placeholder="🩹" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Base Price ($)</label>
                  <input name="basePrice" type="number" step="0.01" className="form-input" defaultValue={editing?.basePrice} required placeholder="35.00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <select name="duration" className="form-input" defaultValue={editing?.duration || 'Hourly'}>
                    <option value="Hourly">Hourly</option>
                    <option value="Daily">Daily</option>
                    <option value="One-time">One-time</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea name="description" className="form-input" defaultValue={editing?.description} required rows="3" placeholder="Brief overview of the service..." />
              </div>
              <div className="form-group">
                <label className="form-label">Key Features (comma separated)</label>
                <input name="features" className="form-input" defaultValue={editing?.features?.join(', ')} placeholder="Feature 1, Feature 2..." />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--space-4)' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{editing ? 'Save Changes' : 'Create Service'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
