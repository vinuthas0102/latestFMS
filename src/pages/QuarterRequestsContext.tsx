import React, { createContext, useContext } from 'react';
import {
  Quarter,
  QuarterRequest,
  QuarterAllotmentCycle,
  QuarterTenantRequest,
  QuarterServiceChat,
  QuarterAllotmentChat,
  QuarterAllotment,
  QuarterAllotmentApproval,
  QuarterApprovalChat,
  QuarterInspection,
  QuarterInspectionChat,
  QuarterHandover,
  QuarterGuestInfo,
} from '../services/quartersService';
import type {
  DPFilter, PrefItem, NewRequestForm, ActionPopupState, RequestForType,
  DemoEmployee, TPInfo, EOMode, EORightMode, RightAction,
} from '../types/quarter';
import { UserDTO } from '../types';

export type { EOMode, EORightMode, RightAction };

export interface QRPageContext {
  // Auth
  user: UserDTO | null;

  // Core data
  requests: QuarterRequest[];
  setRequests: React.Dispatch<React.SetStateAction<QuarterRequest[]>>;
  tenantRequests: QuarterTenantRequest[];
  setTenantRequests: React.Dispatch<React.SetStateAction<QuarterTenantRequest[]>>;
  selectedRequest: QuarterRequest | null;
  setSelectedRequest: React.Dispatch<React.SetStateAction<QuarterRequest | null>>;
  activeCycle: QuarterAllotmentCycle | null;
  loading: boolean;

  // EO mode
  isEO: boolean;
  eoMode: EOMode;
  setEOMode: React.Dispatch<React.SetStateAction<EOMode>>;

  // EO My Allotment: Allot Now
  allotNowQuarterId: string | null;
  setAllotNowQuarterId: React.Dispatch<React.SetStateAction<string | null>>;
  allotNowQuarter: Quarter | null;
  setAllotNowQuarter: React.Dispatch<React.SetStateAction<Quarter | null>>;
  allotNowSubmitting: boolean;
  showAllotNowPicker: boolean;
  setShowAllotNowPicker: React.Dispatch<React.SetStateAction<boolean>>;
  allotNowSearch: string;
  setAllotNowSearch: React.Dispatch<React.SetStateAction<string>>;
  allotNowQuarters: Quarter[];
  allotNowLoading: boolean;

  // EO Employee: override
  overrideAllotment: QuarterAllotment | null;
  setOverrideAllotment: React.Dispatch<React.SetStateAction<QuarterAllotment | null>>;
  overrideRequest: QuarterRequest | null;
  setOverrideRequest: React.Dispatch<React.SetStateAction<QuarterRequest | null>>;
  showOverrideModal: boolean;
  setShowOverrideModal: React.Dispatch<React.SetStateAction<boolean>>;

  // EO Employee: manual allot
  manualAllotPickerOpen: boolean;
  setManualAllotPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  manualAllotSearch: string;
  setManualAllotSearch: React.Dispatch<React.SetStateAction<string>>;
  manualAllotQuarters: Quarter[];
  manualAllotLoading: boolean;
  manualAllotSubmitting: boolean;

  // EO Employee: approve/reject tenant request
  eoTrId: string | null;
  setEoTrId: React.Dispatch<React.SetStateAction<string | null>>;
  eoTrAction: 'approve' | 'reject' | null;
  setEoTrAction: React.Dispatch<React.SetStateAction<'approve' | 'reject' | null>>;
  eoTrNotes: string;
  setEoTrNotes: React.Dispatch<React.SetStateAction<string>>;
  eoTrSubmitting: boolean;

  // EO: Approval workflow
  approvalRecord: QuarterAllotmentApproval | null;
  approvalChats: QuarterApprovalChat[];
  approvalChatMsg: string;
  setApprovalChatMsg: React.Dispatch<React.SetStateAction<string>>;
  approvalAction: 'approve' | 'clarify' | null;
  setApprovalAction: React.Dispatch<React.SetStateAction<'approve' | 'clarify' | null>>;
  approvalRemarks: string;
  setApprovalRemarks: React.Dispatch<React.SetStateAction<string>>;
  approvalTargetLevel: number;
  setApprovalTargetLevel: React.Dispatch<React.SetStateAction<number>>;
  approvalSubmitting: boolean;

  // EO: Inspection
  inspections: QuarterInspection[];
  inspectionChats: QuarterInspectionChat[];
  selectedInspectionId: string | null;
  setSelectedInspectionId: React.Dispatch<React.SetStateAction<string | null>>;
  inspectionPanel: 'list' | 'chat' | 'new';
  setInspectionPanel: React.Dispatch<React.SetStateAction<'list' | 'chat' | 'new'>>;
  inspectionOpeningRemark: string;
  setInspectionOpeningRemark: React.Dispatch<React.SetStateAction<string>>;
  inspectionChatMsg: string;
  setInspectionChatMsg: React.Dispatch<React.SetStateAction<string>>;
  inspectionChatFile: File | null;
  setInspectionChatFile: React.Dispatch<React.SetStateAction<File | null>>;
  inspectionSubmitting: boolean;
  inspectionCloseRemarks: string;
  setInspectionCloseRemarks: React.Dispatch<React.SetStateAction<string>>;
  inspectionCondition: string;
  setInspectionCondition: React.Dispatch<React.SetStateAction<string>>;

  // EO: Handover
  showHandoverPopup: boolean;
  setShowHandoverPopup: React.Dispatch<React.SetStateAction<boolean>>;
  handover: QuarterHandover | null;
  handoverKeyNo: string;
  setHandoverKeyNo: React.Dispatch<React.SetStateAction<string>>;
  handoverRemarks: string;
  setHandoverRemarks: React.Dispatch<React.SetStateAction<string>>;
  handoverDeadline: string;
  setHandoverDeadline: React.Dispatch<React.SetStateAction<string>>;
  handoverInteriorFile: File | null;
  setHandoverInteriorFile: React.Dispatch<React.SetStateAction<File | null>>;
  handoverReportFile: File | null;
  setHandoverReportFile: React.Dispatch<React.SetStateAction<File | null>>;
  handoverSubmitting: boolean;

  // EO: Guest info
  showGuestInfoPopup: boolean;
  setShowGuestInfoPopup: React.Dispatch<React.SetStateAction<boolean>>;
  guestInfoList: QuarterGuestInfo[];
  guestInfoLoading: boolean;
  guestForm: { name: string; mobile: string; email: string };
  setGuestForm: React.Dispatch<React.SetStateAction<{ name: string; mobile: string; email: string }>>;
  guestAadhaarFile: File | null;
  setGuestAadhaarFile: React.Dispatch<React.SetStateAction<File | null>>;
  guestPanFile: File | null;
  setGuestPanFile: React.Dispatch<React.SetStateAction<File | null>>;
  guestOtherFiles: File[];
  setGuestOtherFiles: React.Dispatch<React.SetStateAction<File[]>>;
  guestSubmitting: boolean;

  // EO: Right panel mode
  eoRightMode: EORightMode;
  setEoRightMode: React.Dispatch<React.SetStateAction<EORightMode>>;
  eoRejectReason: string;
  setEoRejectReason: React.Dispatch<React.SetStateAction<string>>;
  eoRejectSubmitting: boolean;

  // DP filter
  dpFilter: DPFilter;
  setDpFilter: React.Dispatch<React.SetStateAction<DPFilter>>;

  // New request modal
  showNewModal: boolean;
  setShowNewModal: React.Dispatch<React.SetStateAction<boolean>>;
  form: NewRequestForm;
  setForm: React.Dispatch<React.SetStateAction<NewRequestForm>>;
  prefs: PrefItem[];
  setPrefs: React.Dispatch<React.SetStateAction<PrefItem[]>>;
  submitting: boolean;
  requestFor: RequestForType;
  setRequestFor: React.Dispatch<React.SetStateAction<RequestForType>>;
  selectedEmployee: DemoEmployee | null;
  setSelectedEmployee: React.Dispatch<React.SetStateAction<DemoEmployee | null>>;
  tpInfo: TPInfo;
  setTpInfo: React.Dispatch<React.SetStateAction<TPInfo>>;
  tpInfoConfirmed: boolean;
  setTpInfoConfirmed: React.Dispatch<React.SetStateAction<boolean>>;
  showEmployeePicker: boolean;
  setShowEmployeePicker: React.Dispatch<React.SetStateAction<boolean>>;
  showTPForm: boolean;
  setShowTPForm: React.Dispatch<React.SetStateAction<boolean>>;
  tpPopupTab: 'quick' | 'manual';
  setTpPopupTab: React.Dispatch<React.SetStateAction<'quick' | 'manual'>>;
  employeeSearch: string;
  setEmployeeSearch: React.Dispatch<React.SetStateAction<string>>;
  employeeDeptFilter: string;
  setEmployeeDeptFilter: React.Dispatch<React.SetStateAction<string>>;
  tpFormDraft: TPInfo;
  setTpFormDraft: React.Dispatch<React.SetStateAction<TPInfo>>;

  // Decline allotment modal
  declineModalReqId: string | null;
  setDeclineModalReqId: React.Dispatch<React.SetStateAction<string | null>>;
  declineModalRemarks: string;
  setDeclineModalRemarks: React.Dispatch<React.SetStateAction<string>>;
  declineModalDocUrl: File | null;
  setDeclineModalDocUrl: React.Dispatch<React.SetStateAction<File | null>>;
  declineModalSubmitting: boolean;

  // Right panel action state
  rightAction: RightAction;
  setRightAction: React.Dispatch<React.SetStateAction<RightAction>>;
  actionRemarks: string;
  setActionRemarks: React.Dispatch<React.SetStateAction<string>>;
  actionReason: string;
  setActionReason: React.Dispatch<React.SetStateAction<string>>;
  actionDocUrl: File | null;
  setActionDocUrl: React.Dispatch<React.SetStateAction<File | null>>;
  actionDate: string;
  setActionDate: React.Dispatch<React.SetStateAction<string>>;
  actionBhk: string;
  setActionBhk: React.Dispatch<React.SetStateAction<string>>;
  actionSubmitting: boolean;

  // Quarter preview modal
  previewQuarterId: string | null;
  setPreviewQuarterId: React.Dispatch<React.SetStateAction<string | null>>;
  isPreviewOpen: boolean;
  setIsPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Service chats
  serviceChats: Record<string, QuarterServiceChat[]>;
  setServiceChats: React.Dispatch<React.SetStateAction<Record<string, QuarterServiceChat[]>>>;
  selectedServiceId: string | null;
  setSelectedServiceId: React.Dispatch<React.SetStateAction<string | null>>;
  servicesHistoryMode: boolean;
  setServicesHistoryMode: React.Dispatch<React.SetStateAction<boolean>>;
  chatMessage: string;
  setChatMessage: React.Dispatch<React.SetStateAction<string>>;
  chatAttachFile: File | null;
  setChatAttachFile: React.Dispatch<React.SetStateAction<File | null>>;
  chatSubmitting: boolean;

  // Allotment chats
  allotmentChats: Record<string, QuarterAllotmentChat[]>;
  allotmentChatMessage: string;
  setAllotmentChatMessage: React.Dispatch<React.SetStateAction<string>>;
  allotmentChatFile: File | null;
  setAllotmentChatFile: React.Dispatch<React.SetStateAction<File | null>>;
  allotmentChatSubmitting: boolean;

  // Card list UI state
  openMenuId: string | null;
  setOpenMenuId: React.Dispatch<React.SetStateAction<string | null>>;
  menuPos: { top: number; left: number } | null;
  setMenuPos: React.Dispatch<React.SetStateAction<{ top: number; left: number } | null>>;
  expandedCardId: string | null;
  setExpandedCardId: React.Dispatch<React.SetStateAction<string | null>>;
  expandedSvcsCardId: string | null;
  setExpandedSvcsCardId: React.Dispatch<React.SetStateAction<string | null>>;
  expandedSvcDetailId: string | null;
  setExpandedSvcDetailId: React.Dispatch<React.SetStateAction<string | null>>;

  // Lightbox
  lightboxImages: string[];
  setLightboxImages: React.Dispatch<React.SetStateAction<string[]>>;
  lightboxIndex: number;
  setLightboxIndex: React.Dispatch<React.SetStateAction<number>>;
  lightboxOpen: boolean;
  setLightboxOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Action popup
  actionPopup: ActionPopupState;
  setActionPopup: React.Dispatch<React.SetStateAction<ActionPopupState>>;
  popupReason: string;
  setPopupReason: React.Dispatch<React.SetStateAction<string>>;
  popupRemarks: string;
  setPopupRemarks: React.Dispatch<React.SetStateAction<string>>;
  popupDocUrl: File | null;
  setPopupDocUrl: React.Dispatch<React.SetStateAction<File | null>>;
  popupDate: string;
  setPopupDate: React.Dispatch<React.SetStateAction<string>>;
  popupSubject: string;
  setPopupSubject: React.Dispatch<React.SetStateAction<string>>;
  popupUrgency: string;
  setPopupUrgency: React.Dispatch<React.SetStateAction<string>>;
  popupSubmitting: boolean;

  // Selected pref quarter
  selectedPrefQuarter: Quarter | null;
  setSelectedPrefQuarter: React.Dispatch<React.SetStateAction<Quarter | null>>;

  // Handlers
  loadData: () => void;
  resetActionForm: () => void;
  openActionPopup: (type: import('../types/quarter').ActionPopupType, requestId: string, allotmentId: string) => void;
  closeActionPopup: () => void;
  handleSendChat: () => void;
  handleSendAllotmentChat: () => void;
  handleCloseService: () => void;
  handleAcknowledge: () => void;
  handleReject: () => void;
  handleTenantRequest: (serviceType: 'EXTEND' | 'UPGRADE' | 'VACATE') => void;
  handleWithdraw: (id: string) => void;
  handleWithdrawTenantReq: (id: string) => void;
  handleManualAllot: (quarterId: string) => void;
  handleEOApproveTR: () => void;
  handleEORejectTR: () => void;
  handlePopupSubmit: () => void;
  handleEORejectRequest: () => void;
  handleApproveLevel: () => void;
  handleSendClarification: () => void;
  handleStartInspection: () => void;
  handleSendInspectionChat: () => void;
  handleCloseInspection: () => void;
  handleCreateHandover: () => void;
  handleAddGuestInfo: () => void;
  openNewModal: (req?: QuarterRequest) => void;
  openQuarterPreview: (req: QuarterRequest) => void;
  // Derived
  selectedPrefs: Array<{ quarter: Quarter | undefined; preference_rank: number; [key: string]: unknown }>;
  // Navigation and toasts (passed from parent hooks)
  navigate: (path: string, opts?: object) => void;
  addToast: (message: string, type: string) => void;
  loadGuestInfo: () => void;
}

const QRContext = createContext<QRPageContext | null>(null);

export const QRProvider = QRContext.Provider;

export function useQRContext(): QRPageContext {
  const ctx = useContext(QRContext);
  if (!ctx) throw new Error('useQRContext must be used within QRProvider');
  return ctx;
}
