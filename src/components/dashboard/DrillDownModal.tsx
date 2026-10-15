import React from 'react';
import { X } from 'lucide-react';
import type { DrillDownData } from '../../types/dashboard';

interface DrillDownModalProps {
  open: boolean;
  data: DrillDownData | null;
  onClose: () => void;
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({ open, data, onClose }) => {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Detailed Records</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {data.breakdownLabel} — {data.records.length} record{data.records.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {data.records.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">No detailed records available for this category.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {data.records.map((record, idx) => (
                <li
                  key={record.id}
                  className="flex items-start justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">{record.title}</span>
                      <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {record.id}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{record.subtitle}</p>
                    {record.meta && <p className="text-xs text-gray-400 mt-0.5">{record.meta}</p>}
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-3 ${
                      record.status === 'Pending' || record.status === 'Open' || record.status === 'Due'
                        ? 'bg-orange-100 text-orange-700'
                        : record.status === 'Resolved' || record.status === 'Paid' || record.status === 'Completed' || record.status === 'Confirmed'
                        ? 'bg-green-100 text-green-700'
                        : record.status === 'Allotted' || record.status === 'Active'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {record.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
