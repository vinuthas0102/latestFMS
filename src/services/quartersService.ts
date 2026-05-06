import { supabase } from '../lib/supabase';

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
  request_status: string;
  sub_status: string | null;
  employee_notes: string;
  eo_notes: string;
  // Request-for fields
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
  employee_notes: string;
  preferences: { quarter_id: string; preference_rank: number }[];
  // Request-for
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

export const quartersService = {
  async getQuarters(filters: QuarterFilters = {}): Promise<Quarter[]> {
    let query = supabase
      .from('quarters')
      .select('*')
      .eq('is_active', true);

    if (filters.search) {
      query = query.or(
        `quarter_number.ilike.%${filters.search}%,block_name.ilike.%${filters.search}%,address.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }
    if (filters.quarter_type) {
      query = query.eq('quarter_type', filters.quarter_type);
    }
    if (filters.furnishing_status) {
      query = query.eq('furnishing_status', filters.furnishing_status);
    }
    if (filters.occupancy_status) {
      query = query.eq('occupancy_status', filters.occupancy_status);
    }
    if (filters.bhk_config) {
      query = query.eq('bhk_config', filters.bhk_config);
    }
    if (filters.min_rent !== undefined) {
      query = query.gte('monthly_rent', filters.min_rent);
    }
    if (filters.max_rent !== undefined) {
      query = query.lte('monthly_rent', filters.max_rent);
    }

    const { data, error } = await query.order('quarter_number');
    if (error) throw error;
    return (data ?? []) as Quarter[];
  },

  async getQuarterById(id: string): Promise<Quarter | null> {
    const { data, error } = await supabase
      .from('quarters')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Quarter | null;
  },

  async getMyRequests(employeeAuthId: string): Promise<QuarterRequest[]> {
    const { data, error } = await supabase
      .from('quarter_requests')
      .select(`
        *,
        preferences:quarter_request_preferences(
          *,
          quarter:quarters(*)
        ),
        allotment:quarter_allotments(
          *,
          quarter:quarters(*)
        )
      `)
      .eq('employee_id', employeeAuthId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    // Supabase returns one-to-many joins as arrays; normalise allotment to a single object
    const normalised = (data ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      allotment: Array.isArray(r.allotment) ? (r.allotment[0] ?? null) : r.allotment,
    }));
    return normalised as unknown as QuarterRequest[];
  },

  async getActiveCycle(): Promise<QuarterAllotmentCycle | null> {
    const { data, error } = await supabase
      .from('quarter_allotment_cycles')
      .select('*')
      .eq('status', 'OPEN')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as QuarterAllotmentCycle | null;
  },

  async getAllotmentCycles(): Promise<QuarterAllotmentCycle[]> {
    const { data, error } = await supabase
      .from('quarter_allotment_cycles')
      .select('*')
      .order('start_date', { ascending: false });
    if (error) throw error;
    return (data ?? []) as QuarterAllotmentCycle[];
  },

  async getAllotmentsForCycle(cycleId: string): Promise<QuarterAllotment[]> {
    const { data, error } = await supabase
      .from('quarter_allotments')
      .select(`
        *,
        quarter:quarters(*),
        request:quarter_requests(*)
      `)
      .eq('request.cycle_id', cycleId);
    if (error) throw error;
    return (data ?? []) as unknown as QuarterAllotment[];
  },

  async getRequestsForCycle(cycleId: string): Promise<QuarterRequest[]> {
    const { data, error } = await supabase
      .from('quarter_requests')
      .select(`
        *,
        preferences:quarter_request_preferences(
          *,
          quarter:quarters(*)
        ),
        allotment:quarter_allotments(
          *,
          quarter:quarters(*)
        )
      `)
      .eq('cycle_id', cycleId)
      .order('created_at');
    if (error) throw error;
    return (data ?? []) as unknown as QuarterRequest[];
  },

  async createRequest(employeeAuthId: string, input: CreateQuarterRequestInput): Promise<QuarterRequest> {
    const ACTIVE_STATUSES = ['DRAFT', 'SUBMITTED', 'ALLOTTED', 'ACKNOWLEDGED', 'EXTEND_REQUESTED', 'UPGRADE_REQUESTED', 'VACATE_REQUESTED'];
    const { count, error: countErr } = await supabase
      .from('quarter_requests')
      .select('id', { count: 'exact', head: true })
      .eq('employee_id', employeeAuthId)
      .in('request_status', ACTIVE_STATUSES);
    if (countErr) throw countErr;
    if ((count ?? 0) >= 2) {
      throw new Error('MAX_QUARTERS_REACHED');
    }

    const reqNumber = `REQ-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

    const { data: req, error: reqErr } = await supabase
      .from('quarter_requests')
      .insert({
        employee_id: employeeAuthId,
        request_number: reqNumber,
        cycle_id: input.cycle_id,
        request_reason: input.request_reason,
        required_bhk_config: input.required_bhk_config,
        preferred_location: input.preferred_location,
        move_in_date: input.move_in_date,
        family_member_count: input.family_member_count,
        employee_notes: input.employee_notes,
        request_status: 'DRAFT',
        request_for: input.request_for ?? 'SELF',
        on_behalf_employee_id: input.on_behalf_employee_id ?? null,
        on_behalf_employee_name: input.on_behalf_employee_name ?? null,
        on_behalf_employee_dept: input.on_behalf_employee_dept ?? null,
        tp_name: input.tp_name ?? null,
        tp_organization: input.tp_organization ?? null,
        tp_mobile: input.tp_mobile ?? null,
        tp_email: input.tp_email ?? null,
        tp_pan: input.tp_pan ?? null,
        tp_notes: input.tp_notes ?? null,
      })
      .select()
      .single();
    if (reqErr) throw reqErr;

    if (input.preferences.length > 0) {
      const prefs = input.preferences.map(p => ({
        request_id: req.id,
        quarter_id: p.quarter_id,
        preference_rank: p.preference_rank,
        pref_status: 'PENDING',
      }));
      const { error: prefErr } = await supabase.from('quarter_request_preferences').insert(prefs);
      if (prefErr) throw prefErr;
    }

    return req as QuarterRequest;
  },

  async submitRequest(requestId: string): Promise<void> {
    const { error } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'SUBMITTED', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) throw error;
  },

  async withdrawRequest(requestId: string): Promise<void> {
    const { error } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'WITHDRAWN', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) throw error;
  },

  async updateRequestPreferences(
    requestId: string,
    preferences: { quarter_id: string; preference_rank: number }[]
  ): Promise<void> {
    const { error: delErr } = await supabase
      .from('quarter_request_preferences')
      .delete()
      .eq('request_id', requestId);
    if (delErr) throw delErr;

    if (preferences.length > 0) {
      const prefs = preferences.map(p => ({
        request_id: requestId,
        quarter_id: p.quarter_id,
        preference_rank: p.preference_rank,
        pref_status: 'PENDING',
      }));
      const { error } = await supabase.from('quarter_request_preferences').insert(prefs);
      if (error) throw error;
    }
  },

  async saveOverride(allottedByAuthId: string, input: OverrideInput): Promise<void> {
    const { error: logErr } = await supabase.from('quarter_override_logs').insert({
      allotment_id: input.allotment_id,
      request_a_id: input.request_a_id,
      request_b_id: input.request_b_id ?? null,
      action_type: input.action_type,
      justification: input.justification,
      done_by: allottedByAuthId,
    });
    if (logErr) throw logErr;

    const updates: Record<string, unknown> = {
      is_overridden: true,
      updated_at: new Date().toISOString(),
    };
    if (input.new_quarter_id) {
      updates.quarter_id = input.new_quarter_id;
    }

    const { error: updErr } = await supabase
      .from('quarter_allotments')
      .update(updates)
      .eq('id', input.allotment_id);
    if (updErr) throw updErr;
  },

  async finaliseAllotments(cycleId: string, allottedByAuthId: string, requests: QuarterRequest[]): Promise<void> {
    for (const req of requests) {
      if (req.request_status !== 'SUBMITTED') continue;
      if (!req.preferences || req.preferences.length === 0) continue;
      const topPref = req.preferences.sort((a, b) => a.preference_rank - b.preference_rank)[0];

      const existing = req.allotment;
      if (existing) continue;

      await supabase.from('quarter_allotments').insert({
        request_id: req.id,
        quarter_id: topPref.quarter_id,
        allotted_by: allottedByAuthId,
        allotment_date: new Date().toISOString().split('T')[0],
        approval_status: 'PENDING',
      });

      await supabase
        .from('quarter_requests')
        .update({ request_status: 'ALLOTTED', updated_at: new Date().toISOString() })
        .eq('id', req.id);
    }

    await supabase
      .from('quarter_allotment_cycles')
      .update({ status: 'CLOSED', updated_at: new Date().toISOString() })
      .eq('id', cycleId);
  },

  async acknowledgeAllotment(allotmentId: string, requestId: string, remarks: string): Promise<void> {
    const now = new Date().toISOString();
    const { error: aErr } = await supabase
      .from('quarter_allotments')
      .update({ approval_status: 'ACKNOWLEDGED', acknowledgement_remarks: remarks, acknowledged_at: now, updated_at: now })
      .eq('id', allotmentId);
    if (aErr) throw aErr;
    const { error: rErr } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'ACKNOWLEDGED', updated_at: now })
      .eq('id', requestId);
    if (rErr) throw rErr;
  },

  async rejectAllotment(allotmentId: string, requestId: string, reason: string, docUrl?: string): Promise<void> {
    const now = new Date().toISOString();
    const { error: aErr } = await supabase
      .from('quarter_allotments')
      .update({ approval_status: 'REJECTED', rejection_reason: reason, rejection_doc_url: docUrl ?? '', rejected_at: now, updated_at: now })
      .eq('id', allotmentId);
    if (aErr) throw aErr;
    const { error: rErr } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'REJECTED', updated_at: now })
      .eq('id', requestId);
    if (rErr) throw rErr;
  },

  async createTenantRequest(employeeId: string, allotmentId: string, input: CreateTenantRequestInput): Promise<QuarterTenantRequest> {
    const { data, error } = await supabase
      .from('quarter_tenant_requests')
      .insert({
        allotment_id: allotmentId,
        employee_id: employeeId,
        service_type: input.service_type,
        remarks: input.remarks,
        reason: input.reason,
        document_url: input.document_url ?? '',
        requested_date: input.requested_date ?? null,
        required_bhk_config: input.required_bhk_config ?? '',
        grievance_subject: input.grievance_subject ?? '',
        urgency_level: input.urgency_level ?? 'NORMAL',
      })
      .select()
      .single();
    if (error) throw error;

    // update request status to reflect pending tenant service
    const statusMap: Record<string, string> = {
      EXTEND: 'EXTEND_REQUESTED',
      UPGRADE: 'UPGRADE_REQUESTED',
      VACATE: 'VACATE_REQUESTED',
    };
    await supabase
      .from('quarter_requests')
      .update({ request_status: statusMap[input.service_type], updated_at: new Date().toISOString() })
      .eq('id', (await supabase.from('quarter_allotments').select('request_id').eq('id', allotmentId).single()).data?.request_id);

    return data as QuarterTenantRequest;
  },

  async getMyTenantRequests(employeeId: string): Promise<QuarterTenantRequest[]> {
    const { data, error } = await supabase
      .from('quarter_tenant_requests')
      .select(`*, allotment:quarter_allotments(*, quarter:quarters(*))`)
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as QuarterTenantRequest[];
  },

  async withdrawTenantRequest(tenantRequestId: string): Promise<void> {
    const { error } = await supabase
      .from('quarter_tenant_requests')
      .update({ request_status: 'WITHDRAWN', updated_at: new Date().toISOString() })
      .eq('id', tenantRequestId);
    if (error) throw error;
  },

  async getAllRequests(): Promise<QuarterRequest[]> {
    const { data, error } = await supabase
      .from('quarter_requests')
      .select(`
        *,
        preferences:quarter_request_preferences(*, quarter:quarters(*)),
        allotment:quarter_allotments(*, quarter:quarters(*))
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as QuarterRequest[];
  },

  async getAllTenantRequests(): Promise<QuarterTenantRequest[]> {
    const { data, error } = await supabase
      .from('quarter_tenant_requests')
      .select(`*, allotment:quarter_allotments(*, quarter:quarters(*))`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as QuarterTenantRequest[];
  },

  async approveTenantRequest(tenantRequestId: string, requestId: string, serviceType: string, eoNotes: string): Promise<void> {
    const now = new Date().toISOString();
    const { error: tErr } = await supabase
      .from('quarter_tenant_requests')
      .update({ request_status: 'APPROVED', eo_notes: eoNotes, updated_at: now })
      .eq('id', tenantRequestId);
    if (tErr) throw tErr;

    const nextStatus: Record<string, string> = {
      VACATE: 'VACATED',
      EXTEND: 'ACKNOWLEDGED',
      UPGRADE: 'ALLOTTED',
    };
    if (nextStatus[serviceType]) {
      await supabase
        .from('quarter_requests')
        .update({ request_status: nextStatus[serviceType], updated_at: now })
        .eq('id', requestId);
    }
  },

  async rejectTenantRequest(tenantRequestId: string, requestId: string, serviceType: string, eoNotes: string): Promise<void> {
    const now = new Date().toISOString();
    const { error: tErr } = await supabase
      .from('quarter_tenant_requests')
      .update({ request_status: 'REJECTED', eo_notes: eoNotes, updated_at: now })
      .eq('id', tenantRequestId);
    if (tErr) throw tErr;

    const revertStatus: Record<string, string> = {
      VACATE: 'ACKNOWLEDGED',
      EXTEND: 'ACKNOWLEDGED',
      UPGRADE: 'ALLOTTED',
    };
    if (revertStatus[serviceType]) {
      await supabase
        .from('quarter_requests')
        .update({ request_status: revertStatus[serviceType], updated_at: now })
        .eq('id', requestId);
    }
  },

  async deallocateRequest(allotmentId: string, requestId: string): Promise<void> {
    const now = new Date().toISOString();
    const { error: delErr } = await supabase.from('quarter_allotments').delete().eq('id', allotmentId);
    if (delErr) throw delErr;
    const { error: updErr } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'SUBMITTED', updated_at: now })
      .eq('id', requestId);
    if (updErr) throw updErr;
  },

  async cancelAllocatedRequest(allotmentId: string, requestId: string): Promise<void> {
    const now = new Date().toISOString();
    const { error: delErr } = await supabase.from('quarter_allotments').delete().eq('id', allotmentId);
    if (delErr) throw delErr;
    const { error: updErr } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'WITHDRAWN', updated_at: now })
      .eq('id', requestId);
    if (updErr) throw updErr;
  },

  async getQuartersSummary(): Promise<{ total: number; available: number; occupied: number }> {
    const { data, error } = await supabase.from('quarters').select('occupancy_status').eq('is_active', true);
    if (error) throw error;
    const rows = (data ?? []) as { occupancy_status: string }[];
    return {
      total: rows.length,
      available: rows.filter(r => r.occupancy_status === 'AVAILABLE').length,
      occupied: rows.filter(r => r.occupancy_status === 'OCCUPIED').length,
    };
  },

  // ─── Decline allotment (employee declines, request goes back to SUBMITTED) ──
  async declineAllotment(allotmentId: string, requestId: string, reason: string, docUrl?: string): Promise<void> {
    const now = new Date().toISOString();
    const { error: aErr } = await supabase
      .from('quarter_allotments')
      .update({ approval_status: 'DECLINED', rejection_reason: reason, rejection_doc_url: docUrl ?? '', rejected_at: now, updated_at: now })
      .eq('id', allotmentId);
    if (aErr) throw aErr;
    const { error: rErr } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'SUBMITTED', sub_status: 'DECLINED', updated_at: now })
      .eq('id', requestId);
    if (rErr) throw rErr;
  },

  // ─── Decline & cancel request ────────────────────────────────────────────────
  async declineAndCancelRequest(allotmentId: string, requestId: string, reason: string, docUrl?: string): Promise<void> {
    const now = new Date().toISOString();
    const { error: aErr } = await supabase
      .from('quarter_allotments')
      .update({ approval_status: 'DECLINED', rejection_reason: reason, rejection_doc_url: docUrl ?? '', rejected_at: now, updated_at: now })
      .eq('id', allotmentId);
    if (aErr) throw aErr;
    const { error: rErr } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'CANCELLED', sub_status: 'DECLINED', updated_at: now })
      .eq('id', requestId);
    if (rErr) throw rErr;
  },

  // ─── Update request header fields (for Draft inline editing) ────────────────
  async updateRequestHeader(
    requestId: string,
    data: {
      request_reason?: string;
      required_bhk_config?: string;
      preferred_location?: string;
      move_in_date?: string | null;
      family_member_count?: number;
      employee_notes?: string;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('quarter_requests')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) throw error;
  },

  // ─── Cancel a draft request ──────────────────────────────────────────────────
  async cancelRequest(requestId: string): Promise<void> {
    const { error } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) throw error;
  },

  // ─── Service chats ───────────────────────────────────────────────────────────
  async getServiceChats(tenantRequestId: string): Promise<QuarterServiceChat[]> {
    const { data, error } = await supabase
      .from('quarter_service_chats')
      .select('*')
      .eq('tenant_request_id', tenantRequestId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as QuarterServiceChat[];
  },

  async addServiceChat(
    tenantRequestId: string,
    authorId: string,
    authorRole: 'EMPLOYEE' | 'EO',
    message: string,
    documentUrls: string[]
  ): Promise<QuarterServiceChat> {
    const { data, error } = await supabase
      .from('quarter_service_chats')
      .insert({
        tenant_request_id: tenantRequestId,
        author_id: authorId,
        author_role: authorRole,
        message,
        document_urls: documentUrls,
      })
      .select()
      .single();
    if (error) throw error;
    return data as QuarterServiceChat;
  },

  async closeService(tenantRequestId: string, requestId: string, serviceType: string): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('quarter_tenant_requests')
      .update({ request_status: 'WITHDRAWN', updated_at: now })
      .eq('id', tenantRequestId);
    if (error) throw error;
    // Revert request status back to ACKNOWLEDGED if this was a pending service
    const revertMap: Record<string, string> = {
      EXTEND: 'ACKNOWLEDGED',
      UPGRADE: 'ACKNOWLEDGED',
      VACATE: 'ACKNOWLEDGED',
      GRIEVANCE: 'ACKNOWLEDGED',
      MAINTENANCE: 'ACKNOWLEDGED',
    };
    if (revertMap[serviceType] && requestId) {
      await supabase
        .from('quarter_requests')
        .update({ request_status: revertMap[serviceType], updated_at: now })
        .eq('id', requestId);
    }
  },

  async getServiceChatsForAllotment(allotmentId: string): Promise<QuarterServiceChat[]> {
    const { data: tenantReqs, error: tErr } = await supabase
      .from('quarter_tenant_requests')
      .select('id')
      .eq('allotment_id', allotmentId);
    if (tErr) throw tErr;
    const ids = (tenantReqs ?? []).map((r: { id: string }) => r.id);
    if (ids.length === 0) return [];
    const { data, error } = await supabase
      .from('quarter_service_chats')
      .select('*')
      .in('tenant_request_id', ids)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as QuarterServiceChat[];
  },

  // ─── Allotment chats ─────────────────────────────────────────────────────────
  async getAllotmentChats(allotmentId: string): Promise<QuarterAllotmentChat[]> {
    const { data, error } = await supabase
      .from('quarter_allotment_chats')
      .select('*')
      .eq('allotment_id', allotmentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as QuarterAllotmentChat[];
  },

  async addAllotmentChat(
    allotmentId: string,
    authorId: string,
    authorRole: 'employee' | 'eo' | 'system',
    message: string,
    documentUrls: string[] = [],
  ): Promise<QuarterAllotmentChat> {
    const { data, error } = await supabase
      .from('quarter_allotment_chats')
      .insert({ allotment_id: allotmentId, author_id: authorId, author_role: authorRole, message, document_urls: documentUrls })
      .select()
      .single();
    if (error) throw error;
    return data as QuarterAllotmentChat;
  },
};
