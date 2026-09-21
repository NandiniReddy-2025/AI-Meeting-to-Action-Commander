import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  FolderKanban, 
  Plus, 
  ArrowRight, 
  Clock, 
  Trash2, 
  BookmarkCheck, 
  CheckSquare, 
  AlertTriangle
} from 'lucide-react';
import { useMeetings } from '../context/MeetingContext';
import { calculateMeetingScore } from './ResultsDashboardPage';

export default function MyMeetingsPage({ setActivePage }) {
  const { meetings, selectMeeting, deleteMeeting, showToast } = useMeetings();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');

  const filteredMeetings = meetings.filter(m => {
    const matchesSearch = !searchQuery || 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sourceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.participants && m.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesSource = selectedSource === 'all' || 
      m.sourceType.toLowerCase().includes(selectedSource.toLowerCase());

    return matchesSearch && matchesSource;
  });

  const handleDelete = (e, id, title) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMeeting(id);
    }
  };

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
            My Meetings
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
            Search and manage all previously analyzed meetings ({meetings.length} total).
          </p>
        </div>

        <button
          onClick={() => setActivePage('new-transcript')}
          className="btn-primary"
          style={{ padding: '0.75rem 1.4rem', fontSize: '0.9rem' }}
        >
          <Plus size={16} />
          <span>+ New Transcript</span>
        </button>
      </div>

      {/* Toolbar: Search & Platform Filter */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by title, participant, or platform..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#FFFFFF', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <Filter size={13} color="var(--text-muted)" />
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            style={{ border: 'none', background: 'transparent', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Platforms</option>
            <option value="youtube">YouTube</option>
            <option value="google meet">Google Meet</option>
            <option value="microsoft teams">Microsoft Teams</option>
            <option value="zoom">Zoom</option>
          </select>
        </div>
      </div>

      {/* Meetings List */}
      {filteredMeetings.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No meetings found matching your filter.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredMeetings.map((m, idx) => {
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.5rem',
                    borderBottom: idx < filteredMeetings.length - 1 ? '1px solid var(--border-light)' : 'none',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-card-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      flexShrink: 0
                    }}>
                      {m.sourceType === 'YouTube' ? 'YT' : m.sourceType === 'Google Meet' ? 'GM' : m.sourceType === 'Microsoft Teams' ? 'MS' : 'ZM'}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <span>{m.sourceType}</span>
                        <span>•</span>
                        <span>{m.date}</span>
                        <span>•</span>
                        <span>{m.duration}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span className="badge badge-neutral">
                        {actionCount} {actionCount === 1 ? 'Action' : 'Actions'}
                      </span>
                      <span className={score >= 85 ? 'badge badge-completed' : 'badge badge-pending'}>
                        Score: {score} / 100
                      </span>
                      <span className="badge badge-neutral">
                        {m.status || 'Completed'}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, m.id, m.title)}
                      className="btn-ghost"
                      style={{ padding: '0.4rem', color: 'var(--text-light)' }}
                      title="Delete meeting"
                      aria-label="Delete meeting"
                    >
                      <Trash2 size={15} />
                    </button>

                    <ArrowRight size={15} color="var(--text-light)" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
