'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '../lib/api';
import { socket } from '../lib/socket';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotifTray, setShowNotifTray] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const playChime = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.4;
      audio.play().catch(e => console.log('Audio playback blocked by browser/interaction policy'));
    } catch (err) {
      console.error('Sound play error:', err);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.notifications.list();
        setNotifications(res.data);
        setUnreadNotifications(res.unreadCount);
      } catch (err) { console.error('Failed to fetch notifications:', err); }
    };

    let currentUser = null;
    const stored = localStorage.getItem('user');
    if (stored && stored !== 'undefined') {
      try {
        currentUser = JSON.parse(stored);
        setUser(currentUser);
      } catch (e) {
        console.error('Failed to parse user from storage');
      }
    }

    if (currentUser) {
      fetchNotifications();
      
      // Connect Socket.io
      if (!socket.connected) {
        socket.connect();
      }
      
      socket.emit('join_personal_room', currentUser._id);
      
      const handleNotification = (data) => {
        playChime();
        toast.custom((t) => (
          <div style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{data.title}</h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{data.message}</p>
          </div>
        ), { duration: 5000, position: 'top-right' });
        
        setNotifications(prev => [data, ...prev].slice(0, 50));
        setUnreadNotifications(prev => prev + 1);
      };

      const handleChatMessage = (message) => {
        if (message.sender._id === currentUser._id || message.sender === currentUser._id) return;
        playChime();
        toast.custom((t) => (
          <div 
            onClick={() => {
              toast.dismiss(t.id);
              const dashboardPath = currentUser.role === 'caregiver' ? '/dashboard/caregiver' : '/dashboard';
              router.push(`${dashboardPath}?openChat=${message.booking._id}`);
            }}
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', 
              padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', 
              borderLeft: '4px solid var(--terracotta-500)', display: 'flex', gap: '12px', alignItems: 'center',
              cursor: 'pointer', transition: 'transform 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {message.sender.name?.[0]}
            </div>
            <div>
              <h4 style={{ margin: '0 0 2px', color: 'var(--text-primary)', fontSize: '0.9rem' }}>New Message from {message.sender.name}</h4>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{message.text.substring(0, 40)}{message.text.length > 40 ? '...' : ''}</p>
            </div>
          </div>
        ), { duration: 6000, position: 'top-right' });
        
        setUnreadNotifications(prev => prev + 1);
        setHasNewMessages(true);
      };

      socket.on('notification', handleNotification);
      socket.on('new_chat_message', handleChatMessage);

      // 1. Alert user if Email is not verified (on every sign-in/mount)
      if (!currentUser.isEmailVerified && !pathname.includes('/auth')) {
        setTimeout(() => {
          toast.custom((t) => (
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.98)', padding: '20px', borderRadius: '16px', 
              boxShadow: 'var(--shadow-2xl)', border: '1px solid var(--terracotta-200)',
              display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center',
              animation: 'fadeInUp 0.5s ease', maxWidth: '400px'
            }}>
              <div style={{ fontSize: '2rem' }}>📧</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Email Verification Needed</h4>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Please verify your account to ensure full access and security.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <button onClick={() => toast.dismiss(t.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}>Later</button>
                <button 
                  onClick={() => { toast.dismiss(t.id); router.push('/auth?mode=verify'); }} 
                  style={{ background: 'var(--primary)', color: 'white', padding: '6px 14px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Verify Now
                </button>
              </div>
            </div>
          ), { duration: 8000, position: 'bottom-center', id: 'verify-email-prompt' });
        }, 1500);
      }

      return () => {
        socket.off('notification', handleNotification);
        socket.off('new_chat_message', handleChatMessage);
        socket.disconnect();
      };
    }
  }, [pathname, router]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    if (socket.connected) socket.disconnect();
    window.location.href = '/';
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadNotifications(0);
    } catch (err) { console.error(err); }
  };

  const handleNotifClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.notifications.markRead(notif._id || notif.id);
        setNotifications(prev => prev.map(n => (n._id === notif._id || n.id === notif.id) ? { ...n, isRead: true } : n));
        setUnreadNotifications(prev => Math.max(0, prev - 1));
      } catch (err) { console.error(err); }
    }
    setShowNotifTray(false);
    
    if (notif.metadata?.bookingId) {
      const path = user?.role === 'caregiver' ? '/dashboard/caregiver' : '/dashboard';
      router.push(path);
    } else if (notif.type === 'VETTING_REQUIRED') {
      router.push('/dashboard/admin/vetting');
    }
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/caregivers', label: 'Find Caregivers' },
    { href: '/book', label: 'Book Care' },
    { href: user?.role === 'admin' ? '/dashboard/admin' : (user?.role === 'caregiver' ? '/dashboard/caregiver' : '/dashboard/patient'), label: 'Dashboard', hasDot: hasNewMessages },
  ];

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? 'rgba(253,248,243,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'all 0.35s var(--ease-smooth)',
        boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
      }}>
        <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height: 72 }}>
          {/* Logo */}
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--primary), var(--terracotta-700))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, boxShadow: '0 4px 12px rgba(196,105,78,0.35)',
            }}>🌿</div>
            <span style={{ fontFamily:'var(--font-serif)', fontSize:'1.375rem', fontWeight:700, color:'var(--text-primary)' }}>
              Care<span style={{ color:'var(--primary)' }}>Nest</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }} className="desktop-nav">
            {navLinks.map(({ href, label, hasDot }) => (
              <Link key={href} href={href} style={{
                padding:'8px 18px', borderRadius:'var(--radius-full)',
                fontWeight: 500, fontSize:'0.9375rem',
                color: pathname === href ? 'var(--primary)' : 'var(--text-secondary)',
                background: pathname === href ? 'var(--terracotta-50)' : 'transparent',
                transition: 'var(--transition)',
                position: 'relative'
              }}
              onClick={() => { if(hasDot) setHasNewMessages(false); }}
              onMouseEnter={e => { if(pathname !== href) { e.target.style.color='var(--text-primary)'; e.target.style.background='var(--cream-200)'; }}}
              onMouseLeave={e => { if(pathname !== href) { e.target.style.color='var(--text-secondary)'; e.target.style.background='transparent'; }}}
              >
                {label}
                {hasDot && <span style={{ position:'absolute', top:6, right:10, width:6, height:6, background:'var(--primary)', borderRadius:'50%', border:'1px solid white' }}></span>}
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {user ? (
              <>
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={() => setShowNotifTray(!showNotifTray)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', fontSize: '1.25rem', padding: '8px', marginRight: '8px', color: 'var(--text-primary)' }}
                  >
                    🔔
                    {unreadNotifications > 0 && (
                      <span style={{ 
                        position: 'absolute', top: 6, right: 6, background: 'var(--primary)', color: 'white', 
                        fontSize: '0.65rem', fontWeight: '800', width: '18px', height: '18px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                        border: '2px solid white', boxShadow: 'var(--shadow-sm)'
                      }}>
                        {unreadNotifications}
                      </span>
                    )}
                  </button>

                  {/* NOTIFICATION TRAY */}
                  {showNotifTray && (
                    <div className="notif-tray" style={{ 
                      position: 'absolute', top: '100%', right: 0, width: '320px', 
                      maxHeight: '400px', background: 'rgba(255, 255, 255, 0.98)', 
                      backdropFilter: 'blur(20px)', borderRadius: 'var(--radius-xl)', 
                      boxShadow: 'var(--shadow-2xl)', border: '1px solid var(--border)', 
                      display: 'flex', flexDirection: 'column', zIndex: 1001,
                      marginTop: '12px', overflow: 'hidden', animation: 'fadeInUp 0.3s ease'
                    }}>
                      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--cream-50)' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
                        {unreadNotifications > 0 && (
                          <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Mark all as read</button>
                        )}
                      </div>
                      <div style={{ overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n, i) => (
                            <div 
                              key={n._id || i} 
                              onClick={() => handleNotifClick(n)}
                              style={{ 
                                padding: '12px 16px', borderBottom: '1px solid var(--border)', 
                                cursor: 'pointer', background: !n.isRead ? 'rgba(188, 108, 92, 0.03)' : 'transparent',
                                transition: 'var(--transition)'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--cream-100)'}
                              onMouseLeave={e => e.currentTarget.style.background = !n.isRead ? 'rgba(188, 108, 92, 0.03)' : 'transparent'}
                            >
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '4px' }}>
                                {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', marginTop: 4, flexShrink: 0 }} />}
                                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{n.title}</span>
                              </div>
                              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>{n.message}</p>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>{new Date(n.createdAt).toLocaleString()}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 14px', borderRadius:'var(--radius-full)', background:'var(--terracotta-50)', border:'1px solid var(--terracotta-200)' }}>
                  <div className="avatar" style={{ 
                    width:30, height:30, fontSize:'0.875rem', background:'var(--primary)', color:'#fff', border:'none',
                    backgroundImage: user.avatar ? `url(${user.avatar})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}>
                    {!user.avatar && (user.name?.[0]?.toUpperCase())}
                  </div>
                  <span style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-primary)' }}>{user.name?.split(' ')[0]}</span>
                </div>
                <button onClick={logout} className="btn btn-ghost btn-sm">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/auth" className="btn btn-ghost btn-sm">Sign In</Link>
                <Link href="/auth?mode=register" className="btn btn-primary btn-sm">Get Started</Link>
              </>
            )}
            {/* Mobile menu toggle */}
            <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)} style={{ display:'none', background:'none', border:'none', padding:8, color:'var(--text-primary)', fontSize:'1.5rem' }}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className="mobile-menu" style={{
        position:'fixed', top:72, left:0, right:0, zIndex:999,
        background:'var(--warm-white)', borderBottom:'1px solid var(--border)',
        padding:'var(--space-4)', display: menuOpen ? 'flex' : 'none',
        flexDirection:'column', gap:'var(--space-2)',
        boxShadow:'var(--shadow-lg)',
        animation: menuOpen ? 'fadeInUp 0.2s ease' : undefined,
      }}>
        {navLinks.map(({ href, label }) => (
          <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{
            padding:'12px 20px', borderRadius:'var(--radius-md)',
            fontWeight:500, color: pathname === href ? 'var(--primary)' : 'var(--text-primary)',
            background: pathname === href ? 'var(--terracotta-50)' : 'transparent',
          }}>{label}</Link>
        ))}
        {!user && <Link href="/auth" className="btn btn-primary" style={{ marginTop:8 }} onClick={() => setMenuOpen(false)}>Get Started</Link>}
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
