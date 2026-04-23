'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import toast from 'react-hot-toast';
import Link from 'next/link';

function Stars({ rating, size = 16 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= Math.round(rating) ? '#f59e0b' : '#d4bfb3' }}>★</span>
      ))}
    </span>
  );
}

function RatingBar({ label, value }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{value.toFixed(1)}</span>
      </div>
      <div style={{ height: '6px', background: 'var(--cream-200)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'var(--primary)', width: `${(value / 5) * 100}%`, transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}

export default function CaregiverProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [cg, setCg] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cgRes, reviewsRes] = await Promise.all([
          api.caregivers.get(id),
          api.reviews.byCaregiverId(id)
        ]);
        setCg(cgRes.data);
        setReviews(reviewsRes.data);
      } catch (err) {
        toast.error('Failed to load caregiver profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="spinner"></div>
    </div>
  );

  if (!cg) return (
    <div style={{ minHeight: '100vh', textAlign: 'center', padding: '100px' }}>
      <h1>Caregiver not found</h1>
      <Link href="/caregivers" className="btn btn-primary">Back to Search</Link>
    </div>
  );

  // Calculate category averages
  const categories = ['punctuality', 'communication', 'professionalism', 'quality'];
  const catAvgs = categories.reduce((acc, cat) => {
    const sum = reviews.reduce((s, r) => s + (r.categories?.[cat] || 5), 0);
    acc[cat] = reviews.length > 0 ? sum / reviews.length : 5;
    return acc;
  }, {});

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '100px', paddingBottom: '80px', background: 'var(--cream-50)' }}>
        <div className="container">
          
          <Link href="/caregivers" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.9rem', fontWeight: 500 }}>
            ← Back to All Caregivers
          </Link>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '48px', alignItems: 'start' }}>
            
            {/* Left Content */}
            <div className="animate-fadeInUp">
              
              {/* Profile Header */}
              <div style={{ display: 'flex', gap: '32px', marginBottom: '40px', alignItems: 'center' }}>
                <div className="avatar" style={{ 
                  width: 140, height: 140, fontSize: '3rem', 
                  backgroundImage: cg.user.avatar ? `url(${cg.user.avatar})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: 'var(--shadow-md)',
                  border: '4px solid white'
                }}>
                  {!cg.user.avatar && cg.user.name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h1 style={{ margin: 0, fontSize: '2.5rem' }}>{cg.user.name}</h1>
                    {cg.isVerified && <span title="Verified Professional" style={{ fontSize: '1.5rem' }}>🛡️</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Stars rating={cg.rating} />
                      <strong style={{ color: 'var(--text-primary)' }}>{cg.rating}</strong>
                      <span>({cg.totalReviews} Reviews)</span>
                    </div>
                    <span>•</span>
                    <span>{cg.experience} Years Experience</span>
                    <span>•</span>
                    <span>📍 {cg.location?.city}, {cg.location?.state}</span>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="card" style={{ padding: '32px', marginBottom: '32px' }}>
                <h3 style={{ marginBottom: '16px' }}>About {cg.user.name.split(' ')[0]}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                  {cg.bio}
                </p>
                
                <div style={{ marginTop: '32px' }}>
                  <h4 style={{ marginBottom: '16px', fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Specializations</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {cg.specializations.map(s => (
                      <span key={s} className="badge badge-terracotta" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              <div id="reviews">
                <h2 style={{ marginBottom: '24px' }}>Reviews from Families</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
                  <div className="card" style={{ padding: '24px', background: 'var(--warm-white)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                      <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{cg.rating}</div>
                      <Stars rating={cg.rating} size={20} />
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Average Rating</div>
                    </div>
                  </div>
                  <div className="card" style={{ padding: '24px', background: 'var(--warm-white)' }}>
                    <RatingBar label="Punctuality" value={catAvgs.punctuality} />
                    <RatingBar label="Communication" value={catAvgs.communication} />
                    <RatingBar label="Professionalism" value={catAvgs.professionalism} />
                    <RatingBar label="Quality of Care" value={catAvgs.quality} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {reviews.length === 0 ? (
                    <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No reviews yet for this caregiver.
                    </div>
                  ) : (
                    reviews.map((r, i) => (
                      <div key={i} className="card animate-fadeInUp" style={{ padding: '24px', animationDelay: `${i * 0.1}s` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="avatar" style={{ 
                              width: 40, height: 40, fontSize: '0.9rem',
                              backgroundImage: r.patient?.user?.avatar ? `url(${r.patient.user.avatar})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}>
                              {!r.patient?.user?.avatar && r.patient?.user?.name[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700 }}>{r.patient?.user?.name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <Stars rating={r.rating} />
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6 }}>
                          "{r.comment}"
                        </p>
                        {r.caregiverResponse && (
                          <div style={{ marginTop: '16px', padding: '16px', background: 'var(--sage-50)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--secondary)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary-dark)', textTransform: 'uppercase', marginBottom: '4px' }}>Caregiver Response</div>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{r.caregiverResponse}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Sidebar Booking Card */}
            <aside style={{ position: 'sticky', top: '120px' }}>
              <div className="card" style={{ padding: '32px', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--terracotta-100)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
                  <div>
                    <span style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)' }}>${cg.hourlyRate}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>/hr</span>
                  </div>
                  <div className="badge badge-sage">Available Now</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>🛡️</span> <span>Full Background Check Passed</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>🏥</span> <span>CPR & First Aid Certified</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>⚡</span> <span>Typical response: &lt; 2 hours</span>
                  </div>
                </div>

                <Link 
                  href={`/book?caregiverId=${cg._id}&name=${encodeURIComponent(cg.user.name)}`} 
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1.125rem' }}
                >
                  Book a Session
                </Link>
                
                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '16px' }}>
                  No charge until booking is confirmed.
                </p>
              </div>

              {/* Trust Badge */}
              <div style={{ marginTop: '24px', textAlign: 'center', padding: '20px', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🤝</div>
                <h5 style={{ margin: 0, fontSize: '0.9rem' }}>CareNest Guarantee</h5>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Every caregiver is vetted through our 5-step verification process.</p>
              </div>
            </aside>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
