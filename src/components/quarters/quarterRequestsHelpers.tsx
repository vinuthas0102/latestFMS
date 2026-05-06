import React from 'react';
import {
  Clock, Send, CheckCircle, ThumbsUp, ThumbsDown, RefreshCw, ArrowRightCircle,
  LogOut, XCircle, AlertCircle, Wrench,
  Bed, Ruler, Building2, MapPin, Layers, CheckSquare,
} from 'lucide-react';
import { ImageCarousel } from '../ui/ImageCarousel';
import { Quarter } from '../../services/quartersService';

// ─── demo data ─────────────────────────────────────────────────────────────────

export const DEMO_EMPLOYEES = [
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

export const DEMO_TP_PROFILES = [
  { id: 'TP-001', name: 'Arjun Mehta',       organization: 'Tata Consultancy Services',   mobile: '9810001001', email: 'arjun.mehta@tcs.com',          pan: 'ARJPM1234A', type: 'Consultant' },
  { id: 'TP-002', name: 'Divya Krishnan',    organization: 'Infosys Ltd.',                mobile: '9820002002', email: 'divya.k@infosys.com',           pan: 'DIVKR5678B', type: 'Contractor' },
  { id: 'TP-003', name: 'Sanjay Bose',       organization: 'NASSCOM Foundation',          mobile: '9830003003', email: 's.bose@nasscom.org',            pan: 'SNJBS9012C', type: 'NGO' },
  { id: 'TP-004', name: 'Nisha Agarwal',     organization: 'World Bank India',            mobile: '9840004004', email: 'n.agarwal@worldbank.org',       pan: 'NSHAG3456D', type: 'Guest' },
  { id: 'TP-005', name: 'Karan Malhotra',    organization: 'L&T Infrastructure',         mobile: '9850005005', email: 'k.malhotra@lnt.com',            pan: 'KRNML7890E', type: 'Contractor' },
  { id: 'TP-006', name: 'Rekha Venkatesh',   organization: 'UNICEF India',               mobile: '9860006006', email: 'r.venkatesh@unicef.org',        pan: 'RKHVN2345F', type: 'NGO' },
  { id: 'TP-007', name: 'Amit Joshi',        organization: 'Ernst & Young LLP',          mobile: '9870007007', email: 'a.joshi@ey.com',                pan: 'AMTJS6789G', type: 'Consultant' },
  { id: 'TP-008', name: 'Sunaina Kapoor',    organization: 'FICCI',                      mobile: '9880008008', email: 's.kapoor@ficci.in',             pan: 'SNKPR1230H', type: 'Guest' },
];

// ─── types ─────────────────────────────────────────────────────────────────────

export type DPFilter = 'all' | 'draft' | 'submitted' | 'allotted' | 'occupied' | 'tenantServices' | 'vacated';

export const DP_LABELS: Record<DPFilter, string> = {
  all: 'All Requests',
  draft: 'Draft Requests',
  submitted: 'Submitted',
  allotted: 'Allotted',
  occupied: 'Occupied',
  tenantServices: 'Tenant Services',
  vacated: 'Vacated',
};

export interface PrefItem { quarter: Quarter; rank: number }

export interface NewRequestForm {
  request_reason: string; required_bhk_config: string; preferred_location: string;
  move_in_date: string; family_member_count: number; employee_notes: string;
}

export const DEFAULT_FORM: NewRequestForm = {
  request_reason: '', required_bhk_config: '', preferred_location: '',
  move_in_date: '', family_member_count: 1, employee_notes: '',
};

export interface StatusCard {
  key: DPFilter; label: string; description: string;
  count: number;
  gradient: string; iconBg: string; textColor: string; countColor: string;
  icon: React.ReactNode;
}

export type ActionPopupType = 'EXTEND' | 'VACATE' | 'GRIEVANCE' | 'MAINTENANCE' | null;

export interface ActionPopupState {
  type: ActionPopupType;
  requestId: string;
  allotmentId: string;
}

export type RequestForType = 'SELF' | 'EMPLOYEE' | 'TP';

export interface DemoEmployee {
  id: string;
  name: string;
  dept: string;
  email: string;
  designation: string;
}

export interface TPInfo {
  name: string;
  organization: string;
  mobile: string;
  email: string;
  pan: string;
  notes: string;
}

// ─── pure helpers ──────────────────────────────────────────────────────────────

export function statusAccentColor(status: string): string {
  if (status === 'DRAFT') return 'bg-amber-400';
  if (status === 'SUBMITTED') return 'bg-blue-500';
  if (status === 'ALLOTTED' || status === 'UPGRADE_REQUESTED') return 'bg-emerald-500';
  if (status === 'ACKNOWLEDGED') return 'bg-teal-500';
  if (status === 'EXTEND_REQUESTED' || status === 'VACATE_REQUESTED') return 'bg-orange-400';
  if (status === 'VACATED' || status === 'WITHDRAWN' || status === 'REJECTED') return 'bg-gray-300';
  return 'bg-gray-300';
}

export const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80',
];

export function getImage(q: Quarter, idx: number) {
  let images = q.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch {
      images = (images as unknown as string).replace(/^\{/, '').replace(/\}$/, '').split(',').map((s: string) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    }
  }
  const first = Array.isArray(images) && images.length > 0 ? images[0] : null;
  return first || PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length];
}

export function resolveAllImages(q: Quarter): string[] {
  let images: unknown = q.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images as string); } catch {
      images = (images as string).replace(/^\{/, '').replace(/\}$/, '').split(',').map((s: string) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    }
  }
  if (Array.isArray(images) && (images as string[]).length > 0) return images as string[];
  return PLACEHOLDER_IMAGES;
}

export function getOccupancyBadge(status: string) {
  if (status === 'AVAILABLE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'OCCUPIED')  return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

export function fmtINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN'); }

export function statusConfig(status: string) {
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

export function tenantStatusConfig(status: string) {
  const cfg: Record<string, { label: string; cls: string }> = {
    PENDING:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    APPROVED:  { label: 'Approved',  cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    REJECTED:  { label: 'Rejected',  cls: 'bg-red-50 text-red-700 border border-red-200' },
    WITHDRAWN: { label: 'Withdrawn', cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
  };
  return cfg[status] ?? cfg.PENDING;
}

export function serviceTypeConfig(type: string) {
  const cfg: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    EXTEND:      { label: 'Extension',   cls: 'bg-amber-50 text-amber-700 border border-amber-200',    icon: <RefreshCw size={11} /> },
    UPGRADE:     { label: 'Upgrade',     cls: 'bg-sky-50 text-sky-700 border border-sky-200',           icon: <ArrowRightCircle size={11} /> },
    VACATE:      { label: 'Vacate',      cls: 'bg-orange-50 text-orange-700 border border-orange-200',  icon: <LogOut size={11} /> },
    GRIEVANCE:   { label: 'Grievance',   cls: 'bg-rose-50 text-rose-700 border border-rose-200',        icon: <AlertCircle size={11} /> },
    MAINTENANCE: { label: 'Maintenance', cls: 'bg-slate-50 text-slate-700 border border-slate-200',     icon: <Wrench size={11} /> },
  };
  return cfg[type] ?? cfg.EXTEND;
}

// ─── stateless display components ─────────────────────────────────────────────

interface QuarterDetailCardProps { quarter: Quarter; compact?: boolean }

export const QuarterDetailCard: React.FC<QuarterDetailCardProps> = ({ quarter, compact }) => {
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

export const CompactQuarterRow: React.FC<{ q: Quarter; accentCls: string }> = ({ q, accentCls }) => (
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

export const QuarterSummaryPanel: React.FC<{ q: Quarter }> = ({ q }) => {
  const [expanded, setExpanded] = React.useState(false);

  const boolChip = (val: boolean, label: string, trueColor: string, falseColor: string) =>
    val ? (
      <span key={label} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${trueColor}`}>
        <CheckSquare size={9} /> {label}
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
      <div className="grid grid-cols-3 gap-2 mb-3">
        {fieldRow('Unit No.', q.unit_number || q.quarter_number)}
        {fieldRow('Quarter Type', q.quarter_type)}
        {fieldRow('Block', q.block_name)}
        {fieldRow('Floor', q.floor_number > 0 ? `${q.floor_number}${q.total_floors > 0 ? ` of ${q.total_floors}` : ''}` : null)}
        {fieldRow('BHK Config', q.bhk_config)}
        {fieldRow('Housing Style', q.housing_style)}
      </div>

      {(q.location_area || q.region || q.district) && (
        <div className="flex items-start gap-1.5 text-xs text-gray-500 mb-3 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <MapPin size={11} className="text-gray-400 shrink-0 mt-0.5" />
          <span className="leading-snug">
            {[q.location_area, q.district, q.region, q.pin_code].filter(Boolean).join(', ')}
          </span>
        </div>
      )}

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

      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          Show more details
        </button>
      )}

      {expanded && (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3 mt-1">
            {fieldRow('Area', q.area_sqft ? `${q.area_sqft} sq.ft` : null)}
            {fieldRow('Furnishing', q.furnishing_status)}
            {fieldRow('Toilet Type', q.toilet_type)}
            {fieldRow('Occupancy', q.occupancy_status)}
            {fieldRow('Quarter Type', q.quarter_type)}
            {fieldRow('Housing Style', q.housing_style)}
          </div>
          {q.amenities && q.amenities.length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1.5">Amenities</div>
              <div className="flex flex-wrap gap-1">
                {q.amenities.map(a => (
                  <span key={a} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a}</span>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => setExpanded(false)}
            className="text-[10px] font-semibold text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
          >
            Show less
          </button>
        </>
      )}
    </div>
  );
};
