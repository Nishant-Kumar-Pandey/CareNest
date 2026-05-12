'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import ChatDrawer from '../../../components/ChatDrawer';
import StatusTimeline from '../../../components/StatusTimeline';
import { socket } from '../../../lib/socket';
import toast from 'react-hot-toast';

export default function PatientDashboardContent() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [submittingId, setSubmittingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [updatingAction, setUpdatingAction] = useState(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Modals
  const [cancelModal, setCancelModal] = useState({ isOpen: false, bookingId: null, reason: '' });
  const [careNoteModal, setCareNoteModal] = useState({ isOpen: false, data: null, loading: false });
  const [reviewModal, setReviewModal] = useState({ isOpen: false, bookingId: null, rating: 5, comment: '' });

  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatBookingId, setChatBookingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Load Razorpay Script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setCurrentUser(JSON.parse(stored));
    fetchBookings();

    // Socket Logic
    if (socket) {
      socket.connect();
      socket.on('booking_status_updated', (data) => {
        toast.success(`Booking status updated to ${data.status.replace('_', ' ')}!`);
        fetchBookings();
      });
    }
    
    // Auto-open chat if deep-linked
    const openChatId = searchParams.get('openChat');
    if (openChatId) {
      setChatBookingId(openChatId);
      setChatOpen(true);
    }

    return () => {
      if (socket) {
        socket.off('booking_status_updated');
        socket.disconnect();
      }
    };
  }, [searchParams]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.bookings.list();
      setBookings(res.data);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Patient profile incomplete')) {
        router.push('/dashboard/patient/setup');
      } else if (msg.toLowerCase().includes('not authorized') || msg.toLowerCase().includes('token')) {
        router.push('/auth');
      } else {
        console.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelModal.reason.trim()) return toast.error('Cancellation reason is required.');
    try {
      setSubmittingId('cancel');
      await api.bookings.updateStatus(cancelModal.bookingId, 'cancelled', { cancelReason: cancelModal.reason });
      setCancelModal({ isOpen: false, bookingId: null, reason: '' });
      fetchBookings();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingId(null);
    }
  };

    const handlePayment = async (bookingId) => {
    try {
      setUpdatingId(bookingId);
      setUpdatingAction('pay');
      
      const { order } = await api.payments.createOrder(bookingId);
      
      // MOCK BYPASS: If the backend used fake keys, skip the modal!
      if (order.isMock) {
        toast.promise(
          new Promise(resolve => setTimeout(resolve, 1500)), // fake delay
          { loading: 'Simulating Payment (No API Keys)...', success: 'Payment successful!', error: 'Failed' }
        ).then(async () => {
          await api.payments.verify({
            razorpay_order_id: order.id,
            razorpay_payment_id: 'mock_payment_' + Date.now(),
            razorpay_signature: 'mock_sig',
            bookingId,
            isMock: true
          });
          toast.success('Payment completed! Booking confirmed.');
          fetchBookings();
        });
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mockkey123',
        amount: order.amount,
        currency: order.currency,
        name: 'CareNest',
        description: 'Caregiver Booking Payment',
        order_id: order.id,
        handler: async function (response) {
          try {
            await api.payments.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId
            });
            toast.success('Payment successful! Booking confirmed.');
            fetchBookings();
          } catch (err) {
            toast.error('Payment verification failed.');
          }
        },
        theme: { color: '#bc6c5c' }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function () {
        toast.error('Payment failed or cancelled.');
      });
      rzp.open();
    } catch (err) {
      toast.error(err.message || 'Error initiating payment');
    } finally {
      setUpdatingId(null);
      setUpdatingAction(null);
    }
  };

  const openCareNotes = async (bookingId) => {
    setCareNoteModal({ isOpen: true, data: null, loading: true });
    try {
      const res = await api.careNotes.list(bookingId);
      setCareNoteModal({ isOpen: true, data: res.data, loading: false });
    } catch (err) {
      toast.error(err.message);
      setCareNoteModal({ isOpen: false, data: null, loading: false });
    }
  };

  const submitReview = async () => {
    if (!reviewModal.comment.trim()) return toast.error('Review comment is required.');
    try {
      setSubmittingId('review');
      await api.reviews.create(reviewModal.bookingId, {
        rating: Number(reviewModal.rating),
        comment: reviewModal.comment,
        categories: {
          punctuality: Number(reviewModal.punctuality || 5),
          communication: Number(reviewModal.communication || 5),
          professionalism: Number(reviewModal.professionalism || 5),
          quality: Number(reviewModal.quality || 5)
        }
      });
      toast.success('Review submitted successfully!');
      setReviewModal({ isOpen: false, bookingId: null, rating: 5, comment: '', punctuality: 5, communication: 5, professionalism: 5, quality: 5 });
      fetchBookings();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingId(null);
    }
  };


  const upcoming = bookings.filter(b => ['pending', 'confirmed', 'awaiting_payment'].includes(b.status));
  const active = bookings.filter(b => b.status === 'in_progress');
  const past = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  const getActiveList = () => {
    if (activeTab === 'upcoming') return upcoming;
    if (activeTab === 'active') return active;
    return past;
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}><div className="spinner"></div></div>;

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: 'var(--space-8) 0', marginTop: '72px' }}>
        
        {bookings.some(b => b.status === 'awaiting_payment') && (
          <div style={{ 
            background: 'rgba(77, 132, 82, 0.08)', border: '1px solid var(--sage-300)', 
            padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', 
            marginBottom: 'var(--space-8)', display: 'flex', gap: 'var(--space-6)', alignItems: 'center',
            boxShadow: 'var(--shadow-sm)', animation: 'pulse 3s infinite'
          }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: 'var(--shadow-xs)' }}>💳</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--sage-800)' }}>Payment Required</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>You have one or more accepted bookings waiting for payment confirmation. Pay now to secure your care schedule.</p>
            </div>
            <button onClick={() => setActiveTab('upcoming')} className="btn btn-primary btn-sm">View Invoices</button>
          </div>
        )}

        {/* Live Session Tracker Hero */}
        {active.length > 0 && (
          <div className="card animate-fadeInDown" style={{ 
            padding: 'var(--space-8)', background: 'white', border: '2px solid var(--primary)', 
            marginBottom: 'var(--space-10)', boxShadow: 'var(--shadow-lg)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', margin: 0 }}>Active Session Live Tracking</h2>
                <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Your caregiver {active[0].caregiver?.user?.name} is currently with the patient.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="badge badge-sage" style={{ animation: 'pulse 2s infinite' }}>● Live Now</span>
              </div>
            </div>
            
            <StatusTimeline status={active[0].status} />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
              <button className="btn btn-primary btn-sm" onClick={() => { setChatBookingId(active[0]._id); setChatOpen(true); }}>
                💬 Message Live Caregiver
              </button>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-8)' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Patient Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Manage your care requests, upcoming sessions, and review caregivers.</p>
          </div>
          <button onClick={() => router.push('/dashboard/patient/setup')} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Edit Care Profile ⚙</span>
          </button>
        </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', borderBottom: '1px solid var(--border)', marginBottom: 'var(--space-8)' }}>
        {['upcoming', 'active', 'past'].map(tab => (
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
            {tab}
            <span style={{ 
              marginLeft: 8, 
              background: activeTab === tab ? 'var(--primary)' : 'var(--border)', 
              color: '#fff', 
              padding: '2px 8px', 
              borderRadius: 12, 
              fontSize: '0.75rem' 
            }}>
              {tab === 'upcoming' ? upcoming.length : tab === 'active' ? active.length : past.length}
            </span>
          </button>
        ))}
      </div>

      {/* LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {getActiveList().length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', background: 'var(--warm-white)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)' }}>
            <span style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)', display: 'block' }}>🍃</span>
            <h3 style={{ color: 'var(--text-secondary)' }}>No {activeTab} bookings found.</h3>
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
                    backgroundImage: booking.caregiver?.user?.avatar ? `url(${booking.caregiver.user.avatar})` : 'none',
                    backgroundSize: 'cover', backgroundPosition: 'center'
                  }}>
                    {!booking.caregiver?.user?.avatar && (booking.caregiver?.user?.name.charAt(0) || 'C')}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{booking.caregiver?.user?.name}</h3>
                      {booking.caregiver?.isVerified && (
                        <span title="Verified Professional" style={{ color: 'var(--secondary)', fontSize: '1rem', cursor: 'help' }}>🛡️</span>
                      )}
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Service: {booking.service?.name}</p>
                  </div>
                </div>
                <div className={`badge badge-${booking.status === 'completed' ? 'sage' : booking.status === 'cancelled' ? 'muted' : 'terracotta'}`}>
                  {booking.status}
                </div>
              </div>

              {/* Visual Timeline */}
              {['pending', 'confirmed', 'in_progress', 'awaiting_payment'].includes(booking.status) && (
                <div style={{ padding: '0 var(--space-4)' }}>
                  <StatusTimeline status={booking.status} />
                </div>
              )}

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

              {booking.cancelReason && (
                <div style={{ fontSize: '0.875rem', padding: 'var(--space-3)', borderLeft: '3px solid var(--primary)', background: 'var(--warm-white)' }}>
                  <strong>Cancellation Reason:</strong> {booking.cancelReason}
                </div>
              )}

              {/* ACTIONS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={() => { setChatBookingId(booking._id); setChatOpen(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}
                >
                  💬 Message Caregiver
                </button>
                {(booking.status === 'pending' || booking.status === 'confirmed') && (
                  <button className="btn btn-outline" onClick={() => setCancelModal({ isOpen: true, bookingId: booking._id, reason: '' })}>
                    Cancel Booking
                  </button>
                )}

                {booking.status === 'awaiting_payment' && (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handlePayment(booking._id)}
                    disabled={updatingId === booking._id}
                  >
                    {updatingId === booking._id ? 'Processing...' : 'Pay Now'}
                  </button>
                )}

                {booking.status === 'completed' && (
                  <>
                    <button className="btn btn-primary" onClick={() => openCareNotes(booking._id)}>
                      View Care Notes
                    </button>
                    {!booking.review && (
                      <button className="btn btn-secondary" onClick={() => setReviewModal({ isOpen: true, bookingId: null, rating: 5, comment: '' })}>
                        Leave a Review
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CANCEL MODAL */}
      {cancelModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--warm-white)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)',
            width: '100%', maxWidth: 500, boxShadow: 'var(--shadow-lg)'
          }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: 'var(--space-4)' }}>Cancel Booking</h2>
            <div className="form-group">
              <label className="form-label">Care Cancellation Reason *</label>
              <textarea 
                className="form-input" rows={3} 
                placeholder="Reason for cancellation..."
                value={cancelModal.reason} 
                onChange={e => setCancelModal(prev => ({...prev, reason: e.target.value}))} 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
              <button className="btn btn-ghost" onClick={() => setCancelModal({ isOpen: false, bookingId: null, reason: '' })}>Go Back</button>
              <button className="btn btn-primary" onClick={handleCancelBooking} disabled={submittingId === 'cancel'}>
                {submittingId === 'cancel' ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CARE NOTE MODAL */}
      {careNoteModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--warm-white)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)',
            width: '100%', maxWidth: 600, boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', margin: 0 }}>Care Notes</h2>
              <button onClick={() => setCareNoteModal({ isOpen: false, data: null, loading: false })} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            {careNoteModal.loading ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Loading...</div>
            ) : careNoteModal.data && careNoteModal.data.length > 0 ? (
              careNoteModal.data.map(note => (
                <div key={note._id} style={{ background: 'var(--cream-100)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: '0.875rem' }}>
                    <strong style={{ color: 'var(--primary)' }}>{new Date(note.date).toLocaleString()}</strong>
                    <span style={{textTransform: 'capitalize'}}>Mood: {note.mood || 'N/A'}</span>
                  </div>
                  <p style={{ margin: '0 0 var(--space-4) 0', color: 'var(--text-primary)' }}>{note.content}</p>
                  
                  {note.vitals && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-3)' }}>
                      <div style={{ fontSize: '0.875rem' }}><strong>BP:</strong> {note.vitals.bloodPressure || '-'}</div>
                      <div style={{ fontSize: '0.875rem' }}><strong>HR:</strong> {note.vitals.heartRate ? `${note.vitals.heartRate} bpm` : '-'}</div>
                      <div style={{ fontSize: '0.875rem' }}><strong>Temp:</strong> {note.vitals.temperature ? `${note.vitals.temperature}°F` : '-'}</div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No care notes recorded for this session.</p>
            )}
          </div>
        </div>
      )}

      {/* REVIEW MODAL */}
      {reviewModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '20px'
        }}>
          <div className="animate-scaleIn" style={{
            background: 'var(--warm-white)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)',
            width: '100%', maxWidth: 550, boxShadow: 'var(--shadow-xl)', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>Share Your Experience</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-6)' }}>Your feedback helps other families find the best care.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: 'var(--space-6)' }}>
              {[
                { key: 'rating', label: 'Overall Rating' },
                { key: 'punctuality', label: 'Punctuality' },
                { key: 'communication', label: 'Communication' },
                { key: 'professionalism', label: 'Professionalism' },
                { key: 'quality', label: 'Quality of Care' }
              ].map((cat) => (
                <div key={cat.key} className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{cat.label}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="range" min="1" max="5" step="1"
                      value={reviewModal[cat.key] || 5} 
                      onChange={e => setReviewModal(prev => ({...prev, [cat.key]: Number(e.target.value)}))}
                      style={{ flex: 1, accentColor: 'var(--primary)' }}
                    />
                    <span style={{ fontWeight: 700, minWidth: '1.5rem', textAlign: 'center', color: 'var(--primary)' }}>
                      {reviewModal[cat.key] || 5}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
              <label className="form-label">Written Feedback *</label>
              <textarea 
                className="form-input" rows={4} 
                placeholder="What did you appreciate most? Any areas for improvement?"
                value={reviewModal.comment} 
                onChange={e => setReviewModal(prev => ({...prev, comment: e.target.value}))} 
                style={{ resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-4)' }}>
              <button className="btn btn-ghost" onClick={() => setReviewModal({ isOpen: false, bookingId: null, rating: 5, comment: '', punctuality: 5, communication: 5, professionalism: 5, quality: 5 })}>Cancel</button>
              <button className="btn btn-primary" onClick={submitReview} disabled={submittingId === 'review'}>
                {submittingId === 'review' ? 'Submitting...' : 'Post Review'}
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
