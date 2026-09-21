import React from 'react';
import { 
  Plus, 
  ArrowRight, 
  CheckSquare, 
  BookmarkCheck, 
  AlertTriangle, 
  Clock, 
  FolderKanban, 
  Calendar, 
  BarChart3, 
  FileText, 
  Sparkles,
  Users,
  Video,
  CheckCircle2,
  TrendingUp,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMeetings } from '../context/MeetingContext';
import { calculateMeetingScore } from './ResultsDashboardPage';

// Visual Representation of: [ MEETING CONVERSATION ] → [ AI UNDERSTANDING ] → [ ACTIONABLE INSIGHTS ]
function HeroWorkflowVisual() {
  return (
    <div style={{
      backgroundColor: 'var(--bg-card-subtle)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem 1.35rem',
      maxWidth: '460px',
      width: '100%'
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '0.85rem' }}>
        FROM CONVERSATION TO ACTION
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        
        {/* Stage 1: Meeting Conversation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.55rem 0.75rem',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Video size={13} color="var(--text-primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              1. Meeting Conversation
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Google Meet, Teams, Zoom & YouTube streams
            </div>
          </div>
        </div>

        {/* Connecting Arrow */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '-2px 0' }}>
          <div style={{ width: '1px', height: '10px', backgroundColor: 'var(--border-medium)' }} />
        </div>

        {/* Stage 2: AI Understanding */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.55rem 0.75rem',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'var(--brand-navy-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={13} color="var(--accent-primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              2. AI Understanding & Reasoning
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Transcript parsing, multi-speaker segmentation
            </div>
          </div>
        </div>

        {/* Connecting Arrow */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '-2px 0' }}>
          <div style={{ width: '1px', height: '10px', backgroundColor: 'var(--border-medium)' }} />
        </div>

        {/* Stage 3: Actionable Insights */}
        <div style={{
          padding: '0.65rem 0.75rem',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--status-completed-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={13} color="#065F46" />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                3. Actionable Insights
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.4rem',
            fontSize: '0.72rem',
            fontWeight: 500,
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: '#059669', fontWeight: 700 }}>✓</span> Decisions
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: '#059669', fontWeight: 700 }}>✓</span> Action Items
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: '#DC2626', fontWeight: 700 }}>⚠</span> Risks & Blockers
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: '#405A8A', fontWeight: 700 }}>💡</span> Key Insights
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function HomePage({ setActivePage }) {
  const { user } = useAuth();
  const { meetings, selectMeeting } = useMeetings();

  const userName = user?.name || 'Nandini';

  // Calculate real metrics from meetings
  let totalActionItems = 0;
  let completedTasks = 0;
  let scoreSum = 0;

  meetings.forEach(m => {
    if (m.analysis?.actionItems) {
      totalActionItems += m.analysis.actionItems.length;
      completedTasks += m.analysis.actionItems.filter(a => a.status === 'Completed').length;
    }
    scoreSum += calculateMeetingScore(m);
  });

  const averageScore = meetings.length > 0 
    ? Math.round(scoreSum / meetings.length) 
    : 85;

  const quickActions = [
    {
      id: 'new-transcript',
      title: 'Generate New Transcript',
      desc: 'Process video or live meeting link into structured transcript.',
      icon: Plus,
      action: () => setActivePage('new-transcript')
    },
    {
      id: 'my-meetings',
      title: 'View My Meetings',
      desc: 'Browse historical sessions, scores, and extracted actions.',
      icon: FolderKanban,
      action: () => setActivePage('my-meetings')
    },
    {
      id: 'calendar',
      title: 'Check Calendar',
      desc: 'Review upcoming meeting schedules and sync commitments.',
      icon: Calendar,
      action: () => setActivePage('calendar')
    },
    {
      id: 'reports',
      title: 'View Meeting Insights',
      desc: 'Analyze completion trends, score benchmarks, and metrics.',
      icon: BarChart3,
      action: () => setActivePage('reports')
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
      
      {/* 1. Welcome Hero Section */}
      <div className="card" style={{
        padding: '2.25rem',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '2rem'
      }}>
        <div style={{ maxWidth: '580px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.22rem 0.6rem',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'var(--brand-navy-subtle)',
            color: 'var(--accent-primary)',
            fontSize: '0.74rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            marginBottom: '0.85rem'
          }}>
            <span>AI MEETING INTELLIGENCE</span>
          </div>

          <h1 style={{
            fontSize: '2.1rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em',
            marginBottom: '0.45rem',
            lineHeight: 1.2
          }}>
            Welcome back, {userName}
          </h1>

          <p style={{
            fontSize: '1rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            marginBottom: '1.5rem'
          }}>
            Turn your meetings into clear decisions, actions and insights.
          </p>

          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActivePage('new-transcript')}
              className="btn-primary"
              style={{ padding: '0.75rem 1.35rem', fontSize: '0.9rem' }}
              id="home-hero-btn-new-transcript"
            >
              <Plus size={16} />
              <span>+ Generate New Transcript</span>
            </button>

            <button
              onClick={() => setActivePage('my-meetings')}
              className="btn-secondary"
              style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}
            >
              <FolderKanban size={16} />
              <span>View My Meetings</span>
            </button>
          </div>
        </div>

        {/* Right Hero Visual: From Conversation to Action */}
        <HeroWorkflowVisual />
      </div>

      {/* 2. Meeting Intelligence Metric Cards (4 Cards) */}
      <div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1.25rem'
        }}>
          
          {/* Card 1: TOTAL MEETINGS */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)'
              }}>
                <Video size={16} />
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
                TOTAL MEETINGS
              </span>
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {meetings.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
              Processed & analyzed sessions
            </div>
          </div>

          {/* Card 2: ACTION ITEMS */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'var(--brand-navy-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)'
              }}>
                <CheckSquare size={16} />
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
                ACTION ITEMS
              </span>
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {totalActionItems}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
              Tasks extracted from meetings
            </div>
          </div>

          {/* Card 3: COMPLETED TASKS */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'var(--status-completed-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#065F46'
              }}>
                <CheckCircle2 size={16} />
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
                COMPLETED TASKS
              </span>
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {completedTasks}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
              Delivered and closed
            </div>
          </div>

          {/* Card 4: AVERAGE MEETING SCORE */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-slate)'
              }}>
                <BarChart3 size={16} />
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
                AVERAGE MEETING SCORE
              </span>
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {averageScore} <span style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ 100</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
              Across all meetings
            </div>
          </div>

        </div>
      </div>

      {/* 3. Main Grid: Recent Meetings (2/3) + Quick Actions (1/3) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        
        {/* Left Column: Recent Meetings */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Recent Meetings
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Latest sessions processed with intelligence scores and action items.
              </p>
            </div>
            {meetings.length > 0 && (
              <button
                onClick={() => setActivePage('my-meetings')}
                className="btn-ghost"
                style={{ fontSize: '0.82rem', color: 'var(--brand-slate)', fontWeight: 600 }}
              >
                View all ({meetings.length}) →
              </button>
            )}
          </div>

          {meetings && meetings.length > 0 ? (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 2.2fr) 90px 100px 80px 110px 40px',
                padding: '0.75rem 1.25rem',
                backgroundColor: 'var(--bg-card-subtle)',
                borderBottom: '1px solid var(--border-light)',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.04em'
              }}>
                <div>MEETING</div>
                <div>SOURCE</div>
                <div>DATE</div>
                <div>DURATION</div>
                <div>SCORE</div>
                <div />
              </div>

              {/* Table Rows */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {meetings.slice(0, 5).map((m, idx) => {
                  const score = calculateMeetingScore(m);
                  const actionCount = m.analysis?.actionItems?.length || 0;

                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        selectMeeting(m);
                        setActivePage('results');
                      }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 2.2fr) 90px 100px 80px 110px 40px',
                        alignItems: 'center',
                        padding: '1rem 1.25rem',
                        borderBottom: idx < meetings.slice(0, 5).length - 1 ? '1px solid var(--border-light)' : 'none',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'background-color 0.12s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                    >
                      {/* Meeting Title & Actions count */}
                      <div style={{ minWidth: 0, paddingRight: '0.75rem' }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {actionCount} {actionCount === 1 ? 'action item' : 'action items'} extracted
                        </div>
                      </div>

                      {/* Source */}
                      <div>
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                          {m.sourceType || 'Meet'}
                        </span>
                      </div>

                      {/* Date */}
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-body)' }}>
                        {m.date}
                      </div>

                      {/* Duration */}
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {m.duration}
                      </div>

                      {/* Score Badge */}
                      <div>
                        <span className={score >= 85 ? 'badge badge-completed' : score >= 75 ? 'badge badge-pending' : 'badge badge-risk-high'}>
                          {score} / 100
                        </span>
                      </div>

                      {/* Action Arrow */}
                      <div style={{ textAlign: 'right' }}>
                        <ArrowRight size={14} color="var(--text-light)" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                marginBottom: '1rem'
              }}>
                <FileText size={22} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                No meetings processed yet
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
                Generate your first transcript to turn a meeting conversation into actionable insights.
              </p>
              <button
                onClick={() => setActivePage('new-transcript')}
                className="btn-primary"
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
              >
                <Plus size={15} />
                <span>+ Generate New Transcript</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions */}
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Quick Actions
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Instant workflows and intelligence modules.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {quickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <div
                  key={qa.id}
                  onClick={qa.action}
                  className="card"
                  style={{
                    padding: '1.15rem 1.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={17} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {qa.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                        {qa.desc}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={14} color="var(--text-light)" />
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
