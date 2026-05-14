export interface Quarter {
  id: string;
  estate_id: string | null;
  quarter_number: string;
  block_name: string;
  floor_number: number;
  bhk_config: string;
  area_sqft: number;
  monthly_rent: number;
  quarter_type: string;
  furnishing_status: string;
  toilet_type: string;
  amenities: string[];
  images: string[];
  description: string;
  address: string;
  occupancy_status: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Extended fields
  region: string;
  district: string;
  pin_code: string;
  unit_number: string;
  quota: string;
  counter_no: string;
  location_area: string;
  facing: string;
  total_floors: number;
  total_area_sqft: number;
  toilet_western: boolean;
  toilet_indian: boolean;
  parking_details: string;
  electricity_rate: number;
  water_charges: number;
  penalty_terms: string;
  pooja_room: boolean;
  electrical_fixtures: string;
  power_backup: boolean;
  water_heating: string;
  lift_access: boolean;
  kitchen_exhaust: boolean;
  housing_style: string;
  balcony: boolean;
  renovation_status: string;
  resident_type: string;
  current_availability_status: string;
}

export type RequestType = 'GENERAL' | 'MEDICAL' | 'REFERENCE';

export interface QuarterRequest {
  id: string;
  request_number: string;
  employee_id: string;
  cycle_id: string | null;
  initiation_type: string;
  request_reason: string;
  required_bhk_config: string;
  preferred_location: string;
  move_in_date: string | null;
  family_member_count: number;
  request_type: RequestType;
  request_status: string;
  sub_status: string | null;
  employee_notes: string;
  eo_notes: string;
  request_for: 'SELF' | 'EMPLOYEE' | 'TP';
  on_behalf_employee_id: string | null;
  on_behalf_employee_name: string | null;
  on_behalf_employee_dept: string | null;
  tp_name: string | null;
  tp_organization: string | null;
  tp_mobile: string | null;
  tp_email: string | null;
  tp_pan: string | null;
  tp_notes: string | null;
  created_at: string;
  updated_at: string;
  preferences?: QuarterRequestPreference[];
  allotment?: QuarterAllotment | null;
}

export interface QuarterServiceChat {
  id: string;
  tenant_request_id: string;
  author_id: string;
  author_role: 'EMPLOYEE' | 'EO';
  message: string;
  document_urls: string[];
  created_at: string;
}

export interface QuarterAllotmentChat {
  id: string;
  allotment_id: string;
  author_id: string;
  author_role: 'employee' | 'eo' | 'system';
  message: string;
  document_urls: string[];
  created_at: string;
}

export interface QuarterRequestPreference {
  id: string;
  request_id: string;
  quarter_id: string;
  preference_rank: number;
  pref_status: string;
  quarter?: Quarter;
}

export interface QuarterAllotmentCycle {
  id: string;
  cycle_name: string;
  cycle_code: string;
  start_date: string;
  end_date: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  request_count?: number;
  allotted_count?: number;
  pending_count?: number;
  overridden_count?: number;
}

export interface QuarterAllotment {
  id: string;
  request_id: string;
  quarter_id: string;
  allotted_by: string;
  allotment_date: string;
  is_overridden: boolean;
  approval_status: string;
  allotment_conditions: string;
  vacate_date: string | null;
  acknowledgement_remarks: string;
  rejection_reason: string;
  rejection_doc_url: string;
  acknowledged_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
  quarter?: Quarter;
  request?: QuarterRequest;
}

export interface QuarterTenantRequest {
  id: string;
  allotment_id: string;
  employee_id: string;
  service_type: 'EXTEND' | 'UPGRADE' | 'VACATE' | 'GRIEVANCE' | 'MAINTENANCE';
  request_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  remarks: string;
  reason: string;
  document_url: string;
  requested_date: string | null;
  required_bhk_config: string;
  eo_notes: string;
  grievance_subject: string;
  urgency_level: string;
  retention_reason: string;
  requested_months: number | null;
  upgrade_mode: 'AUTO' | 'SELECTED' | null;
  target_quarter_id: string | null;
  created_at: string;
  updated_at: string;
  allotment?: QuarterAllotment;
}

export interface CreateTenantRequestInput {
  service_type: 'EXTEND' | 'UPGRADE' | 'VACATE' | 'GRIEVANCE' | 'MAINTENANCE';
  remarks: string;
  reason: string;
  document_url?: string;
  requested_date?: string | null;
  required_bhk_config?: string;
  grievance_subject?: string;
  urgency_level?: string;
  retention_reason?: string;
  requested_months?: number | null;
  upgrade_mode?: 'AUTO' | 'SELECTED';
  target_quarter_id?: string | null;
}

export interface QuarterFilters {
  search?: string;
  quarter_type?: string;
  furnishing_status?: string;
  occupancy_status?: string;
  min_rent?: number;
  max_rent?: number;
  bhk_config?: string;
}

export interface CreateQuarterRequestInput {
  cycle_id: string | null;
  request_reason: string;
  required_bhk_config: string;
  preferred_location: string;
  move_in_date: string | null;
  family_member_count: number;
  request_type: RequestType;
  employee_notes: string;
  preferences: { quarter_id: string; preference_rank: number }[];
  request_for?: 'SELF' | 'EMPLOYEE' | 'TP';
  on_behalf_employee_id?: string | null;
  on_behalf_employee_name?: string | null;
  on_behalf_employee_dept?: string | null;
  tp_name?: string | null;
  tp_organization?: string | null;
  tp_mobile?: string | null;
  tp_email?: string | null;
  tp_pan?: string | null;
  tp_notes?: string | null;
}

export interface OverrideInput {
  allotment_id: string;
  request_a_id: string;
  request_b_id?: string;
  action_type: string;
  justification: string;
  new_quarter_id?: string;
  b_new_quarter_id?: string;
}

export interface QuarterApprovalWorkflow {
  id: string;
  workflow_name: string;
  description: string;
  levels: { level: number; approver_role: string; approver_title: string }[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuarterAllotmentApproval {
  id: string;
  allotment_id: string;
  workflow_id: string;
  current_level: number;
  max_level: number;
  status: string;
  initiated_by: string;
  created_at: string;
  updated_at: string;
  workflow?: QuarterApprovalWorkflow;
}

export interface QuarterApprovalChat {
  id: string;
  approval_id: string;
  author_id: string;
  author_role: string;
  message: string;
  document_urls: string[];
  created_at: string;
}

export interface QuarterRequestApproval {
  id: string;
  request_id: string;
  workflow_id: string | null;
  current_level: number;
  max_level: number;
  status: string;
  initiated_by: string | null;
  created_at: string;
  updated_at: string;
  workflow?: QuarterApprovalWorkflow;
}

export interface QuarterRequestApprovalChat {
  id: string;
  request_approval_id: string;
  author_id: string | null;
  author_role: string;
  message: string;
  action_type: string;
  level_snapshot: number | null;
  document_urls: string[];
  created_at: string;
}

export interface CreateQuarterInput {
  unit_number: string;
  quarter_number: string;
  quarter_type: string;
  bhk_config: string;
  quota: string;
  counter_no: string;
  block_name: string;
  location_area: string;
  region: string;
  district: string;
  pin_code: string;
  address: string;
  floor_number: number;
  total_floors: number;
  facing: string;
  total_area_sqft: number;
  area_sqft: number;
  resident_type: string;
  toilet_western: boolean;
  toilet_indian: boolean;
  toilet_type: string;
  parking_details: string;
  current_availability_status: string;
  monthly_rent: number;
  electricity_rate: number;
  water_charges: number;
  penalty_terms: string;
  pooja_room: boolean;
  electrical_fixtures: string;
  power_backup: boolean;
  water_heating: string;
  lift_access: boolean;
  kitchen_exhaust: boolean;
  housing_style: string;
  balcony: boolean;
  renovation_status: string;
  furnishing_status: string;
  description: string;
  estate_id: string | null;
}

export interface QuarterInspection {
  id: string;
  allotment_id: string;
  created_by: string;
  status: string;
  inspector_name: string;
  opening_remarks: string;
  closing_remarks: string;
  property_condition: string;
  created_at: string;
  closed_at: string | null;
}

export interface QuarterInspectionChecklistItem {
  id: string;
  inspection_id: string;
  category: 'CIVIL' | 'ELECTRICAL';
  item_name: string;
  default_qty: number | null;
  actual_qty: number | null;
  qty_label: string | null;
  is_checked: boolean;
  remarks: string;
  created_at: string;
}

export interface QuarterInspectionChat {
  id: string;
  inspection_id: string;
  author_id: string;
  author_role: string;
  message: string;
  document_urls: string[];
  created_at: string;
}

export interface QuarterHandover {
  id: string;
  allotment_id: string;
  created_by: string;
  key_number: string;
  remarks: string;
  occupying_deadline: string;
  interior_doc_url: string;
  inspection_report_url: string;
  created_at: string;
  updated_at: string;
}

export interface QuarterGuestInfo {
  id: string;
  allotment_id: string;
  guest_name: string;
  guest_mobile: string;
  guest_email: string;
  aadhaar_doc_url: string;
  pan_doc_url: string;
  other_doc_urls: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}
