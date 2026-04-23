'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { api } from '../../../../lib/api';

const AVAILABLE_SPECIALIZATIONS = [
  'Dementia Care', 'Post-Surgery Recovery', 'Physical Therapy Assistance',
  'Medication Management', 'Palliative Care', 'Companionship',
  'Wound Care', 'Mobility Assistance', 'Nutrition & Meal Prep', 'Chronic Disease Management'
];

export default function CaregiverSetup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    bio: '',
    hourlyRate: '',
    experience: '',
    location: { city: '', state: '', zipCode: '' },
    specializations: [],
    languages: '',
    certifications: [],
    availability: {
      monday: { available: false },
      tuesday: { available: false },
      wednesday: { available: false },
      thursday: { available: false },
      friday: { available: false },
      saturday: { available: false },
      sunday: { available: false },
    }
  });

  const [certInput, setCertInput] = useState({ name: '', issuer: '', year: '' });
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const res = await api.caregivers.me();
        if (res.data) {
          setIsEditMode(true);
          const p = res.data;
          setFormData({
            bio: p.bio || '',
            hourlyRate: p.hourlyRate || '',
            experience: p.experience || '',
            location: p.location || { city: '', state: '', zipCode: '' },
            specializations: p.specializations || [],
            languages: p.languages?.join(', ') || '',
            certifications: p.certifications || [],
            availability: p.availability || formData.availability,
            avatar: res.data.user?.avatar || ''
          });

        }
      } catch (err) {
        // If 404, it means setup is required, ignore
      }
    };
    checkProfile();
  }, []);

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleSpecialization = (spec) => {
    setFormData(prev => {
      const current = prev.specializations;
      if (current.includes(spec)) {
        return { ...prev, specializations: current.filter(s => s !== spec) };
      } else {
        return { ...prev, specializations: [...current, spec] };
      }
    });
  };

  const addCertification = () => {
    if (!certInput.name || !certInput.issuer || !certInput.year) return;
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, { ...certInput, year: Number(certInput.year) }]
    }));
    setCertInput({ name: '', issuer: '', year: '' });
  };

  const removeCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: { available: !prev.availability[day].available }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      experience: Number(formData.experience),
      hourlyRate: Number(formData.hourlyRate),
      languages: formData.languages.split(',').map(s => s.trim()).filter(s => s)
    };

    try {
      await api.caregivers.update(payload);
      toast.success(isEditMode ? 'Profile updated successfully!' : 'Profile submitted for review!');
      router.push('/dashboard/caregiver');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section-sm animate-fadeIn">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
          <h1 className="section-heading">{isEditMode ? 'Edit Professional Profile' : 'Professional Profile'}</h1>
          <p className="section-subheading" style={{ margin: '0 auto' }}>
            {isEditMode ? 'Update your credentials and availability directly.' : 'Set up your credentials and availability to get matched with families.'}
          </p>
        </div>

        {/* Sage-themed Progress Tracker */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-8)' }}>
          {[1, 2, 3, 4].map((num) => (
            <div 
              key={num} 
              style={{
                flex: 1, height: '8px', borderRadius: '4px',
                background: step >= num ? 'var(--secondary)' : 'var(--sage-100)',
                transition: 'var(--transition)'
              }} 
            />
          ))}
        </div>

        {error && (
          <div style={{ padding: '16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        <div className="card" style={{ padding: 'var(--space-8)', borderColor: 'var(--sage-200)' }}>
          <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            
            {/* STEP 1: Core Metrics */}
            {step === 1 && (
              <div className="animate-fadeInRight">
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: 'var(--space-6)', color: 'var(--secondary-dark)' }}>1. Core Metrics</h2>
                
                {/* Avatar Upload */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: 'var(--space-6)', padding: '20px', background: 'var(--sage-50)', borderRadius: 'var(--radius-lg)' }}>
                  <div className="avatar" style={{ 
                    width: 80, height: 80, fontSize: '2rem', 
                    backgroundImage: formData.avatar ? `url(${formData.avatar})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '3px solid white',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {!formData.avatar && '👤'}
                  </div>
                  <div>
                    <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Profile Picture</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        
                        const uploadToast = toast.loading('Uploading image...');
                        try {
                          const uploadData = new FormData();
                          uploadData.append('avatar', file);
                          const res = await api.auth.uploadAvatar(uploadData);
                          setFormData(prev => ({ ...prev, avatar: res.avatar }));
                          toast.success('Avatar uploaded!', { id: uploadToast });
                          
                          // Update local user storage
                          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                          localStorage.setItem('user', JSON.stringify({ ...storedUser, avatar: res.avatar }));
                        } catch (err) {
                          toast.error('Upload failed: ' + err.message, { id: uploadToast });
                        }
                      }}
                      style={{ fontSize: '0.875rem' }}
                    />
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Professional headshot recommended (Max 5MB)</p>
                  </div>
                </div>
                
                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="form-label">Professional Bio</label>
                  <textarea name="bio" value={formData.bio} onChange={handleChange} className="form-input" rows="4" placeholder="Tell families about your nursing philosophy and background..." required />
                </div>

                <div className="grid-2" style={{ marginBottom: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Hourly Rate ($)</label>
                    <input type="number" name="hourlyRate" value={formData.hourlyRate} onChange={handleChange} className="form-input" min="10" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Years of Experience</label>
                    <input type="number" name="experience" value={formData.experience} onChange={handleChange} className="form-input" min="0" required />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="form-label">Languages Spoken (Comma separated)</label>
                  <input type="text" name="languages" value={formData.languages} onChange={handleChange} className="form-input" placeholder="e.g. English, Spanish" required />
                </div>

                <h3 style={{ fontSize: '1.1rem', marginTop: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>Service Location</h3>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input type="text" name="location.city" value={formData.location.city} onChange={handleChange} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input type="text" name="location.state" value={formData.location.state} onChange={handleChange} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Zip Code</label>
                    <input type="text" name="location.zipCode" value={formData.location.zipCode} onChange={handleChange} className="form-input" required />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Specializations */}
            {step === 2 && (
              <div className="animate-fadeInRight">
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: 'var(--space-6)', color: 'var(--secondary-dark)' }}>2. Specializations</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>Select the areas in which you are professionally qualified to assist:</p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {AVAILABLE_SPECIALIZATIONS.map(spec => {
                    const isSelected = formData.specializations.includes(spec);
                    return (
                      <div 
                        key={spec}
                        onClick={() => toggleSpecialization(spec)}
                        style={{
                          padding: '12px 20px',
                          borderRadius: 'var(--radius-full)',
                          border: `2px solid ${isSelected ? 'var(--secondary)' : 'var(--sage-100)'}`,
                          background: isSelected ? 'var(--sage-50)' : 'transparent',
                          color: isSelected ? 'var(--secondary-dark)' : 'var(--text-primary)',
                          cursor: 'pointer',
                          fontWeight: 500,
                          transition: 'var(--transition)'
                        }}
                      >
                        {spec}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: Certifications */}
            {step === 3 && (
              <div className="animate-fadeInRight">
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: 'var(--space-6)', color: 'var(--secondary-dark)' }}>3. Certifications & Degrees</h2>
                
                <div style={{ background: 'var(--sage-50)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)' }}>
                  <div className="grid-3" style={{ alignItems: 'end' }}>
                    <div className="form-group">
                      <label className="form-label">Certificate / Degree</label>
                      <input type="text" className="form-input" value={certInput.name} onChange={e => setCertInput({...certInput, name: e.target.value})} placeholder="e.g. RN, CNA" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Issuing Body</label>
                      <input type="text" className="form-input" value={certInput.issuer} onChange={e => setCertInput({...certInput, issuer: e.target.value})} placeholder="e.g. State Board" />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Year</label>
                        <input type="number" className="form-input" value={certInput.year} onChange={e => setCertInput({...certInput, year: e.target.value})} placeholder="2022" />
                      </div>
                      <button type="button" onClick={addCertification} className="btn btn-secondary" style={{ padding: '0 var(--space-4)' }}>Add</button>
                    </div>
                  </div>
                </div>

                {formData.certifications.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {formData.certifications.map((cert, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        <div>
                          <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{cert.name}</strong>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{cert.issuer} ({cert.year})</span>
                        </div>
                        <button type="button" onClick={() => removeCertification(index)} style={{ color: '#991b1b', background: 'transparent', border: 'none' }}>Remove</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>No certifications added yet.</p>
                )}
              </div>
            )}

            {/* STEP 4: Availability */}
            {step === 4 && (
              <div className="animate-fadeInRight">
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: 'var(--space-6)', color: 'var(--secondary-dark)' }}>4. Typical Availability</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>Select the days you are typically available for assignments.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                  {Object.keys(formData.availability).map((day) => {
                    const isAvailable = formData.availability[day].available;
                    return (
                      <div 
                        key={day}
                        onClick={() => toggleDay(day)}
                        style={{
                          padding: '16px',
                          textAlign: 'center',
                          borderRadius: 'var(--radius-md)',
                          border: `2px solid ${isAvailable ? 'var(--secondary)' : 'var(--border)'}`,
                          background: isAvailable ? 'var(--secondary)' : 'var(--warm-white)',
                          color: isAvailable ? '#fff' : 'var(--text-primary)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          transition: 'var(--transition)'
                        }}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>

                {!isEditMode && (
                  <div style={{ marginTop: 'var(--space-6)', padding: '16px', background: 'var(--terracotta-50)', color: 'var(--terracotta-800)', borderRadius: '8px', fontSize: '0.9rem' }}>
                    <strong>Note:</strong> Upon completion, your profile will be held in a <em>Pending Verification</em> state. An Admin will review your credentials before you can accept bookings.
                  </div>
                )}
              </div>
            )}

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-8)' }}>
              {step > 1 ? (
                <button type="button" onClick={handlePrev} className="btn btn-outline" disabled={loading} style={{ borderColor: 'var(--text-secondary)', color: 'var(--text-secondary)' }}>
                  Back
                </button>
              ) : (
                <Link href="/dashboard" className="btn btn-ghost">Cancel</Link>
              )}
              
              {step < 4 ? (
                <button type="button" onClick={handleNext} className="btn btn-secondary">
                  Continue Phase
                </button>
              ) : (
                <button type="submit" className="btn btn-secondary" disabled={loading} style={{ background: loading ? 'var(--sage-300)' : 'var(--secondary)' }}>
                  {loading ? (isEditMode ? 'Updating...' : 'Submitting for Review...') : (isEditMode ? 'Update Profile' : 'Submit Profile')}
                </button>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
