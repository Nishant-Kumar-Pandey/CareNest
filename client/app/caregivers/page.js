'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import CaregiverCard from '../../components/CaregiverCard';



const ALL_SPECIALIZATIONS = ['Dementia Care','Medication Management','Post-Surgery Recovery','Physical Therapy Assistance','Palliative Care','Companionship','Wound Care','Mobility Assistance','Nutrition & Meal Prep','Chronic Disease Management','Personal Care'];
const LANGUAGES = ['English','Spanish','Mandarin','Cantonese','Korean','Yoruba','French'];

// Removed inline CaregiverCard and Stars in favor of shared component

export default function CaregiversPage() {
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [view, setView]             = useState('grid');
  const [search, setSearch]         = useState('');
  const [filters, setFilters]       = useState({ specialization:'', minRate:'', maxRate:'', minRating:'', language:'' });
  const [sortBy, setSortBy]         = useState('rating');

  const fetchCaregivers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filters.specialization) params.set('specialization', filters.specialization);
      if (filters.minRate) params.set('minRate', filters.minRate);
      if (filters.maxRate) params.set('maxRate', filters.maxRate);
      if (filters.minRating) params.set('minRating', filters.minRating);
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API}/caregivers?${params}`);
      const data = await res.json();
      if (data.data?.caregivers?.length) setCaregivers(data.data.caregivers);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [search, filters]);

  useEffect(() => { fetchCaregivers(); }, [fetchCaregivers]);

  const sorted = [...caregivers].sort((a, b) => {
    if (sortBy === 'rating')     return b.rating - a.rating;
    if (sortBy === 'price_asc')  return a.hourlyRate - b.hourlyRate;
    if (sortBy === 'price_desc') return b.hourlyRate - a.hourlyRate;
    if (sortBy === 'reviews')    return b.totalReviews - a.totalReviews;
    return 0;
  });

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const clearFilters = () => { setFilters({ specialization:'', minRate:'', maxRate:'', minRating:'', language:'' }); setSearch(''); };

  return (
    <>
      <Navbar />

      {/* Page Hero */}
      <div style={{ background:'linear-gradient(135deg, var(--terracotta-50), var(--cream-100))', paddingTop:130, paddingBottom:'var(--space-12)', borderBottom:'1px solid var(--border)' }}>
        <div className="container">
          <div className="section-label">Our Care Team</div>
          <h1 className="section-heading">Find Your Perfect Caregiver</h1>
          <p className="section-subheading">Browse {caregivers.length} verified, background-checked caregivers. Filter by specialty, language, and budget to find the right fit.</p>

          {/* Search bar */}
          <div style={{ marginTop:'var(--space-8)', display:'flex', gap:'var(--space-3)', maxWidth:640, flexWrap:'wrap' }}>
            <div style={{ flex:1, position:'relative', minWidth:200 }}>
              <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:'1.125rem', pointerEvents:'none' }}>🔍</span>
              <input className="form-input" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or specialty…"
                style={{ width:'100%', paddingLeft:40 }} />
            </div>
            <select className="form-select" value={filters.specialization} onChange={e => setFilter('specialization', e.target.value)} style={{ minWidth:200 }}>
              <option value="">All Specializations</option>
              {ALL_SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-primary" onClick={fetchCaregivers}>Search</button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBlock:'var(--space-10)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:'var(--space-8)', alignItems:'start' }}>

          {/* ── FILTERS SIDEBAR ── */}
          <aside style={{ background:'var(--warm-white)', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)', padding:'var(--space-6)', position:'sticky', top:88 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'var(--space-5)' }}>
              <h3 style={{ fontSize:'1rem', margin:0 }}>Filters</h3>
              <button onClick={clearFilters} style={{ fontSize:'0.8125rem', color:'var(--primary)', background:'none', border:'none', fontWeight:600, cursor:'pointer' }}>Clear all</button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-5)' }}>
              {/* Rating */}
              <div className="form-group">
                <label className="form-label">Minimum Rating</label>
                <select className="form-select" value={filters.minRating} onChange={e => setFilter('minRating', e.target.value)}>
                  <option value="">Any rating</option>
                  <option value="4">4+ ★★★★</option>
                  <option value="4.5">4.5+ ★★★★½</option>
                  <option value="4.8">4.8+ ★★★★★</option>
                </select>
              </div>

              {/* Hourly Rate */}
              <div className="form-group">
                <label className="form-label">Hourly Rate</label>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input className="form-input" type="number" placeholder="Min $" value={filters.minRate} onChange={e => setFilter('minRate', e.target.value)} style={{ width:'50%' }} />
                  <span style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>–</span>
                  <input className="form-input" type="number" placeholder="Max $" value={filters.maxRate} onChange={e => setFilter('maxRate', e.target.value)} style={{ width:'50%' }} />
                </div>
              </div>

              {/* Language */}
              <div className="form-group">
                <label className="form-label">Language</label>
                <select className="form-select" value={filters.language} onChange={e => setFilter('language', e.target.value)}>
                  <option value="">Any language</option>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Specializations */}
              <div className="form-group">
                <label className="form-label">Specialization</label>
                <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:220, overflowY:'auto' }}>
                  {ALL_SPECIALIZATIONS.map(s => (
                    <label key={s} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'0.875rem', color:'var(--text-secondary)', padding:'4px 0' }}>
                      <input type="radio" name="spec" value={s} checked={filters.specialization === s}
                        onChange={e => setFilter('specialization', e.target.value)}
                        style={{ accentColor:'var(--primary)' }} />
                      {s}
                    </label>
                  ))}
                </div>
              </div>

              {/* Quick filters */}
              <div className="form-group">
                <label className="form-label">Quick Filters</label>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[{label:'✓ Verified Only', key:'verified'},{label:'🛡 Background Checked', key:'bg'},{label:'⭐ Top Rated (4.8+)', key:'top'}].map(({label}) => (
                    <label key={label} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'0.875rem', color:'var(--text-secondary)' }}>
                      <input type="checkbox" style={{ accentColor:'var(--primary)' }} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary" style={{ width:'100%' }} onClick={fetchCaregivers}>Apply Filters</button>
            </div>
          </aside>

          {/* ── RESULTS ── */}
          <div>
            {/* Toolbar */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'var(--space-6)', flexWrap:'wrap', gap:'var(--space-3)' }}>
              <p style={{ color:'var(--text-secondary)', fontSize:'0.9375rem' }}>
                Showing <strong style={{ color:'var(--text-primary)' }}>{sorted.length}</strong> caregivers
              </p>
              <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)' }}>
                <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding:'8px 36px 8px 12px', fontSize:'0.875rem' }}>
                  <option value="rating">Highest Rated</option>
                  <option value="reviews">Most Reviewed</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
                <div style={{ display:'flex', gap:4, background:'var(--cream-200)', borderRadius:'var(--radius-md)', padding:4 }}>
                  {['grid','list'].map(v => (
                    <button key={v} onClick={() => setView(v)} style={{ padding:'6px 12px', borderRadius:'var(--radius-sm)', border:'none', background: view === v ? 'var(--warm-white)' : 'transparent', color: view === v ? 'var(--text-primary)' : 'var(--text-muted)', fontSize:'1rem', boxShadow: view === v ? 'var(--shadow-sm)' : 'none', transition:'var(--transition)' }}>
                      {v === 'grid' ? '⊞' : '≡'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ display:'flex', justifyContent:'center', padding:'var(--space-20)' }}>
                <div className="spinner" />
              </div>
            ) : (
              <div style={view === 'grid' ? { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'var(--space-6)' } : { display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
                {sorted.map(cg => <CaregiverCard key={cg._id} cg={cg} view={view} />)}
              </div>
            )}

            {sorted.length === 0 && !loading && (
              <div style={{ textAlign:'center', padding:'var(--space-20)', color:'var(--text-muted)' }}>
                <div style={{ fontSize:'3rem', marginBottom:'var(--space-4)' }}>🔍</div>
                <h3>No caregivers found</h3>
                <p>Try adjusting your filters or search terms.</p>
                <button className="btn btn-outline" onClick={clearFilters} style={{ marginTop:'var(--space-4)' }}>Clear Filters</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
