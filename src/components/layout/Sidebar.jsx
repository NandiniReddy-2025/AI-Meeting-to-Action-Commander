import React from 'react';
import { 
  Home, 
  PlusCircle, 
  FolderKanban, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMeetings } from '../../context/MeetingContext';

// Meeting Intelligence Emblem: Conversation + Waveform + Action Node
function MeetingIntelligenceLogo() {
  return (
    <div style={{
      width: '34px',
      height: '34px',
      borderRadius: 'var(--radius-sm)',
      backgroundColor: 'var(--accent-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: 'var(--shadow-xs)'
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Conversation speech outline with waveform and check node */}
        <path d="M4 6.5C4 4.567 5.567 3 7.5 3H16.5C18.433 3 20 4.567 20 6.5V13.5C20 15.433 18.433 17 16.5 17H8L4 21V6.5Z" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Waveform bars inside conversation */}
        <path d="M8 10V10.01M11 8.5V11.5M14 7V13M17 9.5V10.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function Sidebar({ activePage, setActivePage, isMobileOpen, setIsMobileOpen }) {
  const { user, logout } = useAuth();
  const { setCurrentStep } = useMeetings();

  const navItems = [
    { id: 'home', label: 'HOME', icon: Home },
    { id: 'new-transcript', label: 'NEW TRANSCRIPT', icon: PlusCircle, isCTA: true },
    { id: 'my-meetings', label: 'MY MEETINGS', icon: FolderKanban },
    { id: 'calendar', label: 'CALENDAR', icon: Calendar },
    { id: 'reports', label: 'MEETING INSIGHTS', icon: BarChart3 },
    { id: 'settings', label: 'SETTINGS', icon: Settings },
  ];

  const handleNavClick = (id) => {
    setActivePage(id);
    if (id === 'new-transcript') {
      setCurrentStep('idle');
    }
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 27, 61, 0.45)',
            zIndex: 40,
            display: 'block'
          }}
        />
      )}

      <aside style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        transform: isMobileOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.25s ease',
        boxShadow: isMobileOpen ? 'var(--shadow-lg)' : 'none'
      }} className={isMobileOpen ? 'sidebar-open' : 'sidebar-desktop'}>
        
        {/* Brand Header */}
        <div style={{
          padding: '1.25rem 1.25rem',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div 
            onClick={() => handleNavClick('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          >
            <MeetingIntelligenceLogo />
            <div>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em', lineHeight: 1.2 }}>
                ACTIONCOMMANDER
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '-0.01em' }}>
                AI Meeting Intelligence
              </div>
            </div>
          </div>

          {/* Close for mobile */}
          {setIsMobileOpen && (
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="btn-ghost"
              style={{ padding: '0.25rem', display: 'none' }}
              id="mobile-close-sidebar-btn"
              aria-label="Close Sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id || (item.id === 'reports' && activePage === 'reports');

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  backgroundColor: isActive 
                    ? 'var(--bg-secondary)' 
                    : 'transparent',
                  color: isActive 
                    ? 'var(--text-primary)' 
                    : 'var(--text-body)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.82rem',
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-card-subtle)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-body)';
                  }
                }}
              >
                <Icon size={16} color={isActive ? 'var(--text-primary)' : 'var(--text-muted)'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.isCTA && (
                  <span style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    padding: '0.1rem 0.4rem',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-secondary)'
                  }}>
                    +
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout (Nandini, Team Lead) */}
        <div style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid var(--border-light)',
          backgroundColor: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <img 
              src={user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'} 
              alt={user?.name || 'Nandini'} 
              style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-light)' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Nandini'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.role || 'Team Lead'}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              padding: '0.45rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              backgroundColor: '#FFFFFF',
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
