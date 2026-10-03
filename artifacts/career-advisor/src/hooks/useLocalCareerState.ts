import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetInteractions,
  useRecordInteraction,
  getGetInteractionsQueryKey,
  getGetReportsQueryKey,
  getGetDashboardQueryKey,
} from '@ai-career-advisor/api-client';
import type { LocalState, ActivityAction } from '@/types/career';

export function useLocalCareerState() {
  const queryClient = useQueryClient();
  const interactionsQuery = useGetInteractions();
  const recordMutation = useRecordInteraction();

  const [local, setLocal] = useState<LocalState>({
    targetRoleId: '',
    analysis: null,
    interactions: {},
    activityLog: [],
  });

  const [resumeText, setResumeText] = useState('');

  // Sync state whenever MongoDB returns persistent user interactions
  useEffect(() => {
    if (interactionsQuery.data) {
      setLocal((prev) => ({
        ...prev,
        interactions: (interactionsQuery.data.interactions || {}) as Record<string, ActivityAction[]>,
        activityLog: interactionsQuery.data.activityLog || [],
      }));
    }
  }, [interactionsQuery.data]);

  const persist = useCallback((next: LocalState) => {
    setLocal(next);
  }, []);

  const addInteraction = useCallback((jobId: string, action: ActivityAction) => {
    // Optimistic UI update
    setLocal((prev) => {
      const current = prev.interactions[jobId] || [];
      const alreadyActive = current.includes(action);
      if (action === 'saved' && alreadyActive) {
        return {
          ...prev,
          interactions: { ...prev.interactions, [jobId]: current.filter((item) => item !== action) },
        };
      }
      if (alreadyActive) return prev;
      return {
        ...prev,
        interactions: { ...prev.interactions, [jobId]: [...current, action] },
        activityLog: [{ id: `${jobId}-${Date.now()}`, userId: 'current', jobId, action, timestamp: new Date().toISOString() }, ...prev.activityLog],
      };
    });

    // Send persistent mutation to MongoDB
    recordMutation.mutate(
      { data: { jobId, action } },
      {
        onSuccess: (data) => {
          setLocal((prev) => ({
            ...prev,
            interactions: (data.interactions || {}) as Record<string, ActivityAction[]>,
            activityLog: data.activityLog || [],
          }));
          queryClient.invalidateQueries({ queryKey: getGetInteractionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetReportsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        },
      }
    );
  }, [recordMutation, queryClient]);

  return {
    local,
    persist,
    resumeText,
    setResumeText,
    addInteraction,
  };
}
