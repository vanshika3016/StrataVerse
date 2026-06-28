/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProjectStatus = 'Active' | 'Completed' | 'Failed' | 'Pending';

export type AutomationType = 'RPA' | 'Cognitive' | 'AI/ML' | 'API Integrator';

export interface RpaProject {
  internal_uid: string; // From dataStream.js
  project_id: string;
  project_name: string;
  department: string;
  project_status: ProjectStatus;
  automation_type: AutomationType;
  robots_deployed: number;
  annual_savings_usd: number;
  budget_usd: number;
  roi_percent: number;
  start_date: string;
  employee_hours_saved: number;
  country: string;
  industry: string;
  implementation_partner: string;
  company_id?: string;
  completion_date?: string;
  ai_enabled?: string;
  cloud_deployment?: string;
}

export interface TelemetryAlert {
  id: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  projectId: string;
  projectName: string;
  rowUid?: string;
}

export interface StreamEvent {
  id: string;
  timestamp: string;
  type: 'update' | 'anomaly' | 'status_change' | 'started' | 'completed' | 'updated' | 'rescheduled' | 'failed';
  message: string;
}

export interface SortRule {
  column: keyof RpaProject;
  direction: 'asc' | 'desc';
}
