'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import { api } from '../../../../lib/api';
import toast from 'react-hot-toast';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      const res = await api.admin.users(filter);
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id) => {
    try {
      await api.admin.updateUserStatus(id);
      toast.success('User status updated');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user');
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
              <h1 className="section-heading" style={{ margin: 0 }}>User Directory</h1>
              <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>Manage all patient and caregiver accounts across the platform.</p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {['', 'patient', 'caregiver', 'admin'].map(r => (
                <button 
                  key={r} 
                  onClick={() => setFilter(r)}
                  style={{
                    padding: '8px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)',
                    background: filter === r ? 'var(--primary)' : 'white',
                    color: filter === r ? 'white' : 'var(--text-primary)',
                    fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  {r === '' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ background: 'white', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--cream-100)', background: 'var(--cream-50)' }}>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>User</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Role</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Joined</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading directory...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>No users found matching the filter.</td></tr>
                  ) : (
                    users.map(user => (
                      <tr key={user._id} style={{ borderBottom: '1px solid var(--cream-100)', transition: 'var(--transition)' }}>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--cream-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                              {user.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : (user.name?.charAt(0) || '?')}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{user.name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span className={`badge ${user.role === 'caregiver' ? 'badge-warm' : user.role === 'admin' ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '0.7rem' }}>
                            {user.role}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: user.isActive ? 'var(--sage-700)' : 'var(--terracotta-700)', fontWeight: 600 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: user.isActive ? '#10b981' : '#ef4444' }}></span>
                            {user.isActive ? 'Active' : 'Suspended'}
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <button 
                            onClick={() => toggleStatus(user._id)}
                            style={{ 
                              padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)',
                              background: user.isActive ? 'white' : 'var(--terracotta-50)',
                              color: user.isActive ? 'var(--terracotta-600)' : 'var(--sage-600)',
                              fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            {user.isActive ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
