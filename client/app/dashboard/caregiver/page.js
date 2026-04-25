'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import ChatDrawer from '../../../components/ChatDrawer';
import toast from 'react-hot-toast';

function CaregiverDashboardContent() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [reviews, setReviews] = useState([]);
  const [caregiverProfile, setCaregiverProfile] = useState(null);
  const [submittingAction, setSubmittingAction] = useState({ id: null, action: null });
  
  // Care Note Modal State
  const [careNoteModal, setCareNoteModal] = useState({ isOpen: false, bookingId: null });
  const [noteForm, setNoteForm] = useState({ content: '', mood: 'good', bloodPressure: '', heartRate: '', temperature: '' });

  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatBookingId, setChatBookingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  const syncUser = async () => {
    try {
      const res = await api.auth.me();
      if (res.success && res.user) {
        const freshUser = { ...res.user, ...res.profileStatus };
        setCurrentUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
      }
    } catch (err) {
      console.error('Failed to sync user:', err);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored && stored !== 'undefined') {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse user from storage');
      }
    }
    
    syncUser();
    fetchBookings();
    
    // Auto-open chat if deep-linked
    const openChatId = searchParams.get('openChat');
    if (openChatId) {
      setChatBookingId(openChatId);
      setChatOpen(true);
    }
  }, [searchParams]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.bookings.list();
      setBookings(res.data);
      
      // Fetch reviews too
      const profileRes = await api.caregivers.me();
      if (profileRes.data) {
        setCaregiverProfile(profileRes.data);
        const reviewsRes = await api.reviews.byCaregiverId(profileRes.data._id);
        setReviews(reviewsRes.data);
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('SetupRequired')) {
        router.push('/dashboard/caregiver/setup');
      } else if (msg.toLowerCase().includes('not authorized') || msg.toLowerCase().includes('token')) {
        router.push('/auth');
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      setSubmittingAction({ id, action: status });
      await api.bookings.updateStatus(id, status);
      toast.success(status === 'awaiting_payment' ? 'Payment requested from patient!' : 'Booking updated.');
      fetchBookings();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingAction({ id: null, action: null });
    }
  };

  const submitCareNote = async () => {
    if (!noteForm.content.trim()) return toast.error('Care note content is required.');
    try {
      setSubmittingAction({ id: 'note', action: 'submitting' });
      await api.careNotes.create(careNoteModal.bookingId, {
        content: noteForm.content,
        mood: noteForm.mood,
        vitals: {
          bloodPressure: noteForm.bloodPressure,
          heartRate: Number(noteForm.heartRate) || undefined,
          temperature: Number(noteForm.temperature) || undefined,
        }
      });
      // automatically complete the booking
      await api.bookings.updateStatus(careNoteModal.bookingId, 'completed');
      setCareNoteModal({ isOpen: false, bookingId: null });
      fetchBookings();
      toast.success('Session completed and Care Note attached!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingAction({ id: null, action: null });
    }
  };

  const pending = bookings.filter(b => b.status === 'pending');
  const active = bookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress' || b.status === 'awaiting_payment');
  const past = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  const handleRespondToReview = async (reviewId, response) => {
    if (!response.trim()) return toast.error('Response cannot be empty');
    try {
      setSubmittingAction({ id: reviewId, action: 'responding' });
      await api.reviews.respond(reviewId, response);
      toast.success('Response posted!');
      fetchBookings();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingAction({ id: null, action: null });
    }
  };

  const getActiveList = () => {
    if (activeTab === 'pending') return pending;
    if (activeTab === 'active') return active;
    return past;
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}><div className="spinner"></div></div>;

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: 'var(--space-8) 0', marginTop: '72px' }}>
        {!currentUser?.isVerified && (
          <div style={{ 
            background: 'var(--terracotta-50)', border: '1px solid var(--terracotta-200)', 
            padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', 
            marginBottom: 'var(--space-8)', display: 'flex', gap: 'var(--space-6)', alignItems: 'center',
            boxShadow: 'var(--shadow-sm)', animation: 'fadeInDown 0.5s ease'
          }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: 'var(--shadow-xs)' }}>⚖️</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--terracotta-700)' }}>Verification Under Review</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Our admin team is currently reviewing your professional credentials. You'll be notified once your profile is live and bookable.</p>
            </div>
            <button className="btn btn-outline btn-sm" style={{ borderColor: 'var(--terracotta-300)', color: 'var(--terracotta-600)' }}>Check status</button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-8)' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Caregiver Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Manage your patient bookings and care sessions.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            {currentUser?.isVerified && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '6px 12px', 
                background: 'var(--sage-50)', 
                color: 'var(--sage-700)', 
                borderRadius: 'var(--radius-full)', 
                fontSize: '0.8125rem', 
                fontWeight: '600',
                border: '1px solid var(--sage-200)'
              }}>
                <span style={{ fontSize: '1rem' }}>🛡️</span> Verified Professional
              </div>
            )}
            <button onClick={() => router.push('/dashboard/caregiver/setup')} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Edit Profile ⚙</span>
            </button>
          </div>
        </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', borderBottom: '1px solid var(--border)', marginBottom: 'var(--space-8)' }}>
        {['pending', 'active', 'past', 'reviews'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === tab ? 600 : 500,
              fontSize: '1.0625rem',
              textTransform: 'capitalize',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            {tab} {tab === 'reviews' ? '' : 'Sessions'}
            <span style={{ 
              marginLeft: 8, 
              background: activeTab === tab ? 'var(--primary)' : 'var(--border)', 
              color: '#fff', 
              padding: '2px 8px', 
              borderRadius: 12, 
              fontSize: '0.75rem' 
            }}>
              {tab === 'pending' ? pending.length : tab === 'active' ? active.length : tab === 'past' ? past.length : reviews.length}
            </span>
          </button>
        ))}
      </div>

      {/* LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {activeTab === 'reviews' ? (
          reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', background: 'var(--warm-white)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)' }}>
              <span style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)', display: 'block' }}>⭐</span>
              <h3 style={{ color: 'var(--text-secondary)' }}>No reviews yet.</h3>
            </div>
          ) : (
            reviews.map(review => (
              <div key={review._id} className="card" style={{ padding: 'var(--space-6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="avatar" style={{ 
                      width: 40, height: 40, 
                      backgroundImage: review.patient?.user?.avatar ? `url(${review.patient.user.avatar})` : 'none',
                      backgroundSize: 'cover', backgroundPosition: 'center'
                    }}>
                      {!review.patient?.user?.avatar && review.patient?.user?.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{review.patient?.user?.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(review.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div style={{ color: '#f59e0b', fontSize: '1.25rem' }}>
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 'var(--space-4)' }}>"{review.comment}"</p>
                
                {review.caregiverResponse ? (
                  <div style={{ background: 'var(--sage-50)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--secondary)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Your Response</div>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{review.caregiverResponse}</p>
                  </div>
                ) : (
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <textarea 
                      id={`respond-${review._id}`}
                      className="form-input" rows={2} 
                      placeholder="Write a professional response..." 
                      style={{ width: '100%', marginBottom: '10px' }}
                    />
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        const val = document.getElementById(`respond-${review._id}`).value;
                        handleRespondToReview(review._id, val);
                      }}
                      disabled={submittingAction.id === review._id}
                    >
                      Post Response
                    </button>
                  </div>
                )}
              </div>
            ))
          )
        ) : (
          getActiveList().length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', background: 'var(--warm-white)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)' }}>
              <span style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)', display: 'block' }}>🍃</span>
              <h3 style={{ color: 'var(--text-secondary)' }}>No {activeTab} sessions found.</h3>
            </div>
          ) : (
            getActiveList().map(booking => (
              <div key={booking._id} style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
                animation: 'fadeInUp 0.4s var(--ease-smooth)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <div className="avatar" style={{ 
                      width: 48, height: 48,
                      backgroundImage: booking.patient?.user?.avatar ? `url(${booking.patient.user.avatar})` : 'none',
                      backgroundSize: 'cover', backgroundPosition: 'center'
                    }}>
                      {!booking.patient?.user?.avatar && (booking.patient?.user?.name.charAt(0) || 'P')}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{booking.patient?.user?.name}</h3>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Service: {booking.service?.name}</p>
                    </div>
                  </div>
                  <div className={`badge badge-${booking.status === 'completed' ? 'sage' : booking.status === 'cancelled' ? 'muted' : 'terracotta'}`}>
                    {booking.status}
                  </div>
                </div>
                {/* ... existing fields ... */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', background: 'var(--cream-100)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date & Time</div>
                    <div style={{ fontWeight: 500 }}>{new Date(booking.startDate).toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.875rem' }}>{booking.startTime} - {booking.endTime}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Location</div>
                    <div style={{ fontWeight: 500 }}>{booking.address?.street}</div>
                    <div style={{ fontSize: '0.875rem' }}>{booking.address?.city}, {booking.address?.state} {booking.address?.zipCode}</div>
                  </div>
                </div>

                {booking.specialInstructions && (
                  <div style={{ fontSize: '0.875rem', padding: 'var(--space-3)', borderLeft: '3px solid var(--secondary)', background: 'var(--warm-white)' }}>
                    <strong>Notes:</strong> {booking.specialInstructions}
                  </div>
                )}

                {/* ACTIONS */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    onClick={() => { setChatBookingId(booking._id); setChatOpen(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}
                  >
                    💬 Message Family
                  </button>
                  {booking.status === 'pending' && (
                    <>
                      <button className="btn btn-primary" onClick={() => handleUpdateStatus(booking._id, 'awaiting_payment')} disabled={submittingAction.id === booking._id}>
                        {submittingAction.id === booking._id && submittingAction.action === 'awaiting_payment' ? 'Requesting...' : 'Accept & Request Payment'}
                      </button>
                      <button className="btn btn-outline" onClick={() => handleUpdateStatus(booking._id, 'cancelled')} disabled={submittingAction.id === booking._id}>
                        {submittingAction.id === booking._id && submittingAction.action === 'cancelled' ? 'Declining...' : 'Decline'}
                      </button>
                    </>
                  )}

                  {booking.status === 'confirmed' && (
                    <button className="btn btn-secondary" onClick={() => handleUpdateStatus(booking._id, 'in_progress')} disabled={submittingAction.id === booking._id}>
                      {submittingAction.id === booking._id && submittingAction.action === 'in_progress' ? 'Starting...' : 'Start Session'}
                    </button>
                  )}

                  {booking.status === 'in_progress' && (
                    <button className="btn btn-primary" onClick={() => setCareNoteModal({ isOpen: true, bookingId: booking._id })} disabled={submittingAction.id === booking._id}>
                      Complete & Add Care Note
                    </button>
                  )}
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* CARE NOTE MODAL */}
      {careNoteModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--warm-white)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8)',
            width: '100%',
            maxWidth: 600,
            boxShadow: 'var(--shadow-lg)',
            animation: 'scaleIn 0.3s var(--ease-smooth)'
          }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: 'var(--space-2)' }}>Post-Session Care Note</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', fontSize: '0.875rem' }}>
              Document vitals and session observations to complete this booking. This will be visible to the patient's family.
            </p>

            <div className="form-group">
              <label className="form-label">Care Session Notes *</label>
              <textarea 
                className="form-input" rows={4} 
                placeholder="Describe the session, mood, activities..."
                value={noteForm.content} 
                onChange={e => setNoteForm(prev => ({...prev, content: e.target.value}))} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Patient Mood</label>
              <select className="form-input" value={noteForm.mood} onChange={e => setNoteForm(prev => ({...prev, mood: e.target.value}))}>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="distressed">Distressed</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
              <div className="form-group">
                <label className="form-label">Blood Pressure</label>
                <input className="form-input" placeholder="120/80" value={noteForm.bloodPressure} onChange={e => setNoteForm(prev => ({...prev, bloodPressure: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Heart Rate (bpm)</label>
                <input className="form-input" type="number" placeholder="72" value={noteForm.heartRate} onChange={e => setNoteForm(prev => ({...prev, heartRate: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Temp (°F)</label>
                <input className="form-input" type="number" step="0.1" placeholder="98.6" value={noteForm.temperature} onChange={e => setNoteForm(prev => ({...prev, temperature: e.target.value}))} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-4)' }}>
              <button className="btn btn-ghost" onClick={() => setCareNoteModal({ isOpen: false, bookingId: null })}>Cancel</button>
              <button className="btn btn-primary" onClick={submitCareNote} disabled={submittingAction.id === 'note'}>
                {submittingAction.id === 'note' ? 'Submitting...' : 'Submit & Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      <ChatDrawer 
        isOpen={chatOpen} 
        onClose={() => setChatOpen(false)} 
        bookingId={chatBookingId} 
        currentUser={currentUser} 
      />
      <Footer />
    </>
  );
}

export default function CaregiverDashboard() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}><div className="spinner"></div></div>}>
      <CaregiverDashboardContent />
    </Suspense>
  );
}
