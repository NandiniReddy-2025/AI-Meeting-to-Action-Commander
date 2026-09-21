import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Video, 
  Youtube,
  Radio,
  Sparkles,
  FileText,
  Brain,
  Layers,
  CheckSquare
} from 'lucide-react';
import { useMeetings } from '../context/MeetingContext';

export default function ProcessingMeetingPage() {
  const { 
    processingProgress, 
    processingStatusText, 
    processingChecklist,
    processingSource,
    processingPlatform 
  } = useMeetings();

  const isYouTube = processingSource === 'youtube';
  const platformName = processingPlatform || (isYouTube ? 'YouTube' : 'Live Meeting');

  const steps = isYouTube ? [
    { id: 1, number: '01', title: 'Connecting to YouTube', desc: 'Fetching metadata and verifying caption streams', icon: Youtube },
    { id: 2, number: '02', title: 'Generating transcript', desc: 'Extracting timed speech segments and captions', icon: FileText },
    { id: 3, number: '03', title: 'Understanding conversation', desc: 'Parsing speaker turns and discourse units', icon: Brain },
    { id: 4, number: '04', title: 'Extracting meeting insights', desc: 'Identifying decisions, tasks, assignees and risks', icon: CheckSquare }
  ] : [
    { id: 1, number: '01', title: `Connecting to ${platformName}`, desc: `Accessing ${platformName} meeting room and verifying bot credentials`, icon: Video },
    { id: 2, number: '02', title: 'Meeting bot join', desc: 'Waiting for meeting bot to authenticate and join session', icon: Radio },
    { id: 3, number: '03', title: 'Transcribing meeting', desc: 'Capturing audio stream and generating timeline transcript', icon: FileText },
    { id: 4, number: '04', title: 'Extracting meeting insights', desc: 'Identifying decisions, tasks, assignees and risks', icon: CheckSquare }
  ];

  return (
    <div style={{ maxWidth: '640px', margin: '3rem auto', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', textAlign: 'center' }}>
      
      {/* Icon Emblem */}
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--accent-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-xs)'
      }}>
        {isYouTube ? <Youtube size={26} /> : <Video size={26} />}
      </div>

      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
          {isYouTube ? 'Processing YouTube video...' : `Connecting to ${platformName}...`}
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          {isYouTube 
            ? 'ActionCommander is extracting captions, generating timeline transcripts, and reasoning with AI.'
            : `ActionCommander is preparing the meeting bot to capture audio from ${platformName}.`}
        </p>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          <span>{processingStatusText || 'Initializing audio capture pipeline...'}</span>
          <span>{processingProgress || 45}%</span>
        </div>
        <div style={{ height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${processingProgress || 45}%`, height: '100%', backgroundColor: 'var(--accent-primary)', borderRadius: '3px', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* 4-Step Workflow Card */}
      <div className="card" style={{ width: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
        {steps.map((step, idx) => {
          const isDone = (processingProgress || 45) >= (step.id * 25);
          const isCurrent = !isDone && (processingProgress || 45) >= ((step.id - 1) * 25);

          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isDone ? 'var(--bg-card-subtle)' : '#FFFFFF',
                border: '1px solid',
                borderColor: isDone ? 'var(--border-light)' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: isDone ? 'var(--status-completed-bg)' : isCurrent ? 'var(--brand-navy-subtle)' : 'var(--bg-secondary)',
                color: isDone ? '#065F46' : isCurrent ? 'var(--accent-primary)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem',
                flexShrink: 0
              }}>
                {isDone ? <CheckCircle2 size={16} /> : step.number}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: isDone || isCurrent ? 700 : 500,
                  color: isDone ? 'var(--text-primary)' : isCurrent ? 'var(--text-primary)' : 'var(--text-muted)'
                }}>
                  {step.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
                  {step.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
