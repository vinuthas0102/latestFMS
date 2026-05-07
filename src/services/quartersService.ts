import { supabase } from '../lib/supabase';

// Re-export all types for backwards compatibility
export type {
  Quarter,
  QuarterRequest,
  QuarterServiceChat,
  QuarterAllotmentChat,
  QuarterRequestPreference,
  QuarterAllotmentCycle,
  QuarterAllotment,
  QuarterTenantRequest,
  CreateTenantRequestInput,
  QuarterFilters,
  CreateQuarterRequestInput,
  OverrideInput,
  QuarterApprovalWorkflow,
  QuarterAllotmentApproval,
  QuarterApprovalChat,
  QuarterInspection,
  QuarterInspectionChat,
  QuarterHandover,
  QuarterGuestInfo,
} from '../types/quarters';

import type {
  Quarter,
  QuarterRequest,
  QuarterServiceChat,
  QuarterAllotmentChat,
  QuarterAllotmentCycle,
  QuarterAllotment,
  QuarterTenantRequest,
  CreateTenantRequestInput,
  QuarterFilters,
  CreateQuarterRequestInput,
  OverrideInput,
  QuarterApprovalWorkflow,
  QuarterAllotmentApproval,
  QuarterApprovalChat,
  QuarterInspection,
  QuarterInspectionChat,
  QuarterHandover,
  QuarterGuestInfo,
} from '../types/quarters';

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
    if (filters.quarter_type) query = query.eq('quarter_type', filters.quarter_type);
    if (filters.furnishing_status) query = query.eq('furnishing_status', filters.furnishing_status);
    if (filters.occupancy_status) query = query.eq('occupancy_status', filters.occupancy_status);
    if (filters.bhk_config) query = query.eq('bhk_config', filters.bhk_config);
    if (filters.min_rent !== undefined) query = query.gte('monthly_rent', filters.min_rent);
    if (filters.max_rent !== undefined) query = query.lte('monthly_rent', filters.max_rent);

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
        preferences:quarter_request_preferences(*, quarter:quarters(*)),
        allotment:quarter_allotments(*, quarter:quarters(*))
      `)
      .eq('employee_id', employeeAuthId)
      .order('created_at', { ascending: false });
    if (error) throw error;
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
      .select(`*, quarter:quarters(*), request:quarter_requests(*)`)
      .eq('request.cycle_id', cycleId);
    if (error) throw error;
    return (data ?? []) as unknown as QuarterAllotment[];
  },

  async getRequestsForCycle(cycleId: string): Promise<QuarterRequest[]> {
    const { data, error } = await supabase
      .from('quarter_requests')
      .select(`
        *,
        preferences:quarter_request_preferences(*, quarter:quarters(*)),
        allotment:quarter_allotments(*, quarter:quarters(*))
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
    if ((count ?? 0) >= 2) throw new Error('MAX_QUARTERS_REACHED');

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

    const updates: Record<string, unknown> = { is_overridden: true, updated_at: new Date().toISOString() };
    if (input.new_quarter_id) updates.quarter_id = input.new_quarter_id;

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
      if (req.allotment) continue;

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

    const nextStatus: Record<string, string> = { VACATE: 'VACATED', EXTEND: 'ACKNOWLEDGED', UPGRADE: 'ALLOTTED' };
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

    const revertStatus: Record<string, string> = { VACATE: 'ACKNOWLEDGED', EXTEND: 'ACKNOWLEDGED', UPGRADE: 'ALLOTTED' };
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

  async cancelRequest(requestId: string): Promise<void> {
    const { error } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) throw error;
  },

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
      .insert({ tenant_request_id: tenantRequestId, author_id: authorId, author_role: authorRole, message, document_urls: documentUrls })
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
    const revertMap: Record<string, string> = {
      EXTEND: 'ACKNOWLEDGED', UPGRADE: 'ACKNOWLEDGED', VACATE: 'ACKNOWLEDGED',
      GRIEVANCE: 'ACKNOWLEDGED', MAINTENANCE: 'ACKNOWLEDGED',
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

  async createAndAllotNow(
    eoId: string,
    input: CreateQuarterRequestInput,
    quarterId: string,
  ): Promise<QuarterRequest> {
    const reqNumber = `REQ-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    const { data: req, error: reqErr } = await supabase
      .from('quarter_requests')
      .insert({
        employee_id: eoId,
        request_number: reqNumber,
        cycle_id: input.cycle_id,
        request_reason: input.request_reason,
        required_bhk_config: input.required_bhk_config,
        preferred_location: input.preferred_location,
        move_in_date: input.move_in_date,
        family_member_count: input.family_member_count,
        employee_notes: input.employee_notes,
        request_status: 'ALLOTTED',
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
      await supabase.from('quarter_request_preferences').insert(prefs);
    }

    const { error: allotErr } = await supabase.from('quarter_allotments').insert({
      request_id: req.id,
      quarter_id: quarterId,
      allotted_by: eoId,
      allotment_date: new Date().toISOString().split('T')[0],
      approval_status: 'APPROVED',
    });
    if (allotErr) throw allotErr;
    return req as QuarterRequest;
  },

  async manualAllotRequest(requestId: string, quarterId: string, eoId: string, conditions?: string): Promise<void> {
    const { error: allotErr } = await supabase.from('quarter_allotments').insert({
      request_id: requestId,
      quarter_id: quarterId,
      allotted_by: eoId,
      allotment_date: new Date().toISOString().split('T')[0],
      approval_status: 'PENDING',
      allotment_conditions: conditions ?? '',
    });
    if (allotErr) throw allotErr;
    const { error: reqErr } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'ALLOTTED', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (reqErr) throw reqErr;
  },

  async getEmployeeUsers(): Promise<{ id: string; full_name: string; govt_department: string; govt_employee_id: string; email: string }[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, govt_department, govt_employee_id, email')
      .neq('role', 'admin')
      .order('full_name');
    if (error) throw error;
    return (data ?? []) as { id: string; full_name: string; govt_department: string; govt_employee_id: string; email: string }[];
  },

  async eoRejectRequest(requestId: string, eoId: string, reason: string, docUrl?: string): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('quarter_requests')
      .update({ request_status: 'DRAFT', sub_status: 'REJECTED', eo_notes: reason, updated_at: now })
      .eq('id', requestId);
    if (error) throw error;
    if (docUrl) {
      await supabase.from('quarter_allotment_chats').insert({
        allotment_id: requestId, author_id: eoId, author_role: 'eo',
        message: `Request rejected by EO. Reason: ${reason}`, document_urls: [docUrl],
      }).maybeSingle();
    }
  },

  async runAllocationCycle(eoId: string, requests: QuarterRequest[]): Promise<{ allotted: number; skipped: number }> {
    let allotted = 0;
    let skipped = 0;
    for (const req of requests) {
      if (req.request_status !== 'SUBMITTED') { skipped++; continue; }
      if (!req.preferences || req.preferences.length === 0) { skipped++; continue; }
      if (req.allotment) { skipped++; continue; }
      const topPref = [...req.preferences].sort((a, b) => a.preference_rank - b.preference_rank)[0];
      const { error: allotErr } = await supabase.from('quarter_allotments').insert({
        request_id: req.id,
        quarter_id: topPref.quarter_id,
        allotted_by: eoId,
        allotment_date: new Date().toISOString().split('T')[0],
        approval_status: 'PENDING',
      });
      if (allotErr) { skipped++; continue; }
      const { error: reqErr } = await supabase
        .from('quarter_requests')
        .update({ request_status: 'ALLOTTED', updated_at: new Date().toISOString() })
        .eq('id', req.id);
      if (reqErr) skipped++; else allotted++;
    }
    return { allotted, skipped };
  },

  async submitAllotments(allotmentIds: string[], workflowId: string | null, eoId: string): Promise<void> {
    const now = new Date().toISOString();
    if (!workflowId) {
      for (const id of allotmentIds) {
        await supabase.from('quarter_allotments').update({ approval_status: 'APPROVED', updated_at: now }).eq('id', id);
      }
    } else {
      const { data: wfl } = await supabase.from('quarter_approval_workflows').select('*').eq('id', workflowId).maybeSingle();
      const maxLevel = wfl ? (wfl.levels as { level: number }[]).length : 1;
      for (const id of allotmentIds) {
        await supabase.from('quarter_allotments').update({ approval_status: 'PENDING', updated_at: now }).eq('id', id);
        await supabase.from('quarter_allotment_approvals').insert({
          allotment_id: id, workflow_id: workflowId, current_level: 1,
          max_level: maxLevel, status: 'PENDING', initiated_by: eoId,
        });
      }
    }
  },

  async getApprovalWorkflows(): Promise<QuarterApprovalWorkflow[]> {
    const { data, error } = await supabase
      .from('quarter_approval_workflows')
      .select('*')
      .eq('is_active', true)
      .order('workflow_name');
    if (error) throw error;
    return (data ?? []) as QuarterApprovalWorkflow[];
  },

  async getApprovalForAllotment(allotmentId: string): Promise<QuarterAllotmentApproval | null> {
    const { data, error } = await supabase
      .from('quarter_allotment_approvals')
      .select('*, workflow:quarter_approval_workflows(*)')
      .eq('allotment_id', allotmentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as QuarterAllotmentApproval | null;
  },

  async getApprovalChats(approvalId: string): Promise<QuarterApprovalChat[]> {
    const { data, error } = await supabase
      .from('quarter_approval_chats')
      .select('*')
      .eq('approval_id', approvalId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as QuarterApprovalChat[];
  },

  async addApprovalChat(approvalId: string, authorId: string, authorRole: string, message: string, docUrls: string[] = []): Promise<void> {
    const { error } = await supabase.from('quarter_approval_chats').insert({
      approval_id: approvalId, author_id: authorId, author_role: authorRole, message, document_urls: docUrls,
    });
    if (error) throw error;
  },

  async approveAllotmentLevel(approvalId: string, approverId: string, remarks: string): Promise<void> {
    const { data: approval } = await supabase.from('quarter_allotment_approvals').select('*').eq('id', approvalId).maybeSingle();
    if (!approval) throw new Error('Approval record not found');
    const now = new Date().toISOString();
    const isLastLevel = approval.current_level >= approval.max_level;
    const newStatus = isLastLevel ? 'APPROVED' : 'PENDING';
    const newLevel = isLastLevel ? approval.current_level : approval.current_level + 1;
    await supabase.from('quarter_allotment_approvals').update({ current_level: newLevel, status: newStatus, updated_at: now }).eq('id', approvalId);
    await supabase.from('quarter_approval_chats').insert({
      approval_id: approvalId, author_id: approverId, author_role: 'approver',
      message: `Level ${approval.current_level} approved. ${remarks}`.trim(), document_urls: [],
    });
    if (isLastLevel) {
      await supabase.from('quarter_allotments').update({ approval_status: 'APPROVED', updated_at: now }).eq('id', approval.allotment_id);
    }
  },

  async sendClarification(approvalId: string, targetLevel: number, remarks: string, senderId: string): Promise<void> {
    const now = new Date().toISOString();
    await supabase.from('quarter_allotment_approvals').update({ current_level: targetLevel, status: 'PENDING', updated_at: now }).eq('id', approvalId);
    await supabase.from('quarter_approval_chats').insert({
      approval_id: approvalId, author_id: senderId, author_role: 'eo',
      message: `Sent for clarification to level ${targetLevel}. ${remarks}`.trim(), document_urls: [],
    });
  },

  async getInspections(allotmentId: string): Promise<QuarterInspection[]> {
    const { data, error } = await supabase
      .from('quarter_inspections')
      .select('*')
      .eq('allotment_id', allotmentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as QuarterInspection[];
  },

  async startInspection(allotmentId: string, createdBy: string, openingRemarks: string): Promise<QuarterInspection> {
    const { data, error } = await supabase.from('quarter_inspections').insert({
      allotment_id: allotmentId, created_by: createdBy, status: 'OPEN',
      opening_remarks: openingRemarks, property_condition: '',
    }).select().single();
    if (error) throw error;
    return data as QuarterInspection;
  },

  async closeInspection(inspectionId: string, closingRemarks: string, propertyCondition: string): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await supabase.from('quarter_inspections').update({
      status: 'CLOSED', closing_remarks: closingRemarks, property_condition: propertyCondition, closed_at: now,
    }).eq('id', inspectionId);
    if (error) throw error;
  },

  async getInspectionChats(inspectionId: string): Promise<QuarterInspectionChat[]> {
    const { data, error } = await supabase
      .from('quarter_inspection_chats')
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as QuarterInspectionChat[];
  },

  async addInspectionChat(inspectionId: string, authorId: string, authorRole: string, message: string, docUrls: string[] = []): Promise<void> {
    const { error } = await supabase.from('quarter_inspection_chats').insert({
      inspection_id: inspectionId, author_id: authorId, author_role: authorRole, message, document_urls: docUrls,
    });
    if (error) throw error;
  },

  async getHandover(allotmentId: string): Promise<QuarterHandover | null> {
    const { data, error } = await supabase
      .from('quarter_handovers')
      .select('*')
      .eq('allotment_id', allotmentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as QuarterHandover | null;
  },

  async createHandover(allotmentId: string, createdBy: string, input: {
    key_number: string;
    remarks: string;
    occupying_deadline: string;
    interior_doc_url?: string;
    inspection_report_url?: string;
  }): Promise<QuarterHandover> {
    const { data, error } = await supabase.from('quarter_handovers').insert({
      allotment_id: allotmentId, created_by: createdBy, ...input,
    }).select().single();
    if (error) throw error;
    await supabase.from('quarter_allotments').update({ approval_status: 'ACKNOWLEDGED', updated_at: new Date().toISOString() }).eq('id', allotmentId);
    return data as QuarterHandover;
  },

  async getGuestInfo(allotmentId: string): Promise<QuarterGuestInfo[]> {
    const { data, error } = await supabase
      .from('quarter_guest_info')
      .select('*')
      .eq('allotment_id', allotmentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as QuarterGuestInfo[];
  },

  async addGuestInfo(allotmentId: string, createdBy: string, input: {
    guest_name: string;
    guest_mobile: string;
    guest_email: string;
    aadhaar_doc_url?: string;
    pan_doc_url?: string;
    other_doc_urls?: string[];
  }): Promise<QuarterGuestInfo> {
    const { data, error } = await supabase.from('quarter_guest_info').insert({
      allotment_id: allotmentId, created_by: createdBy,
      guest_name: input.guest_name, guest_mobile: input.guest_mobile, guest_email: input.guest_email,
      aadhaar_doc_url: input.aadhaar_doc_url ?? '', pan_doc_url: input.pan_doc_url ?? '',
      other_doc_urls: input.other_doc_urls ?? [],
    }).select().single();
    if (error) throw error;
    return data as QuarterGuestInfo;
  },

  async removeGuestInfo(guestInfoId: string): Promise<void> {
    const { error } = await supabase.from('quarter_guest_info').delete().eq('id', guestInfoId);
    if (error) throw error;
  },
};
