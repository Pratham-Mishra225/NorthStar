import type { ResumeAnalysis } from '@ai-career-advisor/api-client';

export type ActivityAction = 'viewed' | 'saved' | 'applied';

export interface ActivityEvent {
  jobId: string;
  action: ActivityAction;
  timestamp: string;
}

export interface LocalState {
  targetRoleId: string;
  analysis: ResumeAnalysis | null;
  interactions: Record<string, ActivityAction[]>;
  activityLog: ActivityEvent[];
}
