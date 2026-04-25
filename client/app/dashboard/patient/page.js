import { Suspense } from 'react';
import PatientDashboardContent from './DashboardContent';

export const dynamic = 'force-dynamic';

export default function PatientDashboard() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}><div className="spinner"></div></div>}>
      <PatientDashboardContent />
    </Suspense>
  );
}
