import { Suspense } from 'react';
import CaregiverDashboardContent from './DashboardContent';

export const dynamic = 'force-dynamic';

export default function CaregiverDashboard() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}><div className="spinner"></div></div>}>
      <CaregiverDashboardContent />
    </Suspense>
  );
}
