import React, { useState } from 'react';
import { X, Plus, Trash2, Upload, FileText, Image as ImageIcon, CheckCircle, AlertTriangle, Download, ClipboardCheck } from 'lucide-react';
import type { QuarterTenantRequest } from '../../../services/quartersService';
import type { VacateInspectionDetail } from './InspectionReportViewModal';

const CATEGORIES = ['Civil', 'Electrical', 'Plumbing', 'Carpentry', 'Paint', 'Other'];

interface FindingRow {
  id: string;
  item: string;
  category: string;
  estimatedCost: number;
  deductionAmount: number;
  remarks: string;
}

interface Props {
  tr: QuarterTenantRequest;
  inspection: VacateInspectionDetail | null;
  onClose: () => void;
  onSubmit: (data: { findings: FindingRow[]; closingRemarks: string; uploadedDocs: { name: string; type: string }[]; damagePhotos: { name: string; type: string }[] }) => void;
  submitting?: boolean;
}

export const DamageFindingsModal: React.FC<Props> = ({ tr, inspection, onClose, onSubmit, submitting = false }) => {
  // Pre-fill with existing findings if the inspection already has them
  const [findings, setFindings] = useState<FindingRow[]>(
    inspection?.findings.map(f => ({ id: f.id, item: f.item, category: f.category, estimatedCost: f.estimatedCost, deductionAmount: f.deductionAmount, remarks: f.remarks })) ?? []
  );
  const [closingRemarks, setClosingRemarks] = useState(inspection?.closingRemarks ?? '');
  const [uploadedDocs, setUploadedDocs] = useState<{ name: string; type: string }[]>(
    inspection?.uploadedDocs.map(d => ({ name: d.name, type: d.type })) ?? []
  );
  const [damagePhotos, setDamagePhotos] = useState<{ name: string; type: string }[]>(
    inspection?.damagePhotos.map(p => ({ name: p.name, type: p.type })) ?? []
  );

  const q = tr.allotment?.quarter;
  const totalEstimated = findings.reduce((s, f) => s + f.estimatedCost, 0);
  const totalDeduction = findings.reduce((s, f) => s + f.deductionAmount, 0);

  const addRow = () => {
    setFindings(prev => [...prev, { id: `f-${Date.now()}-${prev.length}`, item: '', category: 'Civil', estimatedCost: 0, deductionAmount: 0, remarks: '' }]);
  };
  const updateRow = (idx: number, patch: Partial<FindingRow>) => {
    setFindings(prev => { const copy = [...prev]; copy[idx] = { ...copy[idx], ...patch }; return copy; });
  };
  const removeRow = (idx: number) => {
    setFindings(prev => prev.filter((_, i) => i !== idx));
  };

  const simulateUpload = (kind: 'doc' | 'photo') => {
    const ts = Date.now();
    if (kind === 'doc') {
      setUploadedDocs(prev => [...prev, { name: `inspection-report-${ts}.pdf`, type: 'PDF' }]);
    } else {
      setDamagePhotos(prev => [...prev, { name: `damage-photo-${ts}.jpg`, type: 'JPEG' }]);
    }
  };

  const canSubmit = findings.length > 0 && findings.every(f => f.item.trim());

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden" style={{ maxHeight: '92vh' }}>

        <div className="shrink-0 bg-gradient-to-r from-indigo-700 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <ClipboardCheck size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Update Damage Findings</h2>
              <p className="text-xs text-indigo-200 mt-0.5 leading-tight">
                {q?.quarter_number ?? 'Quarter'} · {tr.reason?.slice(0, 40) ?? 'Vacate Inspection'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0 ml-4">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Vacate Request & Quarter Details */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Inspection Request Details</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-gray-500">Quarter:</span> <span className="font-medium text-gray-800">{q?.quarter_number ?? '—'}</span></div>
              <div><span className="text-gray-500">Block:</span> <span className="font-medium text-gray-800">{q?.block_name ?? '—'}</span></div>
              <div><span className="text-gray-500">Type:</span> <span className="font-medium text-gray-800">{q?.bhk_config ?? '—'}</span></div>
              <div><span className="text-gray-500">Inspector:</span> <span className="font-medium text-gray-800">{inspection?.inspectorName ?? '—'}</span></div>
              <div><span className="text-gray-500">Inspection Date:</span> <span className="font-medium text-gray-800">{inspection?.inspectionDate ?? '—'}</span></div>
              <div><span className="text-gray-500">Time Slot:</span> <span className="font-medium text-gray-800">{inspection?.timeSlot ?? '—'}</span></div>
            </div>
            {inspection?.openingRemarks && (
              <div className="text-xs text-gray-600 pt-2 mt-2 border-t border-gray-200">
                <span className="font-medium text-gray-700">EO Guidelines:</span> {inspection.openingRemarks}
              </div>
            )}
          </div>

          {/* Damage Findings Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-600" />
                <span className="text-sm font-semibold text-gray-700">Damage Findings</span>
              </div>
              <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors">
                <Plus size={13} /> Add Item
              </button>
            </div>

            {findings.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
                <AlertTriangle size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs text-gray-400">No damage items added yet. Click "Add Item" to start recording findings.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase tracking-wide w-2/5">Item / Damage</th>
                      <th className="text-left px-2 py-2 font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                      <th className="text-right px-2 py-2 font-semibold text-gray-500 uppercase tracking-wide">Est. Cost</th>
                      <th className="text-right px-2 py-2 font-semibold text-gray-500 uppercase tracking-wide">Deduction</th>
                      <th className="text-left px-2 py-2 font-semibold text-gray-500 uppercase tracking-wide">Remarks</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {findings.map((f, idx) => (
                      <tr key={f.id} className="hover:bg-gray-50/30">
                        <td className="px-3 py-2">
                          <input type="text" value={f.item} onChange={e => updateRow(idx, { item: e.target.value })}
                            placeholder="Describe damage…"
                            className="w-full text-xs font-medium border border-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 placeholder-gray-300" />
                        </td>
                        <td className="px-2 py-2">
                          <select value={f.category} onChange={e => updateRow(idx, { category: e.target.value })}
                            className="w-full text-xs border border-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 bg-white">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" min={0} value={f.estimatedCost || ''} onChange={e => updateRow(idx, { estimatedCost: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                            className="w-full text-right text-xs font-semibold border border-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 placeholder-gray-300" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" min={0} value={f.deductionAmount || ''} onChange={e => updateRow(idx, { deductionAmount: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                            className="w-full text-right text-xs font-semibold border border-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 placeholder-gray-300" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" value={f.remarks} onChange={e => updateRow(idx, { remarks: e.target.value })}
                            placeholder="Add remark…"
                            className="w-full text-xs border border-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 placeholder-gray-300" />
                        </td>
                        <td className="px-1 py-2">
                          <button onClick={() => removeRow(idx)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan={2} className="px-3 py-2 text-right font-semibold text-gray-600">Total</td>
                      <td className="px-2 py-2 text-right font-bold text-gray-800">₹{totalEstimated.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right font-bold text-red-700">₹{totalDeduction.toLocaleString('en-IN')}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Closing Remarks */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Closing Remarks / Inspector Notes</label>
            <textarea value={closingRemarks} onChange={e => setClosingRemarks(e.target.value)} rows={3}
              placeholder="Summarize the overall condition of the quarter and any recommendations…"
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 resize-none placeholder-gray-300 transition-colors" />
          </div>

          {/* Upload Damage Photographs */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Upload Damage Photographs <span className="text-gray-400 font-normal">(JPEG / JPG)</span></label>
            <button onClick={() => simulateUpload('photo')}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 flex flex-col items-center gap-1.5 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all">
              <ImageIcon size={18} className="text-gray-400" />
              <span className="text-xs text-gray-500">Click to attach damage photo</span>
            </button>
            {damagePhotos.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {damagePhotos.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white">
                    <ImageIcon size={13} className="text-blue-500 shrink-0" />
                    <span className="text-xs font-medium text-gray-700 flex-1 truncate">{p.name}</span>
                    <button onClick={() => setDamagePhotos(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Final Inspection Report */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Upload Final Inspection Report <span className="text-gray-400 font-normal">(PDF / JPEG / JPG)</span></label>
            <button onClick={() => simulateUpload('doc')}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 flex flex-col items-center gap-1.5 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all">
              <Upload size={18} className="text-gray-400" />
              <span className="text-xs text-gray-500">Click to attach inspection report</span>
            </button>
            {uploadedDocs.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {uploadedDocs.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white">
                    <FileText size={13} className="text-red-500 shrink-0" />
                    <span className="text-xs font-medium text-gray-700 flex-1 truncate">{d.name}</span>
                    <button onClick={() => setUploadedDocs(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
            <Download size={15} /> Generate Report
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">Cancel</button>
          <button onClick={() => onSubmit({ findings, closingRemarks, uploadedDocs, damagePhotos })} disabled={!canSubmit || submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            {submitting ? (<><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Submitting…</>)
              : (<><CheckCircle size={15} />Submit Report</>)}
          </button>
        </div>
      </div>
    </div>
  );
};
