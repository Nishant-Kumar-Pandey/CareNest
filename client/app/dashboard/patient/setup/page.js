'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { api } from '../../../../lib/api';

export default function PatientSetup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    gender: 'prefer_not_to_say',
    address: { street: '', city: '', state: '', zipCode: '' },
    conditions: '', // String to be split into array
    allergies: '',
    currentMedications: '',
    mobilityLevel: 'independent',
    cognitionLevel: 'normal',
    careNeeds: '',
    emergencyContact: { name: '', relationship: '', phone: '', email: '' },
    insuranceProvider: '',
    primaryPhysician: { name: '', phone: '' }
  });

  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const res = await api.patients.me();
        if (res.data) {
          setIsEditMode(true);
          const p = res.data;
          
          setFormData({
            dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
            gender: p.gender || 'prefer_not_to_say',
            address: p.address || { street: '', city: '', state: '', zipCode: '' },
            conditions: p.medicalHistory?.conditions?.join(', ') || '',
            allergies: p.medicalHistory?.allergies?.join(', ') || '',
            currentMedications: p.medicalHistory?.currentMedications?.join(', ') || '',
            mobilityLevel: p.medicalHistory?.mobilityLevel || 'independent',
            cognitionLevel: p.medicalHistory?.cognitionLevel || 'normal',
            careNeeds: p.careNeeds?.join(', ') || '',
            emergencyContact: p.emergencyContact || { name: '', relationship: '', phone: '', email: '' },
            insuranceProvider: p.insuranceProvider || '',
            primaryPhysician: p.primaryPhysician || { name: '', phone: '' }
          });
        }
      } catch (err) {
        // Not found, normal setup mode
      }
    };
    checkProfile();
  }, []);

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      // Handle nested object structure (e.g., 'address.city')
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: { ...formData[parent], [child]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Transform strings into arrays where needed
    const payload = {
      ...formData,
      conditions: formData.conditions ? formData.conditions.split(',').map(s => s.trim()) : [],
      allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
      careNeeds: formData.careNeeds ? formData.careNeeds.split(',').map(s => s.trim()) : [],
      currentMedications: formData.currentMedications ? formData.currentMedications.split(',').map(s => s.trim()) : [],
    };

    try {
      await api.patients.update(payload);
      toast.success(isEditMode ? 'Care profile updated successfully!' : 'Care profile setup complete!');
      router.push('/dashboard/patient');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section-sm animate-fadeIn">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
          <h1 className="section-heading">{isEditMode ? 'Edit Care Profile' : 'Patient Setup'}</h1>
          <p className="section-subheading" style={{ margin: '0 auto' }}>
            {isEditMode ? 'Update your medical background and care requirements.' : 'Help us understand your medical background to find the best care.'}
          </p>
        </div>

        {/* Progress Tracker */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-8)' }}>
          {[1, 2, 3, 4].map((num) => (
            <div 
              key={num} 
              style={{
                flex: 1, height: '8px', borderRadius: '4px',
                background: step >= num ? 'var(--primary)' : 'var(--cream-200)',
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

        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            
            {/* STEP 1: Basic Information */}
            {step === 1 && (
              <div className="animate-fadeInRight">
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: 'var(--space-6)' }}>1. Basic Information</h2>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="form-select">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
                
                <h3 style={{ fontSize: '1.1rem', marginTop: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>Home Address</h3>
                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="form-label">Street Address</label>
                  <input type="text" name="address.street" value={formData.address.street} onChange={handleChange} className="form-input" required />
                </div>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input type="text" name="address.city" value={formData.address.city} onChange={handleChange} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input type="text" name="address.state" value={formData.address.state} onChange={handleChange} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Zip Code</label>
                    <input type="text" name="address.zipCode" value={formData.address.zipCode} onChange={handleChange} className="form-input" required />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Medical Baseline */}
            {step === 2 && (
              <div className="animate-fadeInRight">
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: 'var(--space-6)' }}>2. Mobility & Cognition</h2>
                
                <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                  <label className="form-label">Mobility Level</label>
                  <select name="mobilityLevel" value={formData.mobilityLevel} onChange={handleChange} className="form-select" style={{ fontSize: '1.1rem', padding: '16px' }}>
                    <option value="independent">Independent - Moves without assistance</option>
                    <option value="assisted">Assisted - Needs cane, walker, or light help</option>
                    <option value="wheelchair">Wheelchair Bound</option>
                    <option value="bedridden">Bedridden</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                  <label className="form-label">Cognition Level</label>
                  <select name="cognitionLevel" value={formData.cognitionLevel} onChange={handleChange} className="form-select" style={{ fontSize: '1.1rem', padding: '16px' }}>
                    <option value="normal">Normal / Typical for age</option>
                    <option value="mild_impairment">Mild Impairment (Occasional memory loss)</option>
                    <option value="moderate_impairment">Moderate (Needs supervision)</option>
                    <option value="severe_impairment">Severe (Dementia / Alzheimer's)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Specific Care Needs (Comma separated)</label>
                  <textarea name="careNeeds" value={formData.careNeeds} onChange={handleChange} className="form-input" placeholder="e.g. Wound dressing, Bathing assistance, Meal prep" rows="3"></textarea>
                </div>
              </div>
            )}

            {/* STEP 3: Clinical Details */}
            {step === 3 && (
              <div className="animate-fadeInRight">
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: 'var(--space-6)' }}>3. Clinical Details</h2>
                
                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="form-label">Medical Conditions (Comma separated)</label>
                  <input type="text" name="conditions" value={formData.conditions} onChange={handleChange} className="form-input" placeholder="e.g. Diabetes, Hypertension, Arthritis" />
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="form-label">Allergies (Comma separated)</label>
                  <input type="text" name="allergies" value={formData.allergies} onChange={handleChange} className="form-input" placeholder="e.g. Penicillin, Peanuts" />
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="form-label">Current Medications (Comma separated names)</label>
                  <textarea name="currentMedications" value={formData.currentMedications} onChange={handleChange} className="form-input" placeholder="e.g. Metformin 500mg daily, Lisinopril 10mg" rows="3"></textarea>
                </div>
              </div>
            )}

            {/* STEP 4: Emergency Contacts */}
            {step === 4 && (
              <div className="animate-fadeInRight">
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: 'var(--space-6)' }}>4. Emergency & Insurance</h2>
                
                <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-4)' }}>Emergency Contact</h3>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Contact Name</label>
                    <input type="text" name="emergencyContact.name" value={formData.emergencyContact.name} onChange={handleChange} className="form-input" required={step===4} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Relationship</label>
                    <input type="text" name="emergencyContact.relationship" value={formData.emergencyContact.relationship} onChange={handleChange} className="form-input" required={step===4} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input type="tel" name="emergencyContact.phone" value={formData.emergencyContact.phone} onChange={handleChange} className="form-input" required={step===4} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" name="emergencyContact.email" value={formData.emergencyContact.email} onChange={handleChange} className="form-input" />
                  </div>
                </div>

                <div className="divider" />

                <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-4)' }}>Primary Physician</h3>
                <div className="grid-2" style={{ marginBottom: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Physician Name</label>
                    <input type="text" name="primaryPhysician.name" value={formData.primaryPhysician.name} onChange={handleChange} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Physician Phone</label>
                    <input type="tel" name="primaryPhysician.phone" value={formData.primaryPhysician.phone} onChange={handleChange} className="form-input" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Insurance Provider (Optional)</label>
                  <input type="text" name="insuranceProvider" value={formData.insuranceProvider} onChange={handleChange} className="form-input" />
                </div>
              </div>
            )}

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-8)' }}>
              {step > 1 ? (
                <button type="button" onClick={handlePrev} className="btn btn-outline" disabled={loading}>
                  Back
                </button>
              ) : (
                <Link href="/dashboard" className="btn btn-ghost">Cancel</Link>
              )}
              
              {step < 4 ? (
                <button type="button" onClick={handleNext} className="btn btn-primary">
                  Continue Form
                </button>
              ) : (
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving Profile...' : (isEditMode ? 'Update Profile' : 'Complete Profile')}
                </button>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
