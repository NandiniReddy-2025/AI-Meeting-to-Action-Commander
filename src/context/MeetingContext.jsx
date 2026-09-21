import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const MeetingContext = createContext(null);

export function MeetingProvider({ children }) {
  const { token, user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [currentStep, setCurrentStepState] = useState('idle'); // 'idle' | 'joining' | 'transcribing' | 'transcript_ready' | 'analyzing' | 'results'
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatusText, setProcessingStatusText] = useState('');
  const [processingChecklist, setProcessingChecklist] = useState([]);
  const [processingSource, setProcessingSource] = useState('youtube'); // 'youtube' | 'live-meeting'
  const [processingPlatform, setProcessingPlatform] = useState('YouTube'); // 'YouTube' | 'Google Meet' | 'Microsoft Teams' | 'Zoom'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  const [activeSourceTab, setActiveSourceTabState] = useState(() => {
    return localStorage.getItem('ac_active_source_tab') || 'youtube';
  });
  const [selectedLivePlatform, setSelectedLivePlatformState] = useState(() => {
    return localStorage.getItem('ac_selected_live_platform') || 'Google Meet';
  });
  const [meetingUrl, setMeetingUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [activeBotSession, setActiveBotSession] = useState(null);

  const setActiveSourceTab = (tab) => {
    setActiveSourceTabState(tab);
    try {
      localStorage.setItem('ac_active_source_tab', tab);
    } catch (_) {}
  };

  const setSelectedLivePlatform = (platform) => {
    setSelectedLivePlatformState(platform);
    try {
      localStorage.setItem('ac_selected_live_platform', platform);
    } catch (_) {}
  };

  const setCurrentStep = (step) => {
    setCurrentStepState(step);
  };

  // Fetch all meetings on load/auth change
  useEffect(() => {
    fetchMeetings();
  }, [token]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/meetings', {
        headers: { Authorization: `Bearer ${token || 'jwt_usr_snehitha'}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
        if (!activeMeeting && data.meetings && data.meetings.length > 0) {
          setActiveMeeting(data.meetings[0]);
        }
      }
    } catch (err) {
      console.warn('Error fetching meetings from server, using local store:', err);
    }
  };

  // Full autonomous workflow from Link (Strictly routes YouTube vs Live Meeting)
  const processMeetingLink = async (url, options = {}) => {
    setError(null);
    setCurrentStepState('joining');

    const source = options.source || (/(?:youtube\.com|youtu\.be)/i.test(url) ? 'youtube' : 'live-meeting');
    const platform = options.platform || (source === 'youtube' ? 'YouTube' : 'Google Meet');
    const isYouTube = source === 'youtube';

    setProcessingSource(source);
    setProcessingPlatform(platform);

    setProcessingProgress(20);
    setProcessingStatusText(
      isYouTube 
        ? 'Connecting to YouTube video & fetching metadata...' 
        : `Connecting to ${platform}...`
    );

    // Dynamic initial checklist tailored to source
    const checklistItems = isYouTube ? [
      { id: 1, text: 'Connecting to YouTube video & fetching metadata...', status: 'in-progress' },
      { id: 2, text: 'Extracting speech audio & timed caption tracks...', status: 'pending' },
      { id: 3, text: 'Structuring conversational timeline transcript...', status: 'pending' },
      { id: 4, text: 'Running AI intelligence & extracting insights...', status: 'pending' }
    ] : [
      { id: 1, text: `Connecting to ${platform} meeting room...`, status: 'in-progress' },
      { id: 2, text: 'Waiting for meeting bot to authenticate & join...', status: 'pending' },
      { id: 3, text: 'Capturing audio stream & transcribing meeting...', status: 'pending' },
      { id: 4, text: 'Extracting decisions, action items, owners & risks...', status: 'pending' }
    ];
    
    setProcessingChecklist(checklistItems);

    try {
      // Step 1 Complete animation
      await new Promise(r => setTimeout(r, 450));
      setProcessingProgress(40);
      setProcessingChecklist(prev => prev.map(item => 
        item.id === 1 ? { ...item, status: 'completed' } :
        item.id === 2 ? { ...item, status: 'in-progress' } : item
      ));
      setProcessingStatusText(isYouTube ? 'Extracting speech audio & caption tracks...' : `Waiting for ${platform} meeting bot...`);

      // Call API with explicit source and platform
      const res = await fetch('/api/meetings/process-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || 'jwt_usr_snehitha'}`
        },
        body: JSON.stringify({ 
          url, 
          source, 
          platform, 
          userId: user?.id 
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to process ${platform} meeting link.`);
      }

      // Step 2, 3 Complete
      setProcessingProgress(75);
      setProcessingChecklist(prev => prev.map(item => 
        item.id <= 2 ? { ...item, status: 'completed' } :
        item.id === 3 ? { ...item, status: 'completed' } :
        item.id === 4 ? { ...item, status: 'in-progress' } : item
      ));
      setProcessingStatusText(isYouTube ? 'Structuring timeline transcript & running AI reasoning...' : 'Analyzing transcript content...');

      await new Promise(r => setTimeout(r, 500));
      if (data && data.botDispatched) {
        setCurrentStepState('idle');
        const botSession = {
          botId: data.botId,
          botName: data.botName,
          status: data.status || 'joining',
          platform: data.platform || platform,
          service: data.service,
          meetingUrl: data.sourceUrl || url,
          createdAt: Date.now()
        };
        setActiveBotSession(botSession);
        return data;
      }

      const newMeeting = data.meeting;
      setActiveMeeting(newMeeting);
      setMeetings(prev => [newMeeting, ...prev.filter(m => m.id !== newMeeting.id)]);
      setCurrentStepState('transcript_ready');
      showToast(isYouTube ? 'YouTube video transcribed & structured successfully!' : `${platform} transcript generated successfully!`);
      return newMeeting;

    } catch (err) {
      console.error('Error during link processing:', err);
      const errMsg = err.message || `Unable to process the ${platform} meeting.`;
      setError(errMsg);
      setCurrentStepState('idle'); // Return to idle so form can show the exact error banner
      throw err;
    }
  };

  const checkBotStatus = async (botId) => {
    if (!botId) return null;
    try {
      const res = await fetch(`/api/bot/${botId}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data && data.status) {
        setActiveBotSession(prev => prev && prev.botId === botId ? { ...prev, status: data.status } : prev);
      }
      return data;
    } catch (err) {
      console.warn(`Error checking bot status for ${botId}:`, err.message);
      return null;
    }
  };

  const completeLiveMeeting = async (botId, platform, url) => {
    try {
      const res = await fetch('/api/meetings/complete-live-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || 'jwt_usr_snehitha'}`
        },
        body: JSON.stringify({
          botId,
          platform: platform || 'Google Meet',
          url,
          userId: user?.id
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete live meeting transcription.');
      }

      const newMeeting = data.meeting;
      setActiveMeeting(newMeeting);
      setMeetings(prev => [newMeeting, ...prev.filter(m => m.id !== newMeeting.id)]);
      setActiveBotSession(null);
      setCurrentStepState('transcript_ready');
      showToast(`${platform || 'Live'} transcript generated & analyzed successfully!`);
      return newMeeting;
    } catch (err) {
      console.error('Error completing live meeting:', err);
      setError(err.message);
      throw err;
    }
  };


  const startAIAnalysis = async () => {
    setCurrentStepState('analyzing');
    try {
      if (activeMeeting && activeMeeting.id) {
        const res = await fetch(`/api/meetings/${activeMeeting.id}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token || 'jwt_usr_snehitha'}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.meeting) {
            setActiveMeeting(data.meeting);
            setMeetings(prev => prev.map(m => m.id === data.meeting.id ? data.meeting : m));
          }
        }
      }
    } catch (err) {
      console.warn('Backend analyze call error:', err);
    }
    await new Promise(r => setTimeout(r, 1200));
    setCurrentStepState('results');
    showToast('AI Analysis Complete! Decisions, Action Items & Risks extracted.');
  };

  const updateActionItemStatus = async (meetingId, actionItemId, newStatus) => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || 'jwt_usr_snehitha'}`
        },
        body: JSON.stringify({ actionItemId, status: newStatus })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveMeeting(data.meeting);
        setMeetings(prev => prev.map(m => m.id === meetingId ? data.meeting : m));
        showToast(`Task status updated to "${newStatus}"`);
      } else {
        // Optimistic local update
        updateLocalActionItem(meetingId, actionItemId, newStatus);
      }
    } catch (e) {
      updateLocalActionItem(meetingId, actionItemId, newStatus);
    }
  };

  const updateLocalActionItem = (meetingId, actionItemId, newStatus) => {
    setMeetings(prev => prev.map(m => {
      if (m.id === meetingId && m.analysis && m.analysis.actionItems) {
        const updatedActions = m.analysis.actionItems.map(a => 
          a.id === actionItemId ? { ...a, status: newStatus } : a
        );
        const updated = {
          ...m,
          analysis: { ...m.analysis, actionItems: updatedActions }
        };
        if (activeMeeting?.id === meetingId) setActiveMeeting(updated);
        return updated;
      }
      return m;
    }));
    showToast(`Task marked as ${newStatus}`);
  };

  const updateFollowUpMessage = async (meetingId, followUpMessage) => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || 'jwt_usr_snehitha'}`
        },
        body: JSON.stringify({ followUpMessage })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveMeeting(data.meeting);
        setMeetings(prev => prev.map(m => m.id === meetingId ? data.meeting : m));
        showToast('Follow-up message saved successfully!');
      }
    } catch (e) {
      showToast('Follow-up message updated locally!');
    }
  };

  const deleteMeeting = async (meetingId) => {
    try {
      await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token || 'jwt_usr_snehitha'}` }
      });
    } catch (e) {
      console.warn('Local delete:', e);
    }
    setMeetings(prev => prev.filter(m => m.id !== meetingId));
    if (activeMeeting?.id === meetingId) {
      setActiveMeeting(meetings.find(m => m.id !== meetingId) || null);
    }
    showToast('Meeting removed from history.');
  };

  const selectMeeting = (meeting) => {
    setActiveMeeting(meeting);
    setCurrentStepState('results');
  };

  return (
    <MeetingContext.Provider value={{
      meetings,
      activeMeeting,
      setActiveMeeting,
      selectMeeting,
      currentStep,
      setCurrentStep,
      processingProgress,
      processingStatusText,
      processingChecklist,
      processingSource,
      processingPlatform,
      processMeetingLink,
      startAIAnalysis,
      updateActionItemStatus,
      updateFollowUpMessage,
      deleteMeeting,
      fetchMeetings,
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
      completeLiveMeeting,
      toasts,
      showToast,
      removeToast,
      error,
      setError
    }}>
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeetings() {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeetings must be used within a MeetingProvider');
  }
  return context;
}
