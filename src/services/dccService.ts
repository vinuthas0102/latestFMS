import { supabase } from '../lib/supabase';
import type {
  DccObjectOwner,
  DccObject,
  DccDemandType,
  DccDemand,
  DccPayment,
  DccDemandRunLog,
  DccTile,
  DccTrackerSummary,
  DccDemandFilters,
} from '../types/dcc';

const OWNERS = 'dcc_object_owners';
const OBJECTS = 'dcc_objects';
const DTYPES = 'dcc_demand_types';
const DEMANDS = 'dcc_demands';
const PAYMENTS = 'dcc_payments';
const RUNLOG = 'dcc_demand_run_log';

export const dccService = {
  // ── Reference data ──────────────────────────────────────────────────────────
  async listDemandTypes(): Promise<DccDemandType[]> {
    const { data, error } = await supabase
      .from(DTYPES)
      .select('*')
      .order('label', { ascending: true });
    if (error) throw error;
    return (data ?? []) as DccDemandType[];
  },

  async listObjectOwners(): Promise<DccObjectOwner[]> {
    const { data, error } = await supabase
      .from(OWNERS)
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []) as DccObjectOwner[];
  },

  async listObjects(ownerId?: string | null): Promise<DccObject[]> {
    let q = supabase.from(OBJECTS).select('*, owner:owner_id(*)').order('object_ref');
    if (ownerId) q = q.eq('owner_id', ownerId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as DccObject[];
  },

  // ── Demands (with joins) ────────────────────────────────────────────────────
  async listDemands(filters?: DccDemandFilters): Promise<DccDemand[]> {
    let q = supabase
      .from(DEMANDS)
      .select('*, object:object_id(*, owner:owner_id(*)), owner:owner_id(*), demand_type:demand_type_id(*)')
      .order('due_date', { ascending: true });

    if (filters?.object_id) q = q.eq('object_id', filters.object_id);
    if (filters?.owner_id) q = q.eq('owner_id', filters.owner_id);
    if (filters?.demand_type_code) {
      const { data: dt } = await supabase
        .from(DTYPES)
        .select('id')
        .eq('code', filters.demand_type_code)
        .maybeSingle();
      if (dt) q = q.eq('demand_type_id', (dt as { id: string }).id);
    }
    if (filters?.region) q = q.eq('region', filters.region);
    if (filters?.group_name) q = q.eq('group_name', filters.group_name);
    if (filters?.subgroup) q = q.eq('subgroup', filters.subgroup);
    if (filters?.run_date_from) q = q.gte('demand_run_date', filters.run_date_from);
    if (filters?.run_date_to) q = q.lte('demand_run_date', filters.run_date_to);
    if (filters?.status) q = q.eq('status', filters.status);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as DccDemand[];
  },

  // ── Tiles (computed from demands + payments) ───────────────────────────────
  async getTiles(filters?: DccDemandFilters): Promise<DccTile[]> {
    const demands = await this.listDemands(filters);

    // Fetch last payment per demand
    const demandIds = demands.map((d) => d.id);
    let lastPayments: Record<string, { date: string; amount: number }> = {};
    if (demandIds.length > 0) {
      const { data: pays } = await supabase
        .from(PAYMENTS)
        .select('demand_id, payment_date, amount')
        .in('demand_id', demandIds)
        .order('payment_date', { ascending: false });
      if (pays) {
        for (const p of pays as { demand_id: string; payment_date: string; amount: number }[]) {
          if (!lastPayments[p.demand_id]) {
            lastPayments[p.demand_id] = { date: p.payment_date, amount: p.amount };
          }
        }
      }
    }

    const today = new Date();
    const tiles: DccTile[] = demands.map((d) => {
      const due = Math.max(0, d.amount - d.amount_paid);
      const overdue = d.status === 'OVERDUE' ? due : 0;
      const lastPay = lastPayments[d.id];
      const dueDate = new Date(d.due_date);
      const avgOverdueDays =
        d.status === 'OVERDUE'
          ? Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / 86400000))
          : 0;

      const owner = d.owner;
      const obj = d.object;
      const ownerAddress = [owner?.address, owner?.city, owner?.state, owner?.pincode]
        .filter(Boolean)
        .join(', ');

      return {
        id: d.id,
        demand_type_code: d.demand_type?.code ?? '',
        demand_type_label: d.demand_type?.label ?? '',
        object_id: d.object_id,
        object_ref: obj?.object_ref ?? '',
        object_description: obj?.description ?? '',
        object_type: obj?.object_type ?? '',
        owner_id: d.owner_id,
        owner_name: owner?.name ?? '',
        owner_contact: owner?.contact_number ?? '',
        owner_address: ownerAddress,
        demand_run_date: d.demand_run_date,
        total_amount: d.amount,
        due_date: d.due_date,
        amount_paid: d.amount_paid,
        amount_due: due,
        overdue_amount: overdue,
        last_paid_date: lastPay?.date ?? null,
        last_paid_amount: lastPay?.amount ?? null,
        avg_overdue_days: avgOverdueDays,
        status: d.status,
        region: obj?.region ?? null,
        group_name: obj?.group_name ?? null,
        subgroup: obj?.subgroup ?? null,
      };
    });

    return tiles;
  },

  // ── Tracker summary ──────────────────────────────────────────────────────────
  async getTrackerSummary(filters?: DccDemandFilters): Promise<DccTrackerSummary> {
    const tiles = await this.getTiles(filters);
    const totalPaid = tiles.reduce((s, t) => s + t.amount_paid, 0);
    const totalDue = tiles.reduce((s, t) => s + t.amount_due, 0);
    const totalOverdue = tiles.reduce((s, t) => s + t.overdue_amount, 0);
    const totalAmount = tiles.reduce((s, t) => s + t.total_amount, 0);
    const collectionRate = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

    return {
      total_paid: totalPaid,
      total_due: totalDue,
      total_overdue: totalOverdue,
      collection_rate: collectionRate,
      paid_count: tiles.filter((t) => t.status === 'PAID').length,
      due_count: tiles.filter((t) => t.status === 'DUE').length,
      overdue_count: tiles.filter((t) => t.status === 'OVERDUE').length,
    };
  },

  // ── Payments ────────────────────────────────────────────────────────────────
  async getPayments(demandId: string): Promise<DccPayment[]> {
    const { data, error } = await supabase
      .from(PAYMENTS)
      .select('*')
      .eq('demand_id', demandId)
      .order('payment_date', { ascending: false });
    if (error) throw error;
    return (data ?? []) as DccPayment[];
  },

  async submitPayment(
    demandId: string,
    objectId: string,
    amount: number,
    mode: string,
    paymentDate: string,
    referenceNumber?: string,
    remarks?: string,
  ): Promise<DccPayment> {
    const { data: pay, error: payErr } = await supabase
      .from(PAYMENTS)
      .insert({
        demand_id: demandId,
        object_id: objectId,
        amount,
        payment_mode: mode,
        payment_date: paymentDate,
        reference_number: referenceNumber ?? null,
        remarks: remarks ?? null,
      })
      .select('*')
      .single();
    if (payErr) throw payErr;

    // Update demand amount_paid + status
    const { data: demand } = await supabase
      .from(DEMANDS)
      .select('amount, amount_paid')
      .eq('id', demandId)
      .single();
    if (demand) {
      const newPaid = (demand as { amount_paid: number }).amount_paid + amount;
      const total = (demand as { amount: number }).amount;
      const status = newPaid >= total ? 'PAID' : 'DUE';
      await supabase
        .from(DEMANDS)
        .update({ amount_paid: newPaid, status, updated_at: new Date().toISOString() })
        .eq('id', demandId);
    }

    return pay as DccPayment;
  },

  // ── Dispute ──────────────────────────────────────────────────────────────────
  async setDispute(
    demandId: string,
    disputeDate: string,
    reason: string,
    remarks: string,
  ): Promise<void> {
    const { error } = await supabase
      .from(DEMANDS)
      .update({
        dispute_date: disputeDate,
        dispute_reason: reason,
        dispute_remarks: remarks,
        updated_at: new Date().toISOString(),
      })
      .eq('id', demandId);
    if (error) throw error;
  },

  // ── Run log ──────────────────────────────────────────────────────────────────
  async listRunLog(): Promise<DccDemandRunLog[]> {
    const { data, error } = await supabase
      .from(RUNLOG)
      .select('*, demand_type:demand_type_id(*)')
      .order('run_date', { ascending: false });
    if (error) throw error;
    return (data ?? []) as DccDemandRunLog[];
  },
};
