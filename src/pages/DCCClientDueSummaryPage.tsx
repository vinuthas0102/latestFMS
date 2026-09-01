import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Users, Phone, MapPin, Building2, Receipt,
  Calendar, Clock, Wallet, CheckCircle2, AlertTriangle,
  Eye, Loader2, ChevronRight,
} from 'lucide-react';
import { dccService } from '../services/dccService';
import { DCCDemandDetailModal } from './DCCDemandDetailPage';
import type { DccTile } from '../types/dcc';
import {
  DCC_STATUS,
  fmtINR, fmtINRShort, fmtDateShort,
} from '../constants/dccTheme';

export const DCCClientDueSummaryPage: React.FC = () => {
  const { ownerId } = useParams<{ ownerId: string }>();
  const navigate = useNavigate();
  const [tiles, setTiles] = useState<DccTile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailDemandId, setDetailDemandId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    setError(null);
    try {
      const allTiles = await dccService.getTiles();
      const ownerTiles = allTiles.filter((t) => t.owner_id === ownerId);
      setTiles(ownerTiles);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load demands');
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalDemand = tiles.reduce((s, t) => s + t.total_amount, 0);
  const totalPaid = tiles.reduce((s, t) => s + t.amount_paid, 0);
  const totalOutstanding = tiles.reduce((s, t) => s + t.amount_due, 0);
  const overdueAmount = tiles.reduce((s, t) => s + t.overdue_amount, 0);
  const propertyCount = new Set(tiles.map((t) => t.object_id)).size;

  const first = tiles[0];
  const ownerName = first?.owner_name ?? 'Unknown Client';
  const ownerContact = first?.owner_contact ?? '';
  const ownerAddress = first?.owner_address ?? '';

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-800 border-b border-blue-900 shrink-0">
        <button
          onClick={() => navigate('/dcc')}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="text-xs font-semibold">Back</span>
        </button>
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
          <Users size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-white truncate">
            Client Due Summary — {ownerName}
          </h1>
          <p className="text-[10px] text-slate-400">
            {tiles.length} Demands · {propertyCount}{' '}
            {propertyCount === 1 ? 'Property' : 'Properties'}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      {!loading && !error && tiles.length > 0 && (
        <div className="px-4 pt-3 pb-2 shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Receipt size={11} className="text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Total Demand
                </span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 tabular-nums">
                {fmtINR(totalDemand)}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <CheckCircle2 size={11} className="text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Total Paid
                </span>
              </div>
              <div className="text-sm font-extrabold text-emerald-600 tabular-nums">
                {fmtINR(totalPaid)}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Wallet size={11} className="text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Outstanding
                </span>
              </div>
              <div className="text-sm font-extrabold text-red-600 tabular-nums">
                {fmtINR(totalOutstanding)}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <AlertTriangle size={11} className="text-red-500" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Overdue
                </span>
              </div>
              <div className="text-sm font-extrabold text-red-700 tabular-nums">
                {fmtINR(overdueAmount)}
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 bg-white rounded-lg border border-slate-200 shadow-sm px-3 py-2">
            <span className="flex items-center gap-1">
              <Phone size={11} className="text-slate-400" />
              {ownerContact || '—'}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={11} className="text-slate-400" />
              {ownerAddress || '—'}
            </span>
            <span className="flex items-center gap-1">
              <Building2 size={11} className="text-slate-400" />
              {propertyCount} {propertyCount === 1 ? 'Property' : 'Properties'}
            </span>
          </div>
        </div>
      )}

      {/* Demand List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 pt-1">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-emerald-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-red-500">
            <AlertTriangle size={28} className="mb-2" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        ) : tiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
            <div className="text-sm font-medium text-slate-600">
              No demands found for this client
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {tiles.map((tile, idx) => {
              const st = DCC_STATUS[tile.status];
              return (
                <motion.button
                  key={tile.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.2) }}
                  onClick={() => setDetailDemandId(tile.id)}
                  className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left overflow-hidden group"
                >
                  <div className={`h-0.5 ${st.dot} shrink-0`} />
                  <div className="px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${st.bg} ${st.text} border ${st.border}`}
                          >
                            {st.label}
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                            {tile.demand_type_label}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 truncate leading-snug">
                          {tile.object_description || tile.object_ref}
                        </h3>
                        <p className="text-[10px] text-slate-500 truncate">
                          {tile.object_ref} · {tile.object_type}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-extrabold text-slate-900 tabular-nums leading-tight">
                          {fmtINR(tile.amount_due)}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          of {fmtINRShort(tile.total_amount)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-600 flex-wrap">
                      <span className="flex items-center gap-0.5">
                        <Calendar size={10} className="text-slate-400" />
                        Run: {fmtDateShort(tile.demand_run_date)}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Clock size={10} className="text-slate-400" />
                        <span
                          className={
                            tile.status === 'OVERDUE'
                              ? 'text-red-600 font-semibold'
                              : ''
                          }
                        >
                          Due: {fmtDateShort(tile.due_date)}
                        </span>
                      </span>
                      {tile.overdue_amount > 0 && (
                        <span className="flex items-center gap-0.5 text-red-600 font-semibold">
                          <AlertTriangle size={10} /> {fmtINRShort(tile.overdue_amount)}
                        </span>
                      )}
                      {tile.amount_paid > 0 && (
                        <span className="flex items-center gap-0.5 text-emerald-600">
                          <CheckCircle2 size={10} /> {fmtINRShort(tile.amount_paid)} pd
                        </span>
                      )}
                      <span className="ml-auto flex items-center gap-0.5 text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye size={10} /> View
                        <ChevronRight size={10} />
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Demand Detail Modal */}
      {detailDemandId && (
        <DCCDemandDetailModal
          demandId={detailDemandId}
          onClose={() => setDetailDemandId(null)}
        />
      )}
    </div>
  );
};

export default DCCClientDueSummaryPage;
