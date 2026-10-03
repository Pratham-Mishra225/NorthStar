import { useState, useCallback } from 'react';
import type { LocalState, ActivityAction } from '@/types/career';
import { loadStoredState, saveStoredState } from '@/services/activityStorage';

export function useLocalCareerState() {
  const [local, setLocal] = useState<LocalState>(loadStoredState);
  const [resumeText, setResumeText] = useState('');

  const persist = useCallback((next: LocalState) => {
    setLocal(next);
    saveStoredState(next);
  }, []);

  const addInteraction = useCallback((jobId: string, action: ActivityAction) => {
    setLocal((prev) => {
      const current = prev.interactions[jobId] || [];
      const alreadyActive = current.includes(action);
      if (action === 'saved' && alreadyActive) {
        const next: LocalState = {
          ...prev,
          interactions: { ...prev.interactions, [jobId]: current.filter((item) => item !== action) },
        };
        saveStoredState(next);
        return next;
      }
      if (alreadyActive) return prev;
      const next: LocalState = {
        ...prev,
        interactions: { ...prev.interactions, [jobId]: [...current, action] },
        activityLog: [...prev.activityLog, { jobId, action, timestamp: new Date().toISOString() }],
      };
      saveStoredState(next);
      return next;
    });
  }, []);

  return {
    local,
    persist,
    resumeText,
    setResumeText,
    addInteraction,
  };
}
