import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  BookmarkCheck, 
  Users, 
  Download,
  Percent,
  Layers,
  Video,
  Calendar
} from 'lucide-react';
import { useMeetings } from '../context/MeetingContext';
import { calculateMeetingScore } from './ResultsDashboardPage';

export default function ReportsPage() {
  const { meetings } = useMeetings();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    let totalDecisions = 0;
    let totalActionItems = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let pendingTasks = 0;
    let highRiskCount = 0;
    let totalScoresSum = 0;

    const ownerCount = {};
    const platformCount = { 'Google Meet': 0, 'Microsoft Teams': 0, 'Zoom': 0, 'YouTube': 0 };

    meetings.forEach(m => {
      const pKey = m.sourceType || 'Google Meet';
      platformCount[pKey] = (platformCount[pKey] || 0) + 1;
      const score = calculateMeetingScore(m);
      totalScoresSum += score;

      if (m.analysis) {
        if (m.analysis.decisions) totalDecisions += m.analysis.decisions.length;
        if (m.analysis.actionItems) {
          totalActionItems += m.analysis.actionItems.length;
          m.analysis.actionItems.forEach(a => {
            if (a.status === 'Completed') completedTasks++;
            else if (a.status === 'In Progress') inProgressTasks++;
            else pendingTasks++;

            const ownerName = a.owner || 'Unassigned';
            ownerCount[ownerName] = (ownerCount[ownerName] || 0) + 1;
          });
        }
        if (m.analysis.risks) {
          m.analysis.risks.forEach(r => {
            if (r.severity === 'High') highRiskCount++;
          });
        }
      }
    });

    const avgScore = meetings.length > 0 ? Math.round(totalScoresSum / meetings.length) : 86;

    setAnalytics({
      totalMeetings: meetings.length,
      averageScore: avgScore,
      totalDecisions,
      totalActionItems,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionRate: totalActionItems > 0 ? Math.round((completedTasks / totalActionItems) * 100) : 0,
      highRiskCount,
      ownerCount,
      platformCount
    });
  }, [meetings]);

  if (!analytics) return null;

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid var(--border-light)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Meeting Insights
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
            Aggregate intelligence metrics, decision quality, and task delivery progress across all meetings.
          </p>
        </div>
      </div>

      {/* 6 Key Summary Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '1.25rem'
      }}>
        
        {/* Total Meetings */}
        <div className="card" style={{ padding: '1.35rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.03em', marginBottom: '0.35rem' }}>
            TOTAL MEETINGS
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {analytics.totalMeetings}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '0.35rem' }}>
            Across all platforms
          </div>
        </div>

        {/* Average Meeting Score */}
        <div className="card" style={{ padding: '1.35rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.03em', marginBottom: '0.35rem' }}>
            AVG MEETING SCORE
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {analytics.averageScore} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 100</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '0.35rem' }}>
            Calculated quality index
          </div>
        </div>

        {/* Total Action Items */}
        <div className="card" style={{ padding: '1.35rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.03em', marginBottom: '0.35rem' }}>
            TOTAL ACTION ITEMS
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {analytics.totalActionItems}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '0.35rem' }}>
            Extracted commitments
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="card" style={{ padding: '1.35rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.03em', marginBottom: '0.35rem' }}>
            COMPLETED TASKS
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669' }}>
            {analytics.completedTasks}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '0.35rem' }}>
            Verified delivered
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="card" style={{ padding: '1.35rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.03em', marginBottom: '0.35rem' }}>
            PENDING TASKS
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#D97706' }}>
            {analytics.pendingTasks + analytics.inProgressTasks}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '0.35rem' }}>
            In progress & pending
          </div>
        </div>

        {/* Completion Rate */}
        <div className="card" style={{ padding: '1.35rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.03em', marginBottom: '0.35rem' }}>
            COMPLETION RATE
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {analytics.completionRate}%
          </div>
          <div style={{ marginTop: '0.45rem', height: '4px', backgroundColor: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${analytics.completionRate}%`, height: '100%', backgroundColor: '#059669', borderRadius: '2px' }} />
          </div>
        </div>

      </div>

      {/* Clean Charts & Distribution Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1.5rem'
      }}>
        
        {/* Task Status Distribution */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
            Action Item Delivery Breakdown
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Completed</span>
                <span style={{ color: 'var(--text-muted)' }}>{analytics.completedTasks} tasks ({analytics.totalActionItems ? Math.round((analytics.completedTasks / analytics.totalActionItems) * 100) : 0}%)</span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${analytics.totalActionItems ? (analytics.completedTasks / analytics.totalActionItems) * 100 : 0}%`, height: '100%', backgroundColor: '#059669', borderRadius: '3px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>In Progress</span>
                <span style={{ color: 'var(--text-muted)' }}>{analytics.inProgressTasks} tasks ({analytics.totalActionItems ? Math.round((analytics.inProgressTasks / analytics.totalActionItems) * 100) : 0}%)</span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${analytics.totalActionItems ? (analytics.inProgressTasks / analytics.totalActionItems) * 100 : 0}%`, height: '100%', backgroundColor: 'var(--brand-slate)', borderRadius: '3px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Pending</span>
                <span style={{ color: 'var(--text-muted)' }}>{analytics.pendingTasks} tasks ({analytics.totalActionItems ? Math.round((analytics.pendingTasks / analytics.totalActionItems) * 100) : 0}%)</span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${analytics.totalActionItems ? (analytics.pendingTasks / analytics.totalActionItems) * 100 : 0}%`, height: '100%', backgroundColor: '#D97706', borderRadius: '3px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Meeting Activity by Platform */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
            Meeting Activity by Platform
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(analytics.platformCount).map(([plat, count], idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    <Video size={13} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {plat}
                  </span>
                </div>

                <span className="badge badge-neutral">
                  {count} {count === 1 ? 'session' : 'sessions'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Deliverables by Contributor */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
            Action Items by Owner
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '220px', overflowY: 'auto' }}>
            {Object.entries(analytics.ownerCount).map(([owner, count], i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.68rem',
                    fontWeight: 700
                  }}>
                    {owner.charAt(0)}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {owner}
                  </span>
                </div>

                <span className="badge badge-neutral">
                  {count} {count === 1 ? 'task' : 'tasks'}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
