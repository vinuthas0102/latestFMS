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
  amenities: string[];
  images: string[];
  description: string;
  address: string;
  occupancy_status: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
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
  employee_notes: string;
  eo_notes: string;
  created_at: string;
  updated_at: string;
  preferences?: QuarterRequestPreference[];
  allotment?: QuarterAllotment | null;
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
  created_at: string;
  updated_at: string;
  quarter?: Quarter;
  request?: QuarterRequest;
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
}

export interface OverrideInput {
  allotment_id: string;
  request_a_id: string;
  request_b_id?: string;
  action_type: string;
  justification: string;
  new_quarter_id?: string;
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
    return (data ?? []) as unknown as QuarterRequest[];
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
};
