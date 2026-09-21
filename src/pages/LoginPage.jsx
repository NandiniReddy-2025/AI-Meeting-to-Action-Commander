import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function MeetingIntelligenceLogo() {
  return (
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: 'var(--radius-sm)',
      backgroundColor: 'var(--accent-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: 'var(--shadow-xs)'
    }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6.5C4 4.567 5.567 3 7.5 3H16.5C18.433 3 20 4.567 20 6.5V13.5C20 15.433 18.433 17 16.5 17H8L4 21V6.5Z" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 10V10.01M11 8.5V11.5M14 7V13M17 9.5V10.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function LoginPage() {
  const { login, signup, oauthLogin, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('nandini@commander.ai');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (isSignUp) {
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    }
  };

  const handleOAuth = async (provider) => {
    setErrorMsg('');
    try {
      await oauthLogin(provider);
    } catch (err) {
      setErrorMsg(`Failed to authenticate with ${provider}.`);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem'
    }}>
      
      {/* Brand Icon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '2rem'
      }}>
        <MeetingIntelligenceLogo />
        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em', lineHeight: 1.1 }}>
            ACTIONCOMMANDER
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            AI Meeting Intelligence Workspace
          </div>
        </div>
      </div>

      {/* Auth Card */}
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.25rem' }}>
        
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            {isSignUp ? 'Start transforming meetings into actions.' : 'Log in to access your meeting intelligence.'}
          </p>
        </div>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            fontSize: '0.82rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isSignUp && (
            <div>
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} color="var(--text-light)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nandini"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '2.35rem' }}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} color="var(--text-light)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                className="form-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.35rem' }}
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color="var(--text-light)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.35rem' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.92rem' }}
            disabled={loading}
          >
            <span>{loading ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In →'}</span>
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          margin: '1.25rem 0'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }} />
        </div>

        {/* Mock SSO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => handleOAuth('Google Workspace')}
            className="btn-secondary"
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
          >
            <span>Continue with Google Workspace</span>
          </button>
          <button
            type="button"
            onClick={() => handleOAuth('Microsoft 365')}
            className="btn-secondary"
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
          >
            <span>Continue with Microsoft 365</span>
          </button>
        </div>

        {/* Toggle sign up / login */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {isSignUp ? (
            <span>Already have an account? <button type="button" onClick={() => setIsSignUp(false)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer' }}>Sign In</button></span>
          ) : (
            <span>Don't have an account? <button type="button" onClick={() => setIsSignUp(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer' }}>Sign Up</button></span>
          )}
        </div>

      </div>

    </div>
  );
}
