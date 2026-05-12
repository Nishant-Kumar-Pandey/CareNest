'use client';

export default function StatusTimeline({ status }) {
  const stages = [
    { key: 'pending', label: 'Requested', icon: '📝', description: 'Waiting for acceptance' },
    { key: 'confirmed', label: 'Confirmed', icon: '🤝', description: 'Caregiver assigned' },
    { key: 'in_progress', label: 'Active', icon: '🧑‍⚕️', description: 'Session is live' },
    { key: 'completed', label: 'Finished', icon: '✨', description: 'Care session done' }
  ];

  const getStatusIndex = (s) => {
    if (s === 'pending') return 0;
    if (s === 'awaiting_payment' || s === 'confirmed') return 1;
    if (s === 'in_progress') return 2;
    if (s === 'completed') return 3;
    if (s === 'cancelled') return -1;
    return 0;
  };

  const currentIndex = getStatusIndex(status);

  if (status === 'cancelled') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--terracotta-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--terracotta-200)' }}>
        <span style={{ fontSize: '1.5rem' }}>🚫</span>
        <div style={{ color: 'var(--terracotta-700)', fontWeight: 600 }}>This session was cancelled.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6) 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: 'var(--space-8)' }}>
        {/* Progress Line */}
        <div style={{ 
          position: 'absolute', top: '24px', left: '10%', right: '10%', height: '3px', 
          background: 'var(--border)', zIndex: 0 
        }}>
          <div style={{ 
            height: '100%', background: 'var(--primary)', 
            width: `${(currentIndex / (stages.length - 1)) * 100}%`,
            transition: 'width 0.8s var(--ease-smooth)'
          }} />
        </div>

        {stages.map((stage, idx) => {
          const isCompleted = idx <= currentIndex;
          const isActive = idx === currentIndex;

          return (
            <div key={stage.key} style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', 
              width: '20%', zIndex: 1, textAlign: 'center', gap: '8px'
            }}>
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '50%', 
                background: isActive ? 'var(--primary)' : isCompleted ? 'var(--primary)' : 'white',
                border: isCompleted ? '2px solid var(--primary)' : '2px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.25rem', color: isCompleted ? 'white' : 'var(--text-muted)',
                boxShadow: isActive ? '0 0 15px var(--primary-light)' : 'none',
                transition: 'var(--transition)',
                animation: isActive ? 'pulse-light 2s infinite' : 'none'
              }}>
                {isCompleted ? '✓' : stage.icon}
              </div>
              <div>
                <div style={{ 
                  fontSize: '0.8125rem', fontWeight: 700, 
                  color: isCompleted ? 'var(--text-primary)' : 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.5px'
                }}>
                  {stage.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'none' }}>{stage.description}</div>
              </div>
            </div>
          );
        })}
      </div>
      
      <style jsx>{`
        @keyframes pulse-light {
          0% { box-shadow: 0 0 0 0 rgba(188, 108, 92, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(188, 108, 92, 0); }
          100% { box-shadow: 0 0 0 0 rgba(188, 108, 92, 0); }
        }
      `}</style>
    </div>
  );
}
