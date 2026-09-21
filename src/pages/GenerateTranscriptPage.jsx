import React, { useState, useEffect } from 'react';
import { 
  Link2, 
  Video, 
  Youtube, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Info,
  Radio,
  Clock,
  RefreshCw,
  ArrowRight,
  CheckSquare
} from 'lucide-react';
import { useMeetings } from '../context/MeetingContext';

// Minimal Decorative Visual: Conversation Waveform → AI Intelligence → Action
function WorkflowWaveformEmblem() {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.35rem 0.75rem',
      backgroundColor: 'var(--brand-navy-subtle)',
      borderRadius: 'var(--radius-full)',
      border: '1px solid var(--border-light)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <div style={{ width: '2px', height: '6px', backgroundColor: 'var(--accent-primary)', borderRadius: '1px' }} />
        <div style={{ width: '2px', height: '12px', backgroundColor: 'var(--accent-primary)', borderRadius: '1px' }} />
        <div style={{ width: '2px', height: '8px', backgroundColor: 'var(--accent-primary)', borderRadius: '1px' }} />
        <div style={{ width: '2px', height: '14px', backgroundColor: 'var(--accent-primary)', borderRadius: '1px' }} />
        <div style={{ width: '2px', height: '10px', backgroundColor: 'var(--accent-primary)', borderRadius: '1px' }} />
      </div>
      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent-primary)', letterSpacing: '0.02em' }}>
        Conversation → AI Understanding → Actionable Insights
      </span>
    </div>
  );
}

export default function GenerateTranscriptPage({ onStartProcessing }) {
  const { 
    processMeetingLink, 
    error, 
    setError,
    activeSourceTab,
    setActiveSourceTab,
    selectedLivePlatform,
    setSelectedLivePlatform,
    meetingUrl,
    setMeetingUrl,
    youtubeUrl,
    setYoutubeUrl,
    activeBotSession,
    setActiveBotSession,
    checkBotStatus,
    completeLiveMeeting
  } = useMeetings();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [skribbyReady, setSkribbyReady] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const isYouTube = activeSourceTab === 'youtube';
  const isMeeting = activeSourceTab === 'meeting' || !isYouTube;

  // Check backend environment status on load
  useEffect(() => {
    fetch('/api/health/env-status')
      .then(res => res.json())
      .then(data => {
        if (data && data.skribbyConfigured) {
          setSkribbyReady(true);
        }
      })
      .catch(() => setSkribbyReady(false));
  }, []);

  // Background polling for active bot session (every 6 seconds)
  useEffect(() => {
    if (!activeBotSession || !activeBotSession.botId) return;

    // Do not poll if finished or permanently failed
    if (activeBotSession.status === 'finished') return;

    const interval = setInterval(async () => {
      try {
        await checkBotStatus(activeBotSession.botId);
      } catch (_) {}
    }, 6000);

    return () => clearInterval(interval);
  }, [activeBotSession, checkBotStatus]);

  // Quick Verified Sample Presets for Testing
  const samplePresets = {
    youtube: [
      {
        title: 'Masterclass Presentation & Architecture Stream',
        url: 'https://youtu.be/3JZ_D3ELwOQ',
        badge: 'Verified CC'
      },
      {
        title: 'Tech Keynote & Product Roadmap Session',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        badge: 'Verified CC'
      },
      {
        title: 'Engineering Sprint & Cloud Infrastructure Walkthrough',
        url: 'https://www.youtube.com/watch?v=kXYiU_JCYtU',
        badge: 'Verified CC'
      }
    ],
    meeting: [
      {
        platform: 'Google Meet',
        title: 'Website Project Launch & API Review',
        url: 'https://meet.google.com/abc-defg-hij',
        badge: 'Bot Engine'
      },
      {
        platform: 'Microsoft Teams',
        title: 'Engineering Sprint Planning',
        url: 'https://teams.microsoft.com/l/meetup-join/19_eng_sprint_2026',
        badge: 'Bot Engine'
      },
      {
        platform: 'Zoom',
        title: 'Q4 Product Strategy Alignment',
        url: 'https://zoom.us/j/9842109841',
        badge: 'Bot Engine'
      }
    ]
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const targetUrl = isYouTube ? youtubeUrl.trim() : meetingUrl.trim();

    if (!targetUrl) {
      setError(isYouTube ? 'Please enter a valid YouTube video link.' : `Please enter a valid ${selectedLivePlatform} meeting link.`);
      return;
    }

    // Basic URL validation
    if (!/^https?:\/\//i.test(targetUrl)) {
      setError('Please enter a valid meeting or video link starting with http:// or https://');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      if (isYouTube && onStartProcessing) {
        onStartProcessing();
      }

      await processMeetingLink(targetUrl, {
        source: isYouTube ? 'youtube' : 'live-meeting',
        platform: isYouTube ? 'YouTube' : selectedLivePlatform
      });

    } catch (err) {
      console.error('Transcript generation error:', err);
      setError(err.message || 'Unable to process the meeting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualStatusCheck = async () => {
    if (!activeBotSession?.botId) return;
    setIsCheckingStatus(true);
    try {
      await checkBotStatus(activeBotSession.botId);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleCompleteMeeting = async () => {
    if (!activeBotSession?.botId) return;
    setIsCompleting(true);
    setError(null);
    try {
      if (onStartProcessing) onStartProcessing();
      await completeLiveMeeting(
        activeBotSession.botId, 
        activeBotSession.platform || selectedLivePlatform, 
        activeBotSession.meetingUrl || meetingUrl
      );
    } catch (err) {
      setError(err.message || 'Failed to complete meeting transcript.');
    } finally {
      setIsCompleting(false);
    }
  };

  // Content & messaging dynamically driven by the Skribby bot lifecycle
  const getBotStatusDetails = (status) => {
    const s = (status || 'joining').toLowerCase();

    if (s === 'finished' || s === 'done') {
      return {
        title: 'Transcript ready. Your meeting transcript and insights are now available.',
        message: 'Your meeting has ended and the transcript has been processed. Click below to view the transcript, key decisions, action items, and AI insights.',
        statusLabel: 'Transcript ready',
        badgeClass: 'badge-completed',
        bg: '#F0FDF4',
        border: '#BBF7D0',
        textColor: '#166534',
        bodyColor: '#15803D',
        dotColor: '#10B981',
        icon: CheckCircle2,
        isFinished: true
      };
    }

    if (s === 'leaving' || s === 'processing' || s === 'transcribing') {
      return {
        title: 'Meeting ended. Your conversation is now being processed.',
        message: 'Your meeting session has concluded. Audio is now being transcribed and processed into structured insights.',
        statusLabel: 'Processing transcript...',
        badgeClass: 'badge-pending',
        bg: 'var(--brand-navy-subtle)',
        border: 'var(--border-light)',
        textColor: 'var(--text-primary)',
        bodyColor: 'var(--text-body)',
        dotColor: '#D97706',
        icon: Info,
        isProcessing: true
      };
    }

    if (s === 'recording' || s === 'in_call' || s === 'active') {
      return {
        title: 'Meeting transcription in progress.',
        message: 'The AI meeting bot is actively recording the meeting conversation. You can continue with your meeting. Once the meeting ends, the transcript and meeting insights will be generated automatically.',
        statusLabel: 'Recording meeting...',
        badgeClass: 'badge-pending',
        bg: 'var(--brand-navy-subtle)',
        border: 'var(--border-light)',
        textColor: 'var(--text-primary)',
        bodyColor: 'var(--text-body)',
        dotColor: '#2563EB',
        icon: Info,
        isRecording: true
      };
    }

    if (s === 'not_admitted' || s === 'auth_required' || s === 'failed' || s === 'error') {
      return {
        title: 'Meeting bot could not join.',
        message: 'The bot was not admitted to the meeting room or authentication was required. Please ensure guest access is enabled in your meeting settings and try again.',
        statusLabel: 'Bot not admitted / Connection failed',
        badgeClass: 'badge-risk',
        bg: '#FEF2F2',
        border: '#FECACA',
        textColor: '#991B1B',
        bodyColor: '#B91C1C',
        dotColor: '#DC2626',
        icon: AlertCircle,
        isError: true
      };
    }

    // Default: booting / joining
    return {
      title: 'Meeting transcription has started.',
      message: 'The AI meeting bot is joining your meeting and will capture the conversation while the meeting is in progress. The full transcript will be generated after the meeting ends and processing is complete.\n\nYou can continue with your meeting. Once the meeting ends, the transcript and meeting insights will be generated automatically.',
      statusLabel: 'Joining meeting...',
      badgeClass: 'badge-pending',
      bg: 'var(--brand-navy-subtle)',
      border: 'var(--border-light)',
      textColor: 'var(--text-primary)',
      bodyColor: 'var(--text-body)',
      dotColor: '#475569',
      icon: Info,
      isJoining: true
    };
  };

  const botDetails = activeBotSession ? getBotStatusDetails(activeBotSession.status) : null;

  return (
    <div style={{ maxWidth: '940px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
      
      {/* 1. Page Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.45rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em',
            lineHeight: 1.2
          }}>
            GENERATE NEW TRANSCRIPT
          </h1>
          <WorkflowWaveformEmblem />
        </div>

        <p style={{
          fontSize: '0.96rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5
        }}>
          Turn a meeting conversation into a transcript and actionable AI insights.
        </p>

        {/* Subtle Horizontal Divider */}
        <div style={{ borderBottom: '1px solid var(--border-light)', marginTop: '1.25rem' }} />
      </div>

      {/* 2. Operational Failure Alert Banner (Shown clearly whenever an error occurs) */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#991B1B',
          fontSize: '0.88rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
            <AlertCircle size={18} color="#DC2626" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div style={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}>
              {error}
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#991B1B',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              flexShrink: 0
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Two Large Controlled Source Selection Cards */}
      <div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.25rem'
        }}>
          
          {/* OPTION 1: YouTube Video Card */}
          <div
            onClick={() => { setActiveSourceTab('youtube'); setError(null); }}
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              border: isYouTube 
                ? '2px solid var(--accent-primary)' 
                : '1px solid var(--border-light)',
              backgroundColor: isYouTube 
                ? 'var(--bg-card-subtle)' 
                : '#FFFFFF',
              boxShadow: isYouTube ? 'var(--shadow-md)' : 'var(--shadow-xs)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem',
              transition: 'all 0.15s ease',
              position: 'relative'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isYouTube ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  color: isYouTube ? '#FFFFFF' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Youtube size={20} />
                </div>
                <span className="badge badge-completed" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                  INSTANT
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                YouTube Video
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Generate a transcript from a public YouTube video.
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: isYouTube ? 'var(--accent-primary)' : 'var(--text-light)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isYouTube ? '#059669' : 'transparent',
                border: isYouTube ? 'none' : '1px solid var(--border-medium)'
              }} />
              <span>{isYouTube ? 'Selected Source' : 'Click to select'}</span>
            </div>
          </div>

          {/* OPTION 2: Live Meeting Card */}
          <div
            onClick={() => { setActiveSourceTab('meeting'); setError(null); }}
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              border: isMeeting 
                ? '2px solid var(--accent-primary)' 
                : '1px solid var(--border-light)',
              backgroundColor: isMeeting 
                ? 'var(--bg-card-subtle)' 
                : '#FFFFFF',
              boxShadow: isMeeting ? 'var(--shadow-md)' : 'var(--shadow-xs)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem',
              transition: 'all 0.15s ease',
              position: 'relative'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isMeeting ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  color: isMeeting ? '#FFFFFF' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Video size={20} />
                </div>
                <span className="badge badge-neutral" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                  BOT ENGINE
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Live Meeting
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Connect a supported live meeting for transcription.
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: isMeeting ? 'var(--accent-primary)' : 'var(--text-light)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isMeeting ? '#059669' : 'transparent',
                border: isMeeting ? 'none' : '1px solid var(--border-medium)'
              }} />
              <span>{isMeeting ? 'Selected Source' : 'Click to select'}</span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. MAIN INPUT & LIVE MEETING SECTION CARD */}
      <div className="card" style={{ padding: '2.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Subtle Live Meeting Initial Setup Notice (Shown inside card when no session is active) */}
        {isMeeting && !activeBotSession && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: skribbyReady ? '#F0FDF4' : 'var(--brand-navy-subtle)',
            border: skribbyReady ? '1px solid #BBF7D0' : '1px solid var(--border-light)'
          }}>
            <div style={{ marginTop: '2px', color: skribbyReady ? '#16A34A' : 'var(--accent-primary)', flexShrink: 0 }}>
              {skribbyReady ? <CheckCircle2 size={16} /> : <Info size={16} />}
            </div>
            <div style={{ fontSize: '0.82rem', color: skribbyReady ? '#15803D' : 'var(--text-body)', lineHeight: 1.45 }}>
              {skribbyReady 
                ? <><strong style={{ color: '#166534' }}>Skribby Bot Engine Ready:</strong> Google Meet, Microsoft Teams, and Zoom live transcription is active and configured.</>
                : <>Live Google Meet, Teams and Zoom transcription requires <code>SKRIBBY_API_KEY</code> in your .env file.</>}
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Header of Input Card */}
          <div>
            <label className="form-label" style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {isYouTube ? 'Enter YouTube Video URL' : 'Enter Meeting URL'}
            </label>
            
            {/* Live Meeting Platform Pills */}
            {isMeeting && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
                {['Google Meet', 'Microsoft Teams', 'Zoom'].map(platform => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => { setSelectedLivePlatform(platform); setError(null); }}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid',
                      borderColor: selectedLivePlatform === platform ? 'var(--accent-primary)' : 'var(--border-light)',
                      backgroundColor: selectedLivePlatform === platform ? 'var(--bg-secondary)' : '#FFFFFF',
                      color: selectedLivePlatform === platform ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            )}

            {/* Input Box with Icon */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center'
              }}>
                {isYouTube ? <Youtube size={19} /> : <Link2 size={19} />}
              </div>

              <input
                type="url"
                className="form-input"
                placeholder={isYouTube ? 'https://www.youtube.com/watch?v=...' : 'https://meet.google.com/...'}
                value={isYouTube ? youtubeUrl : meetingUrl}
                onChange={(e) => {
                  setError(null);
                  if (isYouTube) setYoutubeUrl(e.target.value);
                  else setMeetingUrl(e.target.value);
                }}
                style={{
                  padding: '0.85rem 1rem 0.85rem 2.75rem',
                  fontSize: '0.95rem',
                  borderRadius: 'var(--radius-md)',
                  borderColor: 'var(--border-medium)',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--text-primary)'
                }}
                required
              />
            </div>

            {/* Source Help Text */}
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.4 }}>
              {isYouTube 
                ? 'Supports YouTube video links, short links, talks, lectures and keynotes.' 
                : 'Supports Google Meet, Microsoft Teams and Zoom meeting links.'}
            </p>
          </div>

          {/* Preset Samples Collapsible for Instant Testing */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {isYouTube ? 'Sample Verified YouTube Videos:' : 'Sample Meeting Sessions:'}
              </span>
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--brand-slate)', fontWeight: 600, cursor: 'pointer' }}
              >
                {showPresets ? 'Hide Samples' : 'Show Samples'}
              </button>
            </div>

            {showPresets && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.5rem' }}>
                {(isYouTube ? samplePresets.youtube : samplePresets.meeting).map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setError(null);
                      if (isYouTube) {
                        setYoutubeUrl(preset.url);
                      } else {
                        setMeetingUrl(preset.url);
                        if (preset.platform) setSelectedLivePlatform(preset.platform);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      backgroundColor: 'var(--bg-card-subtle)',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      transition: 'background-color 0.1s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-subtle)'}
                  >
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {preset.title}
                    </span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                      {preset.badge}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Primary Generate Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: '0.8rem 1.6rem',
                fontSize: '0.92rem',
                letterSpacing: '0.01em'
              }}
              disabled={isSubmitting || (isYouTube ? !youtubeUrl.trim() : !meetingUrl.trim())}
              id="generate-transcript-submit-btn"
            >
              <Sparkles size={16} />
              <span>{isSubmitting ? 'Connecting Meeting Bot...' : 'Generate Transcript'}</span>
            </button>
          </div>

        </form>

        {/* 4b. INLINE LIVE MEETING TRANSCRIPTION STATUS PANEL (Positioned DIRECTLY below the Generate Transcript area) */}
        {isMeeting && activeBotSession && botDetails && (
          <div style={{
            marginTop: '1.25rem',
            padding: '1.35rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: botDetails.bg,
            border: `1px solid ${botDetails.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            transition: 'all 0.2s ease'
          }}>
            {/* Header & Status Pill */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#FFFFFF',
                  color: botDetails.textColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${botDetails.border}`,
                  flexShrink: 0
                }}>
                  <botDetails.icon size={18} />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: botDetails.textColor,
                    marginBottom: '0.2rem',
                    lineHeight: 1.3
                  }}>
                    {botDetails.title}
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Platform: {activeBotSession.platform || selectedLivePlatform} &bull; Bot ID: <code>{activeBotSession.botId}</code>
                  </div>
                </div>
              </div>

              {/* Status Badge & Manual Refresh */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${botDetails.border}`,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: botDetails.textColor
                }}>
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: botDetails.dotColor,
                    display: 'inline-block'
                  }} />
                  <span>Bot Status: {botDetails.statusLabel}</span>
                </div>

                {!botDetails.isFinished && (
                  <button
                    type="button"
                    onClick={handleManualStatusCheck}
                    disabled={isCheckingStatus}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.35rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--text-secondary)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    title="Check latest status from Skribby"
                  >
                    <RefreshCw size={12} className={isCheckingStatus ? 'animate-spin' : ''} />
                    <span>{isCheckingStatus ? 'Checking...' : 'Refresh'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Informational Message Body */}
            <div style={{
              fontSize: '0.86rem',
              color: botDetails.bodyColor,
              lineHeight: 1.55,
              whiteSpace: 'pre-line'
            }}>
              {botDetails.message}
            </div>

            {/* Footer Actions (View transcript when finished / Dismiss) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: `1px solid ${botDetails.border}`
            }}>
              <button
                type="button"
                onClick={() => setActiveBotSession(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Start New Meeting Session
              </button>

              {botDetails.isFinished && (
                <button
                  type="button"
                  onClick={handleCompleteMeeting}
                  disabled={isCompleting}
                  className="btn-primary"
                  style={{
                    padding: '0.6rem 1.35rem',
                    fontSize: '0.88rem',
                    backgroundColor: '#059669',
                    borderColor: '#059669'
                  }}
                >
                  <Sparkles size={15} />
                  <span>{isCompleting ? 'Generating AI Insights...' : 'View Transcript & AI Insights'}</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      {/* 5. "WHAT HAPPENS NEXT?" Visual Workflow Section */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 800,
          color: 'var(--text-muted)',
          letterSpacing: '0.06em',
          marginBottom: '1.25rem'
        }}>
          WHAT HAPPENS NEXT?
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.25rem',
          alignItems: 'flex-start'
        }}>
          
          {/* Step 1: TRANSCRIPT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem'
              }}>
                01
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
                TRANSCRIPT
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              AI captures the conversation with precise timestamps and speaker labels.
            </p>
          </div>

          {/* Step 2: UNDERSTAND */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--brand-navy-subtle)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem'
              }}>
                02
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
                UNDERSTAND
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              AI identifies what matters and structures key discussion topics.
            </p>
          </div>

          {/* Step 3: ACTION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--status-completed-bg)',
                color: '#065F46',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem'
              }}>
                03
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
                ACTION
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Decisions, tasks, assigned owners, and risks are extracted.
            </p>
          </div>

          {/* Step 4: INSIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--brand-slate)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem'
              }}>
                04
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
                INSIGHT
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Your meeting becomes actionable with meeting scores and task tracking.
            </p>
          </div>

        </div>
      </div>

      {/* 6. SUPPORTED SOURCES Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.85rem',
        padding: '1.25rem',
        borderTop: '1px solid var(--border-light)'
      }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
          SUPPORTED SOURCES
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { name: 'Google Meet', icon: Video },
            { name: 'Microsoft Teams', icon: Radio },
            { name: 'Zoom', icon: Video },
            { name: 'YouTube', icon: Youtube }
          ].map((src, i) => {
            const Icon = src.icon;
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)'
                }}
              >
                <Icon size={15} color="var(--text-muted)" />
                <span>{src.name}</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
