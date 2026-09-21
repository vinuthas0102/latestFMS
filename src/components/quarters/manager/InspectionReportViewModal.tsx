import React from 'react';
import { X, FileText, Download, AlertTriangle, ImageIcon, Calendar, Clock, User, MapPin } from 'lucide-react';
import type { QuarterTenantRequest } from '../../../services/quartersService';

export interface VacateInspectionDetail {
  id: string;
  tenantRequestId: string;
  inspectorName: string;
  inspectionDate: string;
  timeSlot: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  employeeAccepted: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  propertyCondition: string;
  openingRemarks: string;
  closingRemarks: string;
  findings: {
    id: string;
    item: string;
    category: string;
    estimatedCost: number;
    deductionAmount: number;
    remarks: string;
  }[];
  uploadedDocs: { name: string; type: string; size: string }[];
  damagePhotos: { name: string; type: string }[];
  auditTrail: { timestamp: string; actor: string; action: string }[];
}

interface Props {
  tr: QuarterTenantRequest;
  inspection: VacateInspectionDetail | null;
  onClose: () => void;
}

export const InspectionReportViewModal: React.FC<Props> = ({ tr, inspection, onClose }) => {
  const q = tr.allotment?.quarter;
  const totalEstimated = inspection?.findings.reduce((s, f) => s + f.estimatedCost, 0) ?? 0;
  const totalDeduction = inspection?.findings.reduce((s, f) => s + f.deductionAmount, 0) ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden" style={{ maxHeight: '92vh' }}>

        <div className="shrink-0 bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Inspection Report</h2>
              <p className="text-xs text-slate-300 mt-0.5 leading-tight">
                {q?.quarter_number ?? 'Quarter'} · Vacate Request
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0 ml-4">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {!inspection ? (
            <div className="text-center py-12 text-gray-400 text-sm">No inspection data available.</div>
          ) : (
            <>
              {/* Vacate Request & Quarter Details */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Vacate Request Details</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2"><User size={12} className="text-gray-400" /><span className="text-gray-500">Allottee:</span> <span className="font-medium text-gray-800">Suresh Nair</span></div>
                  <div className="flex items-center gap-2"><MapPin size={12} className="text-gray-400" /><span className="text-gray-500">Quarter:</span> <span className="font-medium text-gray-800">{q?.quarter_number ?? '—'}</span></div>
                  <div><span className="text-gray-500">Block:</span> <span className="font-medium text-gray-800">{q?.block_name ?? '—'}</span></div>
                  <div><span className="text-gray-500">Type:</span> <span className="font-medium text-gray-800">{q?.bhk_config ?? '—'}</span></div>
                </div>
              </div>

              {/* Scheduled Inspection Info */}
              <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4">
                <div className="text-[10px] font-bold text-sky-500 uppercase tracking-widest mb-3">Scheduled Inspection</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2"><Calendar size={12} className="text-sky-400" /><span className="text-gray-500">Date:</span> <span className="font-medium text-gray-800">{inspection.inspectionDate}</span></div>
                  <div className="flex items-center gap-2"><Clock size={12} className="text-sky-400" /><span className="text-gray-500">Time:</span> <span className="font-medium text-gray-800">{inspection.timeSlot}</span></div>
                  <div className="flex items-center gap-2"><User size={12} className="text-sky-400" /><span className="text-gray-500">Inspector:</span> <span className="font-medium text-gray-800">{inspection.inspectorName}</span></div>
                  <div>
                    <span className="text-gray-500">Employee Acceptance:</span>{' '}
                    <span className={`font-medium px-2 py-0.5 rounded-full text-[10px] ${
                      inspection.employeeAccepted === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                      inspection.employeeAccepted === 'DECLINED' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{inspection.employeeAccepted}</span>
                  </div>
                </div>
              </div>

              {/* Damage Findings Table */}
              {inspection.findings.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span className="text-sm font-semibold text-gray-700">Damage Findings</span>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase tracking-wide">Item / Damage</th>
                          <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                          <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase tracking-wide">Remarks</th>
                          <th className="text-right px-3 py-2 font-semibold text-gray-500 uppercase tracking-wide">Est. Cost</th>
                          <th className="text-right px-3 py-2 font-semibold text-gray-500 uppercase tracking-wide">Deduction</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {inspection.findings.map(f => (
                          <tr key={f.id} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2.5 text-gray-700 font-medium">{f.item}</td>
                            <td className="px-3 py-2.5 text-gray-500">{f.category}</td>
                            <td className="px-3 py-2.5 text-gray-500">{f.remarks}</td>
                            <td className="px-3 py-2.5 text-right font-medium text-gray-700">₹{f.estimatedCost.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-2.5 text-right font-medium text-red-600">₹{f.deductionAmount.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t border-gray-200">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-right font-semibold text-gray-600">Total</td>
                          <td className="px-3 py-2 text-right font-bold text-gray-800">₹{totalEstimated.toLocaleString('en-IN')}</td>
                          <td className="px-3 py-2 text-right font-bold text-red-700">₹{totalDeduction.toLocaleString('en-IN')}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Uploaded Documents & Damage Photos */}
              {(inspection.uploadedDocs.length > 0 || inspection.damagePhotos.length > 0) && (
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Uploaded Documents & Damage Photographs</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {inspection.uploadedDocs.map((d, i) => (
                      <div key={`d-${i}`} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white">
                        <FileText size={15} className="text-red-500 shrink-0" />
                        <span className="text-xs font-medium text-gray-700 flex-1 truncate">{d.name}</span>
                        <Download size={13} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                      </div>
                    ))}
                    {inspection.damagePhotos.map((p, i) => (
                      <div key={`p-${i}`} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white">
                        <ImageIcon size={15} className="text-blue-500 shrink-0" />
                        <span className="text-xs font-medium text-gray-700 flex-1 truncate">{p.name}</span>
                        <Download size={13} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Trail */}
              {inspection.auditTrail.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Audit Trail</div>
                  <div className="space-y-2">
                    {inspection.auditTrail.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <span className="font-medium text-gray-700">{a.actor}</span>
                          <span className="text-gray-500"> — {a.action}</span>
                          <div className="text-[10px] text-gray-400">{new Date(a.timestamp).toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="shrink-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
            Close
          </button>
          {inspection && (
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 text-white text-sm font-bold hover:bg-slate-800 active:scale-[0.98] transition-all">
              <Download size={15} />
              Download Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
