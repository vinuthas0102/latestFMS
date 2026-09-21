import React from 'react';
import { X, FileText, Download, User, MapPin, Calendar, Clock, HardHat, Building2 } from 'lucide-react';
import type { QuarterTenantRequest } from '../../../services/quartersService';
import type { VacateInspectionDetail } from './InspectionReportViewModal';

interface Props {
  tr: QuarterTenantRequest;
  inspection: VacateInspectionDetail | null;
  onClose: () => void;
}

export const InspectionRequestDetailsModal: React.FC<Props> = ({ tr, inspection, onClose }) => {
  const q = tr.allotment?.quarter;

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden" style={{ maxHeight: '92vh' }}>

        <div className="shrink-0 bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Inspection Request Details</h2>
              <p className="text-xs text-slate-300 mt-0.5 leading-tight">
                {q?.quarter_number ?? 'Quarter'} · Vacate Inspection
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0 ml-4">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Allottee Details */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Allottee Details</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2"><User size={12} className="text-gray-400" /><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-800">Suresh Nair</span></div>
              <div><span className="text-gray-500">Designation:</span> <span className="font-medium text-gray-800">Section Officer</span></div>
              <div><span className="text-gray-500">Department:</span> <span className="font-medium text-gray-800">Revenue</span></div>
              <div><span className="text-gray-500">Employee ID:</span> <span className="font-medium text-gray-800">EMP-2025-001</span></div>
            </div>
          </div>

          {/* Quarter Details */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Quarter Details</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2"><MapPin size={12} className="text-gray-400" /><span className="text-gray-500">Quarter:</span> <span className="font-medium text-gray-800">{q?.quarter_number ?? '—'}</span></div>
              <div><span className="text-gray-500">Block:</span> <span className="font-medium text-gray-800">{q?.block_name ?? '—'}</span></div>
              <div><span className="text-gray-500">BHK Type:</span> <span className="font-medium text-gray-800">{q?.bhk_config ?? '—'}</span></div>
              <div><span className="text-gray-500">Address:</span> <span className="font-medium text-gray-800">{q?.address ?? '—'}</span></div>
            </div>
          </div>

          {/* Vacate Request Details */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Vacate Request Details</div>
            <div className="grid grid-cols-1 gap-3 text-xs">
              <div><span className="text-gray-500">Reason:</span> <span className="font-medium text-gray-800">{tr.reason ?? '—'}</span></div>
              {tr.remarks && <div><span className="text-gray-500">Remarks:</span> <span className="font-medium text-gray-800">{tr.remarks}</span></div>}
              <div><span className="text-gray-500">Requested Date:</span> <span className="font-medium text-gray-800">{tr.requested_date ?? '—'}</span></div>
            </div>
          </div>

          {/* Scheduled Inspection Info */}
          {inspection && (
            <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4">
              <div className="text-[10px] font-bold text-sky-500 uppercase tracking-widest mb-3">Scheduled Inspection</div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2"><Calendar size={12} className="text-sky-400" /><span className="text-gray-500">Date:</span> <span className="font-medium text-gray-800">{inspection.inspectionDate}</span></div>
                <div className="flex items-center gap-2"><Clock size={12} className="text-sky-400" /><span className="text-gray-500">Time:</span> <span className="font-medium text-gray-800">{inspection.timeSlot}</span></div>
                <div className="flex items-center gap-2"><HardHat size={12} className="text-sky-400" /><span className="text-gray-500">Inspector:</span> <span className="font-medium text-gray-800">{inspection.inspectorName}</span></div>
                <div>
                  <span className="text-gray-500">Employee Status:</span>{' '}
                  <span className={`font-medium px-2 py-0.5 rounded-full text-[10px] ${inspection.employeeAccepted === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' : inspection.employeeAccepted === 'DECLINED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{inspection.employeeAccepted}</span>
                </div>
              </div>
              {inspection.openingRemarks && (
                <div className="text-xs text-gray-600 pt-2 mt-2 border-t border-sky-100">
                  <span className="font-medium text-gray-700">EO Guidelines:</span> {inspection.openingRemarks}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">Close</button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 text-white text-sm font-bold hover:bg-slate-800 active:scale-[0.98] transition-all">
            <Download size={15} /> Download Blank Form
          </button>
        </div>
      </div>
    </div>
  );
};
