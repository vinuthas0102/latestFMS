import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Home, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Plus, FileText, CheckCircle, Clock, XCircle,
  ArrowUp, ArrowDown, Trash2, Search, Star, X, Eye, Send,
  Bed, Ruler, AlertCircle, Building2, CalendarDays, Upload,
  ThumbsUp, ThumbsDown, ArrowRightCircle, RefreshCw, LogOut,
  MapPin, Layers, IndianRupee, Wrench, Filter, MoreVertical,
  Images, Bell, Users, Paperclip, User, UserCheck, UserPlus, Phone, Mail, CreditCard,
  ArrowLeft, ExternalLink, Zap, ShieldCheck, UserCog,
  GitMerge, Key, ClipboardList, PlayCircle, CheckSquare, MessageSquare, SkipForward,
  UserX, HardHat, Package, ClipboardCheck, Handshake,
} from 'lucide-react';
import { PhotoLightbox } from '../components/ui/PhotoGallery';
import { Button } from '../components/ui/Button';
import { DocUpload } from '../components/ui/DocUpload';
import { QuarterDetailModal } from '../components/quarters/QuarterDetailModal';
import { QuarterOverrideModal } from '../components/quarters/QuarterOverrideModal';
import {
  DEMO_EMPLOYEES, DEMO_TP_PROFILES,
  DP_LABELS,
  statusAccentColor, fmtINR, fmtDate, statusConfig, tenantStatusConfig, serviceTypeConfig,
  resolveAllImages, getImage, CompactQuarterRow, QuarterDetailCard,
} from '../components/quarters/quarterRequestsHelpers';
import type { PrefItem } from '../types/quarter';
import {
  quartersService,
  Quarter,
  QuarterRequest,
  QuarterAllotment,
} from '../services/quartersService';
import { useQRContext, EORightMode } from './QuarterRequestsContext';
import { ROUTES } from '../constants/routes';

// Unified request summary block shown in all DPs
export const RequestSummaryBlock = ({ req }: { req: QuarterRequest }) => {
  const {
    user, requests, tenantRequests, selectedRequest, setSelectedRequest, activeCycle,
    isEO, eoMode, setEOMode,
    allotNowQuarterId, setAllotNowQuarterId, allotNowQuarter, setAllotNowQuarter, allotNowSubmitting,
    showAllotNowPicker, setShowAllotNowPicker, allotNowSearch, setAllotNowSearch, allotNowQuarters, allotNowLoading,
    overrideAllotment, setOverrideAllotment, overrideRequest, setOverrideRequest, showOverrideModal, setShowOverrideModal,
    manualAllotPickerOpen, setManualAllotPickerOpen, manualAllotSearch, setManualAllotSearch,
    manualAllotQuarters, manualAllotLoading, manualAllotSubmitting,
    eoTrId, setEoTrId, eoTrAction, setEoTrAction, eoTrNotes, setEoTrNotes, eoTrSubmitting,
    approvalRecord, approvalChats, approvalChatMsg, setApprovalChatMsg, approvalAction, setApprovalAction,
    approvalRemarks, setApprovalRemarks, approvalTargetLevel, setApprovalTargetLevel, approvalSubmitting,
    inspections, inspectionChats, selectedInspectionId, setSelectedInspectionId,
    inspectionPanel, setInspectionPanel, inspectionOpeningRemark, setInspectionOpeningRemark,
    inspectionChatMsg, setInspectionChatMsg, inspectionChatFile, setInspectionChatFile, inspectionSubmitting,
    inspectionCloseRemarks, setInspectionCloseRemarks, inspectionCondition, setInspectionCondition,
    showHandoverPopup, setShowHandoverPopup, handover, handoverKeyNo, setHandoverKeyNo,
    handoverRemarks, setHandoverRemarks, handoverDeadline, setHandoverDeadline,
    handoverInteriorFile, setHandoverInteriorFile, handoverReportFile, setHandoverReportFile, handoverSubmitting,
    showGuestInfoPopup, setShowGuestInfoPopup, guestInfoList, guestInfoLoading,
    guestForm, setGuestForm, guestAadhaarFile, setGuestAadhaarFile, guestPanFile, setGuestPanFile,
    guestOtherFiles, setGuestOtherFiles, guestSubmitting,
    eoRightMode, setEoRightMode, eoRejectReason, setEoRejectReason, eoRejectSubmitting,
    dpFilter, setDpFilter, showNewModal, setShowNewModal, form, setForm, prefs, setPrefs, submitting,
    requestFor, setRequestFor, selectedEmployee, setSelectedEmployee, tpInfo, setTpInfo,
    tpInfoConfirmed, setTpInfoConfirmed, showEmployeePicker, setShowEmployeePicker,
    showTPForm, setShowTPForm, tpPopupTab, setTpPopupTab, employeeSearch, setEmployeeSearch,
    employeeDeptFilter, setEmployeeDeptFilter, tpFormDraft, setTpFormDraft,
    declineModalReqId, setDeclineModalReqId, declineModalRemarks, setDeclineModalRemarks,
    declineModalDocUrl, setDeclineModalDocUrl, declineModalSubmitting,
    rightAction, setRightAction, actionRemarks, setActionRemarks, actionReason, setActionReason,
    actionDocUrl, setActionDocUrl, actionDate, setActionDate, actionBhk, setActionBhk, actionSubmitting,
    previewQuarterId, setPreviewQuarterId, isPreviewOpen, setIsPreviewOpen,
    serviceChats, setServiceChats, selectedServiceId, setSelectedServiceId,
    servicesHistoryMode, setServicesHistoryMode, chatMessage, setChatMessage,
    chatAttachFile, setChatAttachFile, chatSubmitting,
    allotmentChats, allotmentChatMessage, setAllotmentChatMessage, allotmentChatFile,
    setAllotmentChatFile, allotmentChatSubmitting,
    openMenuId, setOpenMenuId, menuPos, setMenuPos,
    expandedCardId, setExpandedCardId, expandedSvcsCardId, setExpandedSvcsCardId,
    expandedSvcDetailId, setExpandedSvcDetailId,
    lightboxImages, setLightboxImages, lightboxIndex, setLightboxIndex, lightboxOpen, setLightboxOpen,
    actionPopup, setActionPopup, popupReason, setPopupReason, popupRemarks, setPopupRemarks,
    popupDocUrl, setPopupDocUrl, popupDate, setPopupDate, popupSubject, setPopupSubject,
    popupUrgency, setPopupUrgency, popupSubmitting,
    selectedPrefQuarter, setSelectedPrefQuarter,
    loadData, resetActionForm, openActionPopup, closeActionPopup,
    handleSendChat, handleSendAllotmentChat, handleCloseService,
    handleAcknowledge, handleReject, handleTenantRequest,
    handleWithdraw, handleWithdrawTenantReq, handleManualAllot,
    handleEOApproveTR, handleEORejectTR, handlePopupSubmit, handleEORejectRequest,
    handleApproveLevel, handleSendClarification, handleStartInspection,
    handleSendInspectionChat, handleCloseInspection, handleCreateHandover, handleAddGuestInfo,
    openNewModal, openQuarterPreview,
    selectedPrefs, navigate, addToast, loadGuestInfo,
  } = useQRContext();
  const reqPrefs = req.preferences?.sort((a, b) => a.preference_rank - b.preference_rank) ?? [];
  const rf = req.request_for ?? 'SELF';
  return (
    <div className="px-5 py-4 border-b border-gray-100 space-y-3">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Request Summary</div>

      {/* Requester row */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 px-3 py-2.5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            {(user?.fullName ?? 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-800 leading-tight">{user?.fullName ?? '—'}</div>
            <div className="text-[10px] text-gray-400">{user?.govtEmployeeId ?? user?.email ?? '—'}</div>
          </div>
          <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${rf === 'SELF' ? 'bg-teal-50 text-teal-700' : rf === 'EMPLOYEE' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
            {rf === 'SELF' ? 'Self' : rf === 'EMPLOYEE' ? 'On Behalf' : 'Third Party'}
          </span>
        </div>
        {user?.govtDepartment && <div className="text-[10px] text-gray-500">{user.govtDepartment}</div>}
      </div>

      {/* On-behalf employee info */}
      {rf === 'EMPLOYEE' && req.on_behalf_employee_name && (
        <div className="bg-blue-50 rounded-xl border border-blue-100 px-3 py-2.5">
          <div className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><UserCheck size={10} />Requested For (Employee)</div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {req.on_behalf_employee_name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-semibold text-blue-900">{req.on_behalf_employee_name}</div>
              <div className="text-[10px] text-blue-500">{req.on_behalf_employee_id}{req.on_behalf_employee_dept ? ` · ${req.on_behalf_employee_dept}` : ''}</div>
            </div>
          </div>
        </div>
      )}

      {/* TP info */}
      {rf === 'TP' && req.tp_name && (
        <div className="bg-amber-50 rounded-xl border border-amber-100 px-3 py-2.5 space-y-1.5">
          <div className="text-[9px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1"><UserPlus size={10} />Third Party Beneficiary</div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {req.tp_name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-900">{req.tp_name}</div>
              {req.tp_organization && <div className="text-[10px] text-amber-600">{req.tp_organization}</div>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 mt-1">
            {req.tp_mobile && <div className="flex items-center gap-1 text-[10px] text-amber-700"><Phone size={9} />{req.tp_mobile}</div>}
            {req.tp_email && <div className="flex items-center gap-1 text-[10px] text-amber-700 truncate"><Mail size={9} />{req.tp_email}</div>}
            {req.tp_pan && <div className="flex items-center gap-1 text-[10px] text-amber-700"><CreditCard size={9} />PAN: {req.tp_pan}</div>}
          </div>
        </div>
      )}

      {/* Request fields grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 col-span-2">
          <div className="text-[10px] text-gray-400 mb-0.5">Request Reason</div>
          <div className="font-semibold text-gray-800">{req.request_reason || '—'}</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <div className="text-[10px] text-gray-400 mb-0.5">BHK Required</div>
          <div className="font-semibold text-gray-800">{req.required_bhk_config || '—'}</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <div className="text-[10px] text-gray-400 mb-0.5">Pref. Location</div>
          <div className="font-semibold text-gray-800 truncate">{req.preferred_location || '—'}</div>
        </div>
        {req.move_in_date && (
          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            <div className="text-[10px] text-gray-400 mb-0.5">Move-in Date</div>
            <div className="font-semibold text-gray-800">{fmtDate(req.move_in_date)}</div>
          </div>
        )}
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <div className="text-[10px] text-gray-400 mb-0.5">Family Members</div>
          <div className="font-semibold text-gray-800">{req.family_member_count ?? 1}</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <div className="text-[10px] text-gray-400 mb-0.5">Requested On</div>
          <div className="font-semibold text-gray-800">{fmtDate(req.created_at)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <div className="text-[10px] text-gray-400 mb-0.5">Preferences</div>
          <div className="font-semibold text-gray-800">{reqPrefs.length} submitted</div>
        </div>
        {req.sub_status && (
          <div className="bg-red-50 rounded-lg px-3 py-2 border border-red-100 col-span-2">
            <div className="text-[10px] text-red-400 mb-0.5">Sub Status</div>
            <div className="font-semibold text-red-700">{req.sub_status}</div>
          </div>
        )}
      </div>
      {req.employee_notes && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs">
          <div className="text-[10px] text-amber-500 font-semibold mb-0.5 flex items-center gap-1"><Paperclip size={9} />Employee Notes</div>
          <div className="text-amber-900">{req.employee_notes}</div>
        </div>
      )}
    </div>
  );
};

export const RightPanelAllotted = ({ panelControls }: { panelControls?: React.ReactNode }) => {
  const {
    user, requests, tenantRequests, selectedRequest, setSelectedRequest, activeCycle,
    isEO, eoMode, setEOMode,
    allotNowQuarterId, setAllotNowQuarterId, allotNowQuarter, setAllotNowQuarter, allotNowSubmitting,
    showAllotNowPicker, setShowAllotNowPicker, allotNowSearch, setAllotNowSearch, allotNowQuarters, allotNowLoading,
    overrideAllotment, setOverrideAllotment, overrideRequest, setOverrideRequest, showOverrideModal, setShowOverrideModal,
    manualAllotPickerOpen, setManualAllotPickerOpen, manualAllotSearch, setManualAllotSearch,
    manualAllotQuarters, manualAllotLoading, manualAllotSubmitting,
    eoTrId, setEoTrId, eoTrAction, setEoTrAction, eoTrNotes, setEoTrNotes, eoTrSubmitting,
    approvalRecord, approvalChats, approvalChatMsg, setApprovalChatMsg, approvalAction, setApprovalAction,
    approvalRemarks, setApprovalRemarks, approvalTargetLevel, setApprovalTargetLevel, approvalSubmitting,
    inspections, inspectionChats, selectedInspectionId, setSelectedInspectionId,
    inspectionPanel, setInspectionPanel, inspectionOpeningRemark, setInspectionOpeningRemark,
    inspectionChatMsg, setInspectionChatMsg, inspectionChatFile, setInspectionChatFile, inspectionSubmitting,
    inspectionCloseRemarks, setInspectionCloseRemarks, inspectionCondition, setInspectionCondition,
    showHandoverPopup, setShowHandoverPopup, handover, handoverKeyNo, setHandoverKeyNo,
    handoverRemarks, setHandoverRemarks, handoverDeadline, setHandoverDeadline,
    handoverInteriorFile, setHandoverInteriorFile, handoverReportFile, setHandoverReportFile, handoverSubmitting,
    showGuestInfoPopup, setShowGuestInfoPopup, guestInfoList, guestInfoLoading,
    guestForm, setGuestForm, guestAadhaarFile, setGuestAadhaarFile, guestPanFile, setGuestPanFile,
    guestOtherFiles, setGuestOtherFiles, guestSubmitting,
    eoRightMode, setEoRightMode, eoRejectReason, setEoRejectReason, eoRejectSubmitting,
    dpFilter, setDpFilter, showNewModal, setShowNewModal, form, setForm, prefs, setPrefs, submitting,
    requestFor, setRequestFor, selectedEmployee, setSelectedEmployee, tpInfo, setTpInfo,
    tpInfoConfirmed, setTpInfoConfirmed, showEmployeePicker, setShowEmployeePicker,
    showTPForm, setShowTPForm, tpPopupTab, setTpPopupTab, employeeSearch, setEmployeeSearch,
    employeeDeptFilter, setEmployeeDeptFilter, tpFormDraft, setTpFormDraft,
    declineModalReqId, setDeclineModalReqId, declineModalRemarks, setDeclineModalRemarks,
    declineModalDocUrl, setDeclineModalDocUrl, declineModalSubmitting,
    rightAction, setRightAction, actionRemarks, setActionRemarks, actionReason, setActionReason,
    actionDocUrl, setActionDocUrl, actionDate, setActionDate, actionBhk, setActionBhk, actionSubmitting,
    previewQuarterId, setPreviewQuarterId, isPreviewOpen, setIsPreviewOpen,
    serviceChats, setServiceChats, selectedServiceId, setSelectedServiceId,
    servicesHistoryMode, setServicesHistoryMode, chatMessage, setChatMessage,
    chatAttachFile, setChatAttachFile, chatSubmitting,
    allotmentChats, allotmentChatMessage, setAllotmentChatMessage, allotmentChatFile,
    setAllotmentChatFile, allotmentChatSubmitting,
    openMenuId, setOpenMenuId, menuPos, setMenuPos,
    expandedCardId, setExpandedCardId, expandedSvcsCardId, setExpandedSvcsCardId,
    expandedSvcDetailId, setExpandedSvcDetailId,
    lightboxImages, setLightboxImages, lightboxIndex, setLightboxIndex, lightboxOpen, setLightboxOpen,
    actionPopup, setActionPopup, popupReason, setPopupReason, popupRemarks, setPopupRemarks,
    popupDocUrl, setPopupDocUrl, popupDate, setPopupDate, popupSubject, setPopupSubject,
    popupUrgency, setPopupUrgency, popupSubmitting,
    selectedPrefQuarter, setSelectedPrefQuarter,
    loadData, resetActionForm, openActionPopup, closeActionPopup,
    handleSendChat, handleSendAllotmentChat, handleCloseService,
    handleAcknowledge, handleReject, handleTenantRequest,
    handleWithdraw, handleWithdrawTenantReq, handleManualAllot,
    handleEOApproveTR, handleEORejectTR, handlePopupSubmit, handleEORejectRequest,
    handleApproveLevel, handleSendClarification, handleStartInspection,
    handleSendInspectionChat, handleCloseInspection, handleCreateHandover, handleAddGuestInfo,
    openNewModal, openQuarterPreview,
    selectedPrefs, navigate, addToast, loadGuestInfo,
  } = useQRContext();
  if (!selectedRequest?.allotment) return null;
  const allotment = selectedRequest.allotment;
  const q = allotment.quarter;

  const allotmentChatFileRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chats = allotmentChats[allotment.id] ?? [];


  const approvalBadgeColor = allotment.approval_status === 'ACKNOWLEDGED'
    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    : allotment.approval_status === 'REJECTED'
    ? 'bg-red-100 text-red-800 border border-red-200'
    : 'bg-white/20 text-white';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-600 rounded-t-xl shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 shrink-0">
          <CheckCircle size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-emerald-100 uppercase tracking-wide">Quarter Allotted</div>
          <div className="text-sm font-semibold text-white">{selectedRequest.request_number}</div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${approvalBadgeColor}`}>
          {allotment.approval_status}
        </span>
        {panelControls}
      </div>

      {/* Quarter identity strip */}
      {q && <CompactQuarterRow q={q} accentCls="bg-emerald-50 text-emerald-700 border-emerald-200" />}
      {!q && (
        <div className="px-5 py-3 border-b border-gray-100 bg-emerald-50 shrink-0">
          <div className="text-xs text-emerald-700 font-medium">Allotted on {fmtDate(allotment.allotment_date)}</div>
        </div>
      )}

      {/* Conditions banner */}
      {allotment.allotment_conditions && (
        <div className="px-4 py-2 border-b border-amber-100 bg-amber-50 shrink-0">
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Conditions: </span>{allotment.allotment_conditions}
          </p>
        </div>
      )}

      {/* Chat thread */}
      <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50 min-h-0">
        {[...chats].reverse().map(chat => {
          const isEmployee = chat.author_role === 'employee';
          return (
            <div key={chat.id} className={`flex ${isEmployee ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                isEmployee
                  ? 'bg-emerald-600 text-white rounded-tr-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
              }`}>
                {chat.author_role === 'eo' && (
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Estate Officer</div>
                )}
                <p className="text-[13px] leading-relaxed">{chat.message}</p>
                {chat.document_urls.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {chat.document_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-1.5 text-[11px] font-medium ${isEmployee ? 'text-emerald-100 hover:text-white' : 'text-blue-600 hover:text-blue-700'}`}>
                        <Paperclip size={10} />Attachment {i + 1}
                      </a>
                    ))}
                  </div>
                )}
                <div className={`text-[10px] mt-1.5 ${isEmployee ? 'text-emerald-200' : 'text-gray-400'}`}>{fmtDate(chat.created_at)}</div>
              </div>
            </div>
          );
        })}
        {chats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-2.5">
              <Send size={16} className="text-emerald-400" />
            </div>
            <div className="text-[13px] font-semibold text-gray-500">No messages yet</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Ask the Estate Officer a question below</div>
          </div>
        )}
      </div>

      {/* Compose bar */}
      <div className="shrink-0 border-t border-gray-100 px-4 py-3 bg-white">
        {allotmentChatFile && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg mb-2">
            <FileText size={13} className="text-blue-500 shrink-0" />
            <span className="flex-1 min-w-0 text-[12px] font-medium text-blue-800 truncate">{allotmentChatFile.name}</span>
            <button type="button" onClick={() => setAllotmentChatFile(null)} className="p-0.5 rounded text-blue-400 hover:text-red-500 transition-colors shrink-0">
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => allotmentChatFileRef.current?.click()}
            className="flex-none p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
            title="Attach file"
          >
            <Paperclip size={15} />
          </button>
          <input
            ref={allotmentChatFileRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0] ?? null; setAllotmentChatFile(f); e.target.value = ''; }}
          />
          <textarea
            value={allotmentChatMessage}
            onChange={e => setAllotmentChatMessage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && allotmentChatMessage.trim()) { e.preventDefault(); handleSendAllotmentChat(); } }}
            rows={1}
            placeholder="Message the Estate Officer… (Enter to send)"
            className="flex-1 px-3.5 py-2.5 text-[13px] border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 bg-white leading-relaxed transition-colors"
            style={{ minHeight: '40px', maxHeight: '80px' }}
          />
          <button
            onClick={handleSendAllotmentChat}
            disabled={!allotmentChatMessage.trim() || allotmentChatSubmitting}
            className="flex-none p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            title="Send"
          >
            <Send size={15} />
          </button>
        </div>
      </div>

    </div>
  );
};

export const RightPanelOccupied = ({ panelControls }: { panelControls?: React.ReactNode }) => {
  const {
    user, requests, tenantRequests, selectedRequest, setSelectedRequest, activeCycle,
    isEO, eoMode, setEOMode,
    allotNowQuarterId, setAllotNowQuarterId, allotNowQuarter, setAllotNowQuarter, allotNowSubmitting,
    showAllotNowPicker, setShowAllotNowPicker, allotNowSearch, setAllotNowSearch, allotNowQuarters, allotNowLoading,
    overrideAllotment, setOverrideAllotment, overrideRequest, setOverrideRequest, showOverrideModal, setShowOverrideModal,
    manualAllotPickerOpen, setManualAllotPickerOpen, manualAllotSearch, setManualAllotSearch,
    manualAllotQuarters, manualAllotLoading, manualAllotSubmitting,
    eoTrId, setEoTrId, eoTrAction, setEoTrAction, eoTrNotes, setEoTrNotes, eoTrSubmitting,
    approvalRecord, approvalChats, approvalChatMsg, setApprovalChatMsg, approvalAction, setApprovalAction,
    approvalRemarks, setApprovalRemarks, approvalTargetLevel, setApprovalTargetLevel, approvalSubmitting,
    inspections, inspectionChats, selectedInspectionId, setSelectedInspectionId,
    inspectionPanel, setInspectionPanel, inspectionOpeningRemark, setInspectionOpeningRemark,
    inspectionChatMsg, setInspectionChatMsg, inspectionChatFile, setInspectionChatFile, inspectionSubmitting,
    inspectionCloseRemarks, setInspectionCloseRemarks, inspectionCondition, setInspectionCondition,
    showHandoverPopup, setShowHandoverPopup, handover, handoverKeyNo, setHandoverKeyNo,
    handoverRemarks, setHandoverRemarks, handoverDeadline, setHandoverDeadline,
    handoverInteriorFile, setHandoverInteriorFile, handoverReportFile, setHandoverReportFile, handoverSubmitting,
    showGuestInfoPopup, setShowGuestInfoPopup, guestInfoList, guestInfoLoading,
    guestForm, setGuestForm, guestAadhaarFile, setGuestAadhaarFile, guestPanFile, setGuestPanFile,
    guestOtherFiles, setGuestOtherFiles, guestSubmitting,
    eoRightMode, setEoRightMode, eoRejectReason, setEoRejectReason, eoRejectSubmitting,
    dpFilter, setDpFilter, showNewModal, setShowNewModal, form, setForm, prefs, setPrefs, submitting,
    requestFor, setRequestFor, selectedEmployee, setSelectedEmployee, tpInfo, setTpInfo,
    tpInfoConfirmed, setTpInfoConfirmed, showEmployeePicker, setShowEmployeePicker,
    showTPForm, setShowTPForm, tpPopupTab, setTpPopupTab, employeeSearch, setEmployeeSearch,
    employeeDeptFilter, setEmployeeDeptFilter, tpFormDraft, setTpFormDraft,
    declineModalReqId, setDeclineModalReqId, declineModalRemarks, setDeclineModalRemarks,
    declineModalDocUrl, setDeclineModalDocUrl, declineModalSubmitting,
    rightAction, setRightAction, actionRemarks, setActionRemarks, actionReason, setActionReason,
    actionDocUrl, setActionDocUrl, actionDate, setActionDate, actionBhk, setActionBhk, actionSubmitting,
    previewQuarterId, setPreviewQuarterId, isPreviewOpen, setIsPreviewOpen,
    serviceChats, setServiceChats, selectedServiceId, setSelectedServiceId,
    servicesHistoryMode, setServicesHistoryMode, chatMessage, setChatMessage,
    chatAttachFile, setChatAttachFile, chatSubmitting,
    allotmentChats, allotmentChatMessage, setAllotmentChatMessage, allotmentChatFile,
    setAllotmentChatFile, allotmentChatSubmitting,
    openMenuId, setOpenMenuId, menuPos, setMenuPos,
    expandedCardId, setExpandedCardId, expandedSvcsCardId, setExpandedSvcsCardId,
    expandedSvcDetailId, setExpandedSvcDetailId,
    lightboxImages, setLightboxImages, lightboxIndex, setLightboxIndex, lightboxOpen, setLightboxOpen,
    actionPopup, setActionPopup, popupReason, setPopupReason, popupRemarks, setPopupRemarks,
    popupDocUrl, setPopupDocUrl, popupDate, setPopupDate, popupSubject, setPopupSubject,
    popupUrgency, setPopupUrgency, popupSubmitting,
    selectedPrefQuarter, setSelectedPrefQuarter,
    loadData, resetActionForm, openActionPopup, closeActionPopup,
    handleSendChat, handleSendAllotmentChat, handleCloseService,
    handleAcknowledge, handleReject, handleTenantRequest,
    handleWithdraw, handleWithdrawTenantReq, handleManualAllot,
    handleEOApproveTR, handleEORejectTR, handlePopupSubmit, handleEORejectRequest,
    handleApproveLevel, handleSendClarification, handleStartInspection,
    handleSendInspectionChat, handleCloseInspection, handleCreateHandover, handleAddGuestInfo,
    openNewModal, openQuarterPreview,
    selectedPrefs, navigate, addToast, loadGuestInfo,
  } = useQRContext();
  if (!selectedRequest?.allotment) return null;
  const allotment = selectedRequest.allotment;
  const q = allotment.quarter;

  // Active tenant requests (PENDING) for this allotment
  const activeSvcRequests = tenantRequests.filter(tr => tr.allotment_id === allotment.id && tr.request_status === 'PENDING');
  // All tenant requests for history mode
  const allSvcRequests = tenantRequests.filter(tr => tr.allotment_id === allotment.id);
  const [historySelectedId, setHistorySelectedId] = useState<string | null>(allSvcRequests[0]?.id ?? null);

  const chatsForService = selectedServiceId ? (serviceChats[selectedServiceId] ?? []) : [];
  const selectedSvc = selectedServiceId ? tenantRequests.find(tr => tr.id === selectedServiceId) : null;
  const serviceTypeLabel = selectedSvc ? serviceTypeConfig(selectedSvc.service_type).label : '';

  if (servicesHistoryMode) {
    const historyChats = historySelectedId ? (serviceChats[historySelectedId] ?? []) : [];
    const historySvc = historySelectedId ? allSvcRequests.find(tr => tr.id === historySelectedId) : null;
    return (
      <>
        <div className="flex items-center gap-3 px-4 py-3 bg-teal-600 rounded-t-xl sticky top-0 z-10">
          <button onClick={() => setServicesHistoryMode(false)} className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors shrink-0">
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-teal-100 uppercase tracking-wide">Service History</div>
            <div className="text-sm font-semibold text-white">{selectedRequest.request_number}</div>
          </div>
          {panelControls}
        </div>
        <div className="flex h-full" style={{ minHeight: 400 }}>
          {/* Left sub-list */}
          <div className="w-40 shrink-0 border-r border-gray-200 overflow-y-auto">
            {allSvcRequests.length === 0 ? (
              <div className="p-3 text-xs text-gray-400 text-center">No history</div>
            ) : allSvcRequests.map(tr => {
              const stc = serviceTypeConfig(tr.service_type);
              const sc = tenantStatusConfig(tr.request_status);
              return (
                <button
                  key={tr.id}
                  onClick={() => {
                    setHistorySelectedId(tr.id);
                    quartersService.getServiceChats(tr.id).then(chats => {
                      setServiceChats(prev => ({ ...prev, [tr.id]: chats }));
                    }).catch(() => {});
                  }}
                  className={`w-full text-left px-3 py-2.5 border-b border-gray-100 transition-colors ${historySelectedId === tr.id ? 'bg-teal-50' : 'hover:bg-gray-50'}`}
                >
                  <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${stc.cls} mb-1`}>{stc.icon}{stc.label}</div>
                  <div className={`text-[10px] px-1.5 py-0.5 rounded-full border inline-block ${sc.cls}`}>{sc.label}</div>
                  <div className="text-[10px] text-gray-400 mt-1">{fmtDate(tr.created_at)}</div>
                </button>
              );
            })}
          </div>
          {/* Right sub-detail: chats */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {historySvc && (
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${serviceTypeConfig(historySvc.service_type).cls}`}>
                  {serviceTypeConfig(historySvc.service_type).icon}{serviceTypeConfig(historySvc.service_type).label}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full border ${tenantStatusConfig(historySvc.request_status).cls}`}>{tenantStatusConfig(historySvc.request_status).label}</span>
              </div>
            )}
            {historyChats.length === 0 ? (
              <div className="text-center text-xs text-gray-400 py-6">No messages for this service request.</div>
            ) : [...historyChats].reverse().map(chat => (
              <div key={chat.id} className={`flex gap-2 ${chat.author_role === 'EMPLOYEE' ? 'flex-row-reverse' : ''}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${chat.author_role === 'EMPLOYEE' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  <p>{chat.message}</p>
                  {chat.document_urls.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {chat.document_urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs underline opacity-80">Document {i + 1}</a>
                      ))}
                    </div>
                  )}
                  <div className="text-[10px] mt-1 opacity-60">{fmtDate(chat.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // ── Service detail view — shown when a service sub-card is selected ────────
  if (selectedSvc) {
    const stc = serviceTypeConfig(selectedSvc.service_type);
    const tsc = tenantStatusConfig(selectedSvc.request_status);
    const svcCtrlRef = `SVC-${selectedSvc.id.slice(-6).toUpperCase()}`;

    const svcAccentBar = {
      GRIEVANCE: 'bg-rose-500',
      MAINTENANCE: 'bg-slate-500',
      EXTEND: 'bg-amber-500',
      UPGRADE: 'bg-sky-500',
      VACATE: 'bg-orange-500',
    }[selectedSvc.service_type] ?? 'bg-gray-500';

    const svcIconCls = {
      GRIEVANCE: 'bg-rose-100 text-rose-600',
      MAINTENANCE: 'bg-slate-100 text-slate-600',
      EXTEND: 'bg-amber-100 text-amber-600',
      UPGRADE: 'bg-sky-100 text-sky-600',
      VACATE: 'bg-orange-100 text-orange-600',
    }[selectedSvc.service_type] ?? 'bg-gray-100 text-gray-600';

    const svcBorderLeft = {
      GRIEVANCE: 'border-l-rose-400',
      MAINTENANCE: 'border-l-slate-400',
      EXTEND: 'border-l-amber-400',
      UPGRADE: 'border-l-sky-400',
      VACATE: 'border-l-orange-400',
    }[selectedSvc.service_type] ?? 'border-l-gray-400';

    const hasSubjectInfo = (selectedSvc.service_type === 'GRIEVANCE' || selectedSvc.service_type === 'MAINTENANCE') && (selectedSvc.grievance_subject || selectedSvc.remarks);
    const mainTitle = (hasSubjectInfo ? selectedSvc.grievance_subject : selectedSvc.reason) || stc.label;

    // File input ref for chat attachment
    const chatFileRef = useRef<HTMLInputElement>(null);

    const titleIsGeneric = mainTitle === stc.label;

    return (
      <div className="flex flex-col h-full bg-white">

        {/* ── Header: single compact bar ── */}
        <div className="flex-none flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-100 rounded-t-xl sticky top-0 z-10">
          <button
            onClick={() => setSelectedServiceId(null)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors shrink-0"
            title="Back to quarter"
          >
            <ChevronLeft size={16} />
          </button>

          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${svcIconCls}`}>
            {stc.icon}
          </div>

          {titleIsGeneric ? (
            /* No meaningful title — collapse to single row */
            <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
              <span className="text-[13px] font-bold text-gray-900 shrink-0">{stc.label}</span>
              <span className="text-[10px] text-gray-400 font-mono shrink-0">{svcCtrlRef}</span>
            </div>
          ) : (
            /* Has a real title — show type+ref on line 1, title on line 2 */
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-500">{stc.label}</span>
                <span className="text-[10px] text-gray-400 font-mono">{svcCtrlRef}</span>
              </div>
              <div className="text-[13px] font-semibold text-gray-900 leading-tight truncate">{mainTitle}</div>
            </div>
          )}

          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${tsc.cls}`}>{tsc.label}</span>
          {panelControls && (
            <div className="flex items-center gap-0.5 shrink-0 ml-1 [&_button]:text-gray-400 [&_button]:hover:text-gray-700 [&_button]:hover:bg-gray-100 [&_div]:bg-gray-200">
              {panelControls}
            </div>
          )}
        </div>

        {/* ── Quarter context sub-row ── */}
        {q && (
          <div className="flex-none flex items-center gap-2.5 px-4 py-1.5 bg-teal-50 border-b border-teal-100">
            <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 border border-teal-200">
              <img src={getImage(q, 0)} alt={q.quarter_number} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-teal-800">{q.quarter_number}</span>
              <span className="text-[10px] text-teal-500">·</span>
              <span className="text-[11px] text-teal-700">{q.bhk_config}</span>
              <span className="text-[10px] text-teal-400">·</span>
              <span className="text-[11px] text-teal-600 truncate">{q.address ?? `Block ${q.block_name}, Floor ${q.floor_number}`}</span>
            </div>
            <span className="text-[10px] font-semibold text-teal-700 bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-full shrink-0">Occupied</span>
          </div>
        )}

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto bg-gray-50">

          {/* ── Service details card ── */}
          <div className="p-4 pb-2">
            <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${svcBorderLeft} shadow-sm overflow-hidden`}>

              {/* Title row */}
              <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{stc.label}</div>
                    <div className="text-[15px] font-bold text-gray-900 leading-snug">{mainTitle}</div>
                  </div>
                  {selectedSvc.request_status === 'PENDING' && (
                    <button
                      onClick={handleCloseService}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-[11px] font-semibold hover:bg-red-100 transition-colors"
                    >
                      <X size={11} />Close
                    </button>
                  )}
                </div>
              </div>

              {/* Detail fields grid */}
              <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-4">

                {/* Reason (if not already shown as title) */}
                {selectedSvc.reason && !hasSubjectInfo && (
                  <div className="col-span-2">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Reason</div>
                    <div className="text-[13px] text-gray-800 leading-relaxed">{selectedSvc.reason}</div>
                  </div>
                )}

                {/* Subject (grievance / maintenance) */}
                {hasSubjectInfo && selectedSvc.grievance_subject && (
                  <div className="col-span-2">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Subject</div>
                    <div className="text-[13px] text-gray-800 leading-relaxed">{selectedSvc.grievance_subject}</div>
                  </div>
                )}

                {/* Remarks */}
                {selectedSvc.remarks && (
                  <div className="col-span-2">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Remarks</div>
                    <div className="text-[12px] text-gray-600 leading-relaxed">{selectedSvc.remarks}</div>
                  </div>
                )}

                {/* Urgency */}
                {selectedSvc.urgency_level && selectedSvc.urgency_level !== 'NORMAL' && (
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Urgency</div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border inline-block ${
                      selectedSvc.urgency_level === 'CRITICAL' ? 'bg-red-100 text-red-800 border-red-300'
                      : selectedSvc.urgency_level === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {selectedSvc.urgency_level}
                    </span>
                  </div>
                )}

                {/* Date */}
                {selectedSvc.requested_date && (
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      {selectedSvc.service_type === 'EXTEND' ? 'Extension Until' : selectedSvc.service_type === 'VACATE' ? 'Vacate By' : 'Requested Date'}
                    </div>
                    <div className="text-[12px] text-gray-800 flex items-center gap-1.5">
                      <CalendarDays size={12} className="text-gray-400" />{fmtDate(selectedSvc.requested_date)}
                    </div>
                  </div>
                )}

                {/* Required BHK */}
                {selectedSvc.required_bhk_config && (
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Required BHK</div>
                    <div className="text-[12px] text-gray-800 flex items-center gap-1.5">
                      <Bed size={12} className="text-gray-400" />{selectedSvc.required_bhk_config}
                    </div>
                  </div>
                )}

                {/* Submitted */}
                <div>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Submitted</div>
                  <div className="text-[12px] text-gray-700">{fmtDate(selectedSvc.created_at)}</div>
                </div>

                {/* Document */}
                {selectedSvc.document_url && (
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Document</div>
                    <a href={selectedSvc.document_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] text-blue-600 hover:text-blue-700 font-medium hover:underline underline-offset-2 transition-colors">
                      <ExternalLink size={11} />View File
                    </a>
                  </div>
                )}
              </div>

              {/* EO Notes */}
              {selectedSvc.eo_notes && (
                <div className="mx-4 mb-4 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Estate Officer Notes</div>
                  <div className="text-[12px] text-amber-900 leading-relaxed">{selectedSvc.eo_notes}</div>
                </div>
              )}
            </div>
          </div>

          {/* ── Conversation section ── */}
          <div className="px-4 pt-2 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Conversation</span>
                {chatsForService.length > 0 && (
                  <span className="bg-teal-100 text-teal-700 rounded-full px-2 py-0.5 text-[10px] font-bold">{chatsForService.length}</span>
                )}
              </div>
              <button
                onClick={() => setServicesHistoryMode(true)}
                className="text-[11px] text-gray-400 hover:text-gray-700 font-medium flex items-center gap-1.5 transition-colors"
              >
                <Clock size={11} /> History
              </button>
            </div>

            <div className="space-y-3">
              {[...chatsForService].reverse().map(chat => {
                const isEmployee = chat.author_role === 'EMPLOYEE';
                return (
                  <div key={chat.id} className={`flex ${isEmployee ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                      isEmployee
                        ? 'bg-teal-600 text-white rounded-tr-sm'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                    }`}>
                      <p className="text-[13px] leading-relaxed">{chat.message}</p>
                      {chat.document_urls.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {chat.document_urls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                              className={`flex items-center gap-1.5 text-[11px] font-medium ${isEmployee ? 'text-teal-100 hover:text-white' : 'text-blue-600 hover:text-blue-700'}`}>
                              <Paperclip size={10} />Attachment {i + 1}
                            </a>
                          ))}
                        </div>
                      )}
                      <div className={`text-[10px] mt-1.5 ${isEmployee ? 'text-teal-200' : 'text-gray-400'}`}>{fmtDate(chat.created_at)}</div>
                    </div>
                  </div>
                );
              })}
              {chatsForService.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2.5">
                    <Send size={16} className="text-gray-300" />
                  </div>
                  <div className="text-[13px] font-semibold text-gray-500">No messages yet</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Start the conversation below</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Pinned compose bar ── */}
        <div className="flex-none border-t border-gray-100 px-4 py-3 bg-white">
          {/* File attachment chip */}
          {chatAttachFile && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg mb-2">
              <FileText size={13} className="text-blue-500 shrink-0" />
              <span className="flex-1 min-w-0 text-[12px] font-medium text-blue-800 truncate">{chatAttachFile.name}</span>
              <button type="button" onClick={() => setChatAttachFile(null)} className="p-0.5 rounded text-blue-400 hover:text-red-500 transition-colors shrink-0">
                <X size={12} />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => chatFileRef.current?.click()}
              className="flex-none p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50 transition-colors"
              title="Attach file"
            >
              <Paperclip size={15} />
            </button>
            <input
              ref={chatFileRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0] ?? null; setChatAttachFile(f); e.target.value = ''; }}
            />

            <textarea
              value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && chatMessage.trim()) { e.preventDefault(); handleSendChat(); } }}
              rows={1}
              placeholder="Type a message… (Enter to send)"
              className="flex-1 px-3.5 py-2.5 text-[13px] border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 bg-white leading-relaxed transition-colors"
              style={{ minHeight: '40px', maxHeight: '80px' }}
            />

            <button
              onClick={handleSendChat}
              disabled={!chatMessage.trim() || chatSubmitting}
              className="flex-none p-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              title="Send"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-teal-600 rounded-t-xl sticky top-0 z-10">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 shrink-0">
          <ThumbsUp size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-teal-100 uppercase tracking-wide">Currently Occupied</div>
          <div className="text-sm font-semibold text-white">{selectedRequest.request_number}</div>
        </div>
        <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full shrink-0">
          Since {fmtDate(allotment.acknowledged_at ?? allotment.allotment_date)}
        </span>
        {panelControls}
      </div>

      {/* Quarter identity strip */}
      {q && <CompactQuarterRow q={q} accentCls="bg-teal-50 text-teal-700 border-teal-200" />}

      {/* ── RAISE NEW SERVICE ───────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">Raise New Service</span>
          <button
            onClick={() => setServicesHistoryMode(true)}
            className="text-[11px] text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1 transition-colors"
          >
            <Clock size={11} /> History
          </button>
        </div>

        {rightAction === null && (() => {
          const hasActiveSvc = ['EXTEND_REQUESTED', 'VACATE_REQUESTED'].includes(selectedRequest.request_status);
          return (
            <>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => openActionPopup('GRIEVANCE', selectedRequest.id, allotment.id)}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-xl border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-medium transition-colors"
                >
                  <Bell size={14} /><span>Grievance</span>
                </button>
                <button
                  onClick={() => openActionPopup('MAINTENANCE', selectedRequest.id, allotment.id)}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-medium transition-colors"
                >
                  <Wrench size={14} /><span>Maintenance</span>
                </button>
                {!hasActiveSvc && (
                  <button
                    onClick={() => setRightAction('extend')}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-xl border border-amber-100 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-medium transition-colors"
                  >
                    <RefreshCw size={14} /><span>Extend</span>
                  </button>
                )}
                {!hasActiveSvc && (
                  <button
                    onClick={() => setRightAction('upgrade')}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-xl border border-sky-100 bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-medium transition-colors"
                  >
                    <ArrowRightCircle size={14} /><span>Upgrade</span>
                  </button>
                )}
                {!hasActiveSvc && (
                  <button
                    onClick={() => openActionPopup('VACATE', selectedRequest.id, allotment.id)}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-xl border border-orange-100 bg-orange-50 hover:bg-orange-100 text-orange-700 text-[11px] font-medium transition-colors"
                  >
                    <LogOut size={14} /><span>Vacate</span>
                  </button>
                )}
                <button
                  onClick={() => navigate(`${ROUTES.QUARTERS_RENT}?allotment_id=${allotment.id}`)}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-xl border border-teal-100 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-medium transition-colors"
                >
                  <IndianRupee size={14} /><span>Rent</span>
                </button>
              </div>
              {hasActiveSvc && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-orange-600 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                  <AlertCircle size={11} />
                  Extend / Upgrade / Vacate unavailable — a request is pending EO review.
                </div>
              )}
            </>
          );
        })()}

        {(rightAction === 'extend' || rightAction === 'vacate') && (() => {
          const serviceType = (rightAction.toUpperCase()) as 'EXTEND' | 'VACATE';
          const cfg = serviceTypeConfig(serviceType);
          return (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-semibold flex items-center gap-1.5 ${cfg.cls.split(' ').filter(c => c.startsWith('text-')).join(' ')}`}>
                  {cfg.icon} {cfg.label} Request
                </span>
                <button onClick={resetActionForm} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reason *</label>
                <textarea value={actionReason} onChange={e => setActionReason(e.target.value)} rows={2} placeholder="Reason for this request…" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                <input value={actionRemarks} onChange={e => setActionRemarks(e.target.value)} placeholder="Additional remarks…" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {rightAction === 'extend' ? 'Extension Until Date' : 'Intended Vacate Date'}
                </label>
                <div className="relative">
                  <CalendarDays size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="date" value={actionDate} onChange={e => setActionDate(e.target.value)} className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
              <DocUpload value={actionDocUrl} onChange={setActionDocUrl} label="Document" optional />
              <div className="flex gap-2 pt-1">
                <button onClick={resetActionForm} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={() => handleTenantRequest(serviceType)} disabled={actionSubmitting} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {actionSubmitting ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </div>
          );
        })()}

        {rightAction === 'upgrade' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-sky-700 flex items-center gap-1.5"><ArrowRightCircle size={14} /> Upgrade Quarter</span>
              <button onClick={resetActionForm} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Required BHK Config *</label>
              <input value={actionBhk} onChange={e => setActionBhk(e.target.value)} placeholder="e.g. 3 BHK" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reason *</label>
              <textarea value={actionReason} onChange={e => setActionReason(e.target.value)} rows={2} placeholder="Reason for upgrade…" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 resize-none" />
            </div>
            <DocUpload value={actionDocUrl} onChange={setActionDocUrl} label="Document" optional />
            <div className="flex gap-2 pt-1">
              <button onClick={resetActionForm} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleTenantRequest('UPGRADE')} disabled={actionSubmitting} className="flex-1 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors">
                {actionSubmitting ? 'Submitting…' : 'Submit Upgrade Request'}
              </button>
            </div>
          </div>
        )}
      </div>

    </>
  );
};

export const RightPanelDraft = ({ panelControls }: { panelControls?: React.ReactNode }) => {
  const {
    user, requests, tenantRequests, selectedRequest, setSelectedRequest, activeCycle,
    isEO, eoMode, setEOMode,
    allotNowQuarterId, setAllotNowQuarterId, allotNowQuarter, setAllotNowQuarter, allotNowSubmitting,
    showAllotNowPicker, setShowAllotNowPicker, allotNowSearch, setAllotNowSearch, allotNowQuarters, allotNowLoading,
    overrideAllotment, setOverrideAllotment, overrideRequest, setOverrideRequest, showOverrideModal, setShowOverrideModal,
    manualAllotPickerOpen, setManualAllotPickerOpen, manualAllotSearch, setManualAllotSearch,
    manualAllotQuarters, manualAllotLoading, manualAllotSubmitting,
    eoTrId, setEoTrId, eoTrAction, setEoTrAction, eoTrNotes, setEoTrNotes, eoTrSubmitting,
    approvalRecord, approvalChats, approvalChatMsg, setApprovalChatMsg, approvalAction, setApprovalAction,
    approvalRemarks, setApprovalRemarks, approvalTargetLevel, setApprovalTargetLevel, approvalSubmitting,
    inspections, inspectionChats, selectedInspectionId, setSelectedInspectionId,
    inspectionPanel, setInspectionPanel, inspectionOpeningRemark, setInspectionOpeningRemark,
    inspectionChatMsg, setInspectionChatMsg, inspectionChatFile, setInspectionChatFile, inspectionSubmitting,
    inspectionCloseRemarks, setInspectionCloseRemarks, inspectionCondition, setInspectionCondition,
    showHandoverPopup, setShowHandoverPopup, handover, handoverKeyNo, setHandoverKeyNo,
    handoverRemarks, setHandoverRemarks, handoverDeadline, setHandoverDeadline,
    handoverInteriorFile, setHandoverInteriorFile, handoverReportFile, setHandoverReportFile, handoverSubmitting,
    showGuestInfoPopup, setShowGuestInfoPopup, guestInfoList, guestInfoLoading,
    guestForm, setGuestForm, guestAadhaarFile, setGuestAadhaarFile, guestPanFile, setGuestPanFile,
    guestOtherFiles, setGuestOtherFiles, guestSubmitting,
    eoRightMode, setEoRightMode, eoRejectReason, setEoRejectReason, eoRejectSubmitting,
    dpFilter, setDpFilter, showNewModal, setShowNewModal, form, setForm, prefs, setPrefs, submitting,
    requestFor, setRequestFor, selectedEmployee, setSelectedEmployee, tpInfo, setTpInfo,
    tpInfoConfirmed, setTpInfoConfirmed, showEmployeePicker, setShowEmployeePicker,
    showTPForm, setShowTPForm, tpPopupTab, setTpPopupTab, employeeSearch, setEmployeeSearch,
    employeeDeptFilter, setEmployeeDeptFilter, tpFormDraft, setTpFormDraft,
    declineModalReqId, setDeclineModalReqId, declineModalRemarks, setDeclineModalRemarks,
    declineModalDocUrl, setDeclineModalDocUrl, declineModalSubmitting,
    rightAction, setRightAction, actionRemarks, setActionRemarks, actionReason, setActionReason,
    actionDocUrl, setActionDocUrl, actionDate, setActionDate, actionBhk, setActionBhk, actionSubmitting,
    previewQuarterId, setPreviewQuarterId, isPreviewOpen, setIsPreviewOpen,
    serviceChats, setServiceChats, selectedServiceId, setSelectedServiceId,
    servicesHistoryMode, setServicesHistoryMode, chatMessage, setChatMessage,
    chatAttachFile, setChatAttachFile, chatSubmitting,
    allotmentChats, allotmentChatMessage, setAllotmentChatMessage, allotmentChatFile,
    setAllotmentChatFile, allotmentChatSubmitting,
    openMenuId, setOpenMenuId, menuPos, setMenuPos,
    expandedCardId, setExpandedCardId, expandedSvcsCardId, setExpandedSvcsCardId,
    expandedSvcDetailId, setExpandedSvcDetailId,
    lightboxImages, setLightboxImages, lightboxIndex, setLightboxIndex, lightboxOpen, setLightboxOpen,
    actionPopup, setActionPopup, popupReason, setPopupReason, popupRemarks, setPopupRemarks,
    popupDocUrl, setPopupDocUrl, popupDate, setPopupDate, popupSubject, setPopupSubject,
    popupUrgency, setPopupUrgency, popupSubmitting,
    selectedPrefQuarter, setSelectedPrefQuarter,
    loadData, resetActionForm, openActionPopup, closeActionPopup,
    handleSendChat, handleSendAllotmentChat, handleCloseService,
    handleAcknowledge, handleReject, handleTenantRequest,
    handleWithdraw, handleWithdrawTenantReq, handleManualAllot,
    handleEOApproveTR, handleEORejectTR, handlePopupSubmit, handleEORejectRequest,
    handleApproveLevel, handleSendClarification, handleStartInspection,
    handleSendInspectionChat, handleCloseInspection, handleCreateHandover, handleAddGuestInfo,
    openNewModal, openQuarterPreview,
    selectedPrefs, navigate, addToast, loadGuestInfo,
  } = useQRContext();
  if (!selectedRequest) return null;
  const [draftForm, setDraftForm] = useState({
    request_reason: selectedRequest.request_reason ?? '',
    required_bhk_config: selectedRequest.required_bhk_config ?? '',
    preferred_location: selectedRequest.preferred_location ?? '',
    move_in_date: selectedRequest.move_in_date ?? '',
    family_member_count: selectedRequest.family_member_count ?? 1,
    employee_notes: selectedRequest.employee_notes ?? '',
  });
  const [draftSubmitting, setDraftSubmitting] = useState(false);

  const handleUpdate = async () => {
    setDraftSubmitting(true);
    try {
      await quartersService.updateRequestHeader(selectedRequest.id, {
        request_reason: draftForm.request_reason,
        required_bhk_config: draftForm.required_bhk_config,
        preferred_location: draftForm.preferred_location,
        move_in_date: draftForm.move_in_date || null,
        family_member_count: draftForm.family_member_count,
        employee_notes: draftForm.employee_notes,
      });
      addToast('Draft updated', 'success');
      loadData();
    } catch { addToast('Failed to update draft', 'error'); } finally { setDraftSubmitting(false); }
  };

  const handleSubmitDraft = async () => {
    if (!window.confirm('Submit this request for allotment?')) return;
    setDraftSubmitting(true);
    try {
      await quartersService.updateRequestHeader(selectedRequest.id, {
        request_reason: draftForm.request_reason,
        required_bhk_config: draftForm.required_bhk_config,
        preferred_location: draftForm.preferred_location,
        move_in_date: draftForm.move_in_date || null,
        family_member_count: draftForm.family_member_count,
        employee_notes: draftForm.employee_notes,
      });
      await quartersService.submitRequest(selectedRequest.id);
      addToast('Request submitted successfully', 'success');
      loadData();
    } catch { addToast('Failed to submit request', 'error'); } finally { setDraftSubmitting(false); }
  };

  const handleCancelDraft = async () => {
    if (!window.confirm('Cancel this draft request?')) return;
    try {
      await quartersService.cancelRequest(selectedRequest.id);
      addToast('Request cancelled', 'success');
      setSelectedRequest(null);
      loadData();
    } catch { addToast('Failed to cancel request', 'error'); }
  };

  const draftPrefs = selectedRequest.preferences?.sort((a, b) => a.preference_rank - b.preference_rank) ?? [];

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-500 rounded-t-xl sticky top-0 z-10">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 shrink-0">
          <FileText size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-amber-100 uppercase tracking-wide">Edit Draft Request</div>
          <div className="text-sm font-semibold text-white">{selectedRequest.request_number}</div>
        </div>
        <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full shrink-0">Draft</span>
        {panelControls}
      </div>

      {/* Form fields */}
      <div className="p-5 space-y-4 border-b border-gray-100">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Request Reason *</label>
          <textarea value={draftForm.request_reason} onChange={e => setDraftForm(f => ({ ...f, request_reason: e.target.value }))} rows={3} placeholder="e.g. Transfer-in" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Required BHK Config</label>
            <input value={draftForm.required_bhk_config} onChange={e => setDraftForm(f => ({ ...f, required_bhk_config: e.target.value }))} placeholder="e.g. 2BHK" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Preferred Location</label>
            <input value={draftForm.preferred_location} onChange={e => setDraftForm(f => ({ ...f, preferred_location: e.target.value }))} placeholder="e.g. Block A" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Move-in Date</label>
            <input type="date" value={draftForm.move_in_date} onChange={e => setDraftForm(f => ({ ...f, move_in_date: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Family Member Count</label>
            <input type="number" min={1} value={draftForm.family_member_count} onChange={e => setDraftForm(f => ({ ...f, family_member_count: Number(e.target.value) }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Employee Notes</label>
          <textarea value={draftForm.employee_notes} onChange={e => setDraftForm(f => ({ ...f, employee_notes: e.target.value }))} rows={2} placeholder="Any additional notes" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none" />
        </div>
      </div>

      {/* Preferences section */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preferences</div>
          <button onClick={() => openNewModal(selectedRequest)} className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline">
            <Plus size={12} /> Add / Reorder
          </button>
        </div>
        {draftPrefs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Star size={24} className="mx-auto mb-1 opacity-30" />
            <p className="text-xs">No preferences added yet.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {draftPrefs.map(pref => {
              const pq = pref.quarter as Quarter | undefined;
              return (
                <div key={pref.id} className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{pref.preference_rank}</span>
                  <span className="font-semibold text-gray-800">{pq?.quarter_number ?? '—'}</span>
                  {pq?.bhk_config && <span className="text-gray-500">{pq.bhk_config}</span>}
                  {pq?.address && <span className="text-gray-400 truncate">{pq.address}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action buttons row (sticky at bottom) */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-2">
        <button onClick={handleUpdate} disabled={draftSubmitting} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors">
          {draftSubmitting ? 'Saving…' : 'Update'}
        </button>
        <button onClick={handleSubmitDraft} disabled={draftSubmitting} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          <span className="flex items-center justify-center gap-1.5"><Send size={13} /> Submit</span>
        </button>
        <button onClick={handleCancelDraft} disabled={draftSubmitting} className="py-2 px-3 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors">
          Cancel
        </button>
      </div>
    </>
  );
};

export const RightPanelPreferences = ({ panelControls }: { panelControls?: React.ReactNode }) => {
  const {
    user, requests, tenantRequests, selectedRequest, setSelectedRequest, activeCycle,
    isEO, eoMode, setEOMode,
    allotNowQuarterId, setAllotNowQuarterId, allotNowQuarter, setAllotNowQuarter, allotNowSubmitting,
    showAllotNowPicker, setShowAllotNowPicker, allotNowSearch, setAllotNowSearch, allotNowQuarters, allotNowLoading,
    overrideAllotment, setOverrideAllotment, overrideRequest, setOverrideRequest, showOverrideModal, setShowOverrideModal,
    manualAllotPickerOpen, setManualAllotPickerOpen, manualAllotSearch, setManualAllotSearch,
    manualAllotQuarters, manualAllotLoading, manualAllotSubmitting,
    eoTrId, setEoTrId, eoTrAction, setEoTrAction, eoTrNotes, setEoTrNotes, eoTrSubmitting,
    approvalRecord, approvalChats, approvalChatMsg, setApprovalChatMsg, approvalAction, setApprovalAction,
    approvalRemarks, setApprovalRemarks, approvalTargetLevel, setApprovalTargetLevel, approvalSubmitting,
    inspections, inspectionChats, selectedInspectionId, setSelectedInspectionId,
    inspectionPanel, setInspectionPanel, inspectionOpeningRemark, setInspectionOpeningRemark,
    inspectionChatMsg, setInspectionChatMsg, inspectionChatFile, setInspectionChatFile, inspectionSubmitting,
    inspectionCloseRemarks, setInspectionCloseRemarks, inspectionCondition, setInspectionCondition,
    showHandoverPopup, setShowHandoverPopup, handover, handoverKeyNo, setHandoverKeyNo,
    handoverRemarks, setHandoverRemarks, handoverDeadline, setHandoverDeadline,
    handoverInteriorFile, setHandoverInteriorFile, handoverReportFile, setHandoverReportFile, handoverSubmitting,
    showGuestInfoPopup, setShowGuestInfoPopup, guestInfoList, guestInfoLoading,
    guestForm, setGuestForm, guestAadhaarFile, setGuestAadhaarFile, guestPanFile, setGuestPanFile,
    guestOtherFiles, setGuestOtherFiles, guestSubmitting,
    eoRightMode, setEoRightMode, eoRejectReason, setEoRejectReason, eoRejectSubmitting,
    dpFilter, setDpFilter, showNewModal, setShowNewModal, form, setForm, prefs, setPrefs, submitting,
    requestFor, setRequestFor, selectedEmployee, setSelectedEmployee, tpInfo, setTpInfo,
    tpInfoConfirmed, setTpInfoConfirmed, showEmployeePicker, setShowEmployeePicker,
    showTPForm, setShowTPForm, tpPopupTab, setTpPopupTab, employeeSearch, setEmployeeSearch,
    employeeDeptFilter, setEmployeeDeptFilter, tpFormDraft, setTpFormDraft,
    declineModalReqId, setDeclineModalReqId, declineModalRemarks, setDeclineModalRemarks,
    declineModalDocUrl, setDeclineModalDocUrl, declineModalSubmitting,
    rightAction, setRightAction, actionRemarks, setActionRemarks, actionReason, setActionReason,
    actionDocUrl, setActionDocUrl, actionDate, setActionDate, actionBhk, setActionBhk, actionSubmitting,
    previewQuarterId, setPreviewQuarterId, isPreviewOpen, setIsPreviewOpen,
    serviceChats, setServiceChats, selectedServiceId, setSelectedServiceId,
    servicesHistoryMode, setServicesHistoryMode, chatMessage, setChatMessage,
    chatAttachFile, setChatAttachFile, chatSubmitting,
    allotmentChats, allotmentChatMessage, setAllotmentChatMessage, allotmentChatFile,
    setAllotmentChatFile, allotmentChatSubmitting,
    openMenuId, setOpenMenuId, menuPos, setMenuPos,
    expandedCardId, setExpandedCardId, expandedSvcsCardId, setExpandedSvcsCardId,
    expandedSvcDetailId, setExpandedSvcDetailId,
    lightboxImages, setLightboxImages, lightboxIndex, setLightboxIndex, lightboxOpen, setLightboxOpen,
    actionPopup, setActionPopup, popupReason, setPopupReason, popupRemarks, setPopupRemarks,
    popupDocUrl, setPopupDocUrl, popupDate, setPopupDate, popupSubject, setPopupSubject,
    popupUrgency, setPopupUrgency, popupSubmitting,
    selectedPrefQuarter, setSelectedPrefQuarter,
    loadData, resetActionForm, openActionPopup, closeActionPopup,
    handleSendChat, handleSendAllotmentChat, handleCloseService,
    handleAcknowledge, handleReject, handleTenantRequest,
    handleWithdraw, handleWithdrawTenantReq, handleManualAllot,
    handleEOApproveTR, handleEORejectTR, handlePopupSubmit, handleEORejectRequest,
    handleApproveLevel, handleSendClarification, handleStartInspection,
    handleSendInspectionChat, handleCloseInspection, handleCreateHandover, handleAddGuestInfo,
    openNewModal, openQuarterPreview,
    selectedPrefs, navigate, addToast, loadGuestInfo,
  } = useQRContext();
  return (
  // TODO: context added
  <>
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-xl sticky top-0 z-10">
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Star size={14} className="text-amber-500 shrink-0" /> Preference List
        </h2>
        <div className="text-xs text-gray-500 mt-0.5">
          For <span className="font-mono text-gray-700">{selectedRequest?.request_number}</span> ·{' '}
          <span className={`font-medium ${selectedPrefs.length >= 5 ? 'text-red-600' : 'text-amber-600'}`}>
            {selectedPrefs.length} of 5
          </span> selected
        </div>
      </div>
      {selectedRequest && (
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 ${statusConfig(selectedRequest.request_status).cls}`}>
          {statusConfig(selectedRequest.request_status).icon}
          {statusConfig(selectedRequest.request_status).label}
        </span>
      )}
      {panelControls && (
        <div className="flex items-center gap-0.5 shrink-0 [&_button]:text-gray-400 [&_button]:hover:text-gray-700 [&_button]:hover:bg-gray-200 [&_div]:bg-gray-300">
          {panelControls}
        </div>
      )}
    </div>

    {selectedPrefQuarter && (
      <div className="px-5 pt-4 pb-3 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            Viewing Preference #{selectedPrefs.findIndex(p => (p.quarter as Quarter | undefined)?.id === selectedPrefQuarter.id) + 1}
          </div>
          <button onClick={() => setSelectedPrefQuarter(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded"><X size={14} /></button>
        </div>
        <QuarterDetailCard quarter={selectedPrefQuarter} compact />
      </div>
    )}

    <div className="p-5">
      {selectedRequest?.request_status === 'DRAFT' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-800 flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          Click <Eye size={12} className="inline mx-1" /> to view quarter details. Reorder with arrows.
        </div>
      )}

      {selectedPrefs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Star size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No preferences added yet.</p>
          {selectedRequest?.request_status === 'DRAFT' && (
            <button onClick={() => openNewModal(selectedRequest)} className="mt-3 text-sm text-blue-600 hover:underline">Add preferences</button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {selectedPrefs.map((pref, i) => {
            const q = pref.quarter as Quarter | undefined;
            if (!q) return null;
            const isViewing = selectedPrefQuarter?.id === q.id;
            return (
              <div
                key={pref.id as string}
                className={`flex items-center gap-3 rounded-xl p-3 border transition-all cursor-pointer hover:shadow-sm ${isViewing ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200 shadow-sm' : 'bg-gray-50 border-gray-100 hover:bg-white hover:border-gray-200'}`}
                onClick={() => setSelectedPrefQuarter(isViewing ? null : q)}
              >
                <div className="relative shrink-0">
                  <img src={getImage(q, i)} alt={q.quarter_number} className="w-16 h-16 rounded-lg object-cover" />
                  <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${isViewing ? 'bg-blue-600' : 'bg-slate-800'}`}>{pref.preference_rank}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{q.quarter_number}</div>
                  {q.address && <div className="text-xs text-gray-500 truncate">{q.address}</div>}
                  <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                    <span className="flex items-center gap-1"><Bed size={11} />{q.bhk_config}</span>
                    <span className="flex items-center gap-1"><Ruler size={11} />{q.area_sqft} sq.ft</span>
                    <span className="font-medium text-gray-800">{fmtINR(q.monthly_rent)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); setPreviewQuarterId(q.id); setIsPreviewOpen(true); }}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
                    title="View quarter details"
                  ><Eye size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedRequest?.request_status === 'DRAFT' && (
        <div className="mt-4 flex gap-2">
          <button onClick={() => openNewModal(selectedRequest)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <Plus size={14} /> Add / Reorder
          </button>
          <Button onClick={async () => {
            if (!selectedRequest) return;
            try {
              await quartersService.submitRequest(selectedRequest.id);
              addToast('Request submitted', 'success');
              loadData();
            } catch { addToast('Failed to submit', 'error'); }
          }}>
            <Send size={14} className="mr-1" /> Submit
          </Button>
        </div>
      )}
    </div>
  </>
  );
};

export const RightPanelSubmitted = ({ panelControls }: { panelControls?: React.ReactNode }) => {
  const {
    user, requests, tenantRequests, selectedRequest, setSelectedRequest, activeCycle,
    isEO, eoMode, setEOMode,
    allotNowQuarterId, setAllotNowQuarterId, allotNowQuarter, setAllotNowQuarter, allotNowSubmitting,
    showAllotNowPicker, setShowAllotNowPicker, allotNowSearch, setAllotNowSearch, allotNowQuarters, allotNowLoading,
    overrideAllotment, setOverrideAllotment, overrideRequest, setOverrideRequest, showOverrideModal, setShowOverrideModal,
    manualAllotPickerOpen, setManualAllotPickerOpen, manualAllotSearch, setManualAllotSearch,
    manualAllotQuarters, manualAllotLoading, manualAllotSubmitting,
    eoTrId, setEoTrId, eoTrAction, setEoTrAction, eoTrNotes, setEoTrNotes, eoTrSubmitting,
    approvalRecord, approvalChats, approvalChatMsg, setApprovalChatMsg, approvalAction, setApprovalAction,
    approvalRemarks, setApprovalRemarks, approvalTargetLevel, setApprovalTargetLevel, approvalSubmitting,
    inspections, inspectionChats, selectedInspectionId, setSelectedInspectionId,
    inspectionPanel, setInspectionPanel, inspectionOpeningRemark, setInspectionOpeningRemark,
    inspectionChatMsg, setInspectionChatMsg, inspectionChatFile, setInspectionChatFile, inspectionSubmitting,
    inspectionCloseRemarks, setInspectionCloseRemarks, inspectionCondition, setInspectionCondition,
    showHandoverPopup, setShowHandoverPopup, handover, handoverKeyNo, setHandoverKeyNo,
    handoverRemarks, setHandoverRemarks, handoverDeadline, setHandoverDeadline,
    handoverInteriorFile, setHandoverInteriorFile, handoverReportFile, setHandoverReportFile, handoverSubmitting,
    showGuestInfoPopup, setShowGuestInfoPopup, guestInfoList, guestInfoLoading,
    guestForm, setGuestForm, guestAadhaarFile, setGuestAadhaarFile, guestPanFile, setGuestPanFile,
    guestOtherFiles, setGuestOtherFiles, guestSubmitting,
    eoRightMode, setEoRightMode, eoRejectReason, setEoRejectReason, eoRejectSubmitting,
    dpFilter, setDpFilter, showNewModal, setShowNewModal, form, setForm, prefs, setPrefs, submitting,
    requestFor, setRequestFor, selectedEmployee, setSelectedEmployee, tpInfo, setTpInfo,
    tpInfoConfirmed, setTpInfoConfirmed, showEmployeePicker, setShowEmployeePicker,
    showTPForm, setShowTPForm, tpPopupTab, setTpPopupTab, employeeSearch, setEmployeeSearch,
    employeeDeptFilter, setEmployeeDeptFilter, tpFormDraft, setTpFormDraft,
    declineModalReqId, setDeclineModalReqId, declineModalRemarks, setDeclineModalRemarks,
    declineModalDocUrl, setDeclineModalDocUrl, declineModalSubmitting,
    rightAction, setRightAction, actionRemarks, setActionRemarks, actionReason, setActionReason,
    actionDocUrl, setActionDocUrl, actionDate, setActionDate, actionBhk, setActionBhk, actionSubmitting,
    previewQuarterId, setPreviewQuarterId, isPreviewOpen, setIsPreviewOpen,
    serviceChats, setServiceChats, selectedServiceId, setSelectedServiceId,
    servicesHistoryMode, setServicesHistoryMode, chatMessage, setChatMessage,
    chatAttachFile, setChatAttachFile, chatSubmitting,
    allotmentChats, allotmentChatMessage, setAllotmentChatMessage, allotmentChatFile,
    setAllotmentChatFile, allotmentChatSubmitting,
    openMenuId, setOpenMenuId, menuPos, setMenuPos,
    expandedCardId, setExpandedCardId, expandedSvcsCardId, setExpandedSvcsCardId,
    expandedSvcDetailId, setExpandedSvcDetailId,
    lightboxImages, setLightboxImages, lightboxIndex, setLightboxIndex, lightboxOpen, setLightboxOpen,
    actionPopup, setActionPopup, popupReason, setPopupReason, popupRemarks, setPopupRemarks,
    popupDocUrl, setPopupDocUrl, popupDate, setPopupDate, popupSubject, setPopupSubject,
    popupUrgency, setPopupUrgency, popupSubmitting,
    selectedPrefQuarter, setSelectedPrefQuarter,
    loadData, resetActionForm, openActionPopup, closeActionPopup,
    handleSendChat, handleSendAllotmentChat, handleCloseService,
    handleAcknowledge, handleReject, handleTenantRequest,
    handleWithdraw, handleWithdrawTenantReq, handleManualAllot,
    handleEOApproveTR, handleEORejectTR, handlePopupSubmit, handleEORejectRequest,
    handleApproveLevel, handleSendClarification, handleStartInspection,
    handleSendInspectionChat, handleCloseInspection, handleCreateHandover, handleAddGuestInfo,
    openNewModal, openQuarterPreview,
    selectedPrefs, navigate, addToast, loadGuestInfo,
  } = useQRContext();
  if (!selectedRequest) return null;
  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 rounded-t-xl sticky top-0 z-10">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 shrink-0">
          <Send size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-blue-100 uppercase tracking-wide">Awaiting EO Review</div>
          <div className="text-sm font-semibold text-white">{selectedRequest.request_number}</div>
        </div>
        <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full shrink-0">
          Submitted {fmtDate(selectedRequest.created_at)}
        </span>
        {panelControls}
      </div>

      {/* Status banner */}
      <div className="mx-5 mt-4 mb-1 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <Clock size={15} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-semibold text-blue-800">Request under review</div>
          <div className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">
            Your request has been submitted and is pending review by the Estate Officer. You will be notified once a decision is made.
          </div>
        </div>
      </div>

      {/* Request summary */}
      <RequestSummaryBlock req={selectedRequest} />

      {/* Withdraw action */}
      <div className="px-5 py-4">
        <button
          onClick={() => handleWithdraw(selectedRequest.id)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
        >
          <XCircle size={15} /> Withdraw Request
        </button>
        <p className="text-[10px] text-gray-400 text-center mt-2">Withdrawing will permanently cancel this request.</p>
      </div>
    </>
  );
};

// ─── EO Employee Mode Right Panel ────────────────────────────────────────────

export const EOEmployeeRightPanel = ({ panelControls }: { panelControls?: React.ReactNode }) => {
  const {
    user, requests, tenantRequests, selectedRequest, setSelectedRequest, activeCycle,
    isEO, eoMode, setEOMode,
    allotNowQuarterId, setAllotNowQuarterId, allotNowQuarter, setAllotNowQuarter, allotNowSubmitting,
    showAllotNowPicker, setShowAllotNowPicker, allotNowSearch, setAllotNowSearch, allotNowQuarters, allotNowLoading,
    overrideAllotment, setOverrideAllotment, overrideRequest, setOverrideRequest, showOverrideModal, setShowOverrideModal,
    manualAllotPickerOpen, setManualAllotPickerOpen, manualAllotSearch, setManualAllotSearch,
    manualAllotQuarters, manualAllotLoading, manualAllotSubmitting,
    eoTrId, setEoTrId, eoTrAction, setEoTrAction, eoTrNotes, setEoTrNotes, eoTrSubmitting,
    approvalRecord, approvalChats, approvalChatMsg, setApprovalChatMsg, approvalAction, setApprovalAction,
    approvalRemarks, setApprovalRemarks, approvalTargetLevel, setApprovalTargetLevel, approvalSubmitting,
    inspections, inspectionChats, selectedInspectionId, setSelectedInspectionId,
    inspectionPanel, setInspectionPanel, inspectionOpeningRemark, setInspectionOpeningRemark,
    inspectionChatMsg, setInspectionChatMsg, inspectionChatFile, setInspectionChatFile, inspectionSubmitting,
    inspectionCloseRemarks, setInspectionCloseRemarks, inspectionCondition, setInspectionCondition,
    showHandoverPopup, setShowHandoverPopup, handover, handoverKeyNo, setHandoverKeyNo,
    handoverRemarks, setHandoverRemarks, handoverDeadline, setHandoverDeadline,
    handoverInteriorFile, setHandoverInteriorFile, handoverReportFile, setHandoverReportFile, handoverSubmitting,
    showGuestInfoPopup, setShowGuestInfoPopup, guestInfoList, guestInfoLoading,
    guestForm, setGuestForm, guestAadhaarFile, setGuestAadhaarFile, guestPanFile, setGuestPanFile,
    guestOtherFiles, setGuestOtherFiles, guestSubmitting,
    eoRightMode, setEoRightMode, eoRejectReason, setEoRejectReason, eoRejectSubmitting,
    dpFilter, setDpFilter, showNewModal, setShowNewModal, form, setForm, prefs, setPrefs, submitting,
    requestFor, setRequestFor, selectedEmployee, setSelectedEmployee, tpInfo, setTpInfo,
    tpInfoConfirmed, setTpInfoConfirmed, showEmployeePicker, setShowEmployeePicker,
    showTPForm, setShowTPForm, tpPopupTab, setTpPopupTab, employeeSearch, setEmployeeSearch,
    employeeDeptFilter, setEmployeeDeptFilter, tpFormDraft, setTpFormDraft,
    declineModalReqId, setDeclineModalReqId, declineModalRemarks, setDeclineModalRemarks,
    declineModalDocUrl, setDeclineModalDocUrl, declineModalSubmitting,
    rightAction, setRightAction, actionRemarks, setActionRemarks, actionReason, setActionReason,
    actionDocUrl, setActionDocUrl, actionDate, setActionDate, actionBhk, setActionBhk, actionSubmitting,
    previewQuarterId, setPreviewQuarterId, isPreviewOpen, setIsPreviewOpen,
    serviceChats, setServiceChats, selectedServiceId, setSelectedServiceId,
    servicesHistoryMode, setServicesHistoryMode, chatMessage, setChatMessage,
    chatAttachFile, setChatAttachFile, chatSubmitting,
    allotmentChats, allotmentChatMessage, setAllotmentChatMessage, allotmentChatFile,
    setAllotmentChatFile, allotmentChatSubmitting,
    openMenuId, setOpenMenuId, menuPos, setMenuPos,
    expandedCardId, setExpandedCardId, expandedSvcsCardId, setExpandedSvcsCardId,
    expandedSvcDetailId, setExpandedSvcDetailId,
    lightboxImages, setLightboxImages, lightboxIndex, setLightboxIndex, lightboxOpen, setLightboxOpen,
    actionPopup, setActionPopup, popupReason, setPopupReason, popupRemarks, setPopupRemarks,
    popupDocUrl, setPopupDocUrl, popupDate, setPopupDate, popupSubject, setPopupSubject,
    popupUrgency, setPopupUrgency, popupSubmitting,
    selectedPrefQuarter, setSelectedPrefQuarter,
    loadData, resetActionForm, openActionPopup, closeActionPopup,
    handleSendChat, handleSendAllotmentChat, handleCloseService,
    handleAcknowledge, handleReject, handleTenantRequest,
    handleWithdraw, handleWithdrawTenantReq, handleManualAllot,
    handleEOApproveTR, handleEORejectTR, handlePopupSubmit, handleEORejectRequest,
    handleApproveLevel, handleSendClarification, handleStartInspection,
    handleSendInspectionChat, handleCloseInspection, handleCreateHandover, handleAddGuestInfo,
    openNewModal, openQuarterPreview,
    selectedPrefs, navigate, addToast, loadGuestInfo,
  } = useQRContext();
  if (!selectedRequest) return null;
  const req = selectedRequest;
  const allotment = req.allotment as QuarterAllotment | null;
  const allottedQ = allotment?.quarter as Quarter | undefined;
  const s = req.request_status;
  const isSubmitted = s === 'SUBMITTED';
  const isAllotted = s === 'ALLOTTED' || s === 'UPGRADE_REQUESTED';
  const isPendingApproval = isAllotted && approvalRecord && approvalRecord.status === 'PENDING';
  const isAccepted = s === 'ACKNOWLEDGED';
  const isOccupied = ['ACKNOWLEDGED', 'EXTEND_REQUESTED', 'VACATE_REQUESTED'].includes(s);
  const activeTRs = tenantRequests.filter(tr => tr.allotment_id === allotment?.id && tr.request_status === 'PENDING');
  const accentCls = isAllotted || isOccupied ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200';

  const headerColor = isSubmitted ? 'bg-blue-700' : isAllotted ? 'bg-emerald-700' : isOccupied ? 'bg-teal-700' : 'bg-slate-700';

  // Sub-nav tabs
  type TabEntry = { key: EORightMode; label: string; icon: React.ReactNode; show: boolean };
  const tabs: TabEntry[] = ([
    { key: 'allot' as EORightMode, label: 'Allot', icon: <Home size={12} />, show: isSubmitted },
    { key: 'rejection_chat' as EORightMode, label: 'Reject', icon: <XCircle size={12} />, show: isSubmitted },
    { key: 'override' as EORightMode, label: 'Override', icon: <RefreshCw size={12} />, show: isAllotted && !!allotment },
    { key: 'approval_chat' as EORightMode, label: 'Approval', icon: <GitMerge size={12} />, show: isAllotted && !!approvalRecord },
    { key: 'services' as EORightMode, label: 'Services', icon: <Wrench size={12} />, show: isOccupied },
  ] as TabEntry[]).filter(t => t.show);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* ── Header (merged with requester info) ── */}
      <div className={`flex items-center gap-2 px-3 py-2.5 sticky top-0 z-10 rounded-t-xl ${headerColor}`}>
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 shrink-0">
          <UserCog size={13} className="text-white" />
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-xs font-semibold text-white truncate">{req.request_number}</span>
          <span className="text-white/40 text-xs">·</span>
          <span className="text-xs font-semibold text-white/90 truncate">
            {req.request_for === 'EMPLOYEE' ? req.on_behalf_employee_name : req.request_for === 'TP' ? req.tp_name : 'Self'}
          </span>
          {(() => {
            const sub = req.request_for === 'EMPLOYEE' ? req.on_behalf_employee_dept : req.request_for === 'TP' ? req.tp_organization : req.required_bhk_config;
            return sub ? <span className="text-[10px] text-white/60 truncate hidden sm:inline">{sub}</span> : null;
          })()}
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${req.request_for === 'TP' ? 'bg-amber-400/30 text-amber-100' : req.request_for === 'EMPLOYEE' ? 'bg-blue-400/30 text-blue-100' : 'bg-white/20 text-white'}`}>
            {req.request_for ?? 'SELF'}
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white shrink-0">{statusConfig(s).label}</span>
        {panelControls}
      </div>

      {/* ── Quarter row if allotted (no image, single line) ── */}
      {allottedQ && <CompactQuarterRow q={allottedQ} accentCls={accentCls} />}

      {/* ── Sub-nav tabs ── */}
      {tabs.length > 1 && (
        <div className="flex items-center gap-0.5 px-3 pt-2 pb-1 border-b border-gray-100 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setEoRightMode(tab.key)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${eoRightMode === tab.key ? `${headerColor} text-white shadow-sm` : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Inline request summary — always shown since Detail tab is removed ── */}
      <RequestSummaryBlock req={req} />

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Allot tab (SUBMITTED) */}
        {eoRightMode === 'allot' && isSubmitted && (
          <div className="p-4 space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
              Select a quarter to manually allot to this request. The employee will be notified to acknowledge.
            </div>
            <button
              onClick={() => { setManualAllotSearch(''); setManualAllotPickerOpen(true); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <Home size={14} />Pick Quarter to Allot
            </button>
          </div>
        )}

        {/* Reject tab (SUBMITTED) */}
        {(eoRightMode as string) === 'rejection_chat' && isSubmitted && (
          <div className="p-4 space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
              Rejecting this request will send it back to Draft status with a sub-status of REJECTED. The employee can revise and resubmit.
            </div>
            <textarea
              value={eoRejectReason}
              onChange={e => setEoRejectReason(e.target.value)}
              rows={4}
              placeholder="Rejection reason (required)…"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
            />
            <button
              onClick={handleEORejectRequest}
              disabled={eoRejectSubmitting || !eoRejectReason.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <XCircle size={14} />{eoRejectSubmitting ? 'Rejecting…' : 'Confirm Rejection'}
            </button>
          </div>
        )}

        {/* Override tab (ALLOTTED) */}
        {eoRightMode === 'override' && isAllotted && allotment && (
          <div className="p-4 space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
              Override allows you to reassign, swap, or cancel this allotment with full audit trail.
            </div>
            <button
              onClick={() => { const a = { ...allotment, request: req }; setOverrideAllotment(a as QuarterAllotment); setOverrideRequest(req); setShowOverrideModal(true); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
            >
              <RefreshCw size={14} />Open Override Panel
            </button>
            <button
              onClick={async () => { if (!user) return; await quartersService.deallocateRequest(allotment.id, req.id); addToast('Deallocated', 'success'); loadData(); }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />Deallocate (Back to Submitted)
            </button>
          </div>
        )}

        {/* Approval chat tab (ALLOTTED with pending approval) */}
        {eoRightMode === 'approval_chat' && approvalRecord && (
          <div className="p-4 space-y-3">
            {/* Approval status card */}
            <div className={`rounded-xl border px-4 py-3 ${approvalRecord.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-bold text-gray-700">Approval Chain</div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${approvalRecord.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {approvalRecord.status}
                </span>
              </div>
              <div className="text-xs text-gray-500">Level {approvalRecord.current_level} of {approvalRecord.max_level}</div>
              <div className="mt-2 flex gap-1.5">
                {Array.from({ length: approvalRecord.max_level }).map((_, i) => (
                  <div key={i} className={`flex-1 h-1.5 rounded-full ${i < approvalRecord.current_level ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                ))}
              </div>
            </div>

            {/* Chat history */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {approvalChats.length === 0 && <p className="text-xs text-gray-400 text-center py-4 italic">No messages yet.</p>}
              {approvalChats.map(chat => (
                <div key={chat.id} className={`rounded-xl px-3 py-2.5 text-xs ${chat.author_role === 'approver' ? 'bg-emerald-50 border border-emerald-100 ml-4' : 'bg-gray-50 border border-gray-100 mr-4'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`font-semibold capitalize ${chat.author_role === 'approver' ? 'text-emerald-700' : 'text-gray-700'}`}>{chat.author_role}</span>
                    <span className="text-gray-400 text-[10px]">{fmtDate(chat.created_at)}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{chat.message}</p>
                </div>
              ))}
            </div>

            {/* EO Actions */}
            {approvalRecord.status === 'PENDING' && (
              approvalAction ? (
                <div className="space-y-2">
                  {approvalAction === 'clarify' && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Target Level</label>
                      <select
                        value={approvalTargetLevel}
                        onChange={e => setApprovalTargetLevel(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none mb-2"
                      >
                        {Array.from({ length: approvalRecord.max_level }).map((_, i) => (
                          <option key={i + 1} value={i + 1}>Level {i + 1}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <textarea
                    value={approvalRemarks}
                    onChange={e => setApprovalRemarks(e.target.value)}
                    rows={3}
                    placeholder={approvalAction === 'approve' ? 'Approval remarks (optional)…' : 'Clarification remarks (required)…'}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { setApprovalAction(null); setApprovalRemarks(''); }} className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button
                      onClick={approvalAction === 'approve' ? handleApproveLevel : handleSendClarification}
                      disabled={approvalSubmitting}
                      className={`flex-1 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50 transition-colors ${approvalAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600'}`}
                    >
                      {approvalSubmitting ? '…' : approvalAction === 'approve' ? 'Approve' : 'Send'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setApprovalAction('approve')} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors">
                    <CheckSquare size={12} />Approve Level {approvalRecord.current_level}
                  </button>
                  <button onClick={() => setApprovalAction('clarify')} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors">
                    <SkipForward size={12} />Clarify
                  </button>
                </div>
              )
            )}
          </div>
        )}

        {/* Inspection (opened via action menu) */}
        {eoRightMode === 'inspection' && (isAccepted || isAllotted) && (
          <div className="p-4 space-y-3">
            {inspectionPanel === 'list' && (
              <>
                <button onClick={() => setEoRightMode('services')} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors mb-1">
                  <ArrowLeft size={12} />Back
                </button>
                <button
                  onClick={() => setInspectionPanel('new')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
                >
                  <Plus size={14} />New Inspection
                </button>
                {inspections.length === 0 && <p className="text-xs text-gray-400 text-center italic py-4">No inspections yet.</p>}
                {inspections.map(insp => (
                  <div key={insp.id} className={`rounded-xl border px-3 py-3 space-y-1.5 ${insp.status === 'CLOSED' ? 'border-gray-200 bg-gray-50' : 'border-teal-200 bg-teal-50'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${insp.status === 'CLOSED' ? 'bg-gray-100 text-gray-500' : 'bg-teal-100 text-teal-700'}`}>{insp.status}</span>
                      <span className="text-[10px] text-gray-400">{fmtDate(insp.created_at)}</span>
                    </div>
                    {insp.opening_remarks && <p className="text-xs text-gray-600">{insp.opening_remarks}</p>}
                    {insp.property_condition && <p className="text-[10px] font-semibold text-gray-500">Condition: {insp.property_condition}</p>}
                    {insp.status === 'OPEN' && (
                      <button
                        onClick={() => { setSelectedInspectionId(insp.id); setInspectionPanel('chat'); }}
                        className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors"
                      >
                        <MessageSquare size={11} />Open Chat
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}
            {inspectionPanel === 'new' && (
              <div className="space-y-3">
                <button onClick={() => setInspectionPanel('list')} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                  <ArrowLeft size={12} />Back
                </button>
                <textarea
                  value={inspectionOpeningRemark}
                  onChange={e => setInspectionOpeningRemark(e.target.value)}
                  rows={4}
                  placeholder="Opening remarks / inspection purpose…"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none resize-none"
                />
                <button onClick={handleStartInspection} disabled={inspectionSubmitting || !inspectionOpeningRemark.trim()} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors">
                  <PlayCircle size={14} />{inspectionSubmitting ? 'Starting…' : 'Start Inspection'}
                </button>
              </div>
            )}
            {inspectionPanel === 'chat' && selectedInspectionId && (
              <div className="space-y-3">
                <button onClick={() => { setInspectionPanel('list'); setSelectedInspectionId(null); }} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                  <ArrowLeft size={12} />Back
                </button>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {inspectionChats.map(chat => (
                    <div key={chat.id} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-semibold text-teal-700 capitalize">{chat.author_role}</span>
                        <span className="text-gray-400 text-[10px]">{fmtDate(chat.created_at)}</span>
                      </div>
                      <p className="text-gray-700">{chat.message}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={inspectionChatMsg}
                    onChange={e => setInspectionChatMsg(e.target.value)}
                    placeholder="Add observation…"
                    className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none"
                    onKeyDown={e => { if (e.key === 'Enter') handleSendInspectionChat(); }}
                  />
                  <button onClick={handleSendInspectionChat} className="px-3 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors"><Send size={13} /></button>
                </div>
                {/* Close inspection form */}
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Close Inspection</div>
                  <select
                    value={inspectionCondition}
                    onChange={e => setInspectionCondition(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none"
                  >
                    {['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'NEEDS_REPAIR'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <textarea
                    value={inspectionCloseRemarks}
                    onChange={e => setInspectionCloseRemarks(e.target.value)}
                    rows={2}
                    placeholder="Closing remarks…"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none resize-none"
                  />
                  <button onClick={handleCloseInspection} disabled={inspectionSubmitting || !inspectionCloseRemarks.trim()} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gray-700 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors">
                    <ClipboardCheck size={12} />{inspectionSubmitting ? '…' : 'Close Inspection'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Handover (opened via action menu) */}
        {eoRightMode === 'handover' && (isAccepted || isAllotted) && (
          <div className="p-4 space-y-3">
            <button onClick={() => setEoRightMode('services')} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft size={12} />Back
            </button>
            {handover ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Key size={14} className="text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-800">Handover Recorded</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><div className="text-[9px] text-gray-400 uppercase mb-0.5">Key No.</div><div className="font-semibold text-gray-800">{handover.key_number}</div></div>
                  <div><div className="text-[9px] text-gray-400 uppercase mb-0.5">Deadline</div><div className="font-semibold text-gray-800">{fmtDate(handover.occupying_deadline)}</div></div>
                </div>
                {handover.remarks && <p className="text-xs text-gray-600">{handover.remarks}</p>}
              </div>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
                  Record the physical handover of keys and set the occupying deadline. This confirms occupancy.
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Key Number *</label>
                    <input value={handoverKeyNo} onChange={e => setHandoverKeyNo(e.target.value)} placeholder="e.g. KEY-A-203" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Occupying Deadline *</label>
                    <input type="date" value={handoverDeadline} onChange={e => setHandoverDeadline(e.target.value)} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Remarks</label>
                    <textarea value={handoverRemarks} onChange={e => setHandoverRemarks(e.target.value)} rows={2} placeholder="Handover notes…" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Interior Photo</label>
                      <label className="flex flex-col items-center justify-center w-full py-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-teal-400 transition-colors text-gray-400 hover:text-teal-600">
                        <Upload size={14} />
                        <span className="text-[10px] mt-1">{handoverInteriorFile?.name ?? 'Upload'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => setHandoverInteriorFile(e.target.files?.[0] ?? null)} />
                      </label>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Inspection Report</label>
                      <label className="flex flex-col items-center justify-center w-full py-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-teal-400 transition-colors text-gray-400 hover:text-teal-600">
                        <Upload size={14} />
                        <span className="text-[10px] mt-1">{handoverReportFile?.name ?? 'Upload'}</span>
                        <input type="file" className="hidden" onChange={e => setHandoverReportFile(e.target.files?.[0] ?? null)} />
                      </label>
                    </div>
                  </div>
                  <button onClick={handleCreateHandover} disabled={handoverSubmitting || !handoverKeyNo.trim() || !handoverDeadline} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors">
                    <Handshake size={14} />{handoverSubmitting ? 'Recording…' : 'Record Handover & Confirm Occupancy'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Services tab (OCCUPIED) */}
        {eoRightMode === 'services' && isOccupied && allotment && (
          <div className="p-4 space-y-3">
            {activeTRs.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-400">
                <ClipboardList size={24} className="mb-2 opacity-30" />
                <p className="text-xs italic">No pending service requests from this tenant.</p>
              </div>
            ) : activeTRs.map(tr => {
              const stc = serviceTypeConfig(tr.service_type);
              return (
                <div key={tr.id} className={`rounded-xl border px-3 py-3 space-y-2 ${stc.cls}`}>
                  <div className="flex items-center gap-2">
                    {stc.icon}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold">{stc.label}</div>
                      {tr.reason && <div className="text-[10px] opacity-80 mt-0.5 truncate">{tr.reason}</div>}
                    </div>
                  </div>
                  {eoTrId === tr.id && eoTrAction ? (
                    <div className="space-y-2 pt-1">
                      <textarea value={eoTrNotes} onChange={e => setEoTrNotes(e.target.value)} rows={2}
                        placeholder={eoTrAction === 'reject' ? 'Rejection reason (required)…' : 'EO notes (optional)…'}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none resize-none bg-white text-gray-800" />
                      <div className="flex gap-2">
                        <button onClick={() => { setEoTrId(null); setEoTrAction(null); setEoTrNotes(''); }} className="flex-1 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-white">Cancel</button>
                        {eoTrAction === 'approve'
                          ? <button onClick={handleEOApproveTR} disabled={eoTrSubmitting} className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50">{eoTrSubmitting ? '…' : 'Approve'}</button>
                          : <button onClick={handleEORejectTR} disabled={eoTrSubmitting} className="flex-1 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold disabled:opacity-50">{eoTrSubmitting ? '…' : 'Reject'}</button>}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => { setEoTrId(tr.id); setEoTrAction('approve'); setEoTrNotes(''); }} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"><ThumbsUp size={11} />Approve</button>
                      <button onClick={() => { setEoTrId(tr.id); setEoTrAction('reject'); setEoTrNotes(''); }} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"><ThumbsDown size={11} />Reject</button>
                    </div>
                  )}
                </div>
              );
            })}
            <button
              onClick={() => { if (allotment) { const a = { ...allotment, request: req }; setOverrideAllotment(a as QuarterAllotment); setOverrideRequest(req); setShowOverrideModal(true); } }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-amber-300 text-amber-700 text-xs font-medium hover:bg-amber-50 transition-colors"
            >
              <RefreshCw size={13} />Override Allotment
            </button>
          </div>
        )}

        {/* Guest Info not shown for quarters — applicable to properties only */}
        {false && (
          <div className="p-4 space-y-3">
            <button onClick={() => setShowGuestInfoPopup(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors">
              <UserPlus size={14} />Add Guest Info
            </button>
            {guestInfoLoading ? (
              Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)
            ) : guestInfoList.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4">No guest info recorded yet.</p>
            ) : guestInfoList.map(guest => (
              <div key={guest.id} className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{guest.guest_name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-900">{guest.guest_name}</div>
                    <div className="text-[10px] text-gray-500">{guest.guest_mobile}{guest.guest_email ? ` · ${guest.guest_email}` : ''}</div>
                  </div>
                  <button onClick={() => quartersService.removeGuestInfo(guest.id).then(() => loadGuestInfo())} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                </div>
                {(guest.aadhaar_doc_url || guest.pan_doc_url) && (
                  <div className="flex gap-1.5 flex-wrap">
                    {guest.aadhaar_doc_url && <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">Aadhaar</span>}
                    {guest.pan_doc_url && <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">PAN</span>}
                    {guest.other_doc_urls?.length > 0 && <span className="text-[10px] bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full">+{guest.other_doc_urls.length} docs</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Manual allot quarter picker modal ── */}
      {manualAllotPickerOpen && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '85vh' }}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><Home size={18} className="text-blue-600" /></div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">Select Quarter to Allot</h3>
                <p className="text-xs text-gray-400 mt-0.5">{req.request_number} · {req.required_bhk_config}</p>
              </div>
              <button onClick={() => setManualAllotPickerOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} /></button>
            </div>
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={manualAllotSearch} onChange={e => setManualAllotSearch(e.target.value)} placeholder="Search by number, block…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" autoFocus />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50 px-2 py-1">
              {manualAllotLoading ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl m-2 animate-pulse" />)
              ) : manualAllotQuarters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400"><Building2 size={24} className="mb-2 opacity-30" /><p className="text-sm">No available quarters found</p></div>
              ) : manualAllotQuarters.map((q, i) => (
                <button key={q.id} onClick={() => handleManualAllot(q.id)} disabled={manualAllotSubmitting}
                  className="w-full flex items-center gap-3 px-3 py-3 hover:bg-blue-50 transition-colors text-left rounded-xl">
                  <img src={getImage(q, i)} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{q.quarter_number}</div>
                    <div className="text-xs text-gray-500 truncate">{q.bhk_config} · {fmtINR(q.monthly_rent)}/mo</div>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 shrink-0">{manualAllotSubmitting ? '…' : 'Allot'}</span>
                </button>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-gray-100">
              <button onClick={() => setManualAllotPickerOpen(false)} className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Override modal */}
      {showOverrideModal && overrideAllotment && user && (
        <QuarterOverrideModal
          isOpen={showOverrideModal}
          allotment={overrideAllotment}
          allCycleAllotments={requests.filter(r => r.allotment).map(r => r.allotment as QuarterAllotment)}
          eoAuthId={user.id}
          onClose={() => { setShowOverrideModal(false); setOverrideAllotment(null); setOverrideRequest(null); }}
          onOverrideSaved={() => { setShowOverrideModal(false); setOverrideAllotment(null); setOverrideRequest(null); loadData(); }}
        />
      )}

      {/* Guest Info popup */}
      {showGuestInfoPopup && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0"><Users size={18} className="text-teal-600" /></div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">Add Guest Information</h3>
                <p className="text-xs text-gray-400 mt-0.5">{req.request_number}</p>
              </div>
              <button onClick={() => setShowGuestInfoPopup(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Guest Name *</label>
                <input value={guestForm.name} onChange={e => setGuestForm(f => ({...f, name: e.target.value}))} placeholder="Full name" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Mobile *</label>
                  <input value={guestForm.mobile} onChange={e => setGuestForm(f => ({...f, mobile: e.target.value}))} placeholder="10-digit mobile" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Email</label>
                  <input value={guestForm.email} onChange={e => setGuestForm(f => ({...f, email: e.target.value}))} placeholder="email@example.com" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Aadhaar</label>
                  <label className="flex flex-col items-center justify-center w-full py-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 text-gray-400 hover:text-blue-500">
                    <Upload size={14} /><span className="text-[10px] mt-1 truncate w-full text-center">{guestAadhaarFile?.name ?? 'Upload'}</span>
                    <input type="file" className="hidden" onChange={e => setGuestAadhaarFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">PAN</label>
                  <label className="flex flex-col items-center justify-center w-full py-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-amber-400 text-gray-400 hover:text-amber-500">
                    <Upload size={14} /><span className="text-[10px] mt-1 truncate w-full text-center">{guestPanFile?.name ?? 'Upload'}</span>
                    <input type="file" className="hidden" onChange={e => setGuestPanFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Others</label>
                  <label className="flex flex-col items-center justify-center w-full py-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-teal-400 text-gray-400 hover:text-teal-500">
                    <Upload size={14} /><span className="text-[10px] mt-1 text-center">{guestOtherFiles.length > 0 ? `${guestOtherFiles.length} file(s)` : 'Upload'}</span>
                    <input type="file" multiple className="hidden" onChange={e => setGuestOtherFiles(Array.from(e.target.files ?? []))} />
                  </label>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowGuestInfoPopup(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleAddGuestInfo} disabled={guestSubmitting || !guestForm.name.trim() || !guestForm.mobile.trim()} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
                  {guestSubmitting ? 'Saving…' : 'Add Guest'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};