import type { LocalState } from '@/types/career';

const STORAGE_KEY = 'career-advisor-demo-v1';

export const loadStoredState = (): LocalState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const value = JSON.parse(stored) as Partial<LocalState>;
      return {
        targetRoleId: value.targetRoleId || '',
        analysis: value.analysis || null,
        interactions: value.interactions || {},
        activityLog: Array.isArray(value.activityLog) ? value.activityLog : [],
      };
    }
  } catch {
    /* Start with a clean demo workspace if browser storage is unavailable. */
  }
  return { targetRoleId: '', analysis: null, interactions: {}, activityLog: [] };
};

export const saveStoredState = (next: LocalState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* Storage is optional. */
  }
};
