import { Suspense } from 'react';
import AdminDashboardContent from './DashboardContent';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}><div className="spinner"></div></div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
