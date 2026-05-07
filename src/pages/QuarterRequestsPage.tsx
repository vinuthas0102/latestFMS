import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
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
import SplitLayout from '../components/ui/SplitLayout';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { ImageCarousel } from '../components/ui/ImageCarousel';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import { SummaryStatsCard } from '../components/ui/SummaryStatsCard';
import { MandatorySearchBar } from '../components/ui/MandatorySearchBar';
import { DocUpload } from '../components/ui/DocUpload';
import { QuarterDetailModal } from '../components/quarters/QuarterDetailModal';
import { QuarterOverrideModal } from '../components/quarters/QuarterOverrideModal';
import { QuarterDetailCard } from '../components/quarters/QuarterDetailCard';
import {
  quartersService,
  Quarter,
  QuarterRequest,
  QuarterAllotmentCycle,
  QuarterTenantRequest,
  QuarterServiceChat,
  QuarterAllotmentChat,
  QuarterAllotment,
  QuarterApprovalWorkflow,
  QuarterAllotmentApproval,
  QuarterApprovalChat,
  QuarterInspection,
  QuarterInspectionChat,
  QuarterHandover,
  QuarterGuestInfo,
  CreateTenantRequestInput,
} from '../services/quartersService';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { ROUTES } from '../constants/routes';
import { DEMO_MODE, DEMO_REQUESTS, DEMO_TENANT_REQUESTS, DEMO_CYCLE } from '../mocks/demoData';
import {
  PLACEHOLDER_IMAGES, getImage, resolveAllImages,
  fmtINR, fmtDate, statusAccentColor,
  statusConfig, tenantStatusConfig, serviceTypeConfig,
  isAllottedStatus, isOccupiedStatus, isAcceptedStatus,
  getRequestForBadgeCls, getRequestForLabel,
  ChatBubble, CompactQuarterRow, QuarterSummaryPanel, RequestSummaryBlock,
} from '../components/quarters/quarterShared';
import { EOActionPanel, EORightMode } from '../components/quarters/EOActionPanel';
import {
  RightPanelAllotted, RightPanelOccupied, RightPanelDraft,
  RightPanelPreferences, RightPanelSubmitted,
} from '../components/quarters/EmployeeRightPanels';
import { DeclineAllotmentModal } from '../components/quarters/DeclineAllotmentModal';
import { ActionPopupModal } from '../components/quarters/ActionPopupModal';
const NewRequestModal = React.lazy(() => import('../components/quarters/NewRequestModal').then(m => ({ default: m.NewRequestModal })));

// ─── helpers ──────────────────────────────────────────────────────────────────

// Demo employee list for EO "Another Employee" picker
const DEMO_EMPLOYEES = [
  { id: 'EMP-1001', name: 'Rajesh Kumar',     dept: 'Ministry of Finance',    email: 'rajesh.kumar@mof.gov.in',    designation: 'Under Secretary' },
  { id: 'EMP-1002', name: 'Sunita Sharma',    dept: 'Dept. of Telecom',        email: 'sunita.sharma@dot.gov.in',   designation: 'Section Officer' },
  { id: 'EMP-1003', name: 'Anil Verma',       dept: 'Ministry of Defence',     email: 'anil.verma@mod.gov.in',      designation: 'Deputy Secretary' },
  { id: 'EMP-1004', name: 'Priya Nair',       dept: 'Ministry of Home Affairs', email: 'priya.nair@mha.gov.in',     designation: 'Assistant Director' },
  { id: 'EMP-1005', name: 'Vikram Singh',     dept: 'Ministry of Rural Dev.',  email: 'vikram.singh@mord.gov.in',   designation: 'Director' },
  { id: 'EMP-1006', name: 'Meera Pillai',     dept: 'Ministry of Commerce',    email: 'meera.pillai@commerce.gov.in', designation: 'Joint Secretary' },
  { id: 'EMP-1007', name: 'Suresh Babu',      dept: 'DOPT',                    email: 'suresh.babu@dopt.gov.in',    designation: 'Section Officer' },
  { id: 'EMP-1008', name: 'Anita Desai',      dept: 'Ministry of Health',      email: 'anita.desai@mohfw.gov.in',   designation: 'Under Secretary' },
  { id: 'EMP-1009', name: 'Ramesh Gupta',     dept: 'NIC',                     email: 'ramesh.gupta@nic.in',        designation: 'Senior Technical Director' },
  { id: 'EMP-1010', name: 'Kavitha Reddy',    dept: 'Ministry of Education',   email: 'kavitha.reddy@education.gov.in', designation: 'Deputy Director' },
  { id: 'EMP-1011', name: 'Dinesh Patel',     dept: 'Ministry of Railways',    email: 'dinesh.patel@railways.gov.in', designation: 'Assistant Secretary' },
  { id: 'EMP-1012', name: 'Lalitha Menon',    dept: 'Ministry of Agriculture', email: 'lalitha.menon@agri.gov.in',  designation: 'Senior Analyst' },
];

// Demo TP profiles for quick-fill in the Third Party picker
const DEMO_TP_PROFILES = [
  { id: 'TP-001', name: 'Arjun Mehta',       organization: 'Tata Consultancy Services',   mobile: '9810001001', email: 'arjun.mehta@tcs.com',          pan: 'ARJPM1234A', type: 'Consultant' },
  { id: 'TP-002', name: 'Divya Krishnan',    organization: 'Infosys Ltd.',                mobile: '9820002002', email: 'divya.k@infosys.com',           pan: 'DIVKR5678B', type: 'Contractor' },
  { id: 'TP-003', name: 'Sanjay Bose',       organization: 'NASSCOM Foundation',          mobile: '9830003003', email: 's.bose@nasscom.org',            pan: 'SNJBS9012C', type: 'NGO' },
  { id: 'TP-004', name: 'Nisha Agarwal',     organization: 'World Bank India',            mobile: '9840004004', email: 'n.agarwal@worldbank.org',       pan: 'NSHAG3456D', type: 'Guest' },
  { id: 'TP-005', name: 'Karan Malhotra',    organization: 'L&T Infrastructure',         mobile: '9850005005', email: 'k.malhotra@lnt.com',            pan: 'KRNML7890E', type: 'Contractor' },
  { id: 'TP-006', name: 'Rekha Venkatesh',   organization: 'UNICEF India',               mobile: '9860006006', email: 'r.venkatesh@unicef.org',        pan: 'RKHVN2345F', type: 'NGO' },
  { id: 'TP-007', name: 'Amit Joshi',        organization: 'Ernst & Young LLP',          mobile: '9870007007', email: 'a.joshi@ey.com',                pan: 'AMTJS6789G', type: 'Consultant' },
  { id: 'TP-008', name: 'Sunaina Kapoor',    organization: 'FICCI',                      mobile: '9880008008', email: 's.kapoor@ficci.in',             pan: 'SNKPR1230H', type: 'Guest' },
];

function getOccupancyBadge(status: string) {
  if (status === 'AVAILABLE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'OCCUPIED')  return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

type DPFilter = 'all' | 'draft' | 'submitted' | 'allotted' | 'occupied' | 'tenantServices' | 'vacated';

const DP_LABELS: Record<DPFilter, string> = {
  all: 'All Requests',
  draft: 'Draft Requests',
  submitted: 'Submitted',
  allotted: 'Allotted',
  occupied: 'Occupied',
  tenantServices: 'Tenant Services',
  vacated: 'Vacated',
};

interface PrefItem { quarter: Quarter; rank: number }

interface NewRequestForm {
  request_reason: string; required_bhk_config: string; preferred_location: string;
  move_in_date: string; family_member_count: number; employee_notes: string;
}

const DEFAULT_FORM: NewRequestForm = {
  request_reason: '', required_bhk_config: '', preferred_location: '',
  move_in_date: '', family_member_count: 1, employee_notes: '',
};

// ─── Status dashboard card ─────────────────────────────────────────────────────

interface StatusCard {
  key: DPFilter; label: string; description: string;
  count: number;
  gradient: string; iconBg: string; textColor: string; countColor: string;
  icon: React.ReactNode;
}

// ─── Action popup types ────────────────────────────────────────────────────────

type ActionPopupType = 'EXTEND' | 'VACATE' | 'GRIEVANCE' | 'MAINTENANCE' | 'INSPECTION' | 'HANDOVER' | null;

interface ActionPopupState {
  type: ActionPopupType;
  requestId: string;
  allotmentId: string;
}

// ─── Request-For types ─────────────────────────────────────────────────────────

type RequestForType = 'SELF' | 'EMPLOYEE' | 'TP';

interface DemoEmployee {
  id: string;
  name: string;
  dept: string;
  email: string;
  designation: string;
}

interface TPInfo {
  name: string;
  organization: string;
  mobile: string;
  email: string;
  pan: string;
  notes: string;
}

// ─── component ────────────────────────────────────────────────────────────────

export const QuarterRequestsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToast = useUIStore(s => s.addToast);

  // DEMO_MODE: initialize state directly with mock data instead of empty defaults
  const [requests, setRequests] = useState<QuarterRequest[]>(DEMO_MODE ? DEMO_REQUESTS : []);
  const [tenantRequests, setTenantRequests] = useState<QuarterTenantRequest[]>(DEMO_MODE ? DEMO_TENANT_REQUESTS : []);
  const [selectedRequest, setSelectedRequest] = useState<QuarterRequest | null>(null);
  const [activeCycle, setActiveCycle] = useState<QuarterAllotmentCycle | null>(DEMO_MODE ? DEMO_CYCLE : null);
  const [loading, setLoading] = useState(DEMO_MODE ? false : true);

  // EO mode selection — null means show mode-selection screen every visit
  type EOMode = 'self' | 'employee' | null;
  const isEO = user?.role === 'manager';
  const [eoMode, setEOMode] = useState<EOMode>(null);

  // EO My Allotment mode: Allot Now state
  const [allotNowQuarterId, setAllotNowQuarterId] = useState<string | null>(null);
  const [allotNowQuarter, setAllotNowQuarter] = useState<Quarter | null>(null);
  const [allotNowSubmitting, setAllotNowSubmitting] = useState(false);
  const [showAllotNowPicker, setShowAllotNowPicker] = useState(false);
  const [allotNowSearch, setAllotNowSearch] = useState('');
  const [allotNowQuarters, setAllotNowQuarters] = useState<Quarter[]>([]);
  const [allotNowLoading, setAllotNowLoading] = useState(false);

  // EO Employee mode: override modal
  const [overrideAllotment, setOverrideAllotment] = useState<QuarterAllotment | null>(null);
  const [overrideRequest, setOverrideRequest] = useState<QuarterRequest | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // EO Employee mode: manual allot quarter picker
  const [manualAllotPickerOpen, setManualAllotPickerOpen] = useState(false);
  const [manualAllotSearch, setManualAllotSearch] = useState('');
  const [manualAllotQuarters, setManualAllotQuarters] = useState<Quarter[]>([]);
  const [manualAllotLoading, setManualAllotLoading] = useState(false);
  const [manualAllotSubmitting, setManualAllotSubmitting] = useState(false);

  // EO Employee mode: approve/reject tenant request panel
  const [eoTrId, setEoTrId] = useState<string | null>(null);
  const [eoTrAction, setEoTrAction] = useState<'approve' | 'reject' | null>(null);
  const [eoTrNotes, setEoTrNotes] = useState('');
  const [eoTrSubmitting, setEoTrSubmitting] = useState(false);

  // EO: Run Allocation popup
  const [showRunAllocationPopup, setShowRunAllocationPopup] = useState(false);
  const [runAllocSubmitting, setRunAllocSubmitting] = useState(false);
  const [runAllocCycleName, setRunAllocCycleName] = useState('');
  const [runAllocStart, setRunAllocStart] = useState('');
  const [runAllocEnd, setRunAllocEnd] = useState('');

  // EO: Cycle history popup
  const [showCycleHistory, setShowCycleHistory] = useState(false);
  const [cycleHistoryList, setCycleHistoryList] = useState<QuarterAllotmentCycle[]>([]);
  const [cycleHistoryLoading, setCycleHistoryLoading] = useState(false);
  const [selectedCycleDetail, setSelectedCycleDetail] = useState<QuarterAllotmentCycle | null>(null);
  const [cycleDetailRequests, setCycleDetailRequests] = useState<QuarterRequest[]>([]);
  const [cycleDetailLoading, setCycleDetailLoading] = useState(false);

  // EO: Allot Requests popup (bulk allot with optional WFL)
  const [showAllotRequestsPopup, setShowAllotRequestsPopup] = useState(false);
  const [allotRequestsWorkflows, setAllotRequestsWorkflows] = useState<QuarterApprovalWorkflow[]>([]);
  const [allotRequestsWflId, setAllotRequestsWflId] = useState<string>('none');
  const [allotRequestsSubmitting, setAllotRequestsSubmitting] = useState(false);

  // EO: Approval workflow panel (Pending Approval DP)
  const [approvalRecord, setApprovalRecord] = useState<QuarterAllotmentApproval | null>(null);
  const [approvalChats, setApprovalChats] = useState<QuarterApprovalChat[]>([]);
  const [approvalChatMsg, setApprovalChatMsg] = useState('');
  const [approvalAction, setApprovalAction] = useState<'approve' | 'clarify' | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [approvalTargetLevel, setApprovalTargetLevel] = useState(1);
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);

  // EO: Inspection panel
  const [inspections, setInspections] = useState<QuarterInspection[]>([]);
  const [inspectionChats, setInspectionChats] = useState<QuarterInspectionChat[]>([]);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [inspectionPanel, setInspectionPanel] = useState<'list' | 'chat' | 'new'>('list');
  const [inspectionOpeningRemark, setInspectionOpeningRemark] = useState('');
  const [inspectionChatMsg, setInspectionChatMsg] = useState('');
  const [inspectionChatFile, setInspectionChatFile] = useState<File | null>(null);
  const [inspectionSubmitting, setInspectionSubmitting] = useState(false);
  const [inspectionCloseRemarks, setInspectionCloseRemarks] = useState('');
  const [inspectionCondition, setInspectionCondition] = useState('GOOD');

  // EO: Handover popup
  const [showHandoverPopup, setShowHandoverPopup] = useState(false);
  const [handover, setHandover] = useState<QuarterHandover | null>(null);
  const [handoverKeyNo, setHandoverKeyNo] = useState('');
  const [handoverRemarks, setHandoverRemarks] = useState('');
  const [handoverDeadline, setHandoverDeadline] = useState('');
  const [handoverInteriorFile, setHandoverInteriorFile] = useState<File | null>(null);
  const [handoverReportFile, setHandoverReportFile] = useState<File | null>(null);
  const [handoverSubmitting, setHandoverSubmitting] = useState(false);

  // EO: Guest Info panel / popup
  const [showGuestInfoPopup, setShowGuestInfoPopup] = useState(false);
  const [guestInfoList, setGuestInfoList] = useState<QuarterGuestInfo[]>([]);
  const [guestInfoLoading, setGuestInfoLoading] = useState(false);
  const [guestForm, setGuestForm] = useState({ name: '', mobile: '', email: '' });
  const [guestAadhaarFile, setGuestAadhaarFile] = useState<File | null>(null);
  const [guestPanFile, setGuestPanFile] = useState<File | null>(null);
  const [guestOtherFiles, setGuestOtherFiles] = useState<File[]>([]);
  const [guestSubmitting, setGuestSubmitting] = useState(false);

  // EO: Right panel mode for each DP
  type EORightMode = 'detail' | 'allot' | 'rejection_chat' | 'override' | 'approval_chat' | 'inspection' | 'handover' | 'chat';
  const [eoRightMode, setEoRightMode] = useState<EORightMode>('detail');
  const [eoRejectReason, setEoRejectReason] = useState('');
  const [eoRejectSubmitting, setEoRejectSubmitting] = useState(false);

  // Dashboard filter — default to 'allotted' per spec
  const [dpFilter, setDpFilter] = useState<DPFilter>('allotted');

  // New-request full-screen
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState<NewRequestForm>(DEFAULT_FORM);
  const [prefs, setPrefs] = useState<PrefItem[]>([]);
  const [modalQuarters, setModalQuarters] = useState<Quarter[]>([]);
  const [modalSearch, setModalSearch] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Available quarters filters
  const [modalFilterOpen, setModalFilterOpen] = useState(false);
  const [modalBhk, setModalBhk] = useState('');
  const [modalFurnishing, setModalFurnishing] = useState('');
  const [modalSortBy, setModalSortBy] = useState('');
  const modalFilterRef = useRef<HTMLDivElement>(null);

  // Decline allotment modal (card-level)
  const [declineModalReqId, setDeclineModalReqId] = useState<string | null>(null);
  const [declineModalRemarks, setDeclineModalRemarks] = useState('');
  const [declineModalDocUrl, setDeclineModalDocUrl] = useState<File | null>(null);
  const [declineModalSubmitting, setDeclineModalSubmitting] = useState(false);

  // Request-For state (for new request form)
  const [requestFor, setRequestFor] = useState<RequestForType>('SELF');
  const [selectedEmployee, setSelectedEmployee] = useState<DemoEmployee | null>(null);
  const [tpInfo, setTpInfo] = useState<TPInfo>({ name: '', organization: '', mobile: '', email: '', pan: '', notes: '' });
  const [tpInfoConfirmed, setTpInfoConfirmed] = useState(false);
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [showTPForm, setShowTPForm] = useState(false);
  const [tpPopupTab, setTpPopupTab] = useState<'quick' | 'manual'>('quick');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeDeptFilter, setEmployeeDeptFilter] = useState('');
  const [tpFormDraft, setTpFormDraft] = useState<TPInfo>({ name: '', organization: '', mobile: '', email: '', pan: '', notes: '' });

  // Full-screen request detail view
  const [detailRequest, setDetailRequest] = useState<QuarterRequest | null>(null);
  const [detailReturnFilter, setDetailReturnFilter] = useState<DPFilter>('allotted');

  // List filters
  const [reqSearch, setReqSearch] = useState('');
  const [reqSort, setReqSort] = useState<'newest' | 'oldest'>('newest');
  const [reqBhkFilter, setReqBhkFilter] = useState<string>('ALL');
  const [reqToiletFilter, setReqToiletFilter] = useState<string[]>([]);
  const [reqFloorFilter, setReqFloorFilter] = useState<number[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Selected preference quarter for detail view
  const [selectedPrefQuarter, setSelectedPrefQuarter] = useState<Quarter | null>(null);

  // Right-panel action state
  type RightAction = null | 'acknowledge' | 'reject' | 'extend' | 'upgrade' | 'vacate';
  const [rightAction, setRightAction] = useState<RightAction>(null);
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionDocUrl, setActionDocUrl] = useState<File | null>(null);
  const [actionDate, setActionDate] = useState('');
  const [actionBhk, setActionBhk] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Card-level accept inline state
  const [acceptCardId, setAcceptCardId] = useState<string | null>(null);
  const [acceptCardRemarks, setAcceptCardRemarks] = useState('');
  const [acceptCardSubmitting, setAcceptCardSubmitting] = useState(false);

  // Quarter preview modal (photo click)
  const [previewQuarterId, setPreviewQuarterId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);


  // Service chats for occupied panel
  const [serviceChats, setServiceChats] = useState<Record<string, QuarterServiceChat[]>>({});
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [servicesHistoryMode, setServicesHistoryMode] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatAttachFile, setChatAttachFile] = useState<File | null>(null);
  const [chatSubmitting, setChatSubmitting] = useState(false);

  // Allotment chats for allotted panel
  const [allotmentChats, setAllotmentChats] = useState<Record<string, QuarterAllotmentChat[]>>({});
  const [allotmentChatMessage, setAllotmentChatMessage] = useState('');
  const [allotmentChatFile, setAllotmentChatFile] = useState<File | null>(null);
  const [allotmentChatSubmitting, setAllotmentChatSubmitting] = useState(false);

  // Card-level dot-menu (portal-based to avoid scroll clipping)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [expandedSvcsCardId, setExpandedSvcsCardId] = useState<string | null>(null);
  const [expandedSvcDetailId, setExpandedSvcDetailId] = useState<string | null>(null);

  // Lightbox for allotted panel image tiles
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Close dot-menu on outside click or Escape
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null); setMenuPos(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpenMenuId(null); setMenuPos(null); }
    };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onMouse); document.removeEventListener('keydown', onKey); };
  }, []);

  function openMenu(e: React.MouseEvent, reqId: string) {
    e.stopPropagation();
    if (openMenuId === reqId) { setOpenMenuId(null); setMenuPos(null); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuHeight = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > menuHeight ? rect.bottom + 4 : rect.top - menuHeight - 4;
    setMenuPos({ top, left: rect.right - 188 });
    setOpenMenuId(reqId);
  }

  // Inline action popup (card-level icons)
  const [actionPopup, setActionPopup] = useState<ActionPopupState>({ type: null, requestId: '', allotmentId: '' });
  const [popupReason, setPopupReason] = useState('');
  const [popupRemarks, setPopupRemarks] = useState('');
  const [popupDocUrl, setPopupDocUrl] = useState<File | null>(null);
  const [popupDate, setPopupDate] = useState('');
  const [popupSubject, setPopupSubject] = useState('');
  const [popupUrgency, setPopupUrgency] = useState('NORMAL');
  const [popupSubmitting, setPopupSubmitting] = useState(false);
  const [popupInspectorName, setPopupInspectorName] = useState('');
  const [popupCondition, setPopupCondition] = useState('');
  const [popupKeyNumber, setPopupKeyNumber] = useState('');
  const [popupHandoverDeadline, setPopupHandoverDeadline] = useState('');

  function resetActionForm() {
    setRightAction(null); setActionRemarks(''); setActionReason('');
    setActionDocUrl(null); setActionDate(''); setActionBhk('');
  }

  // ─── shared file-upload helper ──────────────────────────────────────────────

  const uploadChatFile = async (file: File, pathPrefix: string): Promise<string | null> => {
    if (DEMO_MODE) return Promise.resolve(null);
    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `${pathPrefix}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('quarter-docs').upload(path, file);
    if (error) return null;
    const { data: pub } = supabase.storage.from('quarter-docs').getPublicUrl(path);
    return pub?.publicUrl ?? null;
  };

  // ─── service chat handlers ──────────────────────────────────────────────────

  const handleSendChat = async () => {
    if (!user || !selectedServiceId || !chatMessage.trim()) return;
    setChatSubmitting(true);
    try {
      const docUrls: string[] = [];
      if (chatAttachFile) {
        const url = await uploadChatFile(chatAttachFile, `service-chats/${selectedServiceId}`);
        if (url) docUrls.push(url);
      }
      await quartersService.addServiceChat(selectedServiceId, user.id, 'EMPLOYEE', chatMessage, docUrls);
      setChatMessage('');
      setChatAttachFile(null);
      const chats = await quartersService.getServiceChats(selectedServiceId);
      setServiceChats(prev => ({ ...prev, [selectedServiceId!]: chats }));
    } catch { addToast('Failed to send message', 'error'); } finally { setChatSubmitting(false); }
  };

  const handleSendAllotmentChat = async (authorRole?: string) => {
    if (!user || !selectedRequest?.allotment?.id || !allotmentChatMessage.trim()) return;
    const allotmentId = selectedRequest.allotment.id;
    const role = authorRole ?? (isEO && eoMode === 'employee' ? 'eo' : 'employee');
    setAllotmentChatSubmitting(true);
    try {
      const docUrls: string[] = [];
      if (allotmentChatFile) {
        const url = await uploadChatFile(allotmentChatFile, `allotment-chats/${allotmentId}`);
        if (url) docUrls.push(url);
      }
      await quartersService.addAllotmentChat(allotmentId, user.id, role, allotmentChatMessage, docUrls);
      setAllotmentChatMessage('');
      setAllotmentChatFile(null);
      const chats = await quartersService.getAllotmentChats(allotmentId);
      setAllotmentChats(prev => ({ ...prev, [allotmentId]: chats }));
    } catch { addToast('Failed to send message', 'error'); } finally { setAllotmentChatSubmitting(false); }
  };

  const handleCloseService = async () => {
    if (!selectedServiceId || !selectedRequest) return;
    if (!window.confirm('Close this service request?')) return;
    const svc = tenantRequests.find(tr => tr.id === selectedServiceId);
    if (!svc) return;
    try {
      await quartersService.closeService(selectedServiceId, selectedRequest.id, svc.service_type);
      setSelectedServiceId(null);
      addToast('Service closed', 'success');
      loadData();
    } catch { addToast('Failed to close service', 'error'); }
  };

  // Load chats when selectedServiceId changes
  useEffect(() => {
    if (!selectedServiceId) return;
    /* DEMO_MODE: service call disabled
    quartersService.getServiceChats(selectedServiceId).then(chats => {
      setServiceChats(prev => ({ ...prev, [selectedServiceId!]: chats }));
    }).catch(() => {});
    */
  }, [selectedServiceId]);

  // Load allotment chats when an allotted request is selected
  useEffect(() => {
    const allotmentId = selectedRequest?.allotment?.id;
    const s = selectedRequest?.request_status;
    const hasAllotment = s ? (isAllottedStatus(s) || isOccupiedStatus(s)) : false;
    if (!allotmentId || !hasAllotment) return;
    /* DEMO_MODE: service call disabled
    quartersService.getAllotmentChats(allotmentId).then(chats => {
      setAllotmentChats(prev => ({ ...prev, [allotmentId]: chats }));
    }).catch(() => {});
    */
  }, [selectedRequest?.allotment?.id, selectedRequest?.request_status]);

  function openActionPopup(type: ActionPopupType, requestId: string, allotmentId: string) {
    setActionPopup({ type, requestId, allotmentId });
    setPopupReason(''); setPopupRemarks(''); setPopupDocUrl(null);
    setPopupDate(''); setPopupSubject(''); setPopupUrgency('NORMAL');
    setPopupInspectorName(''); setPopupCondition(''); setPopupKeyNumber(''); setPopupHandoverDeadline('');
  }

  function closeActionPopup() {
    setActionPopup({ type: null, requestId: '', allotmentId: '' });
  }

  const loadData = useCallback(async () => {
    /* DEMO_MODE: data is pre-loaded from mock state; live fetch disabled
    if (!user) return;
    setLoading(true);
    try {
      const isEmployeeMode = isEO && eoMode === 'employee';
      const [reqs, cycle, tReqs] = await Promise.all([
        isEmployeeMode ? quartersService.getAllRequests() : quartersService.getMyRequests(user.id),
        quartersService.getActiveCycle(),
        isEmployeeMode ? quartersService.getAllTenantRequests() : quartersService.getMyTenantRequests(user.id),
      ]);
      const normalised = reqs.map((r: any) => ({
        ...r,
        allotment: Array.isArray(r.allotment) ? (r.allotment[0] ?? null) : r.allotment,
      }));
      setRequests(normalised as QuarterRequest[]);
      setActiveCycle(cycle);
      setTenantRequests(tReqs);

      // Auto-select default tab for EO employee mode per priority: Occupied > Allotted > Submitted
      if (isEmployeeMode) {
        const hasOccupied = normalised.some((r: any) => isOccupiedStatus(r.request_status));
        const hasAllotted = normalised.some((r: any) => isAllottedStatus(r.request_status));
        const hasSubmitted = normalised.some((r: any) => r.request_status === 'SUBMITTED');
        setDpFilter(hasOccupied ? 'occupied' : hasAllotted ? 'allotted' : hasSubmitted ? 'submitted' : 'occupied');
      }
    } catch {
      addToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
    */
  }, [user, addToast, isEO, eoMode]);

  // DEMO_MODE: loadData is a no-op; original trigger: useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (!DEMO_MODE) loadData(); }, [loadData]);

  // Reset EO right mode when selected request changes
  useEffect(() => {
    const s = selectedRequest?.request_status;
    const isOcc = s ? isOccupiedStatus(s) : false;
    setEoRightMode(isOcc ? 'chat' : 'detail');
    setApprovalAction(null);
    setApprovalRemarks('');
    setInspectionPanel('list');
    setSelectedInspectionId(null);
    setEoRejectReason('');
    setEoTrId(null);
    setEoTrAction(null);
    setEoTrNotes('');
  }, [selectedRequest?.id]);

  // Auto-select top preference for detail view
  useEffect(() => {
    if (!selectedRequest) return;
    const prefs = selectedRequest.preferences?.sort((a, b) => a.preference_rank - b.preference_rank) ?? [];
    const topQ = prefs[0]?.quarter as Quarter | undefined;
    setSelectedPrefQuarter(topQ ?? null);
  }, [selectedRequest?.id]);

  // Prefill from freeview "Add to Request"
  useEffect(() => {
    const prefill = (location.state as { prefill?: Quarter })?.prefill;
    if (prefill) {
      setPrefs([{ quarter: prefill, rank: 1 }]);
      setShowNewModal(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const loadModalQuarters = useCallback(async () => {
    setModalLoading(true);
    try {
      const data = await quartersService.getQuarters({
        occupancy_status: 'AVAILABLE',
        search: modalSearch || undefined,
        bhk_config: modalBhk || undefined,
        furnishing_status: modalFurnishing || undefined,
      });
      let filtered = data.filter(q => !prefs.find(p => p.quarter.id === q.id));
      if (modalSortBy === 'rent_asc') filtered = [...filtered].sort((a, b) => a.monthly_rent - b.monthly_rent);
      else if (modalSortBy === 'rent_desc') filtered = [...filtered].sort((a, b) => b.monthly_rent - a.monthly_rent);
      setModalQuarters(filtered);
    } catch {
      addToast('Failed to load quarters', 'error');
    } finally {
      setModalLoading(false);
    }
  }, [modalSearch, modalBhk, modalFurnishing, modalSortBy, prefs, addToast]);

  useEffect(() => {
    if (showNewModal) {
      const t = setTimeout(loadModalQuarters, 300);
      return () => clearTimeout(t);
    }
  }, [showNewModal, modalSearch, modalBhk, modalFurnishing, modalSortBy, loadModalQuarters]);

  // Close filter popup on outside click
  useEffect(() => {
    if (!modalFilterOpen) return;
    const handler = (e: MouseEvent) => {
      if (modalFilterRef.current && !modalFilterRef.current.contains(e.target as Node)) {
        setModalFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [modalFilterOpen]);

  // ─── pref list helpers ──────────────────────────────────────────────────────

  const addPref = (q: Quarter) => {
    if (prefs.length >= 5) { addToast('Maximum 5 preferences allowed', 'warning'); return; }
    if (prefs.find(p => p.quarter.id === q.id)) return;
    setPrefs(prev => [...prev, { quarter: q, rank: prev.length + 1 }]);
  };

  const removePref = (quarterId: string) => {
    setPrefs(prev => prev.filter(p => p.quarter.id !== quarterId).map((p, i) => ({ ...p, rank: i + 1 })));
  };

  const movePref = (idx: number, dir: 'up' | 'down') => {
    setPrefs(prev => {
      const arr = [...prev];
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr.map((p, i) => ({ ...p, rank: i + 1 }));
    });
  };

  const openNewModal = (req?: QuarterRequest) => {
    if (req) {
      setForm({
        request_reason: req.request_reason, required_bhk_config: req.required_bhk_config,
        preferred_location: req.preferred_location, move_in_date: req.move_in_date ?? '',
        family_member_count: req.family_member_count, employee_notes: req.employee_notes,
      });
      const existing = req.preferences?.map(p => ({ quarter: p.quarter as Quarter, rank: p.preference_rank })) ?? [];
      setPrefs(existing.sort((a, b) => a.rank - b.rank));
      // Restore request_for state from existing request
      const rf = (req.request_for ?? 'SELF') as RequestForType;
      setRequestFor(rf);
      if (rf === 'EMPLOYEE' && req.on_behalf_employee_id) {
        const emp = DEMO_EMPLOYEES.find(e => e.id === req.on_behalf_employee_id);
        setSelectedEmployee(emp ?? { id: req.on_behalf_employee_id, name: req.on_behalf_employee_name ?? '', dept: req.on_behalf_employee_dept ?? '', email: '', designation: '' });
      } else {
        setSelectedEmployee(null);
      }
      if (rf === 'TP') {
        const tp: TPInfo = { name: req.tp_name ?? '', organization: req.tp_organization ?? '', mobile: req.tp_mobile ?? '', email: req.tp_email ?? '', pan: req.tp_pan ?? '', notes: req.tp_notes ?? '' };
        setTpInfo(tp);
        setTpFormDraft(tp);
        setTpInfoConfirmed(true);
      } else {
        setTpInfo({ name: '', organization: '', mobile: '', email: '', pan: '', notes: '' });
        setTpInfoConfirmed(false);
      }
    } else {
      setForm(DEFAULT_FORM);
      setPrefs([]);
      setRequestFor('SELF');
      setSelectedEmployee(null);
      setTpInfo({ name: '', organization: '', mobile: '', email: '', pan: '', notes: '' });
      setTpInfoConfirmed(false);
    }
    setEmployeeSearch('');
    setModalSearch('');
    setModalBhk('');
    setModalFurnishing('');
    setModalSortBy('');
    setModalFilterOpen(false);
    setShowNewModal(true);
  };

  // ─── submit handlers ────────────────────────────────────────────────────────

  function buildRequestForPayload() {
    if (requestFor === 'EMPLOYEE' && selectedEmployee) {
      return {
        request_for: 'EMPLOYEE' as const,
        on_behalf_employee_id: selectedEmployee.id,
        on_behalf_employee_name: selectedEmployee.name,
        on_behalf_employee_dept: selectedEmployee.dept,
      };
    }
    if (requestFor === 'TP' && tpInfoConfirmed) {
      return {
        request_for: 'TP' as const,
        tp_name: tpInfo.name,
        tp_organization: tpInfo.organization,
        tp_mobile: tpInfo.mobile,
        tp_email: tpInfo.email,
        tp_pan: tpInfo.pan || null,
        tp_notes: tpInfo.notes || null,
      };
    }
    return { request_for: 'SELF' as const };
  }

  const handleSaveDraft = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const existing = requests.find(r => r.request_status === 'DRAFT' && showNewModal);
      if (existing && selectedRequest?.request_status === 'DRAFT') {
        await quartersService.updateRequestPreferences(
          selectedRequest.id,
          prefs.map(p => ({ quarter_id: p.quarter.id, preference_rank: p.rank }))
        );
      } else {
        const req = await quartersService.createRequest(user.id, {
          cycle_id: activeCycle?.id ?? null,
          request_reason: form.request_reason,
          required_bhk_config: form.required_bhk_config || '',
          preferred_location: form.preferred_location || '',
          move_in_date: form.move_in_date || null,
          family_member_count: form.family_member_count,
          employee_notes: form.employee_notes,
          preferences: prefs.map(p => ({ quarter_id: p.quarter.id, preference_rank: p.rank })),
          ...buildRequestForPayload(),
        });
        await quartersService.updateRequestPreferences(
          req.id,
          prefs.map(p => ({ quarter_id: p.quarter.id, preference_rank: p.rank }))
        );
      }
      addToast('Draft saved', 'success');
      setShowNewModal(false);
      loadData();
    } catch { addToast('Failed to save draft', 'error'); } finally { setSubmitting(false); }
  };

  const handleSubmit = async () => {
    if (!user || !form.request_reason.trim()) { addToast('Please provide a request reason', 'warning'); return; }
    if (requestFor === 'TP' && !tpInfoConfirmed) { addToast('Please complete Third Party information', 'warning'); return; }
    if (requestFor === 'EMPLOYEE' && !selectedEmployee) { addToast('Please select an employee', 'warning'); return; }
    setSubmitting(true);
    try {
      const req = await quartersService.createRequest(user.id, {
        cycle_id: activeCycle?.id ?? null,
        request_reason: form.request_reason,
        required_bhk_config: form.required_bhk_config || '',
        preferred_location: form.preferred_location || '',
        move_in_date: form.move_in_date || null,
        family_member_count: form.family_member_count,
        employee_notes: form.employee_notes,
        preferences: prefs.map(p => ({ quarter_id: p.quarter.id, preference_rank: p.rank })),
        ...buildRequestForPayload(),
      });
      await quartersService.updateRequestPreferences(
        req.id,
        prefs.map(p => ({ quarter_id: p.quarter.id, preference_rank: p.rank }))
      );
      await quartersService.submitRequest(req.id);
      addToast('Request submitted successfully', 'success');
      setShowNewModal(false);
      loadData();
    } catch { addToast('Failed to submit request', 'error'); } finally { setSubmitting(false); }
  };

  const handleAcknowledge = async () => {
    if (!selectedRequest?.allotment) return;
    setActionSubmitting(true);
    try {
      await quartersService.acknowledgeAllotment(selectedRequest.allotment.id, selectedRequest.id, actionRemarks);
      addToast('Allotment acknowledged', 'success');
      resetActionForm();
      loadData();
    } catch { addToast('Failed to acknowledge', 'error'); } finally { setActionSubmitting(false); }
  };

  const handleCardAcknowledge = async (req: QuarterRequest) => {
    if (!req.allotment?.id) return;
    setAcceptCardSubmitting(true);
    try {
      await quartersService.acknowledgeAllotment(req.allotment.id, req.id, acceptCardRemarks);
      addToast('Allotment acknowledged', 'success');
      setAcceptCardId(null);
      setAcceptCardRemarks('');
      loadData();
    } catch { addToast('Failed to acknowledge', 'error'); } finally { setAcceptCardSubmitting(false); }
  };

  const handleReject = async () => {
    if (!selectedRequest?.allotment || !actionReason.trim()) { addToast('Please provide a reason', 'warning'); return; }
    setActionSubmitting(true);
    try {
      await quartersService.rejectAllotment(selectedRequest.allotment.id, selectedRequest.id, actionReason, actionDocUrl?.name || undefined);
      addToast('Allotment rejected', 'success');
      resetActionForm();
      loadData();
    } catch { addToast('Failed to reject', 'error'); } finally { setActionSubmitting(false); }
  };

  const handleTenantRequest = async (serviceType: 'EXTEND' | 'UPGRADE' | 'VACATE') => {
    if (!user || !selectedRequest?.allotment) return;
    if (!actionReason.trim()) { addToast('Please provide a reason', 'warning'); return; }
    setActionSubmitting(true);
    try {
      const input: CreateTenantRequestInput = {
        service_type: serviceType, remarks: actionRemarks, reason: actionReason,
        document_url: actionDocUrl?.name || undefined, requested_date: actionDate || null,
        required_bhk_config: actionBhk || undefined,
      };
      await quartersService.createTenantRequest(user.id, selectedRequest.allotment.id, input);
      addToast('Request submitted successfully', 'success');
      resetActionForm();
      loadData();
    } catch { addToast('Failed to submit request', 'error'); } finally { setActionSubmitting(false); }
  };

  const handleWithdraw = async (id: string) => {
    try {
      await quartersService.withdrawRequest(id);
      addToast('Request withdrawn', 'success');
      setSelectedRequest(null);
      loadData();
    } catch { addToast('Failed to withdraw', 'error'); }
  };

  const handleAcceptAllotment = async (req: QuarterRequest) => {
    if (!req.allotment) return;
    try {
      await quartersService.acknowledgeAllotment(req.allotment.id, req.id, '');
      addToast('Allotment accepted', 'success');
      loadData();
    } catch { addToast('Failed to accept allotment', 'error'); }
  };

  const handleDeclineModalSubmit = async (andCancel: boolean) => {
    if (!declineModalReqId || !declineModalRemarks.trim()) {
      addToast('Please provide decline remarks', 'warning'); return;
    }
    const req = requests.find(r => r.id === declineModalReqId);
    if (!req?.allotment) return;
    setDeclineModalSubmitting(true);
    try {
      if (andCancel) {
        await quartersService.declineAndCancelRequest(req.allotment.id, req.id, declineModalRemarks, declineModalDocUrl?.name || undefined);
        addToast('Request cancelled', 'success');
      } else {
        await quartersService.declineAllotment(req.allotment.id, req.id, declineModalRemarks, declineModalDocUrl?.name || undefined);
        addToast('Allotment declined', 'success');
      }
      setDeclineModalReqId(null);
      setDeclineModalRemarks('');
      setDeclineModalDocUrl(null);
      loadData();
    } catch { addToast('Failed to decline allotment', 'error'); } finally { setDeclineModalSubmitting(false); }
  };

  const handleWithdrawTenantReq = async (id: string) => {
    try {
      await quartersService.withdrawTenantRequest(id);
      addToast('Request withdrawn', 'success');
      loadData();
    } catch { addToast('Failed to withdraw', 'error'); }
  };

  // ─── EO: Allot Now (create request + immediately allot) ─────────────────────
  const handleAllotNow = async () => {
    if (!user || !allotNowQuarterId) { addToast('Please select a quarter to allot', 'warning'); return; }
    if (!form.request_reason.trim()) { addToast('Please provide a request reason', 'warning'); return; }
    setAllotNowSubmitting(true);
    try {
      await quartersService.createAndAllotNow(user.id, {
        cycle_id: activeCycle?.id ?? null,
        request_reason: form.request_reason,
        required_bhk_config: form.required_bhk_config || '',
        preferred_location: form.preferred_location || '',
        move_in_date: form.move_in_date || null,
        family_member_count: form.family_member_count,
        employee_notes: form.employee_notes,
        preferences: prefs.map(p => ({ quarter_id: p.quarter.id, preference_rank: p.rank })),
        ...buildRequestForPayload(),
      }, allotNowQuarterId);
      addToast('Quarter allotted immediately', 'success');
      setShowNewModal(false);
      setAllotNowQuarterId(null);
      setAllotNowQuarter(null);
      loadData();
    } catch { addToast('Allot Now failed', 'error'); } finally { setAllotNowSubmitting(false); }
  };

  // Load Allot Now picker quarters
  const loadAllotNowQuarters = useCallback(async () => {
    if (!showAllotNowPicker) return;
    setAllotNowLoading(true);
    try {
      const data = await quartersService.getQuarters({
        occupancy_status: 'AVAILABLE',
        search: allotNowSearch || undefined,
        bhk_config: (user?.bhkEntitlement || form.required_bhk_config) || undefined,
      });
      setAllotNowQuarters(data);
    } catch { addToast('Failed to load quarters', 'error'); } finally { setAllotNowLoading(false); }
  }, [showAllotNowPicker, allotNowSearch, user?.bhkEntitlement, form.required_bhk_config, addToast]);

  useEffect(() => {
    if (showAllotNowPicker) {
      const t = setTimeout(loadAllotNowQuarters, 300);
      return () => clearTimeout(t);
    }
  }, [showAllotNowPicker, allotNowSearch, loadAllotNowQuarters]);

  // ─── EO Employee mode: manual allot ────────────────────────────────────────
  const loadManualAllotQuarters = useCallback(async () => {
    if (!manualAllotPickerOpen) return;
    setManualAllotLoading(true);
    try {
      const data = await quartersService.getQuarters({ occupancy_status: 'AVAILABLE', search: manualAllotSearch || undefined });
      setManualAllotQuarters(data);
    } catch { addToast('Failed to load quarters', 'error'); } finally { setManualAllotLoading(false); }
  }, [manualAllotPickerOpen, manualAllotSearch, addToast]);

  useEffect(() => {
    if (manualAllotPickerOpen) {
      const t = setTimeout(loadManualAllotQuarters, 300);
      return () => clearTimeout(t);
    }
  }, [manualAllotPickerOpen, manualAllotSearch, loadManualAllotQuarters]);

  const handleManualAllot = async (quarterId: string) => {
    if (!user || !selectedRequest) return;
    setManualAllotSubmitting(true);
    try {
      await quartersService.manualAllotRequest(selectedRequest.id, quarterId, user.id);
      addToast('Quarter allotted successfully', 'success');
      setManualAllotPickerOpen(false);
      loadData();
    } catch { addToast('Failed to allot quarter', 'error'); } finally { setManualAllotSubmitting(false); }
  };

  // ─── EO Employee mode: approve/reject tenant request ───────────────────────
  const handleEOActionTR = async (action: 'approve' | 'reject') => {
    if (!eoTrId || !selectedRequest) return;
    if (action === 'reject' && !eoTrNotes.trim()) { addToast('Please provide rejection notes', 'warning'); return; }
    const tr = tenantRequests.find(t => t.id === eoTrId);
    if (!tr) return;
    setEoTrSubmitting(true);
    try {
      if (action === 'approve') {
        await quartersService.approveTenantRequest(eoTrId, selectedRequest.id, tr.service_type, eoTrNotes);
        addToast('Request approved', 'success');
      } else {
        await quartersService.rejectTenantRequest(eoTrId, selectedRequest.id, tr.service_type, eoTrNotes);
        addToast('Request rejected', 'success');
      }
      setEoTrId(null); setEoTrAction(null); setEoTrNotes('');
      loadData();
    } catch { addToast(`Failed to ${action}`, 'error'); } finally { setEoTrSubmitting(false); }
  };

  // ─── inline action popup submit ────────────────────────────────────────────

  const handlePopupSubmit = async () => {
    if (!user || !actionPopup.type || !actionPopup.allotmentId) return;
    setPopupSubmitting(true);
    try {
      if (actionPopup.type === 'INSPECTION') {
        if (!popupInspectorName.trim()) { addToast('Please enter inspector name', 'warning'); setPopupSubmitting(false); return; }
        await quartersService.startInspection(actionPopup.allotmentId, user.id, popupInspectorName.trim() + (popupCondition ? ` — Condition: ${popupCondition}` : '') + (popupRemarks ? ` — ${popupRemarks}` : ''));
        addToast('Inspection started', 'success');
        closeActionPopup();
        loadData();
        return;
      }
      if (actionPopup.type === 'HANDOVER') {
        if (!popupKeyNumber.trim()) { addToast('Please enter key number', 'warning'); setPopupSubmitting(false); return; }
        await quartersService.createHandover(actionPopup.allotmentId, user.id, {
          key_number: popupKeyNumber,
          occupying_deadline: popupHandoverDeadline || '',
          remarks: (popupCondition ? `Condition: ${popupCondition}. ` : '') + (popupRemarks || ''),
        });
        addToast('Handover recorded', 'success');
        closeActionPopup();
        loadData();
        return;
      }
      if (!popupReason.trim() && actionPopup.type !== 'GRIEVANCE') {
        addToast('Please provide a reason', 'warning'); setPopupSubmitting(false); return;
      }
      if (actionPopup.type === 'GRIEVANCE' && !popupSubject.trim()) {
        addToast('Please provide a subject', 'warning'); setPopupSubmitting(false); return;
      }
      const input: CreateTenantRequestInput = {
        service_type: actionPopup.type,
        reason: popupReason,
        remarks: popupRemarks,
        document_url: popupDocUrl?.name || undefined,
        requested_date: popupDate || null,
        grievance_subject: popupSubject || undefined,
        urgency_level: popupUrgency,
      };
      await quartersService.createTenantRequest(user.id, actionPopup.allotmentId, input);
      addToast('Request submitted successfully', 'success');
      closeActionPopup();
      loadData();
    } catch { addToast('Failed to submit request', 'error'); } finally { setPopupSubmitting(false); }
  };

  // ─── EO: Run Allocation cycle ─────────────────────────────────────────────────
  const handleRunAllocation = async () => {
    if (!user) return;
    setRunAllocSubmitting(true);
    try {
      const submitted = requests.filter(r => r.request_status === 'SUBMITTED');
      let cycleId: string | undefined;
      if (runAllocCycleName.trim()) {
        const startDate = runAllocStart || new Date().toISOString().split('T')[0];
        const endDate = runAllocEnd || startDate;
        const cycle = await quartersService.createAllotmentCycle(runAllocCycleName.trim(), startDate, endDate, user.id);
        cycleId = cycle.id;
      }
      const result = await quartersService.runAllocationCycle(user.id, submitted, cycleId);
      addToast(`Allocation complete: ${result.allotted} allotted, ${result.skipped} skipped`, 'success');
      setShowRunAllocationPopup(false);
      setRunAllocCycleName(''); setRunAllocStart(''); setRunAllocEnd('');
      loadData();
    } catch { addToast('Allocation failed', 'error'); } finally { setRunAllocSubmitting(false); }
  };

  // ─── EO: Load cycle history ───────────────────────────────────────────────────
  const loadCycleHistory = async () => {
    setCycleHistoryLoading(true);
    try {
      const cycles = await quartersService.getAllotmentCycles();
      setCycleHistoryList(cycles);
    } catch { addToast('Failed to load cycles', 'error'); } finally { setCycleHistoryLoading(false); }
  };

  const loadCycleDetail = async (cycle: QuarterAllotmentCycle) => {
    setSelectedCycleDetail(cycle);
    setCycleDetailLoading(true);
    try {
      const reqs = await quartersService.getRequestsForCycle(cycle.id);
      setCycleDetailRequests(reqs);
    } catch { addToast('Failed to load cycle requests', 'error'); } finally { setCycleDetailLoading(false); }
  };

  // ─── EO: Allot Requests (bulk, with/without WFL) ───────────────────────────
  const handleAllotRequests = async () => {
    if (!user) return;
    setAllotRequestsSubmitting(true);
    try {
      const allotted = requests.filter(r => isAllottedStatus(r.request_status) && r.allotment?.id);
      const ids = allotted.map(r => r.allotment!.id).filter(Boolean);
      const wflId = allotRequestsWflId === 'none' ? null : allotRequestsWflId;
      await quartersService.submitAllotments(ids, wflId, user.id);
      addToast(`${ids.length} allotments processed`, 'success');
      setShowAllotRequestsPopup(false);
      loadData();
    } catch { addToast('Failed to process allotments', 'error'); } finally { setAllotRequestsSubmitting(false); }
  };

  // Load workflows for Allot Requests popup
  useEffect(() => {
    if (showAllotRequestsPopup) {
      quartersService.getApprovalWorkflows().then(setAllotRequestsWorkflows).catch(() => {});
    }
  }, [showAllotRequestsPopup]);

  // ─── EO: Reject request (DRAFT + sub_status=REJECTED) ─────────────────────
  const handleEORejectRequest = async () => {
    if (!user || !selectedRequest || !eoRejectReason.trim()) {
      addToast('Please provide a rejection reason', 'warning'); return;
    }
    setEoRejectSubmitting(true);
    try {
      await quartersService.eoRejectRequest(selectedRequest.id, user.id, eoRejectReason);
      addToast('Request rejected and sent back to draft', 'success');
      setEoRightMode('detail');
      setEoRejectReason('');
      setSelectedRequest(null);
      loadData();
    } catch { addToast('Failed to reject request', 'error'); } finally { setEoRejectSubmitting(false); }
  };

  // ─── EO: Load approval for selected allotment ─────────────────────────────
  useEffect(() => {
    const allotmentId = selectedRequest?.allotment?.id;
    if (!allotmentId || !(isEO && eoMode === 'employee')) return;
    quartersService.getApprovalForAllotment(allotmentId).then(approval => {
      setApprovalRecord(approval);
      if (approval) {
        quartersService.getApprovalChats(approval.id).then(setApprovalChats).catch(() => {});
      }
    }).catch(() => {});
  }, [selectedRequest?.allotment?.id, isEO, eoMode]);

  // ─── EO: Load inspections for selected allotment ──────────────────────────
  useEffect(() => {
    const allotmentId = selectedRequest?.allotment?.id;
    if (!allotmentId || !(isEO && eoMode === 'employee')) return;
    quartersService.getInspections(allotmentId).then(setInspections).catch(() => {});
  }, [selectedRequest?.allotment?.id, isEO, eoMode]);

  // ─── EO: Load inspection chats ────────────────────────────────────────────
  useEffect(() => {
    if (!selectedInspectionId) return;
    quartersService.getInspectionChats(selectedInspectionId).then(setInspectionChats).catch(() => {});
  }, [selectedInspectionId]);

  // ─── EO: Load handover for selected allotment ─────────────────────────────
  useEffect(() => {
    const allotmentId = selectedRequest?.allotment?.id;
    if (!allotmentId || !(isEO && eoMode === 'employee')) return;
    quartersService.getHandover(allotmentId).then(setHandover).catch(() => {});
  }, [selectedRequest?.allotment?.id, isEO, eoMode]);

  // ─── EO: Load guest info ──────────────────────────────────────────────────
  const loadGuestInfo = useCallback(async () => {
    const allotmentId = selectedRequest?.allotment?.id;
    if (!allotmentId) return;
    setGuestInfoLoading(true);
    try {
      const list = await quartersService.getGuestInfo(allotmentId);
      setGuestInfoList(list);
    } catch {} finally { setGuestInfoLoading(false); }
  }, [selectedRequest?.allotment?.id]);

  useEffect(() => {
    if (showGuestInfoPopup) loadGuestInfo();
  }, [showGuestInfoPopup, loadGuestInfo]);

  // ─── EO: Approve allotment level ──────────────────────────────────────────
  const handleApproveLevel = async () => {
    if (!user || !approvalRecord) return;
    setApprovalSubmitting(true);
    try {
      await quartersService.approveAllotmentLevel(approvalRecord.id, user.id, approvalRemarks);
      addToast('Level approved', 'success');
      setApprovalAction(null);
      setApprovalRemarks('');
      const updated = await quartersService.getApprovalForAllotment(approvalRecord.allotment_id);
      setApprovalRecord(updated);
      if (updated) {
        const chats = await quartersService.getApprovalChats(updated.id);
        setApprovalChats(chats);
      }
      loadData();
    } catch { addToast('Failed to approve', 'error'); } finally { setApprovalSubmitting(false); }
  };

  // ─── EO: Send for clarification ───────────────────────────────────────────
  const handleSendClarification = async () => {
    if (!user || !approvalRecord || !approvalRemarks.trim()) {
      addToast('Please provide clarification remarks', 'warning'); return;
    }
    setApprovalSubmitting(true);
    try {
      await quartersService.sendClarification(approvalRecord.id, approvalTargetLevel, approvalRemarks, user.id);
      addToast('Sent for clarification', 'success');
      setApprovalAction(null);
      setApprovalRemarks('');
      const updated = await quartersService.getApprovalForAllotment(approvalRecord.allotment_id);
      setApprovalRecord(updated);
      if (updated) {
        const chats = await quartersService.getApprovalChats(updated.id);
        setApprovalChats(chats);
      }
    } catch { addToast('Failed to send clarification', 'error'); } finally { setApprovalSubmitting(false); }
  };

  // ─── EO: Start inspection ─────────────────────────────────────────────────
  const handleStartInspection = async () => {
    if (!user || !selectedRequest?.allotment?.id || !inspectionOpeningRemark.trim()) {
      addToast('Please provide opening remarks', 'warning'); return;
    }
    setInspectionSubmitting(true);
    try {
      const insp = await quartersService.startInspection(selectedRequest.allotment.id, user.id, inspectionOpeningRemark);
      addToast('Inspection started', 'success');
      setInspectionOpeningRemark('');
      setInspectionPanel('chat');
      setSelectedInspectionId(insp.id);
      const list = await quartersService.getInspections(selectedRequest.allotment.id);
      setInspections(list);
    } catch { addToast('Failed to start inspection', 'error'); } finally { setInspectionSubmitting(false); }
  };

  // ─── EO: Add inspection chat ──────────────────────────────────────────────
  const handleSendInspectionChat = async () => {
    if (!user || !selectedInspectionId || !inspectionChatMsg.trim()) return;
    try {
      const docUrls: string[] = [];
      if (inspectionChatFile) {
        const url = await uploadChatFile(inspectionChatFile, `inspection-chats/${selectedInspectionId}`);
        if (url) docUrls.push(url);
        setInspectionChatFile(null);
      }
      await quartersService.addInspectionChat(selectedInspectionId, user.id, 'eo', inspectionChatMsg, docUrls);
      setInspectionChatMsg('');
      const chats = await quartersService.getInspectionChats(selectedInspectionId);
      setInspectionChats(chats);
    } catch { addToast('Failed to send message', 'error'); }
  };

  // ─── EO: Close inspection ─────────────────────────────────────────────────
  const handleCloseInspection = async () => {
    if (!selectedInspectionId || !inspectionCloseRemarks.trim()) {
      addToast('Please provide closing remarks', 'warning'); return;
    }
    setInspectionSubmitting(true);
    try {
      await quartersService.closeInspection(selectedInspectionId, inspectionCloseRemarks, inspectionCondition);
      addToast('Inspection closed', 'success');
      setInspectionCloseRemarks('');
      setInspectionPanel('list');
      setSelectedInspectionId(null);
      if (selectedRequest?.allotment?.id) {
        const list = await quartersService.getInspections(selectedRequest.allotment.id);
        setInspections(list);
      }
    } catch { addToast('Failed to close inspection', 'error'); } finally { setInspectionSubmitting(false); }
  };

  // ─── EO: Create handover ──────────────────────────────────────────────────
  const handleCreateHandover = async () => {
    if (!user || !selectedRequest?.allotment?.id || !handoverKeyNo.trim() || !handoverDeadline) {
      addToast('Key number and deadline are required', 'warning'); return;
    }
    setHandoverSubmitting(true);
    try {
      await quartersService.createHandover(selectedRequest.allotment.id, user.id, {
        key_number: handoverKeyNo,
        remarks: handoverRemarks,
        occupying_deadline: handoverDeadline,
        interior_doc_url: handoverInteriorFile?.name,
        inspection_report_url: handoverReportFile?.name,
      });
      addToast('Handover recorded and allotment confirmed', 'success');
      setShowHandoverPopup(false);
      setHandoverKeyNo(''); setHandoverRemarks(''); setHandoverDeadline('');
      setHandoverInteriorFile(null); setHandoverReportFile(null);
      loadData();
    } catch { addToast('Failed to record handover', 'error'); } finally { setHandoverSubmitting(false); }
  };

  // ─── EO: Add guest info ───────────────────────────────────────────────────
  const handleAddGuestInfo = async () => {
    if (!user || !selectedRequest?.allotment?.id || !guestForm.name.trim() || !guestForm.mobile.trim()) {
      addToast('Guest name and mobile are required', 'warning'); return;
    }
    setGuestSubmitting(true);
    try {
      await quartersService.addGuestInfo(selectedRequest.allotment.id, user.id, {
        guest_name: guestForm.name,
        guest_mobile: guestForm.mobile,
        guest_email: guestForm.email,
        aadhaar_doc_url: guestAadhaarFile?.name,
        pan_doc_url: guestPanFile?.name,
        other_doc_urls: guestOtherFiles.map(f => f.name),
      });
      addToast('Guest info added', 'success');
      setGuestForm({ name: '', mobile: '', email: '' });
      setGuestAadhaarFile(null); setGuestPanFile(null); setGuestOtherFiles([]);
      await loadGuestInfo();
    } catch { addToast('Failed to add guest info', 'error'); } finally { setGuestSubmitting(false); }
  };

  // ─── derived counts ─────────────────────────────────────────────────────────

  const statCounts = {
    draft:     requests.filter(r => r.request_status === 'DRAFT').length,
    submitted: requests.filter(r => r.request_status === 'SUBMITTED').length,
    allotted:  requests.filter(r => isAllottedStatus(r.request_status)).length,
    occupied:  requests.filter(r => isOccupiedStatus(r.request_status)).length,
    vacated:   requests.filter(r => r.request_status === 'VACATED').length,
  };

  const ALL_STATUS_CARDS: StatusCard[] = [
    {
      key: 'draft', label: 'Draft Requests', description: 'Not yet submitted',
      count: statCounts.draft,
      gradient: 'from-amber-500 to-yellow-400',
      iconBg: 'bg-amber-100', textColor: 'text-amber-700', countColor: 'text-amber-900',
      icon: <FileText size={20} className="text-amber-600" />,
    },
    {
      key: 'submitted', label: 'Submitted', description: 'Awaiting EO review',
      count: statCounts.submitted,
      gradient: 'from-blue-500 to-sky-400',
      iconBg: 'bg-blue-100', textColor: 'text-blue-700', countColor: 'text-blue-900',
      icon: <Send size={20} className="text-blue-600" />,
    },
    {
      key: 'allotted', label: 'Allotted', description: 'Pending your action',
      count: statCounts.allotted,
      gradient: 'from-emerald-500 to-green-400',
      iconBg: 'bg-emerald-100', textColor: 'text-emerald-700', countColor: 'text-emerald-900',
      icon: <CheckCircle size={20} className="text-emerald-600" />,
    },
    {
      key: 'occupied', label: 'Occupied', description: 'Occupying / Service active',
      count: statCounts.occupied,
      gradient: 'from-teal-500 to-cyan-400',
      iconBg: 'bg-teal-100', textColor: 'text-teal-700', countColor: 'text-teal-900',
      icon: <Home size={20} className="text-teal-600" />,
    },
    {
      key: 'vacated', label: 'Vacated', description: 'Historical records',
      count: statCounts.vacated,
      gradient: 'from-slate-400 to-gray-400',
      iconBg: 'bg-slate-100', textColor: 'text-slate-600', countColor: 'text-slate-700',
      icon: <Building2 size={20} className="text-slate-500" />,
    },
  ];

  // Hide Draft tab in EO employee mode
  const STATUS_CARDS = (isEO && eoMode === 'employee')
    ? ALL_STATUS_CARDS.filter(c => c.key !== 'draft')
    : ALL_STATUS_CARDS;

  // ─── filtered request lists ─────────────────────────────────────────────────

  const filteredRequests = React.useMemo(() => {
    let result = [...requests];

    if (dpFilter === 'draft') result = result.filter(r => r.request_status === 'DRAFT');
    else if (dpFilter === 'submitted') result = result.filter(r => r.request_status === 'SUBMITTED');
    else if (dpFilter === 'allotted') result = result.filter(r => isAllottedStatus(r.request_status));
    else if (dpFilter === 'occupied') result = result.filter(r => isOccupiedStatus(r.request_status));
    else if (dpFilter === 'vacated') result = result.filter(r => r.request_status === 'VACATED');

    if (reqBhkFilter !== 'ALL') result = result.filter(r => r.required_bhk_config?.includes(reqBhkFilter));

    if (reqToiletFilter.length > 0) {
      result = result.filter(r => {
        const quarter = (r.allotment?.quarter as Quarter | undefined) ?? r.preferences?.[0]?.quarter;
        if (!quarter) return false;
        return reqToiletFilter.includes((quarter as Quarter).toilet_type ?? 'Western');
      });
    }

    if (reqFloorFilter.length > 0) {
      result = result.filter(r => {
        const quarter = (r.allotment?.quarter as Quarter | undefined) ?? r.preferences?.[0]?.quarter;
        if (!quarter) return false;
        const floor = (quarter as Quarter).floor_number ?? 0;
        return reqFloorFilter.some(f => f === 4 ? floor >= 4 : floor === f);
      });
    }

    if (reqSearch.trim()) {
      const q = reqSearch.toLowerCase();
      result = result.filter(r =>
        r.request_number?.toLowerCase().includes(q) ||
        r.required_bhk_config?.toLowerCase().includes(q) ||
        r.preferred_location?.toLowerCase().includes(q) ||
        r.on_behalf_employee_name?.toLowerCase().includes(q) ||
        r.on_behalf_employee_dept?.toLowerCase().includes(q) ||
        r.tp_name?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (dpFilter === 'occupied') {
        const rankA = a.request_status === 'ACKNOWLEDGED' ? 0 : 1;
        const rankB = b.request_status === 'ACKNOWLEDGED' ? 0 : 1;
        if (rankA !== rankB) return rankA - rankB;
      }
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return reqSort === 'newest' ? diff : -diff;
    });
    return result;
  }, [requests, dpFilter, reqSearch, reqSort, reqBhkFilter, reqToiletFilter, reqFloorFilter, isEO, eoMode]);

  const selectedPrefs = selectedRequest?.preferences?.sort((a, b) => a.preference_rank - b.preference_rank) ?? [];

  const activeFilterCount = [
    reqBhkFilter !== 'ALL',
    reqSearch.trim().length > 0,
  ].filter(Boolean).length + reqToiletFilter.length + reqFloorFilter.length;

  // ─── helper to open preview modal ──────────────────────────────────────────

  function openQuarterPreview(req: QuarterRequest) {
    const qId = (req.allotment?.quarter as Quarter | undefined)?.id
      ?? (req.preferences?.[0]?.quarter as Quarter | undefined)?.id;
    if (!qId) { addToast('No quarter linked to this request yet', 'info'); return; }
    setPreviewQuarterId(qId);
    setIsPreviewOpen(true);
  }

  // ─── handleDeallocate helper ─────────────────────────────────────────────────

  const handleDeallocate = async (allotmentId: string, requestId: string) => {
    if (!user) return;
    try {
      await quartersService.deallocateRequest(allotmentId, requestId);
      addToast('Deallocated', 'success');
      loadData();
    } catch { addToast('Failed to deallocate', 'error'); }
  };

  // ─── render ──────────────────────────────────────────────────────────────────

  // EO mode selection screen — shown every time before the main dashboard
  if (isEO && eoMode === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600 text-white rounded-2xl shadow-lg mb-4">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Estate Officer Portal</h1>
            <p className="text-gray-500 mt-2 text-sm">How would you like to proceed today?</p>
            {user?.bhkEntitlement && (
              <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-teal-50 border border-teal-200 rounded-full text-xs font-semibold text-teal-700">
                <Bed size={11} /> Cadre Entitlement: {user.bhkEntitlement}
              </div>
            )}
          </div>

          {/* Two mode cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* My Allotments */}
            <button
              onClick={() => setEOMode('self')}
              className="group text-left bg-white rounded-2xl border-2 border-gray-200 hover:border-teal-400 hover:shadow-xl transition-all duration-200 p-7 flex flex-col gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-50 group-hover:bg-teal-600 flex items-center justify-center transition-colors duration-200">
                <Home size={22} className="text-teal-600 group-hover:text-white transition-colors duration-200" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1.5">My Allotments</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Manage your own quarter requests, view allotment status, and submit new requests for yourself or on behalf of others.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-teal-600 text-xs font-semibold mt-auto">
                Continue <ChevronRight size={14} />
              </div>
            </button>

            {/* Employee Allotments */}
            <button
              onClick={() => { setEOMode('employee'); }}
              className="group text-left bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all duration-200 p-7 flex flex-col gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-600 flex items-center justify-center transition-colors duration-200">
                <UserCog size={22} className="text-blue-600 group-hover:text-white transition-colors duration-200" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1.5">Employee Allotments</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Review all employee requests, manually allot quarters, approve or reject tenant services, and manage override actions.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold mt-auto">
                Continue <ChevronRight size={14} />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Full-Screen Request Detail View ──────────────────────────────── */}
      {detailRequest && createPortal(
        <div className="fixed inset-0 z-[900] bg-gray-50 flex flex-col" style={{ fontFamily: 'inherit' }}>
          {(() => {
            const req = detailRequest;
            const allotment = req.allotment;
            const q = allotment?.quarter as Quarter | undefined;
            const reqPrefs = (req.preferences ?? []).sort((a, b) => a.preference_rank - b.preference_rank);
            const sc = statusConfig(req.request_status);
            const rf = req.request_for ?? 'SELF';
            const hasRightData = true; // always true

            // Determine primary action button
            const primaryAction = (() => {
              const s = req.request_status;
              if (s === 'ALLOTTED') return { label: 'Accept Allotment', color: 'bg-emerald-600 hover:bg-emerald-700', icon: <ThumbsUp size={14} /> };
              if (s === 'SUBMITTED') return { label: 'Withdraw', color: 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100', icon: <XCircle size={14} />, outline: true };
              if (s === 'DRAFT') return { label: 'Submit Request', color: 'bg-blue-600 hover:bg-blue-700', icon: <Send size={14} /> };
              return null;
            })();

            return (
              <>
                {/* Header */}
                <div className="flex items-center gap-4 px-6 py-3.5 bg-white border-b border-gray-200 shadow-sm shrink-0">
                  <button
                    onClick={() => { setDetailRequest(null); setDpFilter(detailReturnFilter); }}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
                  >
                    <ArrowLeft size={16} /><span>Back</span>
                  </button>
                  <div className="h-5 w-px bg-gray-200" />
                  <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
                    <span className="font-mono text-sm font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-lg">{req.request_number}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${sc.cls}`}>{sc.icon}{sc.label}</span>
                    {req.sub_status === 'DECLINED' && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">Declined</span>}
                    {/* Request-for badge */}
                    {rf === 'EMPLOYEE' && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1"><UserCheck size={11} />On Behalf</span>}
                    {rf === 'TP' && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"><UserPlus size={11} />Third Party</span>}
                    <span className="text-xs text-gray-400 ml-auto">{fmtDate(req.created_at)}</span>
                  </div>
                  {primaryAction && (
                    <button
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold shrink-0 transition-colors ${primaryAction.color} ${!(primaryAction as { outline?: boolean }).outline ? 'text-white' : ''}`}
                      onClick={() => {
                        setDetailRequest(null);
                        setDpFilter(detailReturnFilter);
                        setSelectedRequest(req);
                        resetActionForm();
                      }}
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
                        {/* Image carousel */}
                        <div className="relative bg-gray-900">
                          <ImageCarousel images={resolveAllImages(q)} className="h-64" />
                          <div className="absolute bottom-3 left-3">
                            <span className="bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-lg backdrop-blur-sm">Allotted Quarter</span>
                          </div>
                        </div>
                        {/* Quarter identity */}
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
                        {/* Specs strip */}
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
                        {/* Feature chips */}
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
                        {/* Location details */}
                        {(q.region || q.district || q.pin_code) && (
                          <div className="px-6 py-3 border-b border-gray-100">
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-2">Location</div>
                            <div className="space-y-1 text-xs text-gray-600">
                              {q.region && <div className="flex items-center gap-1.5"><MapPin size={11} className="text-gray-400 shrink-0" />{q.region}</div>}
                              {q.district && <div className="pl-4 text-gray-500">{q.district}{q.pin_code ? ` · PIN ${q.pin_code}` : ''}</div>}
                            </div>
                          </div>
                        )}
                        {/* Amenities */}
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
                      /* No allotment — show preference list */
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
                                    onClick={() => { setPreviewQuarterId(pq.id); setIsPreviewOpen(true); }}
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

                  {/* ── Right: Request & Allotment details (always shown) ── */}
                  {hasRightData && (
                    <div className="flex-1 overflow-y-auto bg-white">
                      {/* Requester section */}
                      <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Requester</div>
                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                          <div className="w-10 h-10 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                            {(user?.fullName ?? 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900">{user?.fullName ?? '—'}</div>
                            <div className="text-xs text-gray-500">{user?.govtEmployeeId ?? user?.email ?? '—'}</div>
                            {user?.govtDepartment && <div className="text-xs text-gray-400">{user.govtDepartment}</div>}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getRequestForBadgeCls(rf)}`}>
                            {getRequestForLabel(rf)}
                          </span>
                        </div>

                        {/* On-behalf employee */}
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

                        {/* TP info */}
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
                          onClick={() => { setDetailRequest(null); setDpFilter(detailReturnFilter); setSelectedRequest(req); resetActionForm(); }}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-blue-200 text-blue-700 text-sm font-semibold hover:bg-blue-50 transition-colors"
                        >
                          <ExternalLink size={15} />Open in Action Panel
                        </button>
                        <p className="text-[10px] text-gray-400 text-center mt-2">Opens the request in the split-panel view for actions</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>,
        document.body
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col" style={{ height: '100vh' }}>

        {/* ── Compact header ─────────────────────────────────────────── */}
        <div className="flex-none bg-white rounded-xl border border-gray-200 px-4 py-3 mb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1 flex-wrap">
                <button onClick={() => navigate(ROUTES.DASHBOARD)} className="hover:text-blue-600 transition-colors"><Home size={11} /></button>
                <ChevronRight size={10} />
                <button onClick={() => navigate(ROUTES.DASHBOARD)} className="text-gray-500 hover:text-blue-600 transition-colors">My Workspace</button>
                <ChevronRight size={10} />
                <button
                  onClick={() => { setSelectedRequest(null); setDpFilter('allotted'); resetActionForm(); }}
                  className="text-gray-600 font-medium hover:text-blue-600 transition-colors"
                >
                  Quarter Requests
                </button>
                <ChevronRight size={10} />
                <button
                  onClick={() => { setSelectedRequest(null); resetActionForm(); }}
                  className="text-gray-700 font-medium hover:text-blue-600 transition-colors"
                >
                  {DP_LABELS[dpFilter]}
                </button>
                {selectedRequest && (
                  <>
                    <ChevronRight size={10} />
                    <span className="font-mono text-gray-700 font-medium">{selectedRequest.request_number}</span>
                  </>
                )}
              </div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                {isEO && eoMode === 'employee' ? 'Employee Allotments' : 'Quarter Requests'}
              </h1>
            </div>
            <div className="flex gap-2 shrink-0 items-center">
              {isEO && (
                <button
                  onClick={() => { setEOMode(null); setSelectedRequest(null); resetActionForm(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors"
                >
                  <ShieldCheck size={13} /> Switch Mode
                </button>
              )}
              {user && activeCycle && (
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                  <Clock size={11} className="text-blue-500" />
                  {activeCycle.cycle_name} · Closes {new Date(activeCycle.end_date).toLocaleDateString('en-IN')}
                </span>
              )}
              {!(isEO && eoMode === 'employee') && (
                <>
                  <button onClick={() => navigate(ROUTES.QUARTERS_FREEVIEW)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Eye size={13} /> Browse
                  </button>
                  <Button onClick={() => openNewModal()}>
                    <Plus size={13} className="mr-1" /> New Request
                  </Button>
                </>
              )}
              {isEO && eoMode === 'employee' && dpFilter === 'submitted' && (
                <>
                  <button
                    onClick={() => { setShowCycleHistory(true); loadCycleHistory(); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ClipboardList size={13} /> View Runs
                  </button>
                  <button
                    onClick={() => setShowRunAllocationPopup(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <PlayCircle size={13} /> Run Allocation
                  </button>
                </>
              )}
              {isEO && eoMode === 'employee' && dpFilter === 'allotted' && (
                <button
                  onClick={() => setShowAllotRequestsPopup(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <CheckSquare size={13} /> Allot Requests
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Status summary cards (SummaryStatsCard, matches QuarterManagerPage) ── */}
        <div className="flex-none mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {STATUS_CARDS.map((card, idx) => (
              <SummaryStatsCard
                key={card.key}
                label={card.label}
                value={card.count}
                icon={(() => {
                  const iconMap: Record<DPFilter, React.FC<any>> = {
                    all: FileText,
                    draft: FileText,
                    submitted: Send,
                    allotted: CheckCircle,
                    occupied: Home,
                    tenantServices: RefreshCw,
                    vacated: Building2,
                  };
                  return iconMap[card.key];
                })()}
                gradient={`bg-gradient-to-r ${card.gradient}`}
                delay={idx * 50}
                subtitle={card.description}
                isActive={dpFilter === card.key}
                onClick={() => {
                  setDpFilter(card.key);
                  setSelectedRequest(null);
                  resetActionForm();
                  setReqSearch('');
                  setReqBhkFilter('ALL');
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Main content ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 h-64 animate-pulse" />)}
          </div>
        ) : filteredRequests.length === 0 && requests.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">
              {isEO && eoMode === 'employee' ? 'No employee requests found' : 'No quarter requests yet'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {isEO && eoMode === 'employee'
                ? 'Employee allotment requests will appear here once submitted.'
                : 'Create your first request to start the allotment process.'}
            </p>
            {!(isEO && eoMode === 'employee') && (
              <Button onClick={() => openNewModal()}><Plus size={15} className="mr-1" /> New Request</Button>
            )}
          </div>
        ) : (
          <>
            {/* ── Search / Filter / Count — single row ── */}
            <div className="flex-none mb-3 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <MandatorySearchBar
                  fields={[
                    {
                      key: 'search',
                      label: 'Search',
                      type: 'text',
                      placeholder: 'Request no., BHK, location…',
                      value: reqSearch,
                      onChange: setReqSearch,
                      icon: <Search size={14} />,
                    },
                    {
                      key: 'bhk',
                      label: 'BHK Config',
                      type: 'chips',
                      value: reqBhkFilter,
                      onChange: setReqBhkFilter,
                      options: [
                        { value: 'ALL', label: 'Any' },
                        { value: '1BHK', label: '1 BHK' },
                        { value: '2BHK', label: '2 BHK' },
                        { value: '3BHK', label: '3 BHK' },
                        { value: '4BHK', label: '4 BHK' },
                      ],
                    },
                    {
                      key: 'sort',
                      label: 'Sort By',
                      type: 'chips',
                      value: reqSort,
                      onChange: v => setReqSort(v as 'newest' | 'oldest'),
                      options: [
                        { value: 'newest', label: 'Newest' },
                        { value: 'oldest', label: 'Oldest' },
                      ],
                    },
                  ]}
                  filterCount={reqToiletFilter.length + reqFloorFilter.length}
                  onFilterOpen={() => setFilterDrawerOpen(true)}
                />
              </div>
            </div>

          <div className="flex-1 min-h-0 overflow-hidden">
          <SplitLayout
            storageKey="qrSplit"
            defaultSplit={65}
            minLeft={40}
            maxLeft={80}
            onClose={() => setSelectedRequest(null)}
            renderRight={selectedRequest ? (controls) => {
              // In EO employee mode, show EO management right panel
              if (isEO && eoMode === 'employee') return (
                <EOActionPanel
                  selectedRequest={selectedRequest}
                  user={user}
                  isEO={isEO}
                  requests={requests}
                  tenantRequests={tenantRequests}
                  eoRightMode={eoRightMode}
                  setEoRightMode={setEoRightMode}
                  eoRejectReason={eoRejectReason}
                  setEoRejectReason={setEoRejectReason}
                  eoRejectSubmitting={eoRejectSubmitting}
                  handleEORejectRequest={handleEORejectRequest}
                  manualAllotPickerOpen={manualAllotPickerOpen}
                  setManualAllotPickerOpen={setManualAllotPickerOpen}
                  manualAllotSearch={manualAllotSearch}
                  setManualAllotSearch={setManualAllotSearch}
                  manualAllotQuarters={manualAllotQuarters}
                  manualAllotLoading={manualAllotLoading}
                  manualAllotSubmitting={manualAllotSubmitting}
                  handleManualAllot={handleManualAllot}
                  overrideAllotment={overrideAllotment}
                  overrideRequest={overrideRequest}
                  showOverrideModal={showOverrideModal}
                  setOverrideAllotment={setOverrideAllotment}
                  setOverrideRequest={setOverrideRequest}
                  setShowOverrideModal={setShowOverrideModal}
                  loadData={loadData}
                  approvalRecord={approvalRecord}
                  approvalChats={approvalChats}
                  approvalAction={approvalAction}
                  setApprovalAction={setApprovalAction}
                  approvalRemarks={approvalRemarks}
                  setApprovalRemarks={setApprovalRemarks}
                  approvalTargetLevel={approvalTargetLevel}
                  setApprovalTargetLevel={setApprovalTargetLevel}
                  approvalSubmitting={approvalSubmitting}
                  handleApproveLevel={handleApproveLevel}
                  handleSendClarification={handleSendClarification}
                  inspections={inspections}
                  inspectionChats={inspectionChats}
                  selectedInspectionId={selectedInspectionId}
                  setSelectedInspectionId={setSelectedInspectionId}
                  inspectionPanel={inspectionPanel}
                  setInspectionPanel={setInspectionPanel}
                  inspectionOpeningRemark={inspectionOpeningRemark}
                  setInspectionOpeningRemark={setInspectionOpeningRemark}
                  inspectionChatMsg={inspectionChatMsg}
                  setInspectionChatMsg={setInspectionChatMsg}
                  inspectionSubmitting={inspectionSubmitting}
                  inspectionCloseRemarks={inspectionCloseRemarks}
                  setInspectionCloseRemarks={setInspectionCloseRemarks}
                  inspectionCondition={inspectionCondition}
                  setInspectionCondition={setInspectionCondition}
                  handleStartInspection={handleStartInspection}
                  handleSendInspectionChat={handleSendInspectionChat}
                  handleCloseInspection={handleCloseInspection}
                  handover={handover}
                  handoverKeyNo={handoverKeyNo}
                  setHandoverKeyNo={setHandoverKeyNo}
                  handoverRemarks={handoverRemarks}
                  setHandoverRemarks={setHandoverRemarks}
                  handoverDeadline={handoverDeadline}
                  setHandoverDeadline={setHandoverDeadline}
                  handoverInteriorFile={handoverInteriorFile}
                  setHandoverInteriorFile={setHandoverInteriorFile}
                  handoverReportFile={handoverReportFile}
                  setHandoverReportFile={setHandoverReportFile}
                  handoverSubmitting={handoverSubmitting}
                  handleCreateHandover={handleCreateHandover}
                  allotmentChats={allotmentChats}
                  allotmentChatMessage={allotmentChatMessage}
                  setAllotmentChatMessage={setAllotmentChatMessage}
                  allotmentChatFile={allotmentChatFile}
                  setAllotmentChatFile={setAllotmentChatFile}
                  allotmentChatSubmitting={allotmentChatSubmitting}
                  handleSendAllotmentChat={handleSendAllotmentChat}
                  showGuestInfoPopup={showGuestInfoPopup}
                  setShowGuestInfoPopup={setShowGuestInfoPopup}
                  guestForm={guestForm}
                  setGuestForm={setGuestForm}
                  guestAadhaarFile={guestAadhaarFile}
                  setGuestAadhaarFile={setGuestAadhaarFile}
                  guestPanFile={guestPanFile}
                  setGuestPanFile={setGuestPanFile}
                  guestOtherFiles={guestOtherFiles}
                  setGuestOtherFiles={setGuestOtherFiles}
                  guestSubmitting={guestSubmitting}
                  handleAddGuestInfo={handleAddGuestInfo}
                  handleDeallocate={handleDeallocate}
                  panelControls={controls}
                />
              );
              const s = selectedRequest.request_status;
              if (s === 'DRAFT') return <RightPanelDraft panelControls={controls} selectedRequest={selectedRequest} addToast={addToast} loadData={loadData} setSelectedRequest={setSelectedRequest} openNewModal={openNewModal} />;
              if (s === 'SUBMITTED') return <RightPanelSubmitted panelControls={controls} selectedRequest={selectedRequest} user={user} handleWithdraw={handleWithdraw} />;
              if (isAllottedStatus(s)) return (
                <RightPanelAllotted
                  panelControls={controls}
                  selectedRequest={selectedRequest}
                  isEO={isEO}
                  eoMode={eoMode}
                  allotmentChats={allotmentChats}
                  allotmentChatMessage={allotmentChatMessage}
                  setAllotmentChatMessage={setAllotmentChatMessage}
                  allotmentChatFile={allotmentChatFile}
                  setAllotmentChatFile={setAllotmentChatFile}
                  allotmentChatSubmitting={allotmentChatSubmitting}
                  handleSendAllotmentChat={handleSendAllotmentChat}
                  openActionPopup={openActionPopup as any}
                />
              );
              if (isOccupiedStatus(s)) return (
                <RightPanelOccupied
                  panelControls={controls}
                  selectedRequest={selectedRequest}
                  tenantRequests={tenantRequests}
                  serviceChats={serviceChats}
                  selectedServiceId={selectedServiceId}
                  setSelectedServiceId={setSelectedServiceId}
                  servicesHistoryMode={servicesHistoryMode}
                  setServicesHistoryMode={setServicesHistoryMode}
                  chatMessage={chatMessage}
                  setChatMessage={setChatMessage}
                  chatAttachFile={chatAttachFile}
                  setChatAttachFile={setChatAttachFile}
                  chatSubmitting={chatSubmitting}
                  handleSendChat={handleSendChat}
                  handleCloseService={handleCloseService}
                  rightAction={rightAction}
                  setRightAction={setRightAction}
                  actionReason={actionReason}
                  setActionReason={setActionReason}
                  actionRemarks={actionRemarks}
                  setActionRemarks={setActionRemarks}
                  actionDate={actionDate}
                  setActionDate={setActionDate}
                  actionBhk={actionBhk}
                  setActionBhk={setActionBhk}
                  actionDocUrl={actionDocUrl}
                  setActionDocUrl={setActionDocUrl}
                  actionSubmitting={actionSubmitting}
                  resetActionForm={resetActionForm}
                  handleTenantRequest={handleTenantRequest}
                  openActionPopup={openActionPopup as any}
                  setServiceChats={setServiceChats}
                  setPreviewQuarterId={setPreviewQuarterId}
                  setIsPreviewOpen={setIsPreviewOpen}
                />
              );
              return (
                <RightPanelPreferences
                  panelControls={controls}
                  selectedRequest={selectedRequest}
                  selectedPrefs={selectedPrefs}
                  selectedPrefQuarter={selectedPrefQuarter}
                  setSelectedPrefQuarter={setSelectedPrefQuarter}
                  setPreviewQuarterId={setPreviewQuarterId}
                  setIsPreviewOpen={setIsPreviewOpen}
                  openNewModal={openNewModal}
                  addToast={addToast}
                  loadData={loadData}
                />
              );
            } : undefined}
            left={
            <div className="space-y-3 pr-1 pb-6">
              {/* Quarter request cards */}
              {(
                filteredRequests.length === 0 ? (
                  dpFilter === 'allotted' ? (
                    <div className="bg-white rounded-xl border border-gray-200 py-14 text-center px-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-100 border-dashed mb-4">
                        <Building2 size={28} className="text-emerald-300" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-700 mb-2">No Quarter Allocated Yet</h3>
                      <p className="text-xs text-gray-500 leading-relaxed mb-4">
                        Your quarter allocation will appear here once an Estate Officer processes and approves your request.
                      </p>
                      <button onClick={() => setDpFilter('all')} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline">
                        View all requests →
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 py-8 text-center">
                      <Filter size={24} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No requests match this filter.</p>
                      <button onClick={() => { setDpFilter('all'); setReqSearch(''); }} className="mt-2 text-xs text-blue-600 hover:underline">Clear filters</button>
                    </div>
                  )
                ) : filteredRequests.map((req, reqIdx) => {
                  const sc = statusConfig(req.request_status);
                  const isSelected = selectedRequest?.id === req.id;
                  const isOccupied = req.request_status === 'ACKNOWLEDGED';
                  const allottedQ = req.allotment?.quarter as Quarter | undefined;
                  const prefQ = req.preferences?.[0]?.quarter as Quarter | undefined;
                  const thumbQ = allottedQ ?? prefQ;
                  const accentColor = statusAccentColor(req.request_status);
                  const reqFor = req.request_for ?? 'SELF';
                  const activeSvcs = tenantRequests.filter(tr => tr.allotment_id === req.allotment?.id && tr.request_status === 'PENDING');

                  return (
                    <React.Fragment key={req.id}>
                    <div
                      onClick={() => { setSelectedRequest(req); setSelectedServiceId(null); resetActionForm(); }}
                      className={`bg-white rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 ${isSelected ? 'border-blue-400 shadow-lg ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex min-h-[116px]">
                        {/* Left status accent bar */}
                        <div className={`w-1 shrink-0 ${accentColor} rounded-l-xl`} />

                        {/* Thumbnail */}
                        <div
                          className="w-24 shrink-0 relative group/thumb bg-gray-100"
                          onClick={e => { e.stopPropagation(); openQuarterPreview(req); }}
                        >
                          <img
                            src={thumbQ ? getImage(thumbQ, reqIdx) : PLACEHOLDER_IMAGES[reqIdx % PLACEHOLDER_IMAGES.length]}
                            alt=""
                            className="w-full h-full object-cover"
                            style={{ minHeight: 116 }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover/thumb:opacity-100 transition-opacity bg-white/90 rounded-full p-1.5 shadow-md">
                              <Eye size={13} className="text-gray-700" />
                            </div>
                          </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 px-3.5 py-3 min-w-0 flex flex-col justify-between">
                          {/* Row 1: request number + status */}
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-mono text-[11px] font-semibold text-gray-400 tracking-wide">{req.request_number}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {req.sub_status === 'DECLINED' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Declined</span>
                              )}
                              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${sc.cls}`}>{sc.icon}{sc.label}</span>
                            </div>
                          </div>

                          {/* Row 2: primary heading */}
                          <div className="mb-1">
                            <div className="font-bold text-gray-900 text-sm leading-tight truncate">
                              {allottedQ ? allottedQ.quarter_number : (req.required_bhk_config || 'Any BHK')}
                              {allottedQ && <span className="text-gray-500 font-normal ml-1.5">· {allottedQ.bhk_config}</span>}
                            </div>
                            <div className="text-[11px] text-gray-400 truncate mt-0.5">
                              {allottedQ?.address ?? prefQ?.address ?? req.preferred_location ?? 'No location specified'}
                            </div>
                          </div>

                          {/* Row 3: meta chips */}
                          <div className="flex items-center gap-1.5 flex-wrap mb-2">
                            {req.required_bhk_config && !allottedQ && (
                              <span className="text-[10px] bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5">
                                <Bed size={9} />{req.required_bhk_config}
                              </span>
                            )}
                            <span className="text-[10px] bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5">
                              <Users size={9} />Fam: {req.family_member_count ?? 1}
                            </span>
                            <span className="text-[10px] bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5">
                              <Star size={9} />Prefs: {req.preferences?.length ?? 0}
                            </span>
                            {req.move_in_date && (
                              <span className="text-[10px] bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5">
                                <CalendarDays size={9} />{fmtDate(req.move_in_date)}
                              </span>
                            )}
                            {req.employee_notes && (
                              <span className="text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5">
                                <Paperclip size={9} />Note
                              </span>
                            )}
                            {activeSvcs.length > 0 && (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setExpandedSvcsCardId(prev => prev === req.id ? null : req.id);
                                }}
                                className={`relative text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border transition-colors ${expandedSvcsCardId === req.id ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}
                              >
                                <span className="relative flex h-2 w-2 shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                {activeSvcs.length} svc{activeSvcs.length > 1 ? 's' : ''}
                                {expandedSvcsCardId === req.id ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                              </button>
                            )}
                          </div>

                          {/* Row 4: requester + TP + actions */}
                          <div className="flex items-center gap-2 pt-1.5 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <div className="w-5 h-5 rounded-full bg-teal-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                                {(user?.fullName ?? 'U').charAt(0).toUpperCase()}
                              </div>
                              <span className="text-[10px] text-gray-500 font-medium truncate">
                                {user?.fullName ?? 'Me'}{user?.govtEmployeeId ? ` · ${user.govtEmployeeId}` : ''}
                              </span>
                              {reqFor === 'EMPLOYEE' && req.on_behalf_employee_name && (
                                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5 shrink-0">
                                  <UserCheck size={8} />For: {req.on_behalf_employee_name.split(' ')[0]}
                                </span>
                              )}
                              {reqFor === 'TP' && req.tp_name && (
                                <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5 shrink-0">
                                  <UserPlus size={8} />TP: {req.tp_name.split(' ')[0]}
                                </span>
                              )}
                            </div>


                            {/* Inspection + Handover buttons for ALLOTTED cards — Estate Manager only */}
                            {isEO && eoMode === 'employee' && req.request_status === 'ALLOTTED' && req.allotment?.id && (
                              <>
                                <button
                                  onClick={e => { e.stopPropagation(); openActionPopup('INSPECTION', req.id, req.allotment!.id); }}
                                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-semibold hover:bg-blue-100 transition-colors shrink-0"
                                  title="Start Inspection"
                                >
                                  <HardHat size={11} /> Inspect
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); openActionPopup('HANDOVER', req.id, req.allotment!.id); }}
                                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-semibold hover:bg-emerald-100 transition-colors shrink-0"
                                  title="Record Handover"
                                >
                                  <Key size={11} /> Handover
                                </button>
                              </>
                            )}

                            {/* Accept / Decline buttons — Govt Official only, ALLOTTED cards */}
                            {!isEO && req.request_status === 'ALLOTTED' && req.allotment?.id && (
                              <>
                                <button
                                  onClick={e => { e.stopPropagation(); setAcceptCardId(req.id); setAcceptCardRemarks(''); }}
                                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-semibold hover:bg-emerald-700 transition-colors shrink-0"
                                  title="Accept Allotment"
                                >
                                  <ThumbsUp size={11} /> Accept
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); setDeclineModalReqId(req.id); setDeclineModalRemarks(''); setDeclineModalDocUrl(null); }}
                                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-[10px] font-semibold hover:bg-red-100 transition-colors shrink-0"
                                  title="Decline Allotment"
                                >
                                  <ThumbsDown size={11} /> Decline
                                </button>
                              </>
                            )}

                            {/* Expand / collapse icon */}
                            <button
                              onClick={e => { e.stopPropagation(); setExpandedCardId(expandedCardId === req.id ? null : req.id); }}
                              className={`p-1.5 rounded-lg border transition-colors shrink-0 ${expandedCardId === req.id ? 'bg-gray-100 border-gray-300 text-gray-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300'}`}
                              title={expandedCardId === req.id ? 'Collapse' : 'Expand'}
                            >
                              {expandedCardId === req.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>

                            {/* Action menu — hidden for ALLOTTED (handled inline) and terminal statuses */}
                            {!['ALLOTTED', 'VACATED', 'WITHDRAWN', 'REJECTED'].includes(req.request_status) && (
                              <button
                                onClick={e => openMenu(e, req.id)}
                                className={`p-1.5 rounded-lg border transition-colors shrink-0 ${openMenuId === req.id ? 'bg-gray-100 border-gray-300 text-gray-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300'}`}
                                title="Actions"
                              >
                                <MoreVertical size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Inline Accept confirmation form */}
                      {acceptCardId === req.id && (
                        <div
                          className="border-t border-emerald-100 bg-emerald-50/60 px-4 py-3 space-y-2"
                          onClick={e => e.stopPropagation()}
                        >
                          <p className="text-[11px] text-emerald-800 font-semibold uppercase tracking-wide">Confirm Acceptance</p>
                          <textarea
                            value={acceptCardRemarks}
                            onChange={e => setAcceptCardRemarks(e.target.value)}
                            placeholder="Remarks (optional)…"
                            rows={2}
                            className="w-full px-3 py-2 text-[12px] border border-emerald-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 bg-white"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCardAcknowledge(req)}
                              disabled={acceptCardSubmitting}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                              {acceptCardSubmitting ? 'Confirming…' : <><CheckCircle size={12} /> Confirm Accept</>}
                            </button>
                            <button
                              onClick={() => { setAcceptCardId(null); setAcceptCardRemarks(''); }}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Expand/collapse request details */}
                      {expandedCardId === req.id && (
                        <div
                          className="border-t border-gray-100 bg-gray-50/80 px-4 py-3 space-y-3"
                          onClick={e => e.stopPropagation()}
                        >
                          {/* Requester + on-behalf info */}
                          <div className="flex items-start gap-2">
                            <div className="flex-1 flex items-center gap-2 bg-white rounded-lg border border-gray-100 px-3 py-2">
                              <div className="w-7 h-7 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                {(user?.fullName ?? 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-gray-800 leading-tight truncate">{user?.fullName ?? '—'}</div>
                                <div className="text-[10px] text-gray-400">{user?.govtEmployeeId ?? user?.email ?? '—'}</div>
                                {user?.govtDepartment && <div className="text-[10px] text-gray-400">{user.govtDepartment}</div>}
                              </div>
                            </div>
                            {reqFor === 'EMPLOYEE' && req.on_behalf_employee_name && (
                              <div className="flex-1 flex items-center gap-2 bg-blue-50 rounded-lg border border-blue-100 px-3 py-2">
                                <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {req.on_behalf_employee_name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-[9px] font-bold text-blue-400 uppercase tracking-wide">On Behalf</div>
                                  <div className="text-xs font-semibold text-blue-900 truncate">{req.on_behalf_employee_name}</div>
                                  <div className="text-[10px] text-blue-500">{req.on_behalf_employee_id}</div>
                                </div>
                              </div>
                            )}
                            {reqFor === 'TP' && req.tp_name && (
                              <div className="flex-1 flex items-center gap-2 bg-amber-50 rounded-lg border border-amber-100 px-3 py-2">
                                <div className="w-7 h-7 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {req.tp_name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-[9px] font-bold text-amber-500 uppercase tracking-wide">Third Party</div>
                                  <div className="text-xs font-semibold text-amber-900 truncate">{req.tp_name}</div>
                                  <div className="text-[10px] text-amber-600 truncate">{req.tp_organization}</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Key fields grid */}
                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            {req.request_reason && (
                              <div className="col-span-2 bg-white rounded-lg border border-gray-100 px-3 py-2">
                                <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">Reason</div>
                                <div className="font-semibold text-gray-800 leading-snug">{req.request_reason}</div>
                              </div>
                            )}
                            {req.required_bhk_config && (
                              <div className="bg-white rounded-lg border border-gray-100 px-3 py-2">
                                <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">BHK</div>
                                <div className="font-semibold text-gray-800">{req.required_bhk_config}</div>
                              </div>
                            )}
                            {req.preferred_location && (
                              <div className="bg-white rounded-lg border border-gray-100 px-3 py-2">
                                <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">Location</div>
                                <div className="font-semibold text-gray-800 truncate">{req.preferred_location}</div>
                              </div>
                            )}
                            {req.move_in_date && (
                              <div className="bg-white rounded-lg border border-gray-100 px-3 py-2">
                                <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">Move-in</div>
                                <div className="font-semibold text-gray-800">{fmtDate(req.move_in_date)}</div>
                              </div>
                            )}
                            <div className="bg-white rounded-lg border border-gray-100 px-3 py-2">
                              <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">Family</div>
                              <div className="font-semibold text-gray-800">{req.family_member_count ?? 1}</div>
                            </div>
                          </div>

                          {req.employee_notes && (
                            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-[11px]">
                              <div className="text-[9px] text-amber-500 font-bold uppercase tracking-wide mb-0.5">Notes</div>
                              <div className="text-amber-900">{req.employee_notes}</div>
                            </div>
                          )}

                          {/* Occupied: services shortcut */}
                          {isOccupied && (
                            <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-teal-700">Active Services</span>
                                {activeSvcs.length > 0 && (
                                  <span className="text-[10px] bg-teal-600 text-white font-bold px-1.5 py-0.5 rounded-full">{activeSvcs.length}</span>
                                )}
                              </div>
                              <button
                                onClick={() => { setSelectedRequest(req); resetActionForm(); }}
                                className="text-[10px] text-teal-600 font-semibold hover:underline"
                              >
                                View in panel →
                              </button>
                            </div>
                          )}

                          {/* Preference quarters list */}
                          {!isOccupied && (req.preferences ?? []).length > 0 && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Star size={11} className="text-amber-500" />
                                <span className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Preferred Quarters</span>
                                <span className="text-[9px] text-gray-400">({(req.preferences ?? []).length})</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                {(req.preferences ?? [])
                                  .slice()
                                  .sort((a, b) => a.preference_rank - b.preference_rank)
                                  .map((pref) => {
                                    const pq = pref.quarter as Quarter | undefined;
                                    if (!pq) return null;
                                    return (
                                      <div key={pref.id} className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-2.5 py-1.5">
                                        <div className="w-5 h-5 rounded-full bg-slate-700 text-white text-[9px] font-bold flex items-center justify-center shrink-0">{pref.preference_rank}</div>
                                        <div className="flex-1 min-w-0">
                                          <span className="text-[11px] font-semibold text-gray-800">{pq.quarter_number}</span>
                                          <span className="text-[10px] text-gray-400 ml-1.5">{pq.bhk_config}</span>
                                          {pq.address && <div className="text-[10px] text-gray-400 truncate">{pq.address}</div>}
                                        </div>
                                        <span className="text-[10px] font-semibold text-gray-600 shrink-0">{fmtINR(pq.monthly_rent)}/mo</span>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── Service sub-record cards — full card style, shown when svcs badge toggled ── */}
                    {expandedSvcsCardId === req.id && activeSvcs.length > 0 && (
                      <div className="relative ml-4 mt-1 mb-1">
                        {/* Vertical connector line */}
                        <div className="absolute left-0 top-0 bottom-4 w-0.5 bg-teal-200 rounded-full" />
                        <div className="space-y-1.5 pl-5">
                          {activeSvcs.map((svc, svcIdx) => {
                            const stc = serviceTypeConfig(svc.service_type);
                            const tsc = tenantStatusConfig(svc.request_status);
                            const isSvcSelected = selectedServiceId === svc.id && isSelected;
                            const hasSubject = (svc.service_type === 'GRIEVANCE' || svc.service_type === 'MAINTENANCE') && (svc.grievance_subject || svc.remarks);
                            const titleText = (hasSubject ? (svc.grievance_subject || svc.remarks) : svc.reason) || stc.label;
                            const subtitleText = hasSubject && svc.remarks ? svc.remarks : (svc.reason ? svc.reason : '');
                            const ctrlRef = `SVC-${svc.id.slice(-6).toUpperCase()}`;
                            const isLast = svcIdx === activeSvcs.length - 1;

                            // Accent bar color by service type
                            const svcAccent = {
                              GRIEVANCE: 'bg-rose-500',
                              MAINTENANCE: 'bg-slate-400',
                              EXTEND: 'bg-amber-500',
                              UPGRADE: 'bg-sky-500',
                              VACATE: 'bg-orange-500',
                            }[svc.service_type] ?? 'bg-gray-400';

                            // Icon zone background by service type
                            const svcIconBg = {
                              GRIEVANCE: 'bg-rose-50',
                              MAINTENANCE: 'bg-slate-50',
                              EXTEND: 'bg-amber-50',
                              UPGRADE: 'bg-sky-50',
                              VACATE: 'bg-orange-50',
                            }[svc.service_type] ?? 'bg-gray-50';

                            return (
                              <div key={svc.id} className="relative">
                                {/* Horizontal nub */}
                                <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-teal-200 rounded-full" />
                                {/* Junction dot */}
                                <div className={`absolute -left-[22px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 transition-colors ${isSvcSelected ? 'bg-teal-600 border-teal-600' : 'bg-white border-teal-300'}`} />
                                {/* Cap bottom of vertical line at last item */}
                                {isLast && (
                                  <div className="absolute -left-[1px] top-1/2 bottom-0 w-0.5 bg-white" />
                                )}

                                {/* Full record card */}
                                <div
                                  onClick={e => {
                                    e.stopPropagation();
                                    setSelectedRequest(req);
                                    setSelectedServiceId(svc.id);
                                    resetActionForm();
                                  }}
                                  className={`bg-white rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 ${isSvcSelected ? `border-2 shadow-lg ring-2 ${
                                    svc.service_type === 'GRIEVANCE' ? 'border-rose-400 ring-rose-100' :
                                    svc.service_type === 'MAINTENANCE' ? 'border-slate-400 ring-slate-100' :
                                    svc.service_type === 'EXTEND' ? 'border-amber-400 ring-amber-100' :
                                    svc.service_type === 'UPGRADE' ? 'border-sky-400 ring-sky-100' :
                                    'border-orange-400 ring-orange-100'
                                  }` : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                  <div className="flex min-h-[100px]">
                                    {/* Left accent bar */}
                                    <div className={`w-1 shrink-0 ${svcAccent} rounded-l-xl`} />

                                    {/* Icon zone (replaces thumbnail) */}
                                    <div className={`w-14 shrink-0 flex items-center justify-center ${svcIconBg}`}>
                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stc.cls} shadow-sm`}>
                                        <span className="scale-125">{stc.icon}</span>
                                      </div>
                                    </div>

                                    {/* Body */}
                                    <div className="flex-1 px-3 py-2.5 min-w-0 flex flex-col justify-between">
                                      {/* Row 1: ref + status */}
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="font-mono text-[10px] font-semibold text-gray-400 tracking-wide">{ctrlRef}</span>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tsc.cls}`}>{tsc.label}</span>
                                      </div>

                                      {/* Row 2: title + subtitle */}
                                      <div className="mb-1.5">
                                        <div className="font-bold text-gray-900 text-[13px] leading-tight truncate">{titleText}</div>
                                        {subtitleText && titleText !== subtitleText && (
                                          <div className="text-[11px] text-gray-400 truncate mt-0.5">{subtitleText}</div>
                                        )}
                                      </div>

                                      {/* Row 3: meta chips */}
                                      <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold border flex items-center gap-0.5 ${stc.cls}`}>
                                          {stc.icon}<span className="ml-0.5">{stc.label}</span>
                                        </span>
                                        {svc.urgency_level && svc.urgency_level !== 'NORMAL' && svc.urgency_level !== 'LOW' && (
                                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold border ${svc.urgency_level === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                            {svc.urgency_level}
                                          </span>
                                        )}
                                        {svc.requested_date && (
                                          <span className="text-[10px] bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5">
                                            <CalendarDays size={9} />{fmtDate(svc.requested_date)}
                                          </span>
                                        )}
                                        {svc.required_bhk_config && (
                                          <span className="text-[10px] bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5">
                                            <Bed size={9} />{svc.required_bhk_config}
                                          </span>
                                        )}
                                        {svc.document_url && (
                                          <span className="text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5">
                                            <Paperclip size={9} />Doc
                                          </span>
                                        )}
                                        <span className="text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5">
                                          <Clock size={9} />{fmtDate(svc.created_at)}
                                        </span>
                                      </div>

                                      {/* Row 4: actions only */}
                                      <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-gray-100">
                                        {/* Chat button */}
                                        <button
                                          onClick={e => { e.stopPropagation(); setSelectedRequest(req); setSelectedServiceId(svc.id); resetActionForm(); }}
                                          className="p-1 rounded-md border border-teal-200 bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors shrink-0"
                                          title="Open Chat"
                                        >
                                          <MessageSquare size={11} />
                                        </button>
                                        {/* Expand / collapse */}
                                        <button
                                          onClick={e => { e.stopPropagation(); setExpandedSvcDetailId(expandedSvcDetailId === svc.id ? null : svc.id); }}
                                          className={`p-1 rounded-md border transition-colors shrink-0 ${expandedSvcDetailId === svc.id ? 'bg-gray-100 border-gray-300 text-gray-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300'}`}
                                          title={expandedSvcDetailId === svc.id ? 'Collapse' : 'Expand details'}
                                        >
                                          {expandedSvcDetailId === svc.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Expanded detail panel */}
                                  {expandedSvcDetailId === svc.id && (
                                    <div
                                      className="border-t border-gray-100 bg-gray-50/90 px-4 py-3 space-y-2.5"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      {svc.reason && (
                                        <div>
                                          <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5 font-semibold">Reason</div>
                                          <div className="text-[11px] text-gray-800 leading-relaxed">{svc.reason}</div>
                                        </div>
                                      )}
                                      {hasSubject && svc.grievance_subject && (
                                        <div>
                                          <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5 font-semibold">Subject</div>
                                          <div className="text-[11px] text-gray-800 leading-relaxed">{svc.grievance_subject}</div>
                                        </div>
                                      )}
                                      {svc.remarks && (
                                        <div>
                                          <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5 font-semibold">Remarks</div>
                                          <div className="text-[11px] text-gray-700 leading-relaxed">{svc.remarks}</div>
                                        </div>
                                      )}
                                      <div className="grid grid-cols-2 gap-2">
                                        {svc.urgency_level && svc.urgency_level !== 'NORMAL' && (
                                          <div>
                                            <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5 font-semibold">Urgency</div>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border inline-block ${svc.urgency_level === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{svc.urgency_level}</span>
                                          </div>
                                        )}
                                        {svc.requested_date && (
                                          <div>
                                            <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5 font-semibold">
                                              {svc.service_type === 'EXTEND' ? 'Extension Until' : svc.service_type === 'VACATE' ? 'Vacate By' : 'Requested Date'}
                                            </div>
                                            <div className="text-[11px] text-gray-800 flex items-center gap-0.5"><CalendarDays size={10} className="text-gray-400" />{fmtDate(svc.requested_date)}</div>
                                          </div>
                                        )}
                                        {svc.required_bhk_config && (
                                          <div>
                                            <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5 font-semibold">Required BHK</div>
                                            <div className="text-[11px] text-gray-800 flex items-center gap-0.5"><Bed size={10} className="text-gray-400" />{svc.required_bhk_config}</div>
                                          </div>
                                        )}
                                        {svc.document_url && (
                                          <div>
                                            <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5 font-semibold">Document</div>
                                            <a href={svc.document_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-0.5 underline underline-offset-1">
                                              <ExternalLink size={9} />View
                                            </a>
                                          </div>
                                        )}
                                      </div>

                                      {/* EO Approve / Reject actions — only in EO employee mode */}
                                      {isEO && eoMode === 'employee' && svc.request_status === 'PENDING' && (() => {
                                        const isActing = eoTrId === svc.id;
                                        return isActing && eoTrAction ? (
                                          <div className="space-y-2 pt-1 border-t border-gray-200">
                                            <textarea value={eoTrNotes} onChange={e => setEoTrNotes(e.target.value)} rows={2}
                                              placeholder={eoTrAction === 'reject' ? 'Rejection reason (required)…' : 'EO notes (optional)…'}
                                              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none resize-none bg-white text-gray-800" />
                                            <div className="flex gap-2">
                                              <button onClick={() => { setEoTrId(null); setEoTrAction(null); setEoTrNotes(''); }}
                                                className="flex-1 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-white">Cancel</button>
                                              {eoTrAction === 'approve'
                                                ? <button onClick={() => handleEOActionTR('approve')} disabled={eoTrSubmitting}
                                                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50">{eoTrSubmitting ? '…' : 'Approve'}</button>
                                                : <button onClick={() => handleEOActionTR('reject')} disabled={eoTrSubmitting}
                                                    className="flex-1 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold disabled:opacity-50">{eoTrSubmitting ? '…' : 'Reject'}</button>}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex gap-2 pt-1 border-t border-gray-200">
                                            <button onClick={e => { e.stopPropagation(); setEoTrId(svc.id); setEoTrAction('approve'); setEoTrNotes(''); }}
                                              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700">
                                              <ThumbsUp size={11} />Approve
                                            </button>
                                            <button onClick={e => { e.stopPropagation(); setEoTrId(svc.id); setEoTrAction('reject'); setEoTrNotes(''); }}
                                              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700">
                                              <ThumbsDown size={11} />Reject
                                            </button>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    </React.Fragment>
                  );
                })
              )}
            </div>
            }
          />
          </div>

            {/* ── Portal action menu (renders at fixed viewport coords to avoid clipping) */}
            {openMenuId && menuPos && (() => {
              const req = filteredRequests.find(r => r.id === openMenuId);
              if (!req) return null;
              const isOccupied = req.request_status === 'ACKNOWLEDGED';
              return createPortal(
                <div
                  ref={menuRef}
                  style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999, minWidth: 200 }}
                  className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="py-1">
                    {req.request_status === 'DRAFT' && (
                      <button
                        onClick={() => { setOpenMenuId(null); setMenuPos(null); openNewModal(req); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        <span className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center shrink-0"><FileText size={12} className="text-blue-600" /></span>
                        Modify Request
                      </button>
                    )}
                    {req.request_status === 'DRAFT' && (
                      <button
                        onClick={() => { setOpenMenuId(null); setMenuPos(null); /* cancel */ quartersService.cancelRequest(req.id).then(() => { addToast('Request cancelled', 'success'); loadData(); }).catch(() => addToast('Failed', 'error')); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <span className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0"><Trash2 size={12} className="text-red-500" /></span>
                        Cancel Draft
                      </button>
                    )}
                    {req.request_status === 'SUBMITTED' && (
                      <button
                        onClick={() => { setOpenMenuId(null); setMenuPos(null); handleWithdraw(req.id); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <span className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0"><XCircle size={12} className="text-red-500" /></span>
                        Withdraw Request
                      </button>
                    )}
                    {req.request_status === 'UPGRADE_REQUESTED' && req.allotment && (
                      <>
                        <div className="px-4 pt-2 pb-0.5"><span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Allotment</span></div>
                        <button
                          onClick={() => { setOpenMenuId(null); setMenuPos(null); setSelectedRequest(req); resetActionForm(); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0"><ThumbsUp size={12} className="text-emerald-600" /></span>
                          Accept Upgrade
                        </button>
                        <button
                          onClick={() => { setOpenMenuId(null); setMenuPos(null); setSelectedRequest(req); resetActionForm(); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0"><ThumbsDown size={12} className="text-red-500" /></span>
                          Decline Upgrade
                        </button>
                      </>
                    )}
                    {isOccupied && req.allotment && (() => {
                      const menuHasActiveSvc = ['EXTEND_REQUESTED', 'VACATE_REQUESTED'].includes(req.request_status);
                      return (
                        <>
                          <div className="px-4 pt-2 pb-0.5"><span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Services</span></div>
                          {!menuHasActiveSvc ? (
                            <>
                              <button
                                onClick={() => { setOpenMenuId(null); setMenuPos(null); openActionPopup('EXTEND', req.id, req.allotment!.id); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                              >
                                <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center shrink-0"><RefreshCw size={12} className="text-amber-600" /></span>
                                Extend Lease
                              </button>
                              <button
                                onClick={() => { setOpenMenuId(null); setMenuPos(null); setSelectedRequest(req); resetActionForm(); setRightAction('upgrade'); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                              >
                                <span className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center shrink-0"><ArrowRightCircle size={12} className="text-sky-600" /></span>
                                Upgrade Quarter
                              </button>
                              <button
                                onClick={() => { setOpenMenuId(null); setMenuPos(null); openActionPopup('VACATE', req.id, req.allotment!.id); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                              >
                                <span className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center shrink-0"><LogOut size={12} className="text-orange-600" /></span>
                                Vacate Quarter
                              </button>
                            </>
                          ) : (
                            <div className="px-4 py-2 text-[10px] text-orange-600 italic">Extend / Upgrade / Vacate pending EO review</div>
                          )}
                          <button
                            onClick={() => { setOpenMenuId(null); setMenuPos(null); openActionPopup('GRIEVANCE', req.id, req.allotment!.id); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                          >
                            <span className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center shrink-0"><AlertCircle size={12} className="text-rose-600" /></span>
                            Raise Grievance
                          </button>
                          <button
                            onClick={() => { setOpenMenuId(null); setMenuPos(null); openActionPopup('MAINTENANCE', req.id, req.allotment!.id); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                          >
                            <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Wrench size={12} className="text-slate-600" /></span>
                            Maintenance
                          </button>
                          <button
                            onClick={() => { setOpenMenuId(null); setMenuPos(null); navigate(`${ROUTES.QUARTERS_RENT}?allotment_id=${req.allotment!.id}`); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                          >
                            <span className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center shrink-0"><IndianRupee size={12} className="text-teal-600" /></span>
                            Rent Details
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>,
                document.body
              );
            })()}

          </>
        )}
      </main>

      {/* ── Decline Allotment Modal ──────────────────────────────────────── */}
      <DeclineAllotmentModal
        reqId={declineModalReqId}
        remarks={declineModalRemarks}
        docUrl={declineModalDocUrl}
        submitting={declineModalSubmitting}
        onClose={() => { setDeclineModalReqId(null); setDeclineModalRemarks(''); setDeclineModalDocUrl(null); }}
        onRemarksChange={setDeclineModalRemarks}
        onDocChange={setDeclineModalDocUrl}
        onDecline={handleDeclineModalSubmit}
      />

      {/* ── Mobile filter drawer ──────────────────────────────────────── */}
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filters"
        activeFilterCount={activeFilterCount}
        onClearAll={() => { setReqSearch(''); setReqBhkFilter('ALL'); setReqToiletFilter([]); setReqFloorFilter([]); }}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Number, BHK, location…" value={reqSearch} onChange={e => setReqSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">BHK Config</label>
            <div className="flex flex-wrap gap-2">
              {['ALL', '1BHK', '2BHK', '3BHK', '4BHK'].map(v => (
                <button key={v} onClick={() => setReqBhkFilter(v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${reqBhkFilter === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                  {v === 'ALL' ? 'Any' : v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Toilet Type</label>
            <div className="flex flex-wrap gap-2">
              {['Indian', 'Western', 'Both'].map(v => (
                <button key={v} onClick={() => setReqToiletFilter(prev =>
                  prev.includes(v) ? prev.filter(t => t !== v) : [...prev, v]
                )}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${reqToiletFilter.includes(v) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Floor</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 0, label: 'Ground' },
                { value: 1, label: '1st' },
                { value: 2, label: '2nd' },
                { value: 3, label: '3rd' },
                { value: 4, label: '4th+' },
              ].map(({ value, label }) => (
                <button key={value} onClick={() => setReqFloorFilter(prev =>
                  prev.includes(value) ? prev.filter(f => f !== value) : [...prev, value]
                )}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${reqFloorFilter.includes(value) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Sort By</label>
            <div className="space-y-2">
              {[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }].map(({ value, label }) => (
                <button key={value} onClick={() => setReqSort(value as 'newest' | 'oldest')}
                  className={`w-full px-4 py-2.5 rounded-lg text-left text-sm font-medium transition-all ${reqSort === value ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FilterDrawer>

      {/* ── New/Modify Request — Full Screen ─────────────────────────────── */}
      {showNewModal && (
        <Suspense fallback={null}>
          <NewRequestModal
            activeCycle={activeCycle}
            isEO={isEO}
            eoMode={eoMode}
            userRole={user?.role}
            userBhkEntitlement={user?.bhkEntitlement}
            form={form}
            setForm={setForm}
            prefs={prefs}
            addPref={addPref}
            removePref={removePref}
            movePref={movePref}
            modalQuarters={modalQuarters}
            modalSearch={modalSearch}
            setModalSearch={setModalSearch}
            modalLoading={modalLoading}
            modalBhk={modalBhk}
            setModalBhk={setModalBhk}
            modalFurnishing={modalFurnishing}
            setModalFurnishing={setModalFurnishing}
            modalSortBy={modalSortBy}
            setModalSortBy={setModalSortBy}
            modalFilterOpen={modalFilterOpen}
            setModalFilterOpen={setModalFilterOpen}
            modalFilterRef={modalFilterRef}
            requestFor={requestFor}
            setRequestFor={setRequestFor}
            selectedEmployee={selectedEmployee}
            setSelectedEmployee={setSelectedEmployee}
            showEmployeePicker={showEmployeePicker}
            setShowEmployeePicker={setShowEmployeePicker}
            employeeSearch={employeeSearch}
            setEmployeeSearch={setEmployeeSearch}
            employeeDeptFilter={employeeDeptFilter}
            setEmployeeDeptFilter={setEmployeeDeptFilter}
            tpInfo={tpInfo}
            setTpInfo={setTpInfo}
            tpInfoConfirmed={tpInfoConfirmed}
            setTpInfoConfirmed={setTpInfoConfirmed}
            showTPForm={showTPForm}
            setShowTPForm={setShowTPForm}
            tpPopupTab={tpPopupTab}
            setTpPopupTab={setTpPopupTab}
            tpFormDraft={tpFormDraft}
            setTpFormDraft={setTpFormDraft}
            submitting={submitting}
            allotNowSubmitting={allotNowSubmitting}
            showAllotNowPicker={showAllotNowPicker}
            setShowAllotNowPicker={setShowAllotNowPicker}
            allotNowSearch={allotNowSearch}
            setAllotNowSearch={setAllotNowSearch}
            allotNowQuarters={allotNowQuarters}
            allotNowLoading={allotNowLoading}
            allotNowQuarterId={allotNowQuarterId}
            setAllotNowQuarterId={setAllotNowQuarterId}
            allotNowQuarter={allotNowQuarter}
            setAllotNowQuarter={setAllotNowQuarter}
            setPreviewQuarterId={setPreviewQuarterId}
            setIsPreviewOpen={setIsPreviewOpen}
            onClose={() => setShowNewModal(false)}
            onSaveDraft={handleSaveDraft}
            onSubmit={handleSubmit}
            onAllotNow={handleAllotNow}
            addToast={addToast}
          />
        </Suspense>
      )}

      {/* ── Inline Action Popup (Extension / Vacate / Grievance / Maintenance / Inspection / Handover) ── */}
      <ActionPopupModal
        actionPopup={actionPopup}
        onClose={closeActionPopup}
        onSubmit={handlePopupSubmit}
        submitting={popupSubmitting}
        reason={popupReason}
        remarks={popupRemarks}
        docUrl={popupDocUrl}
        date={popupDate}
        subject={popupSubject}
        urgency={popupUrgency}
        inspectorName={popupInspectorName}
        condition={popupCondition}
        keyNumber={popupKeyNumber}
        handoverDeadline={popupHandoverDeadline}
        onReasonChange={setPopupReason}
        onRemarksChange={setPopupRemarks}
        onDocChange={setPopupDocUrl}
        onDateChange={setPopupDate}
        onSubjectChange={setPopupSubject}
        onUrgencyChange={setPopupUrgency}
        onInspectorNameChange={setPopupInspectorName}
        onConditionChange={setPopupCondition}
        onKeyNumberChange={setPopupKeyNumber}
        onHandoverDeadlineChange={setPopupHandoverDeadline}
      />

      {/* ── Quarter Preview Modal ──────────────────────────────────────── */}
      {previewQuarterId && (
        <QuarterDetailModal
          isOpen={isPreviewOpen}
          onClose={() => { setIsPreviewOpen(false); setPreviewQuarterId(null); }}
          quarterId={previewQuarterId}
        />
      )}

      {/* ── Image lightbox (allotted/occupied panel tiles) ─────────────── */}
      {lightboxOpen && (
        <PhotoLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* ── EO: Run Allocation Popup ────────────────────────────────────── */}
      {showRunAllocationPopup && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <PlayCircle size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">Run Allocation Cycle</h3>
                <p className="text-xs text-gray-400 mt-0.5">Auto-allot submitted requests by top-ranked preference</p>
              </div>
              <button onClick={() => setShowRunAllocationPopup(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X size={16} /></button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-xl border border-blue-100 px-3 py-3 text-center">
                  <div className="text-2xl font-bold text-blue-700">{requests.filter(r => r.request_status === 'SUBMITTED').length}</div>
                  <div className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide mt-0.5">Outstanding</div>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-100 px-3 py-3 text-center">
                  <div className="text-xs font-bold text-gray-700 leading-tight">Demo Admin User</div>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">Estate Officer</div>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-100 px-3 py-3 text-center">
                  <div className="text-xs font-bold text-gray-700 leading-tight">{new Date().toLocaleDateString('en-IN')}</div>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">Run Date</div>
                </div>
              </div>

              {/* Cycle Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Cycle Name / Number <span className="text-gray-400 font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={runAllocCycleName}
                  onChange={e => setRunAllocCycleName(e.target.value)}
                  placeholder="e.g. 2025-Q2, Jun Cycle"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Date range */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Cycle Period <span className="text-gray-400 font-normal normal-case">(optional)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-gray-400 mb-1">Start Date</div>
                    <input
                      type="date"
                      value={runAllocStart}
                      onChange={e => setRunAllocStart(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 mb-1">End Date</div>
                    <input
                      type="date"
                      value={runAllocEnd}
                      onChange={e => setRunAllocEnd(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
              </div>

              {/* Info banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700 leading-relaxed">
                <strong>{requests.filter(r => r.request_status === 'SUBMITTED').length} requests</strong> will be auto-allotted using each employee's top-ranked quarter preference. Requests without preferences will be skipped.
                {runAllocCycleName.trim() && (
                  <div className="mt-1.5 text-blue-600">A formal cycle record "<strong>{runAllocCycleName}</strong>" will be created and linked to all allotted requests.</div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowRunAllocationPopup(false); setRunAllocCycleName(''); setRunAllocStart(''); setRunAllocEnd(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >Cancel</button>
                <button
                  onClick={handleRunAllocation}
                  disabled={runAllocSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {runAllocSubmitting ? 'Running…' : 'Run Now'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── EO: Cycle History Popup ──────────────────────────────────────── */}
      {showCycleHistory && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col" style={{ maxHeight: '90vh' }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
              {selectedCycleDetail ? (
                <>
                  <button onClick={() => { setSelectedCycleDetail(null); setCycleDetailRequests([]); }} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                    <ArrowLeft size={16} />
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <ClipboardList size={18} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900">{selectedCycleDetail.cycle_name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(selectedCycleDetail.start_date).toLocaleDateString('en-IN')} – {new Date(selectedCycleDetail.end_date).toLocaleDateString('en-IN')}
                      <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${selectedCycleDetail.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{selectedCycleDetail.status}</span>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <ClipboardList size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900">Allocation Run History</h3>
                    <p className="text-xs text-gray-400 mt-0.5">All allocation cycles run for this estate</p>
                  </div>
                </>
              )}
              <button onClick={() => { setShowCycleHistory(false); setSelectedCycleDetail(null); setCycleDetailRequests([]); }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X size={16} /></button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {!selectedCycleDetail ? (
                /* ── Cycle list ── */
                <div className="p-5">
                  {cycleHistoryLoading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
                    </div>
                  ) : cycleHistoryList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <ClipboardList size={32} className="mb-3 opacity-30" />
                      <div className="text-sm font-semibold">No allocation runs yet</div>
                      <div className="text-xs mt-1">Run your first allocation to see history here</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cycleHistoryList.map(cycle => (
                        <div key={cycle.id} className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:bg-white hover:shadow-sm transition-all cursor-default">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">{cycle.cycle_name}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cycle.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{cycle.status}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {new Date(cycle.start_date).toLocaleDateString('en-IN')} – {new Date(cycle.end_date).toLocaleDateString('en-IN')}
                              <span className="mx-1.5 text-gray-300">·</span>
                              Code: <span className="font-mono text-gray-600">{cycle.cycle_code}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs text-gray-400">Created</div>
                            <div className="text-xs font-medium text-gray-700">{new Date(cycle.created_at).toLocaleDateString('en-IN')}</div>
                          </div>
                          <button
                            onClick={() => loadCycleDetail(cycle)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shrink-0"
                          >
                            <Eye size={12} /> View Details
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* ── Cycle detail table ── */
                <div className="p-5">
                  {cycleDetailLoading ? (
                    <div className="space-y-3">
                      {[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
                    </div>
                  ) : cycleDetailRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <Users size={32} className="mb-3 opacity-30" />
                      <div className="text-sm font-semibold">No requests in this cycle</div>
                    </div>
                  ) : (
                    <>
                      {/* Summary strip */}
                      {(() => {
                        const shown = cycleDetailRequests.filter(r => ['ALLOTTED','ACKNOWLEDGED','REJECTED','VACATED'].includes(r.request_status));
                        return (
                          <div className="grid grid-cols-4 gap-3 mb-5">
                            {[
                              { label: 'Total Requests', value: shown.length, cls: 'bg-blue-50 border-blue-100 text-blue-700' },
                              { label: 'Allocated', value: shown.filter(r => isAllottedStatus(r.request_status)).length, cls: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
                              { label: 'Occupied', value: shown.filter(r => isOccupiedStatus(r.request_status)).length, cls: 'bg-teal-50 border-teal-100 text-teal-700' },
                              { label: 'Declined / Vacated', value: shown.filter(r => ['VACATED','REJECTED'].includes(r.request_status)).length, cls: 'bg-gray-50 border-gray-100 text-gray-600' },
                            ].map(stat => (
                              <div key={stat.label} className={`rounded-xl border px-4 py-3 text-center ${stat.cls}`}>
                                <div className="text-xl font-bold">{stat.value}</div>
                                <div className="text-[10px] font-semibold uppercase tracking-wide mt-0.5 opacity-80">{stat.label}</div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Table */}
                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              {['Request No.','Quarter','Location','Requested By','Request For','Allotted To','Allotted On','Allotted By','Status'].map(col => (
                                <th key={col} className="text-left px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {cycleDetailRequests.filter(r => ['ALLOTTED','ACKNOWLEDGED','REJECTED','VACATED'].includes(r.request_status)).map((req, i) => {
                              const allotment = req.allotment as QuarterAllotment | null | undefined;
                              const quarter = allotment?.quarter as Quarter | undefined;
                              const sc = statusConfig(req.request_status);
                              const reqFor = req.request_for ?? 'SELF';
                              const allottedTo = reqFor === 'EMPLOYEE' ? (req.on_behalf_employee_name ?? 'Employee') : reqFor === 'TP' ? (req.tp_name ?? 'Third Party') : 'Demo Admin User';
                              return (
                                <tr key={req.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                                  <td className="px-3 py-2.5 font-mono text-gray-700 whitespace-nowrap">{req.request_number}</td>
                                  <td className="px-3 py-2.5 whitespace-nowrap">
                                    {quarter ? (
                                      <div>
                                        <div className="font-semibold text-gray-800">{quarter.quarter_number}</div>
                                        <div className="text-[10px] text-gray-400">{req.required_bhk_config}</div>
                                      </div>
                                    ) : <span className="text-gray-400">—</span>}
                                  </td>
                                  <td className="px-3 py-2.5 whitespace-nowrap text-gray-600">
                                    {quarter ? `${(quarter as any).block_name ?? 'Block'}, Sector 3` : '—'}
                                  </td>
                                  <td className="px-3 py-2.5 whitespace-nowrap">
                                    <div className="font-medium text-gray-800">Demo Admin User</div>
                                    <div className="text-[10px] text-gray-400">DEMO001</div>
                                  </td>
                                  <td className="px-3 py-2.5 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getRequestForBadgeCls(reqFor)}`}>{getRequestForLabel(reqFor)}</span>
                                  </td>
                                  <td className="px-3 py-2.5 whitespace-nowrap font-medium text-gray-800">{allottedTo}</td>
                                  <td className="px-3 py-2.5 whitespace-nowrap text-gray-600">
                                    {allotment?.allotment_date ? fmtDate(allotment.allotment_date) : '—'}
                                  </td>
                                  <td className="px-3 py-2.5 whitespace-nowrap text-gray-600">Estate Officer</td>
                                  <td className="px-3 py-2.5 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sc.cls}`}>
                                      {sc.icon}{sc.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── EO: Allot Requests Popup (bulk with/without WFL) ───────────── */}
      {showAllotRequestsPopup && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0"><CheckSquare size={20} className="text-emerald-600" /></div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">Allot Requests</h3>
                <p className="text-xs text-gray-400 mt-0.5">Finalize allotments with or without approval chain</p>
              </div>
              <button onClick={() => setShowAllotRequestsPopup(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-700">
                Finalizing <strong>{requests.filter(r => ['ALLOTTED', 'UPGRADE_REQUESTED'].includes(r.request_status) && r.allotment?.id).length} allotments</strong>. Select an approval workflow to route through approvers, or finalize immediately.
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Approval Workflow (optional)</label>
                <select
                  value={allotRequestsWflId}
                  onChange={e => setAllotRequestsWflId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none"
                >
                  <option value="none">No Workflow — Finalize Immediately</option>
                  {allotRequestsWorkflows.map(wfl => (
                    <option key={wfl.id} value={wfl.id}>{wfl.workflow_name}</option>
                  ))}
                </select>
              </div>
              {allotRequestsWflId !== 'none' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700">
                  Allotments will be sent through the selected approval chain before being finalized.
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setShowAllotRequestsPopup(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleAllotRequests} disabled={allotRequestsSubmitting} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                  {allotRequestsSubmitting ? 'Processing…' : allotRequestsWflId === 'none' ? 'Finalize All' : 'Send for Approval'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── EO: Override modal (globally mounted) ────────────────────────── */}
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
    </div>
  );
};
