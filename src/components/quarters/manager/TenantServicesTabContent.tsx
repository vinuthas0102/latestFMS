import React from 'react';
import { Building2, CheckCircle, XCircle, Search, Calendar, ClipboardCheck, FileText, Eye } from 'lucide-react';
import { MandatorySearchBar } from '../../ui/MandatorySearchBar';
import type { QuarterTenantRequest, Quarter } from '../../../services/quartersService';
import type { VacateInspectionDetail } from './InspectionReportViewModal';

interface ServiceTypeConfig {
  cls: string;
  label: string;
  icon: React.ReactNode;
}

interface Props {
  filteredTenantRequests: QuarterTenantRequest[];
  allTenantRequests: QuarterTenantRequest[];
  tenantSearch: string;
  setTenantSearch: (v: string) => void;
  tenantStatusFilter: string;
  setTenantStatusFilter: (v: string) => void;
  tenantTypeFilter: string;
  setTenantTypeFilter: (v: string) => void;
  loadingTenant: boolean;
  eoNotesMap: Record<string, string>;
  setEoNotesMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  processingTenant: string | null;
  onApprove: (tr: QuarterTenantRequest) => void;
  onReject: (tr: QuarterTenantRequest) => void;
  onScheduleInspection: (tr: QuarterTenantRequest) => void;
  onCompleteInspection: (tr: QuarterTenantRequest) => void;
  onViewReport: (tr: QuarterTenantRequest) => void;
  vacateInspectionMap: Record<string, VacateInspectionDetail | undefined>;
  processingInspection: string | null;
  tenantServiceConfig: (type: string) => ServiceTypeConfig;
  tenantStatusBadge: (status: string) => string;
  getImage: (q: Quarter, idx: number) => string;
  fmtDate: (d: string) => string;
}

const SUMMARY_TILES = [
  { key: 'PENDING',  label: 'Pending Action', color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  { key: 'APPROVED', label: 'Approved',       color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  { key: 'REJECTED', label: 'Rejected',       color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
];

function VacateStageBadge({ inspection }: { inspection?: VacateInspectionDetail }) {
  if (!inspection) return null;
  if (inspection.status === 'SCHEDULED' && inspection.employeeAccepted === 'PENDING') {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
        <Calendar size={11} />
        Scheduled {inspection.inspectionDate} · {inspection.timeSlot} — Awaiting employee acceptance
      </div>
    );
  }
  if (inspection.status === 'SCHEDULED' && inspection.employeeAccepted === 'ACCEPTED') {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1.5">
        <Calendar size={11} />
        Scheduled {inspection.inspectionDate} · {inspection.timeSlot} — Employee accepted
      </div>
    );
  }
  if (inspection.status === 'IN_PROGRESS') {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1.5">
        <ClipboardCheck size={11} />
        Inspector report submitted — {inspection.findings.length} findings · Awaiting EO completion
      </div>
    );
  }
  if (inspection.status === 'COMPLETED') {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-2.5 py-1.5">
        <ClipboardCheck size={11} />
        Inspection completed — Ready for decision
      </div>
    );
  }
  return null;
}

export const TenantServicesTabContent: React.FC<Props> = ({
  filteredTenantRequests, allTenantRequests, tenantSearch, setTenantSearch,
  tenantStatusFilter, setTenantStatusFilter, tenantTypeFilter, setTenantTypeFilter,
  loadingTenant, eoNotesMap, setEoNotesMap, processingTenant, onApprove, onReject,
  onScheduleInspection, onCompleteInspection, onViewReport,
  vacateInspectionMap, processingInspection,
  tenantServiceConfig, tenantStatusBadge, getImage, fmtDate,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-3">
      {SUMMARY_TILES.map(s => {
        const cnt = allTenantRequests.filter(t => t.request_status === s.key).length;
        return (
          <button
            key={s.key}
            onClick={() => setTenantStatusFilter(tenantStatusFilter === s.key ? 'ALL' : s.key)}
            className={`flex flex-col items-center py-3 rounded-xl border transition-all ${
              tenantStatusFilter === s.key
                ? `${s.bg} ring-2 ring-offset-1 ring-current ${s.color}`
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className={`text-2xl font-bold ${tenantStatusFilter === s.key ? s.color : 'text-gray-800'}`}>{cnt}</span>
            <span className={`text-[10px] font-medium mt-0.5 ${tenantStatusFilter === s.key ? s.color : 'text-gray-500'}`}>{s.label}</span>
          </button>
        );
      })}
    </div>

    <MandatorySearchBar
      fields={[
        {
          key: 'search',
          label: 'Search',
          type: 'text',
          placeholder: 'Quarter no., reason…',
          value: tenantSearch,
          onChange: setTenantSearch,
          icon: <Search size={14} />,
        },
        {
          key: 'type',
          label: 'Request Type',
          type: 'chips',
          value: tenantTypeFilter,
          onChange: setTenantTypeFilter,
          options: [
            { value: 'ALL', label: 'All' },
            { value: 'EXTEND', label: 'Extend' },
            { value: 'UPGRADE', label: 'Upgrade' },
            { value: 'VACATE', label: 'Vacate' },
            { value: 'EXCHANGE', label: 'Exchange' },
          ],
        },
        {
          key: 'status',
          label: 'Status',
          type: 'chips',
          value: tenantStatusFilter,
          onChange: setTenantStatusFilter,
          options: [
            { value: 'ALL', label: 'All' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'APPROVED', label: 'Approved' },
            { value: 'REJECTED', label: 'Rejected' },
          ],
        },
      ]}
      className="mb-0"
    />

    {loadingTenant ? (
      <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400 text-sm">Loading…</div>
    ) : filteredTenantRequests.length === 0 ? (
      <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
        <Building2 size={32} className="mx-auto text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">No tenant service requests found.</p>
      </div>
    ) : (
      <div className="space-y-3">
        {filteredTenantRequests.map(tr => {
          const stc = tenantServiceConfig(tr.service_type);
          const q = tr.allotment?.quarter;
          const isPending = tr.request_status === 'PENDING';
          const isVacate = tr.service_type === 'VACATE';
          const vacInsp = isVacate ? vacateInspectionMap[tr.id] : undefined;
          const hasInspection = !!vacInsp;
          const isCompleted = vacInsp?.status === 'COMPLETED';
          const isInProgress = vacInsp?.status === 'IN_PROGRESS';

          return (
            <div
              key={tr.id}
              className={`bg-white rounded-xl border border-gray-200 p-5 ${isPending ? 'border-l-4 border-l-amber-400' : ''}`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4">
                  {q && (
                    <img src={getImage(q, 0)} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${stc.cls}`}>
                        {stc.icon}{stc.label}
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${tenantStatusBadge(tr.request_status)}`}>
                        {tr.request_status}
                      </span>
                    </div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {q?.quarter_number ?? 'Quarter'}{q?.bhk_config ? ` · ${q.bhk_config}` : ''}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{q?.address || q?.block_name}</div>
                    <div className="text-xs text-gray-600 mt-1.5 max-w-sm">{tr.reason || 'No reason provided'}</div>
                    {tr.remarks && (
                      <div className="text-xs text-gray-500 mt-0.5">Remarks: {tr.remarks}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">Requested on {fmtDate(tr.created_at)}</div>
                  </div>
                </div>

                {isPending && (
                  <div className="flex flex-col gap-2 min-w-56">
                    {isVacate && <VacateStageBadge inspection={vacInsp} />}

                    {isVacate && hasInspection && (
                      <button
                        onClick={() => onViewReport(tr)}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
                      >
                        <Eye size={13} /> View Inspection Report
                      </button>
                    )}

                    <textarea
                      value={eoNotesMap[tr.id] ?? ''}
                      onChange={e => setEoNotesMap(prev => ({ ...prev, [tr.id]: e.target.value }))}
                      rows={2}
                      placeholder="EO notes (optional)…"
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                    />

                    {isVacate ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onScheduleInspection(tr)}
                          disabled={processingTenant === tr.id || processingInspection === tr.id || hasInspection}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Calendar size={13} /> Schedule
                        </button>
                        <button
                          onClick={() => onCompleteInspection(tr)}
                          disabled={processingTenant === tr.id || processingInspection === tr.id || !isInProgress}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <ClipboardCheck size={13} /> Complete
                        </button>
                        <button
                          onClick={() => onApprove(tr)}
                          disabled={processingTenant === tr.id || processingInspection === tr.id || !isCompleted}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <CheckCircle size={13} /> Accept
                        </button>
                        <button
                          onClick={() => onReject(tr)}
                          disabled={processingTenant === tr.id || processingInspection === tr.id}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onApprove(tr)}
                          disabled={processingTenant === tr.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button
                          onClick={() => onReject(tr)}
                          disabled={processingTenant === tr.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!isPending && tr.eo_notes && (
                  <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 max-w-xs">
                    <span className="font-medium text-gray-700">EO Notes:</span> {tr.eo_notes}
                  </div>
                )}

                {!isPending && isVacate && (
                  <button
                    onClick={() => onViewReport(tr)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
                  >
                    <FileText size={13} /> View Report
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);
