// ── Payable Criteria MT types ──────────────────────────────────────────────────

export type PayableTransactionType =
  | 'PP'
  | 'TPF'
  | 'EMD'
  | 'SD'
  | 'RENT'
  | 'LEASE'
  | 'MAINT'
  | 'LOAN'
  | 'PURCHASE'
  | 'TAX'
  | 'INSURANCE';

export const PAYABLE_TRANSACTION_TYPES: PayableTransactionType[] = [
  'PP', 'TPF', 'EMD', 'SD', 'RENT', 'LEASE', 'MAINT', 'LOAN', 'PURCHASE', 'TAX', 'INSURANCE',
];

export const PAYABLE_TRANSACTION_TYPE_LABELS: Record<PayableTransactionType, string> = {
  PP: 'Processing Payment (PP)',
  TPF: 'Tender Processing Fee (TPF)',
  EMD: 'Earnest Money Deposit (EMD)',
  SD: 'Security Deposit (SD)',
  RENT: 'Rent',
  LEASE: 'Lease',
  MAINT: 'Maintenance',
  LOAN: 'Loan Instalment',
  PURCHASE: 'Purchase',
  TAX: 'Tax',
  INSURANCE: 'Insurance',
};

export type PaymentMode = 'EPAY' | 'MANUAL' | 'SALARY_ADJUSTED' | 'CHEQUE' | 'DD' | 'ONLINE';

export const ALL_PAYMENT_MODES: PaymentMode[] = [
  'EPAY', 'MANUAL', 'SALARY_ADJUSTED', 'CHEQUE', 'DD', 'ONLINE',
];

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  EPAY: 'E-Pay',
  MANUAL: 'Manual',
  SALARY_ADJUSTED: 'Salary Adjusted',
  CHEQUE: 'Cheque',
  DD: 'Demand Draft',
  ONLINE: 'Online',
};

export type ReferenceDateType =
  | 'payable_generation_date'
  | 'allotment_submitted_date'
  | 'allotted_date'
  | 'accepted_date'
  | 'handover_date'
  | 'calendar_year_beginning'
  | 'fiscal_year_beginning';

export const ALL_REFERENCE_DATES: ReferenceDateType[] = [
  'payable_generation_date',
  'allotment_submitted_date',
  'allotted_date',
  'accepted_date',
  'handover_date',
  'calendar_year_beginning',
  'fiscal_year_beginning',
];

export const REFERENCE_DATE_LABELS: Record<ReferenceDateType, string> = {
  payable_generation_date: 'Payable Generation Date',
  allotment_submitted_date: 'Allotment Submitted Date',
  allotted_date: 'Allotted Date',
  accepted_date: 'Accepted Date',
  handover_date: 'Handover Date',
  calendar_year_beginning: 'Calendar Year Beginning',
  fiscal_year_beginning: 'Fiscal Year Beginning',
};

export interface DiscountSlabRow {
  days_offset: number;
  discount_pct: number;
  discount_amount: number;
  applicable_days: number;
}

export interface PayableFullPaymentSpec {
  id?: string;
  criteria_id?: string;
  reference_date: ReferenceDateType;
  days_offset: number;
  discount_slabs: DiscountSlabRow[];
}

export interface PayableAdvanceSpec {
  id?: string;
  criteria_id?: string;
  advance_type: 'PERCENTAGE' | 'AMOUNT';
  advance_value: number;
  reference_date: ReferenceDateType;
  days_offset: number;
}

export interface PayableInstallmentSpec {
  id?: string;
  criteria_id?: string;
  installment_type: 'PERCENTAGE' | 'AMOUNT';
  installment_value: number;
  reference_date: ReferenceDateType;
  days_offset: number;
}

export interface PayablePenaltySlab {
  id?: string;
  criteria_id?: string;
  slab_row: number;
  penalty_type: 'PERCENTAGE' | 'AMOUNT';
  penalty_value: number;
  late_days: number;
}

export interface PayableAlertSpec {
  id?: string;
  criteria_id?: string;
  days_before_due: number;
  message_hook: string;
}

export interface PayableCriteria {
  id: string;
  dept: string;
  subdept: string;
  module_id: string;
  location: string;
  grade_designation: string;
  payable_transaction_type: PayableTransactionType;
  first_btm_run_date: string | null;
  subsequent_btm_run_day: string;
  next_run_date: string | null;
  available_payment_modes: PaymentMode[];
  include_gst: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Child specs (populated when fetched with joins)
  full_payment_spec?: PayableFullPaymentSpec | null;
  advance_spec?: PayableAdvanceSpec | null;
  installment_spec?: PayableInstallmentSpec | null;
  penalty_slabs?: PayablePenaltySlab[];
  alert_spec?: PayableAlertSpec | null;
}

export interface PayableCriteriaInput {
  dept: string;
  subdept: string;
  module_id: string;
  location: string;
  grade_designation: string;
  payable_transaction_type: PayableTransactionType;
  first_btm_run_date: string | null;
  subsequent_btm_run_day: string;
  next_run_date: string | null;
  available_payment_modes: PaymentMode[];
  include_gst: boolean;
  is_active: boolean;
  full_payment_spec: PayableFullPaymentSpec;
  advance_spec: PayableAdvanceSpec;
  installment_spec: PayableInstallmentSpec;
  penalty_slabs: PayablePenaltySlab[];
  alert_spec: PayableAlertSpec;
}
