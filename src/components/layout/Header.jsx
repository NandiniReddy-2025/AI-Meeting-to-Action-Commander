import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Menu, 
  ChevronDown, 
  User, 
  Sliders, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  Search,
  Command
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMeetings } from '../../context/MeetingContext';

export default function Header({ onMobileMenuToggle, setActivePage }) {
  const { user, logout } = useAuth();
  const { meetings, selectMeeting } = useMeetings();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);

  const notifRef = useRef(null);
  const userRef = useRef(null);
  const searchRef = useRef(null);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Action Item Completed',
      desc: 'Rahul Mehta marked "Complete login page" as Completed.',
      time: '12m ago',
      type: 'success',
      read: false
    },
    {
      id: 2,
      title: 'High Risk Detected',
      desc: 'API dependency risk identified in Website Project Launch.',
      time: '1h ago',
      type: 'risk',
      read: false
    },
    {
      id: 3,
      title: 'Follow-up Email Drafted',
      desc: 'Ready-to-send draft prepared for Product Roadmap sync.',
      time: '3h ago',
      type: 'ai',
      read: true
    }
  ]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('global-search-input');
        if (input) input.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const filteredMeetings = searchQuery.trim()
    ? meetings.filter(m => 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sourceType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.analysis?.actionItems?.some(a => a.task.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <header style={{
      height: 'var(--header-height)',
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2.25rem',
      position: 'sticky',
      top: 0,
      zIndex: 30
    }}>
      {/* Left: Mobile Toggle & Global Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, maxWidth: '640px' }}>
        <button
          onClick={onMobileMenuToggle}
          className="btn-ghost"
          style={{ padding: '0.45rem', display: 'none' }}
          id="header-mobile-toggle"
          aria-label="Open Navigation Menu"
        >
          <Menu size={20} color="var(--text-primary)" />
        </button>

        {/* Search Bar with ⌘ K shortcut */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }} ref={searchRef}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '0.45rem 0.85rem',
            gap: '0.6rem',
            transition: 'all 0.15s ease'
          }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              id="global-search-input"
              type="text"
              placeholder="Search meetings, transcripts, or ask a question..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                width: '100%'
              }}
            />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              padding: '0.15rem 0.4rem',
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
              flexShrink: 0
            }}>
              <span>⌘</span>
              <span>K</span>
            </div>
          </div>

          {/* Quick Search Dropdown */}
          {showSearchResults && searchQuery.trim().length > 0 && (
            <div style={{
              position: 'absolute',
              top: '42px',
              left: 0,
              right: 0,
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-lg)',
              padding: '0.5rem',
              zIndex: 100,
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {filteredMeetings.length > 0 ? (
                filteredMeetings.map(m => (
                  <div
                    key={m.id}
                    onClick={() => {
                      selectMeeting(m);
                      setActivePage('results');
                      setShowSearchResults(false);
                      setSearchQuery('');
                    }}
                    style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background-color 0.1s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-subtle)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {m.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {m.sourceType} • {m.date} • {m.duration}
                      </div>
                    </div>
                    <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                      {m.analysis?.actionItems?.length || 0} tasks
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '0.85rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  No matching meetings or transcripts found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Notifications & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        
        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.15s ease',
              color: 'var(--text-secondary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-medium)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-light)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '7px',
                right: '7px',
                width: '6px',
                height: '6px',
                backgroundColor: 'var(--accent-primary)',
                borderRadius: '50%'
              }} />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '46px',
              width: '340px',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-lg)',
              padding: '0.85rem',
              zIndex: 100
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Notifications ({unreadCount})
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '260px', overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{
                    padding: '0.55rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: n.read ? '#FFFFFF' : 'var(--bg-card-subtle)',
                    border: '1px solid',
                    borderColor: n.read ? 'transparent' : 'var(--border-light)',
                    display: 'flex',
                    gap: '0.6rem'
                  }}>
                    <div style={{ marginTop: '2px' }}>
                      {n.type === 'success' && <CheckCircle2 size={15} color="#059669" />}
                      {n.type === 'risk' && <AlertTriangle size={15} color="#DC2626" />}
                      {n.type === 'ai' && <Sparkles size={15} color="var(--text-primary)" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-body)', marginTop: '2px' }}>{n.desc}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-light)', marginTop: '3px' }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Trigger & Dropdown (Nandini) */}
        <div style={{ position: 'relative' }} ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-light)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-medium)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
          >
            <img 
              src={user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'} 
              alt={user?.name || 'Nandini'} 
              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ textAlign: 'left', display: 'none' }} className="user-name-label">
              <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {user?.name || 'Nandini'}
              </span>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {/* User Profile Menu */}
          {showUserMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '46px',
              width: '220px',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-lg)',
              padding: '0.4rem',
              zIndex: 100
            }}>
              <div style={{ padding: '0.6rem 0.65rem 0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.name || 'Nandini'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {user?.email || 'nandini@commander.ai'}
                </div>
              </div>

              <div style={{ padding: '0.3rem 0' }}>
                <button
                  onClick={() => { setActivePage('settings'); setShowUserMenu(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-body)',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <User size={15} color="var(--text-muted)" />
                  <span>Profile Settings</span>
                </button>

                <button
                  onClick={() => { setActivePage('settings'); setShowUserMenu(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-body)',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Sliders size={15} color="var(--text-muted)" />
                  <span>AI & Preferences</span>
                </button>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.3rem' }}>
                <button
                  onClick={() => { logout(); setShowUserMenu(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#DC2626',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={15} color="#DC2626" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
