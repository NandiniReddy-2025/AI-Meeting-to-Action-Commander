import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Brain, 
  BookmarkCheck, 
  CheckSquare, 
  AlertTriangle, 
  Layers,
  FileText,
  Loader2
} from 'lucide-react';
import { useMeetings } from '../context/MeetingContext';

export default function AIAnalysisLoadingPage({ onComplete }) {
  const { setCurrentStep } = useMeetings();
  const [completedSteps, setCompletedSteps] = useState([1]);

  const steps = [
    { id: 1, text: 'Analyzing meeting...', icon: Brain },
    { id: 2, text: 'Generating transcript...', icon: FileText },
    { id: 3, text: 'Understanding conversation...', icon: Brain },
    { id: 4, text: 'Finding decisions...', icon: BookmarkCheck },
    { id: 5, text: 'Extracting action items...', icon: CheckSquare },
    { id: 6, text: 'Identifying risks...', icon: AlertTriangle },
    { id: 7, text: 'Preparing meeting intelligence...', icon: Layers }
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setCompletedSteps(prev => [...prev, 2]), 300);
    const timer2 = setTimeout(() => setCompletedSteps(prev => [...prev, 3]), 600);
    const timer3 = setTimeout(() => setCompletedSteps(prev => [...prev, 4]), 900);
    const timer4 = setTimeout(() => setCompletedSteps(prev => [...prev, 5]), 1200);
    const timer5 = setTimeout(() => setCompletedSteps(prev => [...prev, 6]), 1500);
    const timer6 = setTimeout(() => setCompletedSteps(prev => [...prev, 7]), 1800);
    const timer7 = setTimeout(() => {
      if (onComplete) onComplete();
      setCurrentStep('results');
    }, 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
      clearTimeout(timer7);
    };
  }, []);

  return (
    <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.75rem', alignItems: 'center' }}>
      
      {/* Central Clean Icon */}
      <div style={{
        width: '54px',
        height: '54px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent-primary)',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <Sparkles size={24} />
      </div>

      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          Processing Meeting Intelligence
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Extracting structured decisions, action items, and risk intelligence from the meeting transcript.
        </p>
      </div>

      {/* Checklist Card */}
      <div className="card" style={{ width: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', textAlign: 'left' }}>
        {steps.map(step => {
          const isDone = completedSteps.includes(step.id);
          const isCurrent = completedSteps[completedSteps.length - 1] === step.id - 1;

          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isDone ? 'var(--bg-card-subtle)' : '#FFFFFF',
                border: '1px solid',
                borderColor: isDone ? 'var(--border-light)' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              {isDone ? (
                <CheckCircle2 size={16} color="#059669" />
              ) : isCurrent ? (
                <div style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  border: '2px solid var(--accent-primary)',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite'
                }} />
              ) : (
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid var(--border-light)' }} />
              )}

              <span style={{
                fontSize: '0.85rem',
                fontWeight: isDone || isCurrent ? 600 : 400,
                color: isDone ? 'var(--text-primary)' : isCurrent ? 'var(--text-primary)' : 'var(--text-light)'
              }}>
                {step.text}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
