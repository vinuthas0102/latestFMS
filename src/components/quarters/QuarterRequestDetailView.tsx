import React from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, Bed, CreditCard, ExternalLink, Eye, Layers, Mail,
  MapPin, Paperclip, Phone, Ruler, Send, Star,
  ThumbsUp, UserCheck, UserPlus, XCircle,
} from 'lucide-react';
import { ImageCarousel } from '../ui/ImageCarousel';
import { Quarter, QuarterRequest } from '../../services/quartersService';
import { fmtINR, fmtDate, statusConfig, resolveAllImages, getImage } from './quarterRequestsHelpers';
import { DPFilter } from './quarterRequestsHelpers';

interface Props {
  detailRequest: QuarterRequest;
  detailReturnFilter: DPFilter;
  userName: string | undefined;
  userEmployeeId: string | undefined;
  userEmail: string | undefined;
  userDepartment: string | undefined;
  onClose: (returnFilter: DPFilter) => void;
  onOpenInActionPanel: (req: QuarterRequest) => void;
  onPreviewQuarter: (quarterId: string) => void;
}

export const QuarterRequestDetailView: React.FC<Props> = ({
  detailRequest,
  detailReturnFilter,
  userName,
  userEmployeeId,
  userEmail,
  userDepartment,
  onClose,
  onOpenInActionPanel,
  onPreviewQuarter,
}) => {
  const req = detailRequest;
  const allotment = req.allotment;
  const q = allotment?.quarter as Quarter | undefined;
  const reqPrefs = (req.preferences ?? []).sort((a, b) => a.preference_rank - b.preference_rank);
  const sc = statusConfig(req.request_status);
  const rf = req.request_for ?? 'SELF';

  const primaryAction = (() => {
    const s = req.request_status;
    if (s === 'ALLOTTED') return { label: 'Accept Allotment', color: 'bg-emerald-600 hover:bg-emerald-700', icon: <ThumbsUp size={14} /> };
    if (s === 'SUBMITTED') return { label: 'Withdraw', color: 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100', icon: <XCircle size={14} />, outline: true };
    if (s === 'DRAFT') return { label: 'Submit Request', color: 'bg-blue-600 hover:bg-blue-700', icon: <Send size={14} /> };
    return null;
  })();

  return createPortal(
    <div className="fixed inset-0 z-[900] bg-gray-50 flex flex-col" style={{ fontFamily: 'inherit' }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-3.5 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <button
          onClick={() => onClose(detailReturnFilter)}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={16} /><span>Back</span>
        </button>
        <div className="h-5 w-px bg-gray-200" />
        <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
          <span className="font-mono text-sm font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-lg">{req.request_number}</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${sc.cls}`}>{sc.icon}{sc.label}</span>
          {req.sub_status === 'DECLINED' && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">Declined</span>}
          {rf === 'EMPLOYEE' && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1"><UserCheck size={11} />On Behalf</span>}
          {rf === 'TP' && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"><UserPlus size={11} />Third Party</span>}
          <span className="text-xs text-gray-400 ml-auto">{fmtDate(req.created_at)}</span>
        </div>
        {primaryAction && (
          <button
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold shrink-0 transition-colors ${primaryAction.color} ${!(primaryAction as { outline?: boolean }).outline ? 'text-white' : ''}`}
            onClick={() => onOpenInActionPanel(req)}
          >
            {primaryAction.icon}{primaryAction.label}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex gap-0 min-h-0">
        {/* ── Left: Property / Preferences ── */}
        <div className="w-[45%] flex flex-col border-r border-gray-200 overflow-y-auto bg-white">
          {q ? (
            <div className="flex flex-col">
              <div className="relative bg-gray-900">
                <ImageCarousel images={resolveAllImages(q)} className="h-64" />
                <div className="absolute bottom-3 left-3">
                  <span className="bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-lg backdrop-blur-sm">Allotted Quarter</span>
                </div>
              </div>
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xl font-bold text-gray-900">{q.quarter_number}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{q.block_name} Block · Floor {q.floor_number ?? '—'}</div>
                    {q.address && <div className="text-xs text-gray-400 mt-1 flex items-center gap-1"><MapPin size={11} />{q.address}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-bold text-gray-900">{fmtINR(q.monthly_rent)}</div>
                    <div className="text-xs text-gray-400">/month</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/60">
                {[
                  { icon: <Bed size={16} className="text-blue-500" />, label: 'Config', value: q.bhk_config },
                  { icon: <Ruler size={16} className="text-teal-500" />, label: 'Area', value: `${q.area_sqft} sq.ft` },
                  { icon: <Layers size={16} className="text-gray-500" />, label: 'Floor', value: q.floor_number !== null ? `Floor ${q.floor_number}` : '—' },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex flex-col items-center gap-1 py-3 px-2">
                    {icon}
                    <div className="text-xs text-gray-400">{label}</div>
                    <div className="text-sm font-semibold text-gray-800">{value}</div>
                  </div>
                ))}
              </div>
              {(q.balcony || q.pooja_room || q.lift_access || q.power_backup || q.water_heating || q.kitchen_exhaust) && (
                <div className="px-6 py-3 border-b border-gray-100">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-2">Features</div>
                  <div className="flex flex-wrap gap-1.5">
                    {q.balcony && <span className="text-[11px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">Balcony</span>}
                    {q.pooja_room && <span className="text-[11px] bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-medium">Pooja Room</span>}
                    {q.lift_access && <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">Lift</span>}
                    {q.power_backup && <span className="text-[11px] bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-medium">Power Backup</span>}
                    {q.water_heating && <span className="text-[11px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium">Geyser</span>}
                    {q.kitchen_exhaust && <span className="text-[11px] bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full font-medium">Kitchen Exhaust</span>}
                  </div>
                </div>
              )}
              {(q.region || q.district || q.pin_code) && (
                <div className="px-6 py-3 border-b border-gray-100">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-2">Location</div>
                  <div className="space-y-1 text-xs text-gray-600">
                    {q.region && <div className="flex items-center gap-1.5"><MapPin size={11} className="text-gray-400 shrink-0" />{q.region}</div>}
                    {q.district && <div className="pl-4 text-gray-500">{q.district}{q.pin_code ? ` · PIN ${q.pin_code}` : ''}</div>}
                  </div>
                </div>
              )}
              {q.amenities && q.amenities.length > 0 && (
                <div className="px-6 py-3">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-2">Amenities</div>
                  <div className="flex flex-wrap gap-1.5">
                    {q.amenities.map(a => <span key={a} className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{a}</span>)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-1">
                  <Star size={15} className="text-amber-500" />Preference List
                </div>
                <div className="text-xs text-gray-500">{reqPrefs.length} of 5 quarters selected</div>
              </div>
              {reqPrefs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Star size={36} className="mb-3 opacity-20" />
                  <div className="text-sm font-medium">No preferences added</div>
                  <div className="text-xs mt-1">Add preferences to your request</div>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {reqPrefs.map((pref, pi) => {
                    const pq = pref.quarter as Quarter | undefined;
                    if (!pq) return null;
                    return (
                      <div key={pref.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 hover:shadow-sm transition-all">
                        <div className="relative shrink-0">
                          <img src={getImage(pq, pi)} alt="" className="w-16 h-16 rounded-lg object-cover" />
                          <div className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center shadow">{pref.preference_rank}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm">{pq.quarter_number}</div>
                          {pq.address && <div className="text-xs text-gray-500 truncate">{pq.address}</div>}
                          <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                            <span className="flex items-center gap-0.5"><Bed size={10} />{pq.bhk_config}</span>
                            <span>{pq.area_sqft} sq.ft</span>
                            <span className="font-semibold text-gray-800">{fmtINR(pq.monthly_rent)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => onPreviewQuarter(pq.id)}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-colors"
                        ><Eye size={13} /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Request & Allotment details ── */}
        <div className="flex-1 overflow-y-auto bg-white">
          {/* Requester section */}
          <div className="px-6 pt-5 pb-4 border-b border-gray-100">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Requester</div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                {(userName ?? 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">{userName ?? '—'}</div>
                <div className="text-xs text-gray-500">{userEmployeeId ?? userEmail ?? '—'}</div>
                {userDepartment && <div className="text-xs text-gray-400">{userDepartment}</div>}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rf === 'SELF' ? 'bg-teal-50 text-teal-700' : rf === 'EMPLOYEE' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                {rf === 'SELF' ? 'Self' : rf === 'EMPLOYEE' ? 'On Behalf' : 'Third Party'}
              </span>
            </div>

            {rf === 'EMPLOYEE' && req.on_behalf_employee_name && (
              <div className="mt-3 flex items-center gap-3 bg-blue-50 rounded-xl border border-blue-100 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {req.on_behalf_employee_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wide mb-0.5">Requested For (Employee)</div>
                  <div className="text-sm font-semibold text-blue-900">{req.on_behalf_employee_name}</div>
                  <div className="text-xs text-blue-600">{req.on_behalf_employee_id}{req.on_behalf_employee_dept ? ` · ${req.on_behalf_employee_dept}` : ''}</div>
                </div>
                <UserCheck size={18} className="text-blue-400 shrink-0" />
              </div>
            )}

            {rf === 'TP' && req.tp_name && (
              <div className="mt-3 bg-amber-50 rounded-xl border border-amber-100 px-4 py-3 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {req.tp_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wide mb-0.5">Third Party Beneficiary</div>
                    <div className="text-sm font-semibold text-amber-900">{req.tp_name}</div>
                    {req.tp_organization && <div className="text-xs text-amber-600">{req.tp_organization}</div>}
                  </div>
                  <UserPlus size={18} className="text-amber-400 shrink-0" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {req.tp_mobile && (
                    <div className="flex items-center gap-1.5 text-amber-700"><Phone size={11} />{req.tp_mobile}</div>
                  )}
                  {req.tp_email && (
                    <div className="flex items-center gap-1.5 text-amber-700 truncate"><Mail size={11} />{req.tp_email}</div>
                  )}
                  {req.tp_pan && (
                    <div className="flex items-center gap-1.5 text-amber-700 col-span-2"><CreditCard size={11} />PAN: {req.tp_pan}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Request details */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Request Details</div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="col-span-2 bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                <div className="text-[10px] text-gray-400 mb-0.5">Request Reason</div>
                <div className="font-semibold text-gray-800 text-sm">{req.request_reason || '—'}</div>
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                <div className="text-[10px] text-gray-400 mb-0.5">BHK Required</div>
                <div className="font-semibold text-gray-800">{req.required_bhk_config || '—'}</div>
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                <div className="text-[10px] text-gray-400 mb-0.5">Pref. Location</div>
                <div className="font-semibold text-gray-800 truncate">{req.preferred_location || '—'}</div>
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                <div className="text-[10px] text-gray-400 mb-0.5">Family Members</div>
                <div className="font-semibold text-gray-800">{req.family_member_count ?? 1}</div>
              </div>
              {req.move_in_date && (
                <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                  <div className="text-[10px] text-gray-400 mb-0.5">Move-in Date</div>
                  <div className="font-semibold text-gray-800">{fmtDate(req.move_in_date)}</div>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                <div className="text-[10px] text-gray-400 mb-0.5">Requested On</div>
                <div className="font-semibold text-gray-800">{fmtDate(req.created_at)}</div>
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                <div className="text-[10px] text-gray-400 mb-0.5">Preferences</div>
                <div className="font-semibold text-gray-800">{reqPrefs.length} submitted</div>
              </div>
            </div>
            {req.employee_notes && (
              <div className="mt-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs">
                <div className="text-[10px] text-amber-500 font-bold uppercase tracking-wide mb-0.5 flex items-center gap-1"><Paperclip size={9} />Employee Notes</div>
                <div className="text-amber-900">{req.employee_notes}</div>
              </div>
            )}
          </div>

          {/* Allotment details */}
          {allotment && (
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Allotment Details</div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-emerald-50 rounded-xl border border-emerald-100 px-4 py-3">
                  <div className="text-[10px] text-emerald-500 mb-0.5">Allotment Date</div>
                  <div className="font-semibold text-emerald-900">{fmtDate(allotment.allotment_date)}</div>
                </div>
                <div className="bg-emerald-50 rounded-xl border border-emerald-100 px-4 py-3">
                  <div className="text-[10px] text-emerald-500 mb-0.5">Approval Status</div>
                  <div className="font-semibold text-emerald-900">{allotment.approval_status}</div>
                </div>
                {allotment.allotment_conditions && (
                  <div className="col-span-2 bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                    <div className="text-[10px] text-gray-400 mb-0.5">Allotment Conditions</div>
                    <div className="font-medium text-gray-800">{allotment.allotment_conditions}</div>
                  </div>
                )}
                {allotment.acknowledgement_remarks && (
                  <div className="col-span-2 bg-teal-50 rounded-xl border border-teal-100 px-4 py-3">
                    <div className="text-[10px] text-teal-500 mb-0.5">Acknowledgement Remarks</div>
                    <div className="font-medium text-teal-800">{allotment.acknowledgement_remarks}</div>
                  </div>
                )}
                {req.eo_notes && (
                  <div className="col-span-2 bg-blue-50 rounded-xl border border-blue-100 px-4 py-3">
                    <div className="text-[10px] text-blue-500 mb-0.5">EO Notes</div>
                    <div className="font-medium text-blue-800">{req.eo_notes}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions strip */}
          <div className="px-6 py-4">
            <button
              onClick={() => onOpenInActionPanel(req)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-blue-200 text-blue-700 text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              <ExternalLink size={15} />Open in Action Panel
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-2">Opens the request in the split-panel view for actions</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
