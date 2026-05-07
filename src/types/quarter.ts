import type { Quarter } from '../services/quartersService';
import type React from 'react';

// ─── DP filter ────────────────────────────────────────────────────────────────

export type DPFilter = 'all' | 'draft' | 'submitted' | 'allotted' | 'occupied' | 'tenantServices' | 'vacated';

// ─── EO/UI mode types ─────────────────────────────────────────────────────────

export type EOMode = 'self' | 'employee' | null;
export type EORightMode = 'allot' | 'rejection_chat' | 'override' | 'approval_chat' | 'services' | 'inspection' | 'handover';
export type RightAction = null | 'acknowledge' | 'reject' | 'extend' | 'upgrade' | 'vacate';

// ─── Request form types ───────────────────────────────────────────────────────

export interface PrefItem { quarter: Quarter; rank: number }

export interface NewRequestForm {
  request_reason: string; required_bhk_config: string; preferred_location: string;
  move_in_date: string; family_member_count: number; employee_notes: string;
}

export interface StatusCard {
  key: DPFilter; label: string; description: string;
  count: number;
  gradient: string; iconBg: string; textColor: string; countColor: string;
  icon: React.ReactNode;
}

export type ActionPopupType = 'EXTEND' | 'VACATE' | 'GRIEVANCE' | 'MAINTENANCE' | null;

export interface ActionPopupState {
  type: ActionPopupType;
  requestId: string;
  allotmentId: string;
}

export type RequestForType = 'SELF' | 'EMPLOYEE' | 'TP';

export interface DemoEmployee {
  id: string;
  name: string;
  dept: string;
  email: string;
  designation: string;
}

export interface TPInfo {
  name: string;
  organization: string;
  mobile: string;
  email: string;
  pan: string;
  notes: string;
}
