import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Copy, 
  Download, 
  Sparkles, 
  Play, 
  Pause, 
  Clock, 
  Users, 
  Check, 
  Languages, 
  Volume2,
  BookmarkCheck,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';
import { useMeetings } from '../context/MeetingContext';

export default function TranscriptPage({ onStartAnalysis }) {
  const { activeMeeting, startAIAnalysis, showToast } = useMeetings();
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [displayLanguage, setDisplayLanguage] = useState('en'); // 'en' | 'original'

  if (!activeMeeting) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>No meeting transcript loaded. Please generate or select a meeting.</p>
      </div>
    );
  }

  const { 
    title, 
    sourceType, 
    date, 
    duration, 
    participants, 
    transcript = [], 
    englishTranscript,
    originalTranscript, 
    originalLanguage,
    languageInfo 
  } = activeMeeting;

  const origLangName = originalLanguage || languageInfo?.originalLanguage || 'Original Language';
  const isTranslated = languageInfo?.isTranslated || (originalTranscript && englishTranscript && originalTranscript !== englishTranscript);
  const isTranslationFailed = languageInfo?.translationStatus === 'failed';
  const isMultiLanguage = isTranslated || isTranslationFailed || (origLangName && origLangName.toLowerCase() !== 'english');

  // Determine active transcript based on user's language selection
  const rawEnglishList = englishTranscript || (languageInfo?.translationStatus !== 'failed' ? transcript : null);
  const rawOriginalList = originalTranscript || transcript || [];

  let activeTranscriptList = [];
  if (displayLanguage === 'original' || isTranslationFailed) {
    activeTranscriptList = rawOriginalList;
  } else {
    activeTranscriptList = rawEnglishList || rawOriginalList;
  }

  // Search filtering on active transcript
  const filteredTranscript = activeTranscriptList.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.speaker.toLowerCase().includes(query) ||
      item.text.toLowerCase().includes(query) ||
      item.time.toLowerCase().includes(query)
    );
  });

  const handleCopyTranscript = () => {
    const fullText = activeTranscriptList.map(t => `[${t.time}] ${t.speaker}:\n${t.text}`).join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    showToast(`Transcript copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format) => {
    let content = '';
    let mimeType = 'text/plain';
    const langTag = displayLanguage === 'en' && !isTranslationFailed ? 'english' : 'original';
    let filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${langTag}_transcript.${format}`;

    if (format === 'txt') {
      content = `MEETING TRANSCRIPT: ${title}\nSource: ${sourceType}\nDate: ${date}\nDuration: ${duration}\nLanguage: ${displayLanguage === 'en' && !isTranslationFailed ? 'English' : origLangName}\nParticipants: ${participants?.join(', ')}\n\n` +
        activeTranscriptList.map(t => `[${t.time}] ${t.speaker}: ${t.text}`).join('\n\n');
    } else if (format === 'md') {
      content = `# ${title}\n\n- **Source**: ${sourceType}\n- **Date**: ${date}\n- **Duration**: ${duration}\n- **Language**: ${displayLanguage === 'en' && !isTranslationFailed ? 'English (Primary)' : origLangName}\n- **Participants**: ${participants?.join(', ')}\n\n## Timeline Transcript\n\n` +
        activeTranscriptList.map(t => `### ${t.time} — **${t.speaker}**\n${t.text}`).join('\n\n');
      mimeType = 'text/markdown';
    } else if (format === 'json') {
      content = JSON.stringify(activeMeeting, null, 2);
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Transcript downloaded as ${format.toUpperCase()}`);
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 600, padding: '0 2px', borderRadius: '2px' }}>
          {part}
        </span>
      ) : part
    );
  };

  // Detect subtle moment tags (Decision, Action Item, Risk) based on utterance content
  const getMomentTag = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('decide') || lower.includes('agree') || lower.includes('confirmed') || lower.includes('approved') || lower.includes('finalized')) {
      return { type: 'decision', label: 'Decision', icon: BookmarkCheck, badgeClass: 'badge-neutral' };
    }
    if (lower.includes('action') || lower.includes('will do') || lower.includes('assign') || lower.includes('i will') || lower.includes('take lead') || lower.includes('deadline')) {
      return { type: 'action', label: 'Action Item', icon: CheckSquare, badgeClass: 'badge-completed' };
    }
    if (lower.includes('risk') || lower.includes('blocker') || lower.includes('concern') || lower.includes('delay') || lower.includes('issue') || lower.includes('bottleneck')) {
      return { type: 'risk', label: 'Risk', icon: AlertTriangle, badgeClass: 'badge-pending' };
    }
    return null;
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header & Next Step CTA */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-completed">
              Transcript Ready
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sourceType}</span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Meeting Transcript
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
            Speaker-labeled timeline transcript for "{title}".
          </p>
        </div>

        {/* Primary AI Analysis Trigger */}
        <button
          onClick={async () => {
            if (onStartAnalysis) onStartAnalysis();
            await startAIAnalysis();
          }}
          className="btn-primary"
          style={{ padding: '0.75rem 1.4rem', fontSize: '0.92rem' }}
          id="analyze-meeting-cta-btn"
        >
          <Sparkles size={16} />
          <span>Analyze Meeting with AI →</span>
        </button>
      </div>

      {/* Multilingual Selector Banner */}
      {isMultiLanguage && (
        <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Languages size={18} color="var(--text-secondary)" />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isTranslationFailed ? 'Original Audio Captured' : 'Multilingual Speech Auto-Translated'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Original Language: {origLangName}
              </div>
            </div>
          </div>

          {!isTranslationFailed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                id="toggle-lang-en-btn"
                onClick={() => setDisplayLanguage('en')}
                className={displayLanguage === 'en' ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              >
                English (Primary)
              </button>
              <button
                type="button"
                id="toggle-lang-original-btn"
                onClick={() => setDisplayLanguage('original')}
                className={displayLanguage === 'original' ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              >
                Original ({origLangName})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Meeting Metadata & Audio Controls Card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{date}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>•</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={13} /> {duration}
              </span>
            </div>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {title}
            </h2>

            {participants && participants.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
                  Participants:
                </span>
                {participants.map((p, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.72rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Export Actions */}
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleCopyTranscript}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.8rem' }}
            >
              {copied ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={() => handleDownload('txt')}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.8rem' }}
            >
              <Download size={14} />
              <span>TXT</span>
            </button>

            <button
              onClick={() => handleDownload('md')}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.8rem' }}
            >
              <FileText size={14} />
              <span>MD</span>
            </button>
          </div>
        </div>

        {/* Audio Scrubber Simulation */}
        <div style={{
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem'
        }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-primary)',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: '1px' }} />}
          </button>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>00:22</span>
            <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--bg-secondary)', borderRadius: '2px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: isPlaying ? '50%' : '15%', height: '100%', backgroundColor: 'var(--accent-primary)', borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{duration}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <Volume2 size={14} />
            <span>Audio Synchronized</span>
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search transcript by keyword, speaker, or timestamp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="btn-ghost"
            style={{ fontSize: '0.82rem' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Timeline Transcript Flow */}
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Transcript Timeline ({filteredTranscript.length} entries)
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Language: {displayLanguage === 'en' && !isTranslationFailed ? 'English' : origLangName}
          </span>
        </div>

        {filteredTranscript.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            No transcript matches for "{searchQuery}"
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredTranscript.map((item, idx) => {
              const moment = getMomentTag(item.text);

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '1.25rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: idx % 2 === 0 ? 'var(--bg-card-subtle)' : '#FFFFFF',
                    border: '1px solid var(--border-light)',
                    transition: 'border-color 0.1s ease'
                  }}
                >
                  {/* Timestamp & Speaker */}
                  <div style={{ width: '130px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <Clock size={11} /> {item.time}
                    </span>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}>
                      {highlightText(item.speaker, searchQuery)}
                    </span>
                  </div>

                  {/* Speech Body & Subtle Moment Badge */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
                      {highlightText(item.text, searchQuery)}
                    </div>

                    {moment && (
                      <div style={{ marginTop: '2px' }}>
                        <span className={`badge ${moment.badgeClass}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem' }}>
                          <moment.icon size={11} />
                          {moment.label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
