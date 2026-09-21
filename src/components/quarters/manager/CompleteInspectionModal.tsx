import React, { useState } from 'react';
import { ClipboardCheck, X, FileText, Upload, AlertTriangle, CheckCircle, ImageIcon } from 'lucide-react';
import type { QuarterTenantRequest } from '../../../services/quartersService';
import type { VacateInspectionDetail } from './InspectionReportViewModal';

interface Props {
  tr: QuarterTenantRequest;
  inspection: VacateInspectionDetail | null;
  onClose: () => void;
  onSubmit: (data: { remarks: string; uploadedDocs: { name: string }[] }) => void;
  submitting: boolean;
}

export const CompleteInspectionModal: React.FC<Props> = ({ tr, inspection, onClose, onSubmit, submitting }) => {
  const [remarks, setRemarks] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState<{ name: string }[]>([]);

  const q = tr.allotment?.quarter;
  const totalEstimated = inspection?.findings.reduce((s, f) => s + f.estimatedCost, 0) ?? 0;
  const totalDeduction = inspection?.findings.reduce((s, f) => s + f.deductionAmount, 0) ?? 0;

  const simulateUpload = (kind: 'doc' | 'photo') => {
    const name = kind === 'doc'
      ? `inspection-report-${Date.now()}.pdf`
      : `damage-photo-${Date.now()}.jpg`;
    setUploadedDocs(prev => [...prev, { name }]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden" style={{ maxHeight: '92vh' }}>

        <div className="shrink-0 bg-gradient-to-r from-teal-700 to-emerald-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <ClipboardCheck size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Complete Inspection</h2>
              <p className="text-xs text-teal-100 mt-0.5 leading-tight">
                {q?.quarter_number ?? 'Quarter'} · Vacate Request
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0 ml-4">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Inspection Summary */}
          {inspection && (
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inspector's Report</div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-gray-500">Inspector:</span> <span className="font-medium text-gray-800">{inspection.inspectorName}</span></div>
                <div><span className="text-gray-500">Date:</span> <span className="font-medium text-gray-800">{inspection.inspectionDate}</span></div>
                <div><span className="text-gray-500">Time Slot:</span> <span className="font-medium text-gray-800">{inspection.timeSlot}</span></div>
                <div><span className="text-gray-500">Condition:</span> <span className="font-medium text-gray-800">{inspection.propertyCondition}</span></div>
              </div>
              {inspection.closingRemarks && (
                <div className="text-xs text-gray-600 pt-1 border-t border-gray-200">
                  <span className="font-medium text-gray-700">Inspector Remarks:</span> {inspection.closingRemarks}
                </div>
              )}
            </div>
          )}

          {/* Damage Findings Table */}
          {inspection && inspection.findings.length > 0 && (
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
                      <th className="text-right px-3 py-2 font-semibold text-gray-500 uppercase tracking-wide">Est. Cost</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-500 uppercase tracking-wide">Deduction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {inspection.findings.map(f => (
                      <tr key={f.id} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2.5 text-gray-700 font-medium">{f.item}</td>
                        <td className="px-3 py-2.5 text-gray-500">{f.category}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-gray-700">₹{f.estimatedCost.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-red-600">₹{f.deductionAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan={2} className="px-3 py-2 text-right font-semibold text-gray-600">Total</td>
                      <td className="px-3 py-2 text-right font-bold text-gray-800">₹{totalEstimated.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-right font-bold text-red-700">₹{totalDeduction.toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Uploaded Documents & Photos */}
          {inspection && (inspection.uploadedDocs.length > 0 || inspection.damagePhotos.length > 0) && (
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Inspector Uploads</div>
              <div className="space-y-2">
                {inspection.uploadedDocs.map((d, i) => (
                  <div key={`d-${i}`} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white">
                    <FileText size={15} className="text-red-500 shrink-0" />
                    <span className="text-xs font-medium text-gray-700 flex-1 truncate">{d.name}</span>
                    <span className="text-[10px] text-gray-400">{d.size}</span>
                  </div>
                ))}
                {inspection.damagePhotos.map((p, i) => (
                  <div key={`p-${i}`} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white">
                    <ImageIcon size={15} className="text-blue-500 shrink-0" />
                    <span className="text-xs font-medium text-gray-700 flex-1 truncate">{p.name}</span>
                    <span className="text-[10px] text-gray-400">{p.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EO Remarks */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Remarks <span className="text-gray-400 font-normal">(Optional)</span></label>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              rows={3}
              placeholder="Enter additional remarks, if any…"
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 resize-none placeholder-gray-300 transition-colors"
            />
          </div>

          {/* Upload area */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Upload Inspection Report / Supporting Document</label>
            <button
              onClick={() => simulateUpload('doc')}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 flex flex-col items-center gap-2 hover:border-teal-400 hover:bg-teal-50/30 transition-all"
            >
              <Upload size={20} className="text-gray-400" />
              <span className="text-xs text-gray-500">Click to attach document (PDF / JPEG / JPG)</span>
            </button>
            {uploadedDocs.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {uploadedDocs.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-50/60 border border-teal-100">
                    <CheckCircle size={13} className="text-teal-600 shrink-0" />
                    <span className="text-xs text-gray-700 flex-1 truncate">{d.name}</span>
                    <button onClick={() => setUploadedDocs(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center gap-3">
          <div className="flex-1 text-xs text-gray-400">Inspection will be marked as completed upon submission.</div>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
            Cancel
          </button>
          <button
            onClick={() => onSubmit({ remarks, uploadedDocs })}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Completing…
              </>
            ) : (
              <>
                <CheckCircle size={15} />
                Submit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
