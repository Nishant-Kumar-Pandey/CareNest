const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const isFormData = options.body instanceof FormData;
  
  const headers = { 
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}), 
    ...options.headers 
  };
  
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      const msg = data.message?.toLowerCase() || '';
      const isAuthError = msg.includes('user not found') || 
                         msg.includes('authorized') || 
                         msg.includes('token') || 
                         msg.includes('expired') || 
                         msg.includes('invalid');

      if (isAuthError) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/auth') && window.location.pathname !== '/') {
           window.location.href = '/auth?expired=true';
        }
      }
    }
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

export const api = {
  auth: {
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request('/auth/me'),
    verifyEmail: (body) => request('/auth/verify-email', { method: 'POST', body: JSON.stringify(body) }),
    resendVerification: (body) => request('/auth/resend-verification', { method: 'POST', body: JSON.stringify(body) }),
    forgotPassword: (body) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
    resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
    uploadAvatar: (formData) => request('/auth/upload-avatar', { method: 'POST', body: formData }),

  },
  caregivers: {
    list: (params = '') => request(`/caregivers?${params}`),
    get: (id) => request(`/caregivers/${id}`),
    me: () => request('/caregivers/me'),
    update: (body) => request('/caregivers/me', { method: 'POST', body: JSON.stringify(body) }),
  },
  patients: {
    me: () => request('/patients/me'),
    update: (body) => request('/patients', { method: 'POST', body: JSON.stringify(body) }),
    getHealthLog: () => request('/patients/health-log'),
  },
  services: {
    list: () => request('/services'),
  },
  bookings: {
    list: (status) => request(`/bookings${status ? `?status=${status}` : ''}`),
    create: (body) => request('/bookings', { method: 'POST', body: JSON.stringify(body) }),
    updateStatus: (id, status, extraFields = {}) => request(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...extraFields }) }),
  },
  reviews: {
    byCaregiverId: (id) => request(`/reviews/caregiver/${id}`),
    create: (bookingId, body) => request(`/bookings/${bookingId}/review`, { method: 'POST', body: JSON.stringify(body) }),
    respond: (reviewId, response) => request(`/reviews/${reviewId}/respond`, { method: 'PATCH', body: JSON.stringify({ response }) }),
  },
  careNotes: {
    list: (bookingId) => request(`/bookings/${bookingId}/notes`),
    create: (bookingId, body) => request(`/bookings/${bookingId}/notes`, { method: 'POST', body: JSON.stringify(body) }),
  },
  admin: {
    metrics: () => request('/admin/metrics'),
    pendingCaregivers: () => request('/admin/pending-caregivers'),
    verifyCaregiver: (id) => request(`/admin/verify-caregiver/${id}`, { method: 'PATCH' }),
    rejectCaregiver: (id) => request(`/admin/reject-caregiver/${id}`, { method: 'DELETE' }),
    // User Management
    users: (role) => request(`/admin/users${role ? `?role=${role}` : ''}`),
    updateUserStatus: (id) => request(`/admin/users/${id}/status`, { method: 'PATCH' }),
    // Service Management
    services: () => request('/admin/services'),
    upsertService: (body) => request('/admin/services', { method: 'POST', body: JSON.stringify(body) }),
  },
  payments: {
    createOrder: (bookingId) => request('/payments/create-order', { method: 'POST', body: JSON.stringify({ bookingId }) }),
    verify: (body) => request('/payments/verify', { method: 'POST', body: JSON.stringify(body) }),
  },
  chat: {
    getMessages: (bookingId) => request(`/chat/${bookingId}/messages`),
    sendMessage: (bookingId, body) => request(`/chat/${bookingId}/messages`, { 
      method: 'POST', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),

  },
  notifications: {
    list: () => request('/notifications'),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request('/notifications/mark-all-read', { method: 'PATCH' }),
    delete: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
  },
  medications: {
    list: () => request('/medications'),
    create: (data) => request('/medications', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/medications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/medications/${id}`, { method: 'DELETE' }),
  },
};
