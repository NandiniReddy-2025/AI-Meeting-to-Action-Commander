import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  ArrowRight,
  Users
} from 'lucide-react';
import { useMeetings } from '../context/MeetingContext';

export default function CalendarPage({ setActivePage }) {
  const { meetings, selectMeeting } = useMeetings();
  const [selectedMonth, setSelectedMonth] = useState('September 2026');

  // Collect all deadlines from all meetings
  const allDeadlines = [];
  meetings.forEach(m => {
    if (m.analysis && m.analysis.actionItems) {
      m.analysis.actionItems.forEach(item => {
        allDeadlines.push({
          id: item.id,
          title: item.task,
          owner: item.owner,
          deadline: item.deadline,
          status: item.status,
          priority: item.priority,
          meetingId: m.id,
          meetingTitle: m.title,
          sourceType: m.sourceType
        });
      });
    }
  });

  const daysInMonth = [
    { day: 1, isCurrent: true },
    { day: 2, isCurrent: true },
    { day: 3, isCurrent: true, hasMeeting: true, meetingTitle: 'Website Project Sync' },
    { day: 4, isCurrent: true },
    { day: 5, isCurrent: true },
    { day: 6, isCurrent: true },
    { day: 7, isCurrent: true },
    { day: 8, isCurrent: true },
    { day: 9, isCurrent: true, isToday: true },
    { day: 10, isCurrent: true, deadlines: [{ title: 'Escalate API endpoints', status: 'Completed', owner: 'Anjali Sharma' }] },
    { day: 11, isCurrent: true },
    { day: 12, isCurrent: true, deadlines: [{ title: 'Share keynote summary', status: 'Completed', owner: 'Marcus Brody' }] },
    { day: 13, isCurrent: true },
    { day: 14, isCurrent: true },
    { day: 15, isCurrent: true, deadlines: [{ title: 'Complete login page', status: 'Completed', owner: 'Rahul Mehta' }] },
    { day: 16, isCurrent: true },
    { day: 17, isCurrent: true, deadlines: [{ title: 'Review API integration', status: 'Pending', owner: 'Anjali Sharma' }] },
    { day: 18, isCurrent: true, deadlines: [{ title: 'Design dashboard & tokens', status: 'In Progress', owner: 'Sneha' }] },
    { day: 19, isCurrent: true },
    { day: 20, isCurrent: true, deadlines: [{ title: 'Q3 Product Review', status: 'Pending', owner: 'Snehitha' }] },
    { day: 21, isCurrent: true },
    { day: 22, isCurrent: true, deadlines: [{ title: 'Finalize sprint deliverable', status: 'Pending', owner: 'Dev Team' }] },
    { day: 23, isCurrent: true },
    { day: 24, isCurrent: true },
    { day: 25, isCurrent: true },
    { day: 26, isCurrent: true },
    { day: 27, isCurrent: true },
    { day: 28, isCurrent: true },
    { day: 29, isCurrent: true },
    { day: 30, isCurrent: true }
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Milestones & Action Calendar
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
            Track commitments, meeting deliverables, and sprint deadlines chronologically.
          </p>
        </div>

        {/* Month Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#FFFFFF', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <button className="btn-ghost" style={{ padding: '0.25rem' }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', minWidth: '130px', textAlign: 'center' }}>
            {selectedMonth}
          </span>
          <button className="btn-ghost" style={{ padding: '0.25rem' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar + Upcoming Side List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Calendar Box */}
        <div className="card" style={{ padding: '1.5rem', gridColumn: 'span 2' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '0.5rem',
            marginBottom: '0.75rem',
            textAlign: 'center'
          }}>
            {daysOfWeek.map((d, i) => (
              <div key={i} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.25rem 0' }}>
                {d}
              </div>
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '0.5rem'
          }}>
            {daysInMonth.map((dayItem, idx) => {
              const hasItems = dayItem.deadlines && dayItem.deadlines.length > 0;
              const isToday = dayItem.isToday;

              return (
                <div
                  key={idx}
                  style={{
                    minHeight: '78px',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: isToday ? 'var(--accent-primary)' : 'var(--border-light)',
                    backgroundColor: isToday ? 'var(--bg-secondary)' : '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'border-color 0.1s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: '0.82rem',
                      fontWeight: isToday ? 700 : 500,
                      color: isToday ? 'var(--text-primary)' : 'var(--text-body)'
                    }}>
                      {dayItem.day}
                    </span>
                    {isToday && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Today
                      </span>
                    )}
                  </div>

                  {hasItems && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                      {dayItem.deadlines.map((dl, dIdx) => (
                        <div
                          key={dIdx}
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.35rem',
                            borderRadius: '2px',
                            backgroundColor: dl.status === 'Completed' ? 'var(--status-completed-bg)' : 'var(--status-pending-bg)',
                            color: dl.status === 'Completed' ? 'var(--status-completed-text)' : 'var(--status-pending-text)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={`${dl.title} (${dl.owner})`}
                        >
                          {dl.title}
                        </div>
                      ))}
                    </div>
                  )}

                  {dayItem.hasMeeting && (
                    <div style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.15rem 0.35rem', borderRadius: '2px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {dayItem.meetingTitle}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Deadlines Side List */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Upcoming Deadlines ({allDeadlines.length})
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Action items requiring completion.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '420px', overflowY: 'auto' }}>
            {allDeadlines.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={11} /> {item.deadline}
                  </span>
                  <span className={item.status === 'Completed' ? 'badge badge-completed' : item.status === 'In Progress' ? 'badge badge-progress' : 'badge badge-pending'}>
                    {item.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.title}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Owner: {item.owner}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
