import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, X, FileText } from 'lucide-react';

interface Props {
  open: boolean;
  remarks: string;
  submitting: boolean;
  onClose: () => void;
  onRemarksChange: (v: string) => void;
  onConfirm: () => void;
}

const TC_ITEMS = [
  {
    num: 1,
    text: 'The executive is advised to take possession of the quarter/housing accommodation allotted by the Estate Section of the Human Resources Department within ',
    bold: '15 days',
    rest: ' from the date of allotment/intimation. Failure to do so may result in cancellation or re-allotment of the quarter as per NMDC rules.',
  },
  {
    num: 2,
    text: 'At the time of taking possession, the allottee should carefully inspect the premises and ensure that all fittings, fixtures, electrical installations, water supply, and sanitary arrangements are in proper condition.',
  },
  {
    num: 3,
    text: 'Any civil, electrical, plumbing, or maintenance-related complaints observed during or after possession should be separately lodged with the concerned department through the prescribed complaint mechanism for necessary action.',
  },
  {
    num: 4,
    text: 'The allottee shall be responsible for maintaining the allotted quarter in good condition and shall not carry out any structural alteration, modification, or unauthorized addition without prior approval from the competent authority.',
  },
  {
    num: 5,
    text: 'The quarter shall be used strictly for residential purposes by the allottee and authorized family members only. Subletting, sharing, or unauthorized occupation is strictly prohibited.',
  },
  {
    num: 6,
    text: 'The following charges, if not recovered earlier, shall be recovered by the department from the salary/payment of the allottee as applicable:',
    bullets: [
      'House Rent / License Fee',
      'Electricity Charges',
      'Water Charges',
      'Maintenance Charges',
      'Any other dues related to quarter occupation',
    ],
  },
  {
    num: 7,
    text: 'The allottee shall comply with all rules, regulations, and guidelines issued by the NMDC regarding residential accommodation from time to time.',
  },
  {
    num: 8,
    text: 'At the time of vacating the quarter, the allottee shall hand over vacant possession of the premises along with all fixtures and fittings in satisfactory condition, subject to normal wear and tear.',
  },
  {
    num: 9,
    text: 'Any damage, loss, or misuse of NMDC property observed during occupation or at the time of vacation shall be recoverable from the allottee.',
  },
  {
    num: 10,
    text: 'Acceptance of the allotted quarter shall be deemed as acceptance of all applicable terms and conditions governing NMDC accommodation.',
  },
];

export function AcceptAllotmentModal({ open, remarks, submitting, onClose, onRemarksChange, onConfirm }: Props) {
  const [agreed, setAgreed] = useState(false);

  if (!open) return null;

  const handleClose = () => {
    setAgreed(false);
    onClose();
  };

  const handleConfirm = () => {
    if (!agreed) return;
    onConfirm();
    setAgreed(false);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <FileText size={18} className="text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900">Terms and Conditions for the Acceptance of the Quarter Allotment</h3>
            <p className="text-xs text-gray-500 mt-0.5">Please read carefully before confirming your acceptance</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable T&C body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-3 text-sm text-gray-700">
          {TC_ITEMS.map(item => (
            <div key={item.num} className="leading-relaxed">
              <span className="font-medium text-gray-800">{item.num}. </span>
              {'bold' in item ? (
                <>
                  {item.text}
                  <strong className="font-bold text-gray-900">{item.bold}</strong>
                  {item.rest}
                </>
              ) : (
                item.text
              )}
              {'bullets' in item && item.bullets && (
                <ul className="mt-1.5 ml-4 space-y-0.5">
                  {item.bullets.map(b => (
                    <li key={b} className="text-gray-700">* {b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 space-y-3 shrink-0 bg-gray-50/60 rounded-b-2xl">
          {/* Checkbox agreement */}
          <label className="flex items-center gap-3 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              I hereby accept the above terms and conditions
            </span>
          </label>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Remarks <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={remarks}
              onChange={e => onRemarksChange(e.target.value)}
              rows={2}
              placeholder="Add any remarks…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 resize-none bg-white"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!agreed || submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Confirming…' : <><CheckCircle size={14} /> Confirm Accept</>}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
