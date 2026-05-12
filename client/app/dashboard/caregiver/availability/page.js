'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import { api } from '../../../../lib/api';
import toast from 'react-hot-toast';

export default function AvailabilityPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.caregivers.me();
      const data = res.data;
      
      // Ensure availability structure exists for older documents
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      if (!data.availability) data.availability = {};
      days.forEach(day => {
        if (!data.availability[day]) data.availability[day] = { available: false, hours: '' };
      });
      
      setProfile(data);
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day) => {
    setProfile(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: { ...prev.availability[day], available: !prev.availability[day].available }
      }
    }));
  };

  const handleHoursChange = (day, hours) => {
    setProfile(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: { ...prev.availability[day], hours }
      }
    }));
  };

  const addServiceArea = () => {
    setProfile(prev => ({
      ...prev,
      serviceAreas: [...(prev.serviceAreas || []), { city: '', state: '', zipCode: '' }]
    }));
  };

  const removeServiceArea = (idx) => {
    setProfile(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.filter((_, i) => i !== idx)
    }));
  };

  const updateServiceArea = (idx, field, value) => {
    setProfile(prev => {
      const newAreas = [...prev.serviceAreas];
      newAreas[idx] = { ...newAreas[idx], [field]: value };
      return { ...prev, serviceAreas: newAreas };
    });
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      await api.caregivers.update(profile);
      toast.success('Availability and areas updated!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div style={{ background: 'var(--cream-50)', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ paddingTop: '110px', paddingBottom: 'var(--space-16)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <Link href="/dashboard/caregiver" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
              ← Back to Dashboard
            </Link>
            <h1 className="section-heading" style={{ margin: 0 }}>Schedule & Service Areas</h1>
            <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>Manage your weekly availability and the regions you cover.</p>
          </div>

          {/* WEEKLY AVAILABILITY */}
          <div className="card" style={{ padding: 'var(--space-8)', marginBottom: 'var(--space-8)', background: 'white', border: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>🗓️</span> Weekly Availability
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {days.map(day => (
                <div key={day} style={{ 
                  display: 'flex', alignItems: 'center', gap: '20px', 
                  padding: '16px', background: 'var(--cream-50)', borderRadius: 'var(--radius-lg)',
                  border: profile.availability[day].available ? '1px solid var(--sage-200)' : '1px solid var(--border)'
                }}>
                  <div style={{ width: '120px', fontWeight: 700, textTransform: 'capitalize' }}>{day}</div>
                  
                  <label className="switch" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={profile.availability[day].available} 
                      onChange={() => handleDayToggle(day)} 
                      style={{ width: '40px', height: '20px' }}
                    />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{profile.availability[day].available ? 'Available' : 'Off'}</span>
                  </label>

                  {profile.availability[day].available && (
                    <input 
                      type="text"
                      className="form-input"
                      style={{ flex: 1, padding: '8px 12px' }}
                      value={profile.availability[day].hours}
                      onChange={(e) => handleHoursChange(day, e.target.value)}
                      placeholder="e.g. 09:00 AM - 05:00 PM"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SERVICE AREAS */}
          <div className="card" style={{ padding: 'var(--space-8)', background: 'white', border: '1px solid var(--border)', marginBottom: 'var(--space-8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>📍</span> Service Areas
              </h2>
              <button onClick={addServiceArea} className="btn btn-outline btn-sm">+ Add Region</button>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
              Add the cities and zip codes where you are willing to provide care.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(profile.serviceAreas || []).map((area, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 40px', gap: '12px', alignItems: 'center' }}>
                  <input 
                    className="form-input" placeholder="City" 
                    value={area.city} onChange={(e) => updateServiceArea(idx, 'city', e.target.value)} 
                  />
                  <input 
                    className="form-input" placeholder="State" 
                    value={area.state} onChange={(e) => updateServiceArea(idx, 'state', e.target.value)} 
                  />
                  <input 
                    className="form-input" placeholder="Zip" 
                    value={area.zipCode} onChange={(e) => updateServiceArea(idx, 'zipCode', e.target.value)} 
                  />
                  <button onClick={() => removeServiceArea(idx)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: 'var(--terracotta-500)', cursor: 'pointer' }}>×</button>
                </div>
              ))}
              {(!profile.serviceAreas || profile.serviceAreas.length === 0) && (
                <div style={{ padding: '32px', textAlign: 'center', background: 'var(--cream-50)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}>
                  No extra service areas defined. You will only be shown in {profile.location?.city}.
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={saveChanges} 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '16px', fontSize: '1.125rem' }}
            disabled={saving}
          >
            {saving ? 'Saving Updates...' : 'Save Schedule & Areas'}
          </button>

        </div>
      </main>
      <Footer />
    </div>
  );
}
