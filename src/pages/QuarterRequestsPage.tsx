import React, { useState, useEffect, useCallback, useRef } from 'react';
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

function statusAccentColor(status: string): string {
  if (status === 'DRAFT') return 'bg-amber-400';
  if (status === 'SUBMITTED') return 'bg-blue-500';
  if (status === 'ALLOTTED' || status === 'UPGRADE_REQUESTED') return 'bg-emerald-500';
  if (status === 'ACKNOWLEDGED') return 'bg-teal-500';
  if (status === 'EXTEND_REQUESTED' || status === 'VACATE_REQUESTED') return 'bg-orange-400';
  if (status === 'VACATED' || status === 'WITHDRAWN' || status === 'REJECTED') return 'bg-gray-300';
  return 'bg-gray-300';
}

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80',
];

function getImage(q: Quarter, idx: number) {
  let images = q.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch {
      images = (images as unknown as string).replace(/^\{/, '').replace(/\}$/, '').split(',').map((s: string) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    }
  }
  const first = Array.isArray(images) && images.length > 0 ? images[0] : null;
  return first || PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length];
}

function resolveAllImages(q: Quarter): string[] {
  let images: unknown = q.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images as string); } catch {
      images = (images as string).replace(/^\{/, '').replace(/\}$/, '').split(',').map((s: string) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    }
  }
  if (Array.isArray(images) && (images as string[]).length > 0) return images as string[];
  return PLACEHOLDER_IMAGES;
}

function getOccupancyBadge(status: string) {
  if (status === 'AVAILABLE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'OCCUPIED')  return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

interface QuarterDetailCardProps { quarter: Quarter; compact?: boolean }

const QuarterDetailCard: React.FC<QuarterDetailCardProps> = ({ quarter, compact }) => {
  const images = resolveAllImages(quarter);
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
      <div className={compact ? 'h-44' : 'h-56'}>
        <ImageCarousel images={images} alt={quarter.quarter_number} className="h-full" showFullscreen autoPlay={false} />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-gray-900 text-base leading-tight">{quarter.quarter_number}</h3>
            {quarter.address && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <MapPin size={11} className="flex-shrink-0" /><span className="truncate">{quarter.address}</span>
              </div>
            )}
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${getOccupancyBadge(quarter.occupancy_status)}`}>
            {quarter.occupancy_status === 'AVAILABLE' ? 'Available' : quarter.occupancy_status === 'OCCUPIED' ? 'Occupied' : quarter.occupancy_status}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: <Bed size={13} />,       label: 'Config',   value: quarter.bhk_config },
            { icon: <Ruler size={13} />,     label: 'Area',     value: `${quarter.area_sqft} sq.ft` },
            { icon: <Building2 size={13} />, label: 'Block/Fl', value: `${quarter.block_name || '—'} / ${quarter.floor_number}` },
            { icon: <Layers size={13} />,    label: 'Furnish',  value: quarter.furnishing_status },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
              <div className="flex items-center gap-1 text-gray-400 mb-0.5">{item.icon}<span className="text-[10px] font-medium uppercase tracking-wide">{item.label}</span></div>
              <div className="text-xs font-semibold text-gray-800 truncate">{item.value}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
          <div className="text-xs text-blue-600 font-medium">Monthly Rent</div>
          <div className="font-bold text-gray-900">{fmtINR(quarter.monthly_rent)}</div>
        </div>
        {quarter.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {quarter.amenities.slice(0, 6).map(a => (
              <span key={a} className="text-xs bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-full">{a}</span>
            ))}
            {quarter.amenities.length > 6 && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{quarter.amenities.length - 6}</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full font-medium">{quarter.quarter_type}</span>
          {quarter.block_name && <span className="text-xs text-gray-500">Block {quarter.block_name}</span>}
        </div>
      </div>
    </div>
  );
};

function fmtINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN'); }

function statusConfig(status: string) {
  const cfg: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    DRAFT:              { label: 'Draft',           cls: 'bg-amber-50 text-amber-700 border border-amber-200',    icon: <Clock size={11} /> },
    SUBMITTED:         { label: 'Submitted',        cls: 'bg-blue-50 text-blue-700 border border-blue-200',       icon: <Send size={11} /> },
    ALLOTTED:          { label: 'Allotted',         cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: <CheckCircle size={11} /> },
    ACKNOWLEDGED:      { label: 'Occupied',         cls: 'bg-teal-50 text-teal-700 border border-teal-200',       icon: <ThumbsUp size={11} /> },
    REJECTED:          { label: 'Rejected',         cls: 'bg-red-50 text-red-700 border border-red-200',          icon: <ThumbsDown size={11} /> },
    EXTEND_REQUESTED:  { label: 'Extension Req.',   cls: 'bg-amber-50 text-amber-700 border border-amber-200',    icon: <RefreshCw size={11} /> },
    UPGRADE_REQUESTED: { label: 'Upgrade Req.',     cls: 'bg-sky-50 text-sky-700 border border-sky-200',          icon: <ArrowRightCircle size={11} /> },
    VACATE_REQUESTED:  { label: 'Vacate Req.',      cls: 'bg-orange-50 text-orange-700 border border-orange-200', icon: <LogOut size={11} /> },
    VACATED:           { label: 'Vacated',          cls: 'bg-gray-100 text-gray-500 border border-gray-200',      icon: <XCircle size={11} /> },
    WITHDRAWN:         { label: 'Withdrawn',        cls: 'bg-gray-100 text-gray-500 border border-gray-200',      icon: <XCircle size={11} /> },
    ON_HOLD:           { label: 'On Hold',          cls: 'bg-purple-50 text-purple-700 border border-purple-200', icon: <Clock size={11} /> },
  };
  return cfg[status] ?? cfg.DRAFT;
}

function tenantStatusConfig(status: string) {
  const cfg: Record<string, { label: string; cls: string }> = {
    PENDING:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    APPROVED:  { label: 'Approved',  cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    REJECTED:  { label: 'Rejected',  cls: 'bg-red-50 text-red-700 border border-red-200' },
    WITHDRAWN: { label: 'Withdrawn', cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
  };
  return cfg[status] ?? cfg.PENDING;
}

function serviceTypeConfig(type: string) {
  const cfg: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    EXTEND:      { label: 'Extension',   cls: 'bg-amber-50 text-amber-700 border border-amber-200',    icon: <RefreshCw size={11} /> },
    UPGRADE:     { label: 'Upgrade',     cls: 'bg-sky-50 text-sky-700 border border-sky-200',           icon: <ArrowRightCircle size={11} /> },
    VACATE:      { label: 'Vacate',      cls: 'bg-orange-50 text-orange-700 border border-orange-200',  icon: <LogOut size={11} /> },
    GRIEVANCE:   { label: 'Grievance',   cls: 'bg-rose-50 text-rose-700 border border-rose-200',        icon: <AlertCircle size={11} /> },
    MAINTENANCE: { label: 'Maintenance', cls: 'bg-slate-50 text-slate-700 border border-slate-200',     icon: <Wrench size={11} /> },
  };
  return cfg[type] ?? cfg.EXTEND;
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

type ActionPopupType = 'EXTEND' | 'VACATE' | 'GRIEVANCE' | 'MAINTENANCE' | null;

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

  const [requests, setRequests] = useState<QuarterRequest[]>([]);
  const [tenantRequests, setTenantRequests] = useState<QuarterTenantRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<QuarterRequest | null>(null);
  const [activeCycle, setActiveCycle] = useState<QuarterAllotmentCycle | null>(null);
  const [loading, setLoading] = useState(true);

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
  type EORightMode = 'detail' | 'allot' | 'rejection_chat' | 'override' | 'approval_chat' | 'inspection' | 'handover' | 'guest_info' | 'services';
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

  function resetActionForm() {
    setRightAction(null); setActionRemarks(''); setActionReason('');
    setActionDocUrl(null); setActionDate(''); setActionBhk('');
  }

  // ─── service chat handlers ──────────────────────────────────────────────────

  const handleSendChat = async () => {
    if (!user || !selectedServiceId || !chatMessage.trim()) return;
    setChatSubmitting(true);
    try {
      const docUrls: string[] = [];
      if (chatAttachFile) {
        const ext = chatAttachFile.name.split('.').pop() ?? 'bin';
        const path = `service-chats/${selectedServiceId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('quarter-docs').upload(path, chatAttachFile);
        if (!upErr) {
          const { data: pub } = supabase.storage.from('quarter-docs').getPublicUrl(path);
          if (pub?.publicUrl) docUrls.push(pub.publicUrl);
        }
      }
      await quartersService.addServiceChat(selectedServiceId, user.id, 'EMPLOYEE', chatMessage, docUrls);
      setChatMessage('');
      setChatAttachFile(null);
      const chats = await quartersService.getServiceChats(selectedServiceId);
      setServiceChats(prev => ({ ...prev, [selectedServiceId!]: chats }));
    } catch { addToast('Failed to send message', 'error'); } finally { setChatSubmitting(false); }
  };

  const handleSendAllotmentChat = async () => {
    if (!user || !selectedRequest?.allotment?.id || !allotmentChatMessage.trim()) return;
    const allotmentId = selectedRequest.allotment.id;
    setAllotmentChatSubmitting(true);
    try {
      const docUrls: string[] = [];
      if (allotmentChatFile) {
        const ext = allotmentChatFile.name.split('.').pop() ?? 'bin';
        const path = `allotment-chats/${allotmentId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('quarter-docs').upload(path, allotmentChatFile);
        if (!upErr) {
          const { data: pub } = supabase.storage.from('quarter-docs').getPublicUrl(path);
          if (pub?.publicUrl) docUrls.push(pub.publicUrl);
        }
      }
      await quartersService.addAllotmentChat(allotmentId, user.id, 'employee', allotmentChatMessage, docUrls);
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
    quartersService.getServiceChats(selectedServiceId).then(chats => {
      setServiceChats(prev => ({ ...prev, [selectedServiceId!]: chats }));
    }).catch(() => {});
  }, [selectedServiceId]);

  // Load allotment chats when an allotted request is selected
  useEffect(() => {
    const allotmentId = selectedRequest?.allotment?.id;
    if (!allotmentId || selectedRequest?.request_status !== 'ALLOTTED') return;
    quartersService.getAllotmentChats(allotmentId).then(chats => {
      setAllotmentChats(prev => ({ ...prev, [allotmentId]: chats }));
    }).catch(() => {});
  }, [selectedRequest?.allotment?.id, selectedRequest?.request_status]);

  function openActionPopup(type: ActionPopupType, requestId: string, allotmentId: string) {
    setActionPopup({ type, requestId, allotmentId });
    setPopupReason(''); setPopupRemarks(''); setPopupDocUrl(null);
    setPopupDate(''); setPopupSubject(''); setPopupUrgency('NORMAL');
  }

  function closeActionPopup() {
    setActionPopup({ type: null, requestId: '', allotmentId: '' });
  }

  const loadData = useCallback(async () => {
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
        const hasOccupied = normalised.some((r: any) => ['ACKNOWLEDGED', 'EXTEND_REQUESTED', 'VACATE_REQUESTED'].includes(r.request_status));
        const hasAllotted = normalised.some((r: any) => ['ALLOTTED', 'UPGRADE_REQUESTED'].includes(r.request_status));
        const hasSubmitted = normalised.some((r: any) => r.request_status === 'SUBMITTED');
        setDpFilter(hasOccupied ? 'occupied' : hasAllotted ? 'allotted' : hasSubmitted ? 'submitted' : 'occupied');
      }
    } catch {
      addToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, addToast, isEO, eoMode]);

  useEffect(() => { loadData(); }, [loadData]);

  // Reset EO right mode when selected request changes
  useEffect(() => {
    setEoRightMode('detail');
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
  const handleEOApproveTR = async () => {
    if (!eoTrId || !selectedRequest) return;
    const tr = tenantRequests.find(t => t.id === eoTrId);
    if (!tr) return;
    setEoTrSubmitting(true);
    try {
      await quartersService.approveTenantRequest(eoTrId, selectedRequest.id, tr.service_type, eoTrNotes);
      addToast('Request approved', 'success');
      setEoTrId(null); setEoTrAction(null); setEoTrNotes('');
      loadData();
    } catch { addToast('Failed to approve', 'error'); } finally { setEoTrSubmitting(false); }
  };

  const handleEORejectTR = async () => {
    if (!eoTrId || !selectedRequest || !eoTrNotes.trim()) { addToast('Please provide rejection notes', 'warning'); return; }
    const tr = tenantRequests.find(t => t.id === eoTrId);
    if (!tr) return;
    setEoTrSubmitting(true);
    try {
      await quartersService.rejectTenantRequest(eoTrId, selectedRequest.id, tr.service_type, eoTrNotes);
      addToast('Request rejected', 'success');
      setEoTrId(null); setEoTrAction(null); setEoTrNotes('');
      loadData();
    } catch { addToast('Failed to reject', 'error'); } finally { setEoTrSubmitting(false); }
  };

  // ─── inline action popup submit ────────────────────────────────────────────

  const handlePopupSubmit = async () => {
    if (!user || !actionPopup.type || !actionPopup.allotmentId) return;
    if (!popupReason.trim() && actionPopup.type !== 'GRIEVANCE') {
      addToast('Please provide a reason', 'warning'); return;
    }
    if (actionPopup.type === 'GRIEVANCE' && !popupSubject.trim()) {
      addToast('Please provide a subject', 'warning'); return;
    }
    setPopupSubmitting(true);
    try {
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
      const result = await quartersService.runAllocationCycle(user.id, submitted);
      addToast(`Allocation complete: ${result.allotted} allotted, ${result.skipped} skipped`, 'success');
      setShowRunAllocationPopup(false);
      loadData();
    } catch { addToast('Allocation failed', 'error'); } finally { setRunAllocSubmitting(false); }
  };

  // ─── EO: Allot Requests (bulk, with/without WFL) ───────────────────────────
  const handleAllotRequests = async () => {
    if (!user) return;
    setAllotRequestsSubmitting(true);
    try {
      const allotted = requests.filter(r => ['ALLOTTED', 'UPGRADE_REQUESTED'].includes(r.request_status) && r.allotment?.id);
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
        const path = `inspection-chats/${selectedInspectionId}/${Date.now()}.${inspectionChatFile.name.split('.').pop() ?? 'bin'}`;
        const { error: upErr } = await supabase.storage.from('quarter-docs').upload(path, inspectionChatFile);
        if (!upErr) {
          const { data: pub } = supabase.storage.from('quarter-docs').getPublicUrl(path);
          if (pub?.publicUrl) docUrls.push(pub.publicUrl);
        }
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
    allotted:  requests.filter(r => ['ALLOTTED', 'UPGRADE_REQUESTED'].includes(r.request_status)).length,
    occupied:  requests.filter(r => ['ACKNOWLEDGED', 'EXTEND_REQUESTED', 'VACATE_REQUESTED'].includes(r.request_status)).length,
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
    else if (dpFilter === 'allotted') result = result.filter(r => ['ALLOTTED', 'UPGRADE_REQUESTED'].includes(r.request_status));
    else if (dpFilter === 'occupied') result = result.filter(r => ['ACKNOWLEDGED', 'EXTEND_REQUESTED', 'VACATE_REQUESTED'].includes(r.request_status));
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

  // ─── right panel sections ────────────────────────────────────────────────────

  // Compact quarter identity row — single line, no image
  const CompactQuarterRow = ({ q, accentCls }: { q: Quarter; accentCls: string }) => (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50/70">
      <span className="font-bold text-gray-900 text-xs shrink-0">{q.quarter_number}</span>
      <span className="text-gray-300 text-xs">·</span>
      <span className="text-[10px] font-medium text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded shrink-0">{q.bhk_config}</span>
      <span className="text-[10px] text-gray-500 truncate flex-1 min-w-0">{q.address ?? `Block ${q.block_name}, Fl. ${q.floor_number}`}</span>
      <span className="text-[10px] text-gray-400 shrink-0 hidden sm:inline">{q.area_sqft} sq.ft</span>
      {q.furnishing_status && <span className="text-[10px] text-gray-400 shrink-0 hidden md:inline">{q.furnishing_status}</span>}
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${accentCls}`}>{q.occupancy_status === 'OCCUPIED' ? 'Occupied' : q.occupancy_status === 'AVAILABLE' ? 'Available' : q.occupancy_status}</span>
      <span className="text-xs font-bold text-gray-900 shrink-0">{fmtINR(q.monthly_rent)}<span className="font-normal text-gray-400 text-[10px]">/mo</span></span>
    </div>
  );

  const QuarterSummaryPanel = ({ q }: { q: Quarter }) => {
    const [expanded, setExpanded] = useState(false);

    const boolChip = (val: boolean, label: string, trueColor: string, falseColor: string) =>
      val ? (
        <span key={label} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${trueColor}`}>
          <CheckCircle size={9} /> {label}
        </span>
      ) : (
        <span key={label} className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${falseColor}`}>
          <XCircle size={9} /> {label}
        </span>
      );

    const fieldRow = (label: string, value: string | number | null | undefined) => {
      if (!value && value !== 0) return null;
      return (
        <div key={label} className="flex flex-col">
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide leading-tight">{label}</span>
          <span className="text-xs font-semibold text-gray-800 mt-0.5 leading-snug">{value}</span>
        </div>
      );
    };

    return (
      <div className="px-4 py-3 border-b border-gray-100 bg-white">
        {/* Always-visible primary grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {fieldRow('Unit No.', q.unit_number || q.quarter_number)}
          {fieldRow('Quarter Type', q.quarter_type)}
          {fieldRow('Block', q.block_name)}
          {fieldRow('Floor', q.floor_number > 0 ? `${q.floor_number}${q.total_floors > 0 ? ` of ${q.total_floors}` : ''}` : null)}
          {fieldRow('BHK Config', q.bhk_config)}
          {fieldRow('Housing Style', q.housing_style)}
        </div>

        {/* Location strip */}
        {(q.location_area || q.region || q.district) && (
          <div className="flex items-start gap-1.5 text-xs text-gray-500 mb-3 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            <MapPin size={11} className="text-gray-400 shrink-0 mt-0.5" />
            <span className="leading-snug">
              {[q.location_area, q.district, q.region, q.pin_code].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {/* Financial row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="col-span-1 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
            <div className="text-[10px] text-blue-500 font-medium uppercase tracking-wide">Monthly Rent</div>
            <div className="text-sm font-bold text-blue-900 mt-0.5">{fmtINR(q.monthly_rent)}</div>
          </div>
          {q.electricity_rate > 0 && (
            <div className="bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
              <div className="text-[10px] text-amber-500 font-medium uppercase tracking-wide">Elect. Rate</div>
              <div className="text-xs font-bold text-amber-900 mt-0.5">₹{q.electricity_rate}/unit</div>
            </div>
          )}
          {q.water_charges > 0 && (
            <div className="bg-cyan-50 rounded-lg px-3 py-2 border border-cyan-100">
              <div className="text-[10px] text-cyan-500 font-medium uppercase tracking-wide">Water</div>
              <div className="text-xs font-bold text-cyan-900 mt-0.5">{fmtINR(q.water_charges)}/mo</div>
            </div>
          )}
        </div>

        {/* Feature boolean chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {boolChip(q.balcony, 'Balcony', 'bg-green-50 text-green-700 border-green-200', 'bg-gray-50 text-gray-400 border-gray-200')}
          {boolChip(q.pooja_room, 'Pooja Room', 'bg-orange-50 text-orange-700 border-orange-200', 'bg-gray-50 text-gray-400 border-gray-200')}
          {boolChip(q.lift_access, 'Lift Access', 'bg-teal-50 text-teal-700 border-teal-200', 'bg-gray-50 text-gray-400 border-gray-200')}
          {boolChip(q.power_backup, 'Power Backup', 'bg-yellow-50 text-yellow-700 border-yellow-200', 'bg-gray-50 text-gray-400 border-gray-200')}
          {boolChip(q.kitchen_exhaust, 'Kitchen Exhaust', 'bg-slate-50 text-slate-700 border-slate-200', 'bg-gray-50 text-gray-400 border-gray-200')}
          {q.toilet_western && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-sky-50 text-sky-700 border-sky-200">
              <CheckCircle size={9} /> Western Toilet
            </span>
          )}
          {q.toilet_indian && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-sky-50 text-sky-700 border-sky-200">
              <CheckCircle size={9} /> Indian Toilet
            </span>
          )}
        </div>

        {/* Expandable extra details */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between text-[11px] font-medium text-gray-500 hover:text-gray-700 transition-colors py-1"
        >
          <span>{expanded ? 'Show less' : 'Show all details'}</span>
          <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {/* Additional identity/location fields */}
            <div className="grid grid-cols-2 gap-2">
              {fieldRow('Quota', q.quota)}
              {fieldRow('Counter No.', q.counter_no)}
              {fieldRow('Resident Type', q.resident_type)}
              {fieldRow('Facing', q.facing)}
              {fieldRow('Total Area', q.total_area_sqft > 0 ? `${q.total_area_sqft} sq.ft` : null)}
              {fieldRow('Unit Area', `${q.area_sqft} sq.ft`)}
              {fieldRow('Water Heating', q.water_heating)}
              {fieldRow('Renovation', q.renovation_status)}
              {fieldRow('Elec. Fixtures', q.electrical_fixtures)}
              {fieldRow('Avail. Status', q.current_availability_status || q.occupancy_status)}
            </div>

            {q.parking_details && (
              <div className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">Parking</div>
                <div className="text-xs text-gray-700 leading-relaxed">{q.parking_details}</div>
              </div>
            )}

            {q.penalty_terms && (
              <div className="bg-red-50 rounded-lg px-3 py-2.5 border border-red-100">
                <div className="text-[10px] text-red-400 font-medium uppercase tracking-wide mb-1">Penalty Terms</div>
                <div className="text-xs text-red-800 leading-relaxed">{q.penalty_terms}</div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Unified request summary block shown in all DPs
  const RequestSummaryBlock = ({ req }: { req: QuarterRequest }) => {
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

  const RightPanelAllotted = ({ panelControls }: { panelControls?: React.ReactNode }) => {
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

  const RightPanelOccupied = ({ panelControls }: { panelControls?: React.ReactNode }) => {
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

  const RightPanelDraft = ({ panelControls }: { panelControls?: React.ReactNode }) => {
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

  const RightPanelPreferences = ({ panelControls }: { panelControls?: React.ReactNode }) => (
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
                  key={pref.id}
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

  const RightPanelSubmitted = ({ panelControls }: { panelControls?: React.ReactNode }) => {
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

  const EOEmployeeRightPanel = ({ panelControls }: { panelControls?: React.ReactNode }) => {
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
      { key: 'detail' as EORightMode, label: 'Detail', icon: <FileText size={12} />, show: true },
      { key: 'allot' as EORightMode, label: 'Allot', icon: <Home size={12} />, show: isSubmitted },
      { key: 'rejection_chat' as EORightMode, label: 'Reject', icon: <XCircle size={12} />, show: isSubmitted },
      { key: 'override' as EORightMode, label: 'Override', icon: <RefreshCw size={12} />, show: isAllotted && !!allotment },
      { key: 'approval_chat' as EORightMode, label: 'Approval', icon: <GitMerge size={12} />, show: isAllotted && !!approvalRecord },
      { key: 'inspection' as EORightMode, label: 'Inspection', icon: <HardHat size={12} />, show: isAccepted },
      { key: 'handover' as EORightMode, label: 'Handover', icon: <Key size={12} />, show: isAccepted },
      { key: 'services' as EORightMode, label: 'Services', icon: <Wrench size={12} />, show: isOccupied },
      { key: 'guest_info' as EORightMode, label: 'Guests', icon: <Users size={12} />, show: isOccupied },
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

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Detail tab */}
          {eoRightMode === 'detail' && <RequestSummaryBlock req={req} />}

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

          {/* Inspection tab (ACKNOWLEDGED) */}
          {eoRightMode === 'inspection' && isAccepted && (
            <div className="p-4 space-y-3">
              {inspectionPanel === 'list' && (
                <>
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

          {/* Handover tab (ACKNOWLEDGED) */}
          {eoRightMode === 'handover' && isAccepted && (
            <div className="p-4 space-y-3">
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

          {/* Guest Info tab (OCCUPIED) */}
          {eoRightMode === 'guest_info' && isOccupied && (
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
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rf === 'SELF' ? 'bg-teal-50 text-teal-700' : rf === 'EMPLOYEE' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                            {rf === 'SELF' ? 'Self' : rf === 'EMPLOYEE' ? 'On Behalf' : 'Third Party'}
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
                <button
                  onClick={() => setShowRunAllocationPopup(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <PlayCircle size={13} /> Run Allocation
                </button>
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
              if (isEO && eoMode === 'employee') return <EOEmployeeRightPanel panelControls={controls} />;
              const s = selectedRequest.request_status;
              if (s === 'DRAFT') return <RightPanelDraft panelControls={controls} />;
              if (s === 'SUBMITTED') return <RightPanelSubmitted panelControls={controls} />;
              if (s === 'ALLOTTED' || s === 'UPGRADE_REQUESTED') return <RightPanelAllotted panelControls={controls} />;
              if (s === 'ACKNOWLEDGED' || ['EXTEND_REQUESTED', 'VACATE_REQUESTED'].includes(s)) return <RightPanelOccupied panelControls={controls} />;
              return <RightPanelPreferences panelControls={controls} />;
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
                  const isServiceInProgress = ['EXTEND_REQUESTED', 'VACATE_REQUESTED'].includes(req.request_status);
                  const allottedQ = req.allotment?.quarter as Quarter | undefined;
                  const prefQ = req.preferences?.[0]?.quarter as Quarter | undefined;
                  const thumbQ = allottedQ ?? prefQ;
                  const accentColor = statusAccentColor(req.request_status);
                  const reqFor = req.request_for ?? 'SELF';
                  const activeSvcs = tenantRequests.filter(tr => tr.allotment_id === req.allotment?.id && tr.request_status === 'PENDING');

                  // Sub-group label: show "Services" divider before first EXTEND/VACATE card when in occupied filter
                  const showServicesDivider = dpFilter === 'occupied' && isServiceInProgress &&
                    (reqIdx === 0 || !['EXTEND_REQUESTED', 'VACATE_REQUESTED'].includes(filteredRequests[reqIdx - 1].request_status));

                  return (
                    <React.Fragment key={req.id}>
                    {showServicesDivider && (
                      <div className="flex items-center gap-2 pt-1 pb-0.5">
                        <div className="flex-1 h-px bg-orange-100" />
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1">
                          <RefreshCw size={9} /> Services in Progress
                        </span>
                        <div className="flex-1 h-px bg-orange-100" />
                      </div>
                    )}
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
                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5 border transition-colors ${expandedSvcsCardId === req.id ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}
                              >
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                {activeSvcs.length} svc{activeSvcs.length > 1 ? 's' : ''}
                                {expandedSvcsCardId === req.id ? <ChevronUp size={9} className="ml-0.5" /> : <ChevronDown size={9} className="ml-0.5" />}
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
                                      </div>

                                      {/* Row 4: submitter + date + expand toggle */}
                                      <div className="flex items-center gap-2 pt-1.5 border-t border-gray-100">
                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                          <div className={`w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center shrink-0 ${svcAccent}`}>
                                            {(user?.fullName ?? 'U').charAt(0).toUpperCase()}
                                          </div>
                                          <span className="text-[10px] text-gray-500 font-medium truncate">
                                            {user?.fullName ?? 'Me'}
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-0.5">
                                          <Clock size={9} />{fmtDate(svc.created_at)}
                                        </span>
                                        {/* Expand / collapse — same style as primary card */}
                                        <button
                                          onClick={e => { e.stopPropagation(); setExpandedSvcDetailId(expandedSvcDetailId === svc.id ? null : svc.id); }}
                                          className={`p-1 rounded-md border transition-colors shrink-0 ml-1 ${expandedSvcDetailId === svc.id ? 'bg-gray-100 border-gray-300 text-gray-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300'}`}
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
      {declineModalReqId && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <ThumbsDown size={18} className="text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">Decline Allotment</h3>
                <p className="text-xs text-gray-400 mt-0.5">Your request will return to Submitted status</p>
              </div>
              <button
                onClick={() => { setDeclineModalReqId(null); setDeclineModalRemarks(''); setDeclineModalDocUrl(null); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Decline Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={declineModalRemarks}
                  onChange={e => setDeclineModalRemarks(e.target.value)}
                  rows={4}
                  placeholder="Please state your reason for declining this allotment…"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
                  autoFocus
                />
              </div>
              <DocUpload value={declineModalDocUrl} onChange={setDeclineModalDocUrl} label="Supporting Document" optional />
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex gap-2.5">
              <button
                onClick={() => { setDeclineModalReqId(null); setDeclineModalRemarks(''); setDeclineModalDocUrl(null); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeclineModalSubmit(false)}
                disabled={declineModalSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {declineModalSubmitting ? 'Saving…' : 'Decline'}
              </button>
              <button
                onClick={() => handleDeclineModalSubmit(true)}
                disabled={declineModalSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {declineModalSubmitting ? '…' : 'Decline & Cancel'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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
      {showNewModal && createPortal(
        <div className="fixed inset-0 z-[1000] bg-gray-50 flex flex-col" style={{ fontFamily: 'inherit' }}>
          {/* Header bar */}
          <div className="flex items-center gap-4 px-6 py-3.5 bg-white border-b border-gray-200 shadow-sm shrink-0">
            <button
              onClick={() => setShowNewModal(false)}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-gray-900">New Allotment Request</h1>
              <div className="text-xs text-gray-500">
                {activeCycle ? `Cycle: ${activeCycle.cycle_name} · Closes ${new Date(activeCycle.end_date).toLocaleDateString('en-IN')}` : 'No active cycle — will be saved as draft'}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={handleSaveDraft} disabled={submitting || allotNowSubmitting}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                Save Draft
              </button>
              {/* Submit — not shown for EO TP flow (TP reviews + submits themselves) */}
              {!(isEO && requestFor === 'TP') && (
                <button onClick={handleSubmit} disabled={submitting || allotNowSubmitting || prefs.length === 0}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                  <Send size={14} />Submit Request
                </button>
              )}
              {/* Allot Now — EO only */}
              {isEO && (
                <button
                  onClick={() => setShowAllotNowPicker(true)}
                  disabled={submitting || allotNowSubmitting || !form.request_reason.trim()}
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  title="Allot Now — pick a quarter and allot immediately (VVIP/priority cases)"
                >
                  <Zap size={14} />Allot Now
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">

            {/* ── Top: Request details form (horizontal band) ── */}
            <div className="shrink-0 bg-gray-50 border-b border-gray-200 px-6 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Request Reason <span className="text-red-500">*</span></label>
                  <input value={form.request_reason} onChange={e => setForm(f => ({ ...f, request_reason: e.target.value }))} placeholder="e.g. Transfer-in"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Required BHK</label>
                  <input value={form.required_bhk_config} onChange={e => setForm(f => ({ ...f, required_bhk_config: e.target.value }))} placeholder="e.g. 3 BHK"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Preferred Location</label>
                  <input value={form.preferred_location} onChange={e => setForm(f => ({ ...f, preferred_location: e.target.value }))} placeholder="e.g. Block A"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Preferred Move-in Date</label>
                  <input type="date" value={form.move_in_date} onChange={e => setForm(f => ({ ...f, move_in_date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Family Members</label>
                  <input type="number" min={1} value={form.family_member_count} onChange={e => setForm(f => ({ ...f, family_member_count: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optional)</label>
                  <input value={form.employee_notes} onChange={e => setForm(f => ({ ...f, employee_notes: e.target.value }))} placeholder="Any additional notes"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" />
                </div>
              </div>

              {/* Request For strip — managers, admins, and EOs (My Allotment mode) */}
              {(user?.role === 'manager' || user?.role === 'admin' || (isEO && eoMode === 'self')) && (
                <div className="mt-4 flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 shrink-0">
                    <Users size={13} className="text-teal-600" />
                    <span className="text-xs font-bold text-gray-700">Request For</span>
                  </div>
                  {/* Segmented control */}
                  <div className="flex rounded-xl border border-gray-200 bg-white p-1 gap-1 shrink-0">
                    {([
                      { value: 'SELF', label: 'Self', icon: <User size={12} /> },
                      { value: 'EMPLOYEE', label: 'Another Employee', icon: <UserCheck size={12} /> },
                      { value: 'TP', label: 'Third Party', icon: <UserPlus size={12} /> },
                    ] as { value: RequestForType; label: string; icon: React.ReactNode }[]).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setRequestFor(opt.value);
                          if (opt.value === 'EMPLOYEE') { setShowEmployeePicker(true); }
                          if (opt.value === 'TP') { setTpFormDraft({ ...tpInfo }); setShowTPForm(true); }
                        }}
                        className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${requestFor === opt.value ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                      >
                        {opt.icon}{opt.value === 'TP' ? 'Third Party' : opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Employee preview — inline */}
                  {requestFor === 'EMPLOYEE' && (
                    selectedEmployee ? (
                      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {selectedEmployee.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-blue-900 truncate">{selectedEmployee.name}</div>
                          <div className="text-[10px] text-blue-500">{selectedEmployee.id} · {selectedEmployee.dept}</div>
                        </div>
                        <button onClick={() => setShowEmployeePicker(true)} className="text-[10px] text-blue-600 font-semibold hover:underline shrink-0">Change</button>
                        <button onClick={() => { setSelectedEmployee(null); setRequestFor('SELF'); }} className="p-0.5 text-blue-400 hover:text-blue-600 transition-colors"><X size={12} /></button>
                      </div>
                    ) : (
                      <button onClick={() => setShowEmployeePicker(true)}
                        className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 text-xs font-medium hover:bg-blue-50 transition-colors">
                        <UserCheck size={13} />Select Employee
                      </button>
                    )
                  )}

                  {/* TP preview — inline */}
                  {requestFor === 'TP' && (
                    tpInfoConfirmed && tpInfo.name ? (
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {tpInfo.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-amber-900 truncate">{tpInfo.name}</div>
                          <div className="text-[10px] text-amber-600 truncate">{tpInfo.organization}</div>
                        </div>
                        <button onClick={() => { setTpFormDraft({ ...tpInfo }); setShowTPForm(true); }} className="text-[10px] text-amber-700 font-semibold hover:underline shrink-0">Edit</button>
                      </div>
                    ) : (
                      <button onClick={() => { setTpFormDraft({ name: '', organization: '', mobile: '', email: '', pan: '', notes: '' }); setShowTPForm(true); }}
                        className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border-2 border-dashed border-amber-300 text-amber-600 text-xs font-medium hover:bg-amber-50 transition-colors">
                        <UserPlus size={13} />Enter Third Party Details
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* ── Bottom: 2-column search + preferences ── */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-0">

            {/* ── Col A: Available quarters search ── */}
            <div className="flex flex-col border-r border-gray-200 min-h-0 bg-white">
              <div className="px-4 pt-4 pb-3 border-b border-gray-200 bg-white shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Search size={15} className="text-gray-500" />Available Quarters
                    <span className="text-xs font-normal text-gray-400">({modalQuarters.length})</span>
                  </h2>
                  {/* Filter icon + popup */}
                  <div className="relative" ref={modalFilterRef}>
                    <button
                      onClick={() => setModalFilterOpen(v => !v)}
                      className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                        (modalBhk || modalFurnishing || modalSortBy)
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Filter size={13} />
                      Filters
                      {(modalBhk || modalFurnishing || modalSortBy) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 absolute -top-0.5 -right-0.5" />
                      )}
                    </button>

                    {modalFilterOpen && (
                      <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-4 space-y-4">
                        {/* BHK */}
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">BHK</div>
                          <div className="flex flex-wrap gap-1.5">
                            {['', '1 BHK', '2 BHK', '4 BHK'].map(v => (
                              <button key={v} onClick={() => setModalBhk(v)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                  modalBhk === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                }`}>
                                {v || 'Any'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Furnishing */}
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Furnishing</div>
                          <div className="flex flex-wrap gap-1.5">
                            {['', 'Furnished', 'Semi-Furnished', 'Unfurnished'].map(v => (
                              <button key={v} onClick={() => setModalFurnishing(v)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                  modalFurnishing === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                }`}>
                                {v || 'Any'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Sort */}
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sort by</div>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { value: '', label: 'Default' },
                              { value: 'rent_asc', label: 'Rent ↑' },
                              { value: 'rent_desc', label: 'Rent ↓' },
                            ].map(({ value, label }) => (
                              <button key={value} onClick={() => setModalSortBy(value)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                  modalSortBy === value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                }`}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                          <button onClick={() => { setModalBhk(''); setModalFurnishing(''); setModalSortBy(''); }}
                            className="text-xs text-gray-500 hover:text-gray-800 transition-colors">
                            Clear all
                          </button>
                          <button onClick={() => setModalFilterOpen(false)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={modalSearch} onChange={e => setModalSearch(e.target.value)} placeholder="Search by number, block, address…"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  click <span className="font-medium text-blue-700">Add</span> to add preference
                  {(modalBhk || modalFurnishing || modalSortBy) && (
                    <span className="ml-2 text-blue-600 font-medium">· filters active</span>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {modalLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)
                ) : modalQuarters.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-16">
                    <Building2 size={32} className="mb-2 opacity-30" />
                    <p className="text-sm">No available quarters found</p>
                    <p className="text-xs mt-1">Try adjusting your search</p>
                  </div>
                ) : (
                  modalQuarters.map((q, i) => (
                    <div key={q.id} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all">
                      <img
                        src={getImage(q, i)} alt=""
                        className="w-14 h-14 rounded-lg object-cover shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all"
                        title="View quarter details"
                        onClick={e => { e.stopPropagation(); setPreviewQuarterId(q.id); setIsPreviewOpen(true); }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm">{q.quarter_number}</div>
                        <div className="text-xs text-gray-500 truncate">{q.address || `${q.block_name} Block`}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                          <span className="flex items-center gap-0.5"><Bed size={10} />{q.bhk_config}</span>
                          <span><Ruler size={10} className="inline mr-0.5" />{q.area_sqft} sq.ft</span>
                          <span className="font-semibold text-gray-800">{fmtINR(q.monthly_rent)}</span>
                        </div>
                      </div>
                      <button onClick={() => addPref(q)} disabled={prefs.length >= 5 || !!prefs.find(p => p.quarter.id === q.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
                        {prefs.find(p => p.quarter.id === q.id) ? 'Added' : <><Plus size={11} className="inline" /> Add</>}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── Col B: My Preferences ── */}
            <div className="flex flex-col min-h-0 bg-gray-50">
              <div className="px-4 pt-4 pb-3 border-b border-gray-200 bg-white shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Star size={15} className="text-amber-500" />My Preferences
                  </h2>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${prefs.length >= 5 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {prefs.length} / 5
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Reorder using arrows · Priority = rank order</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {prefs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-16">
                    <Star size={32} className="mb-2 opacity-20" />
                    <p className="text-sm font-medium">No preferences yet</p>
                    <p className="text-xs mt-1">Add quarters from the middle panel</p>
                  </div>
                ) : (
                  prefs.map((p, i) => (
                    <div key={p.quarter.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all">
                      <div className="relative shrink-0">
                        <img
                          src={getImage(p.quarter, i)} alt=""
                          className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all"
                          title="View quarter details"
                          onClick={e => { e.stopPropagation(); setPreviewQuarterId(p.quarter.id); setIsPreviewOpen(true); }}
                        />
                        <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center shadow">{p.rank}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">{p.quarter.quarter_number}</div>
                        <div className="text-xs text-gray-500 truncate">{p.quarter.bhk_config} · {fmtINR(p.quarter.monthly_rent)}/mo</div>
                        {p.quarter.address && <div className="text-[10px] text-gray-400 truncate">{p.quarter.address}</div>}
                      </div>
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button onClick={() => movePref(i, 'up')} disabled={i === 0}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded hover:bg-gray-100 transition-colors"><ArrowUp size={12} /></button>
                        <button onClick={() => movePref(i, 'down')} disabled={i === prefs.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded hover:bg-gray-100 transition-colors"><ArrowDown size={12} /></button>
                        <button onClick={() => removePref(p.quarter.id)}
                          className="p-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            </div>{/* end bottom 2-col grid */}
          </div>{/* end body flex-col */}

          {/* ── Employee Picker popup ─────────────────────── */}
          {showEmployeePicker && (() => {
            const depts = Array.from(new Set(DEMO_EMPLOYEES.map(e => e.dept)));
            const filtered = DEMO_EMPLOYEES.filter(e => {
              const matchDept = !employeeDeptFilter || e.dept === employeeDeptFilter;
              const q = employeeSearch.trim().toLowerCase();
              const matchSearch = !q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.dept.toLowerCase().includes(q) || e.designation.toLowerCase().includes(q);
              return matchDept && matchSearch;
            });
            return (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col" style={{ maxHeight: '85vh' }}>
                  {/* Header */}
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <UserCheck size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900">Select Employee</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Request will be raised on behalf of selected employee</p>
                    </div>
                    <button onClick={() => { setShowEmployeePicker(false); setEmployeeSearch(''); setEmployeeDeptFilter(''); }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} /></button>
                  </div>

                  {/* Currently selected banner */}
                  {selectedEmployee && (
                    <div className="mx-4 mt-3 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{selectedEmployee.name.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-blue-900">{selectedEmployee.name}</div>
                        <div className="text-[10px] text-blue-500">{selectedEmployee.id} · {selectedEmployee.dept}</div>
                      </div>
                      <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full shrink-0">Selected</span>
                    </div>
                  )}

                  {/* Search bar */}
                  <div className="px-4 pt-3 pb-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input value={employeeSearch} onChange={e => setEmployeeSearch(e.target.value)}
                        placeholder="Search by name, ID, or designation…"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" autoFocus />
                    </div>
                  </div>

                  {/* Dept filter chips */}
                  <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => setEmployeeDeptFilter('')}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${!employeeDeptFilter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}
                    >All</button>
                    {depts.map(d => (
                      <button key={d} onClick={() => setEmployeeDeptFilter(d === employeeDeptFilter ? '' : d)}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${employeeDeptFilter === d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}
                      >{d.replace('Ministry of ', 'Min. ')}</button>
                    ))}
                  </div>

                  {/* Count */}
                  <div className="px-4 pb-1.5">
                    <span className="text-[10px] text-gray-400 font-medium">{filtered.length} employee{filtered.length !== 1 ? 's' : ''} found</span>
                  </div>

                  {/* Employee list */}
                  <div className="flex-1 overflow-y-auto border-t border-gray-100 divide-y divide-gray-50">
                    {filtered.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Search size={24} className="mb-2 opacity-30" />
                        <p className="text-sm">No employees match your search</p>
                      </div>
                    ) : filtered.map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => { setSelectedEmployee(emp); setRequestFor('EMPLOYEE'); setShowEmployeePicker(false); setEmployeeSearch(''); setEmployeeDeptFilter(''); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left group ${selectedEmployee?.id === emp.id ? 'bg-blue-50' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-xl text-white text-sm font-bold flex items-center justify-center shrink-0 transition-colors ${selectedEmployee?.id === emp.id ? 'bg-blue-600' : 'bg-gray-200 text-gray-600 group-hover:bg-blue-500 group-hover:text-white'}`}>
                          {emp.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{emp.name}</span>
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{emp.id}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{emp.designation}</div>
                          <div className="text-[10px] text-gray-400 truncate">{emp.dept} · {emp.email}</div>
                        </div>
                        {selectedEmployee?.id === emp.id
                          ? <CheckCircle size={16} className="text-blue-600 shrink-0" />
                          : <div className="w-4 h-4 rounded-full border-2 border-gray-200 group-hover:border-blue-400 transition-colors shrink-0" />
                        }
                      </button>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-2xl">
                    <span className="text-xs text-gray-400">Only one employee can be selected</span>
                    <button onClick={() => { setShowEmployeePicker(false); setEmployeeSearch(''); setEmployeeDeptFilter(''); }}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40"
                      disabled={!selectedEmployee}>Done</button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Allot Now: Quarter Picker overlay (EO only) ── */}
          {showAllotNowPicker && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col" style={{ maxHeight: '85vh' }}>
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                    <Zap size={18} className="text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900">Select Quarter to Allot Now</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {user?.bhkEntitlement ? `Cadre: ${user.bhkEntitlement} · ` : ''}Showing available quarters
                    </p>
                  </div>
                  <button onClick={() => setShowAllotNowPicker(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} /></button>
                </div>

                {allotNowQuarter && (
                  <div className="mx-4 mt-3 flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5">
                    <div className="w-8 h-8 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      <Home size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-teal-900">{allotNowQuarter.quarter_number}</div>
                      <div className="text-[10px] text-teal-500">{allotNowQuarter.bhk_config} · {fmtINR(allotNowQuarter.monthly_rent)}/mo</div>
                    </div>
                    <span className="text-[10px] font-bold bg-teal-600 text-white px-2 py-0.5 rounded-full shrink-0">Selected</span>
                  </div>
                )}

                <div className="px-4 pt-3 pb-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={allotNowSearch} onChange={e => setAllotNowSearch(e.target.value)}
                      placeholder="Search quarter number, block…"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20" autoFocus />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto border-t border-gray-100 divide-y divide-gray-50 px-2 py-1">
                  {allotNowLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl m-2 animate-pulse" />)
                  ) : allotNowQuarters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Building2 size={24} className="mb-2 opacity-30" />
                      <p className="text-sm">No available quarters found</p>
                    </div>
                  ) : allotNowQuarters.map((q, i) => (
                    <button
                      key={q.id}
                      onClick={() => { setAllotNowQuarterId(q.id); setAllotNowQuarter(q); }}
                      className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-teal-50 transition-colors text-left group rounded-xl ${allotNowQuarterId === q.id ? 'bg-teal-50' : ''}`}
                    >
                      <img src={getImage(q, i)} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900">{q.quarter_number}</div>
                        <div className="text-xs text-gray-500 truncate">{q.address || `${q.block_name} Block`}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                          <span className="flex items-center gap-0.5"><Bed size={10} />{q.bhk_config}</span>
                          <span className="font-semibold text-gray-800">{fmtINR(q.monthly_rent)}/mo</span>
                        </div>
                      </div>
                      {allotNowQuarterId === q.id
                        ? <CheckCircle size={16} className="text-teal-600 shrink-0" />
                        : <div className="w-4 h-4 rounded-full border-2 border-gray-200 group-hover:border-teal-400 transition-colors shrink-0" />
                      }
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                  <button onClick={() => setShowAllotNowPicker(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-white transition-colors">Cancel</button>
                  <button
                    onClick={async () => { setShowAllotNowPicker(false); await handleAllotNow(); }}
                    disabled={!allotNowQuarterId || allotNowSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                    <Zap size={14} />{allotNowSubmitting ? 'Allotting…' : 'Confirm Allot Now'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TP Info form popup ─────────────────────────── */}
          {showTPForm && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col" style={{ maxHeight: '90vh' }}>
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <UserPlus size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900">Third Party Beneficiary</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Pick from the list or enter details manually</p>
                  </div>
                  <button onClick={() => { setShowTPForm(false); if (!tpInfoConfirmed) setRequestFor('SELF'); }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} /></button>
                </div>

                {/* Tabs */}
                <div className="px-5 pt-4 shrink-0">
                  <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
                    <button
                      onClick={() => setTpPopupTab('quick')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${tpPopupTab === 'quick' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <Users size={13} />Quick Select
                    </button>
                    <button
                      onClick={() => setTpPopupTab('manual')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${tpPopupTab === 'manual' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <FileText size={13} />Enter Manually
                    </button>
                  </div>
                </div>

                {/* Quick Select grid */}
                {tpPopupTab === 'quick' && (
                  <div className="flex-1 overflow-y-auto px-5 pt-3 pb-4 min-h-0">
                    <p className="text-[10px] text-gray-400 mb-3 font-medium uppercase tracking-wide">Select a third-party profile — fields will be pre-filled and can be edited</p>
                    <div className="grid grid-cols-1 gap-2">
                      {DEMO_TP_PROFILES.map(tp => {
                        const isSelected = tpFormDraft.name === tp.name && tpFormDraft.email === tp.email;
                        const typeColors: Record<string, string> = {
                          Consultant: 'bg-blue-50 text-blue-700 border-blue-200',
                          Contractor: 'bg-green-50 text-green-700 border-green-200',
                          NGO: 'bg-teal-50 text-teal-700 border-teal-200',
                          Guest: 'bg-amber-50 text-amber-700 border-amber-200',
                        };
                        return (
                          <button
                            key={tp.id}
                            onClick={() => {
                              setTpFormDraft({ name: tp.name, organization: tp.organization, mobile: tp.mobile, email: tp.email, pan: tp.pan, notes: '' });
                              setTpPopupTab('manual');
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:shadow-sm ${isSelected ? 'border-amber-300 bg-amber-50' : 'border-gray-100 bg-white hover:border-amber-200 hover:bg-amber-50/40'}`}
                          >
                            <div className={`w-10 h-10 rounded-xl text-sm font-bold flex items-center justify-center shrink-0 ${isSelected ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                              {tp.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-semibold text-gray-900">{tp.name}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${typeColors[tp.type] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>{tp.type}</span>
                              </div>
                              <div className="text-xs text-gray-500 truncate">{tp.organization}</div>
                              <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-400">
                                <span className="flex items-center gap-0.5"><Phone size={9} />{tp.mobile}</span>
                                <span className="flex items-center gap-0.5 truncate"><Mail size={9} />{tp.email}</span>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-amber-500 bg-amber-500' : 'border-gray-200'}`}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Manual entry form */}
                {tpPopupTab === 'manual' && (
                  <div className="flex-1 overflow-y-auto px-5 pt-4 pb-2 min-h-0">
                    {tpFormDraft.name && (
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
                        <div className="w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0">{tpFormDraft.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-amber-900">{tpFormDraft.name}</div>
                          <div className="text-[10px] text-amber-600 truncate">{tpFormDraft.organization}</div>
                        </div>
                        <button onClick={() => setTpFormDraft({ name: '', organization: '', mobile: '', email: '', pan: '', notes: '' })} className="p-0.5 text-amber-400 hover:text-amber-600 transition-colors"><X size={12} /></button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name <span className="text-red-500">*</span></label>
                        <input value={tpFormDraft.name} onChange={e => setTpFormDraft(d => ({ ...d, name: e.target.value }))} placeholder="Enter full name"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Organization <span className="text-red-500">*</span></label>
                        <input value={tpFormDraft.organization} onChange={e => setTpFormDraft(d => ({ ...d, organization: e.target.value }))} placeholder="Organization / Ministry / Company"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Mobile <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input value={tpFormDraft.mobile} onChange={e => setTpFormDraft(d => ({ ...d, mobile: e.target.value }))} placeholder="10-digit mobile"
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">PAN # <span className="text-gray-400 font-normal">(optional)</span></label>
                        <div className="relative">
                          <CreditCard size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input value={tpFormDraft.pan} onChange={e => setTpFormDraft(d => ({ ...d, pan: e.target.value.toUpperCase() }))} placeholder="ABCDE1234F"
                            maxLength={10}
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 uppercase" />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="email" value={tpFormDraft.email} onChange={e => setTpFormDraft(d => ({ ...d, email: e.target.value }))} placeholder="email@example.com"
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                        <textarea value={tpFormDraft.notes} onChange={e => setTpFormDraft(d => ({ ...d, notes: e.target.value }))} placeholder="Any additional info about this third party…" rows={2}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer actions */}
                <div className="flex gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0">
                  <button onClick={() => { setShowTPForm(false); if (!tpInfoConfirmed) setRequestFor('SELF'); }}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-white transition-colors">Cancel</button>
                  {tpPopupTab === 'quick' ? (
                    <button onClick={() => setTpPopupTab('manual')}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5">
                      <FileText size={14} />Enter Manually
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (!tpFormDraft.name.trim() || !tpFormDraft.organization.trim() || !tpFormDraft.mobile.trim() || !tpFormDraft.email.trim()) {
                          addToast('Please fill in all required fields', 'warning'); return;
                        }
                        setTpInfo({ ...tpFormDraft });
                        setTpInfoConfirmed(true);
                        setRequestFor('TP');
                        setShowTPForm(false);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5">
                      <CheckCircle size={14} />Confirm Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* ── Inline Action Popup (Extension / Vacate / Grievance / Maintenance) ── */}
      <Modal
        isOpen={!!actionPopup.type}
        onClose={closeActionPopup}
        size="sm"
        noPadding={false}
      >
        {actionPopup.type && (() => {
          const typeLabels: Record<string, { title: string; color: string; icon: React.ReactNode }> = {
            EXTEND:      { title: 'Extension Request',    color: 'text-amber-700',  icon: <RefreshCw size={16} className="text-amber-600" /> },
            VACATE:      { title: 'Vacate Request',       color: 'text-rose-700',   icon: <LogOut size={16} className="text-rose-600" /> },
            GRIEVANCE:   { title: 'Raise Grievance',      color: 'text-slate-700',  icon: <AlertCircle size={16} className="text-slate-600" /> },
            MAINTENANCE: { title: 'Maintenance Request',  color: 'text-teal-700',   icon: <Wrench size={16} className="text-teal-600" /> },
          };
          const cfg = typeLabels[actionPopup.type];
          const isGrievance = actionPopup.type === 'GRIEVANCE';
          const isMaintenance = actionPopup.type === 'MAINTENANCE';
          const hasDate = actionPopup.type === 'EXTEND' || actionPopup.type === 'VACATE';

          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                {cfg.icon}
                <h3 className={`text-base font-bold ${cfg.color}`}>{cfg.title}</h3>
              </div>

              {isGrievance && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Subject *</label>
                  <input value={popupSubject} onChange={e => setPopupSubject(e.target.value)} placeholder="Brief subject of your grievance"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500/20" />
                </div>
              )}

              {isMaintenance && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Urgency Level</label>
                  <div className="flex gap-2">
                    {(['LOW', 'NORMAL', 'HIGH'] as const).map(u => (
                      <button key={u} onClick={() => setPopupUrgency(u)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          popupUrgency === u
                            ? u === 'HIGH' ? 'bg-red-600 text-white border-red-600' : u === 'LOW' ? 'bg-gray-600 text-white border-gray-600' : 'bg-teal-600 text-white border-teal-600'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}>
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isGrievance ? 'Description *' : 'Reason *'}
                </label>
                <textarea value={popupReason} onChange={e => setPopupReason(e.target.value)} rows={3}
                  placeholder={isGrievance ? 'Describe your grievance in detail…' : isMaintenance ? 'Describe the issue…' : 'Reason for this request…'}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Remarks (optional)</label>
                <input value={popupRemarks} onChange={e => setPopupRemarks(e.target.value)} placeholder="Additional remarks…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>

              {hasDate && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {actionPopup.type === 'EXTEND' ? 'Extension Until Date' : 'Intended Vacate Date'}
                  </label>
                  <div className="relative">
                    <CalendarDays size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="date" value={popupDate} onChange={e => setPopupDate(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                </div>
              )}

              <DocUpload value={popupDocUrl} onChange={setPopupDocUrl} label="Document" optional />

              <div className="flex gap-3 pt-1">
                <button onClick={closeActionPopup} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handlePopupSubmit} disabled={popupSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {popupSubmitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><PlayCircle size={20} className="text-blue-600" /></div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">Run Allocation Cycle</h3>
                <p className="text-xs text-gray-400 mt-0.5">Auto-allot all submitted requests by top preference</p>
              </div>
              <button onClick={() => setShowRunAllocationPopup(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700 leading-relaxed">
                This will allot <strong>{requests.filter(r => r.request_status === 'SUBMITTED').length} submitted requests</strong> using each employee's top-ranked quarter preference. Requests without preferences will be skipped.
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowRunAllocationPopup(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleRunAllocation} disabled={runAllocSubmitting} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {runAllocSubmitting ? 'Running…' : 'Run Now'}
                </button>
              </div>
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
