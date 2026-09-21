import React, { useState } from 'react';
import { 
  User, 
  Sliders, 
  Video, 
  Check, 
  Save, 
  LogOut,
  Bell,
  Sparkles,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMeetings } from '../context/MeetingContext';

export default function SettingsPage() {
  const { user, updateProfile, logout } = useAuth();
  const { showToast } = useMeetings();

  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'ai' | 'preferences' | 'notifications'

  // Profile Form State
  const [name, setName] = useState(user?.name || 'Nandini');
  const [email, setEmail] = useState(user?.email || 'nandini@commander.ai');
  const [role, setRole] = useState(user?.role || 'Team Lead');
  const [avatar, setAvatar] = useState(user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80');

  // AI Form State
  const [aiModel, setAiModel] = useState(user?.settings?.aiModel || 'gemini-2.5-flash');
  const [geminiApiKey, setGeminiApiKey] = useState(user?.settings?.geminiApiKey || '');
  const [temperature, setTemperature] = useState(user?.settings?.temperature || 0.2);

  // Integrations State
  const [integrations, setIntegrations] = useState(user?.settings?.integrations || {
    googleMeet: { connected: true, botName: 'ActionCommander AI' },
    microsoftTeams: { connected: true, botName: 'ActionCommander Bot' },
    zoom: { connected: true, botName: 'ActionCommander Assistant' },
    youtube: { connected: true, status: 'Active' },
  });

  // Notification toggles
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile({ name, email, role, avatar });
    showToast('Account profile updated successfully!');
  };

  const handleSaveAI = (e) => {
    e.preventDefault();
    updateProfile({
      settings: {
        ...user?.settings,
        aiModel,
        geminiApiKey,
        temperature: parseFloat(temperature),
        integrations
      }
    });
    showToast('AI and workspace preferences saved!');
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-light)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          Settings & Workspace
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
          Manage your account profile, AI reasoning preferences, meeting integrations, and alerts.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '2px', overflowX: 'auto' }}>
        {[
          { id: 'account', label: 'Account', icon: User },
          { id: 'ai', label: 'AI Intelligence Engine', icon: Sliders },
          { id: 'preferences', label: 'Meeting Preferences & Bots', icon: Video },
          { id: 'notifications', label: 'Notifications', icon: Bell }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.65rem 0.95rem',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                backgroundColor: 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={15} color={isActive ? 'var(--text-primary)' : 'var(--text-muted)'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ACCOUNT PROFILE */}
      {activeTab === 'account' && (
        <form onSubmit={handleSaveProfile} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-light)' }}>
            <img 
              src={avatar} 
              alt={name} 
              style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-light)' }} 
            />
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{name}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{role}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

            <div>
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div>
              <label className="form-label">Role / Title</label>
              <input 
                type="text" 
                className="form-input" 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                required 
              />
            </div>

            <div>
              <label className="form-label">Avatar Image URL</label>
              <input 
                type="url" 
                className="form-input" 
                value={avatar} 
                onChange={(e) => setAvatar(e.target.value)} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
            <button type="submit" className="btn-primary" style={{ padding: '0.65rem 1.4rem' }}>
              <Save size={15} />
              <span>Save Account Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: AI REASONING */}
      {activeTab === 'ai' && (
        <form onSubmit={handleSaveAI} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              AI Intelligence Engine Configuration
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Configure precision reasoning models for decision extraction, action item parsing, and risk scoring.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="form-label">AI Model</label>
              <select 
                className="form-select"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Ultra Low Latency)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Structured Analysis)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Standard)</option>
              </select>
            </div>

            <div>
              <label className="form-label">Gemini API Key (Optional Override)</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="AIzaSy... (Leave blank to use system default)"
                value={geminiApiKey} 
                onChange={(e) => setGeminiApiKey(e.target.value)} 
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                If provided, analysis will use your personal quota. Otherwise, ActionCommander internal engine handles processing.
              </p>
            </div>

            <div>
              <label className="form-label">Reasoning Temperature ({temperature})</label>
              <input 
                type="range" 
                min="0.0" 
                max="1.0" 
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>0.0 (Strict & Deterministic)</span>
                <span>0.5 (Balanced)</span>
                <span>1.0 (Creative)</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
            <button type="submit" className="btn-primary" style={{ padding: '0.65rem 1.4rem' }}>
              <Save size={15} />
              <span>Save AI Preferences</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: MEETING PREFERENCES & BOTS */}
      {activeTab === 'preferences' && (
        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Supported Meeting Platforms & Connectors
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Integrated bot engines for automated transcription ingestion.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { name: 'Google Meet', status: 'Connected', desc: 'Auto-join and transcribe via ActionCommander AI participant.' },
              { name: 'Microsoft Teams', status: 'Connected', desc: 'Teams bot integration active with multi-speaker audio capture.' },
              { name: 'Zoom Meetings', status: 'Connected', desc: 'Zoom API & assistant bridge verified.' },
              { name: 'YouTube Video Ingestion', status: 'Active', desc: 'Instant transcript parser & captions extractor.' },
            ].map((p, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {p.desc}
                  </div>
                </div>

                <span className="badge badge-completed">
                  <Check size={12} /> {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Email & Digest Preferences
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Control when follow-up summaries and task completion notices are sent.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={emailNotifications} 
                onChange={(e) => setEmailNotifications(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
              />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Email Action Item Summaries
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Send an automatic draft email upon meeting transcript completion.
                </div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={dailyDigest} 
                onChange={(e) => setDailyDigest(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
              />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Daily Sprint & Milestone Digest
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Receive a morning briefing of upcoming deadlines and pending tasks.
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

    </div>
  );
}
