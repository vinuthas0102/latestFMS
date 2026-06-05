import React, { useState, useEffect, useRef } from 'react';
import {
  Lock, Save, User, Briefcase, CreditCard, Phone, Users,
  Building, Stethoscope, History, Upload, FileText, ExternalLink,
  Loader2, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { authService } from '../services/authService';
import { ROLE_LABELS } from '../constants/roles';
import { ProfileMetadata, FamilyEmployeeDetails, MedicalGrounds } from '../types';

/* ── Tiny primitives ── */

const ReadonlyField: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</label>
    <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-[13px] text-gray-600 min-h-[38px]">
      <Lock size={11} className="text-gray-300 flex-shrink-0" />
      <span>{value || '—'}</span>
    </div>
  </div>
);

const EditableField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}> = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[38px]"
    />
  </div>
);

const EditableTextarea: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}> = ({ label, value, onChange, placeholder, rows = 2 }) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
    />
  </div>
);

const ToggleButtons: React.FC<{
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-[13px] font-medium text-gray-700">{label}</span>
    <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[12px] font-semibold">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-4 py-1.5 transition-colors ${value ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-4 py-1.5 transition-colors ${!value ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
      >
        No
      </button>
    </div>
  </div>
);

const SectionCard: React.FC<{ id: string; title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  id, title, icon, children,
}) => (
  <div id={id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
      <span className="text-blue-600">{icon}</span>
      <h2 className="text-[14px] font-bold text-gray-800">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const FieldGrid: React.FC<{ cols?: 2 | 3 | 4; children: React.ReactNode }> = ({ cols = 3, children }) => {
  const cls = cols === 4 ? 'grid-cols-2 lg:grid-cols-4' : cols === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2';
  return <div className={`grid ${cls} gap-4`}>{children}</div>;
};

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

const NAV_ITEMS = [
  { id: 'personal', label: 'Personal Info', icon: <User size={14} /> },
  { id: 'employment', label: 'Employment', icon: <Briefcase size={14} /> },
  { id: 'identification', label: 'Identification', icon: <CreditCard size={14} /> },
  { id: 'contact', label: 'Contact Details', icon: <Phone size={14} /> },
  { id: 'family', label: 'Family Details', icon: <Users size={14} /> },
  { id: 'family-emp', label: 'Family Employment', icon: <Building size={14} /> },
  { id: 'medical', label: 'Medical Grounds', icon: <Stethoscope size={14} /> },
  { id: 'service', label: 'Service History', icon: <History size={14} /> },
];

const RELATION_OPTIONS = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Other'];
const MEDICAL_REASON_OPTIONS = ['Critical Illness', 'Post-Surgery Recovery', 'Disability', 'Chronic Condition', 'Other'];

/* ── Main component ── */

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { addToast } = useUIStore();

  /* Editable state */
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [alternateEmail, setAlternateEmail] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [familyCount, setFamilyCount] = useState(0);
  const [numDependents, setNumDependents] = useState(0);
  const [dependents, setDependents] = useState<Array<{ relation: string; age: number }>>([]);
  const [familyEmployeeActive, setFamilyEmployeeActive] = useState(false);
  const [familyEmpDetails, setFamilyEmpDetails] = useState<FamilyEmployeeDetails>({
    relation: '', name: '', designation: '', location: '', empId: '', phone: '', email: '',
  });
  const [medicalRequired, setMedicalRequired] = useState(false);
  const [medicalReason, setMedicalReason] = useState('');
  const [medicalMember, setMedicalMember] = useState('');
  const [medicalRemarks, setMedicalRemarks] = useState('');
  const [medDocFile, setMedDocFile] = useState<File | null>(null);
  const [medDocInfo, setMedDocInfo] = useState<{ name: string; url: string } | null>(null);
  const [medDocUploading, setMedDocUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Initialise from user */
  useEffect(() => {
    if (!user) return;
    const m = user.metadata ?? {};
    setPhone(user.phone || '');
    setAlternatePhone(m.alternatePhone ?? '');
    setAlternateEmail(m.alternateEmail ?? '');
    setAadhaarNumber(m.aadhaarNumber ?? '');
    setPanNumber(m.panNumber ?? '');
    setCurrentAddress(m.currentAddress ?? '');
    setPermanentAddress(m.permanentAddress ?? '');
    setFamilyCount(m.familyCount ?? 0);
    setNumDependents(m.numDependents ?? 0);
    setDependents(m.dependents ?? []);
    setFamilyEmployeeActive(m.familyEmployeeActive ?? false);
    setFamilyEmpDetails(m.familyEmployeeDetails ?? {
      relation: '', name: '', designation: '', location: '', empId: '', phone: '', email: '',
    });
    const mg = m.medicalGrounds as MedicalGrounds | undefined;
    setMedicalRequired(mg?.required ?? false);
    setMedicalReason(mg?.reason ?? '');
    setMedicalMember(mg?.member ?? '');
    setMedicalRemarks(mg?.remarks ?? '');
  }, [user]);

  /* Sync dependents array length to numDependents */
  useEffect(() => {
    setDependents(prev => {
      if (prev.length === numDependents) return prev;
      if (prev.length < numDependents) {
        return [...prev, ...Array(numDependents - prev.length).fill({ relation: '', age: 0 })];
      }
      return prev.slice(0, numDependents);
    });
  }, [numDependents]);

  /* Scroll spy */
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    NAV_ITEMS.forEach(n => {
      const el = document.getElementById(n.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const metadata: ProfileMetadata = {
        ...(user.metadata ?? {}),
        alternatePhone,
        alternateEmail,
        aadhaarNumber,
        panNumber,
        currentAddress,
        permanentAddress,
        familyCount,
        numDependents,
        dependents,
        familyEmployeeActive,
        familyEmployeeDetails: familyEmpDetails,
        medicalGrounds: { required: medicalRequired, reason: medicalReason, member: medicalMember, remarks: medicalRemarks },
      };
      const updated = await authService.updateProfile(user.id, { phone, metadata });
      setUser(updated);
      addToast('Profile updated successfully', 'success');
    } catch {
      addToast('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleMedDocUpload = async () => {
    if (!user || !medDocFile) return;
    setMedDocUploading(true);
    try {
      const path = await authService.uploadProfileMedicalDoc(user.id, medDocFile);
      const metadata: ProfileMetadata = { ...(user.metadata ?? {}), medicalDocPath: path };
      const updated = await authService.updateProfile(user.id, { metadata });
      setUser(updated);
      setMedDocInfo({ name: medDocFile.name, url: path });
      setMedDocFile(null);
      addToast('Medical document uploaded', 'success');
    } catch {
      addToast('Upload failed', 'error');
    } finally {
      setMedDocUploading(false);
    }
  };

  if (!user) return null;

  const m = user.metadata ?? {};
  const serviceHistory = (m.serviceHistory ?? []) as Array<{ dateJoining: string; dateTransfer: string; designation: string; region: string; payScale: string }>;
  const initials = user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky page header */}
      <div className="sticky top-[60px] z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="leading-tight">
                <div className="text-[14px] font-bold text-gray-900">{user.fullName}</div>
                <div className="text-[11px] text-blue-500 font-medium">{ROLE_LABELS[user.role]}</div>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">

          {/* Left nav — desktop only */}
          <aside className="hidden lg:block w-52 flex-shrink-0">
            <div className="sticky top-[124px] bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[12px] font-medium transition-colors mb-0.5 ${
                    activeSection === item.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className={activeSection === item.id ? 'text-blue-600' : 'text-gray-400'}>{item.icon}</span>
                  {item.label}
                  {activeSection === item.id && <ChevronRight size={12} className="ml-auto text-blue-400" />}
                </button>
              ))}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* 1 · Personal Info */}
            <SectionCard id="personal" title="Personal Information" icon={<User size={16} />}>
              <div className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[12px] text-amber-700">
                <Lock size={12} className="mt-0.5 flex-shrink-0" />
                <span>Name, father's name, and category fields are managed by HR and cannot be edited.</span>
              </div>
              <FieldGrid cols={3}>
                <ReadonlyField label="Full Name" value={user.fullName} />
                <ReadonlyField label="Father's Name" value={m.fatherName as string} />
                <ReadonlyField label="Date of Birth" value={fmtDate(m.dateOfBirth as string)} />
                <ReadonlyField label="Social Category" value={m.socialCategory as string} />
                <ReadonlyField label="Physical Status" value={m.physicalStatus as string} />
                <ReadonlyField label="BHK Entitlement" value={user.bhkEntitlement} />
              </FieldGrid>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditableTextarea label="Current Address" value={currentAddress} onChange={setCurrentAddress} placeholder="Enter current address" rows={3} />
                <EditableTextarea label="Permanent Address" value={permanentAddress} onChange={setPermanentAddress} placeholder="Enter permanent address" rows={3} />
              </div>
            </SectionCard>

            {/* 2 · Employment Details */}
            <SectionCard id="employment" title="Employment Details" icon={<Briefcase size={16} />}>
              <div className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[12px] text-amber-700">
                <Lock size={12} className="mt-0.5 flex-shrink-0" />
                <span>Employment details are maintained by HR and are read-only.</span>
              </div>
              <FieldGrid cols={3}>
                <ReadonlyField label="Department" value={user.govtDepartment} />
                <ReadonlyField label="Employee ID" value={user.govtEmployeeId} />
                <ReadonlyField label="Project Location" value={user.projectLocation} />
                <ReadonlyField label="Date of Joining" value={fmtDate(m.dateOfJoining as string)} />
                <ReadonlyField label="Date of Retirement" value={fmtDate(m.dateOfRetirement as string)} />
                <ReadonlyField label="HRMS ID" value={m.hrmsId as string} />
                <ReadonlyField label="PF Number" value={m.pfNumber as string} />
              </FieldGrid>
            </SectionCard>

            {/* 3 · Identification */}
            <SectionCard id="identification" title="Identification & Official Details" icon={<CreditCard size={16} />}>
              <div className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[12px] text-amber-700">
                <Lock size={12} className="mt-0.5 flex-shrink-0" />
                <span>SAP ID and official IDs are system-assigned and cannot be edited.</span>
              </div>
              <FieldGrid cols={2}>
                <ReadonlyField label="SAP ID" value={user.sapId} />
                <ReadonlyField label="Employee ID" value={user.govtEmployeeId} />
              </FieldGrid>
              <div className="mt-4">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Identification Numbers</p>
                <FieldGrid cols={2}>
                  <EditableField label="Aadhaar Number" value={aadhaarNumber} onChange={setAadhaarNumber} placeholder="XXXX XXXX XXXX" />
                  <EditableField label="PAN Number" value={panNumber} onChange={setPanNumber} placeholder="ABCDE1234F" />
                </FieldGrid>
              </div>
            </SectionCard>

            {/* 4 · Contact */}
            <SectionCard id="contact" title="Contact Details" icon={<Phone size={16} />}>
              <FieldGrid cols={2}>
                <ReadonlyField label="Official Email" value={user.email} />
                <EditableField label="Mobile Number" value={phone} onChange={setPhone} placeholder="10-digit mobile" type="tel" />
                <EditableField label="Alternate Phone" value={alternatePhone} onChange={setAlternatePhone} placeholder="Alternate number" type="tel" />
                <EditableField label="Alternate Email" value={alternateEmail} onChange={setAlternateEmail} placeholder="Personal email" type="email" />
              </FieldGrid>
            </SectionCard>

            {/* 5 · Family */}
            <SectionCard id="family" title="Family Details" icon={<Users size={16} />}>
              <FieldGrid cols={2}>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Family Members</label>
                  <select
                    value={familyCount}
                    onChange={e => setFamilyCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 11 }, (_, i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Number of Dependents</label>
                  <select
                    value={numDependents}
                    onChange={e => setNumDependents(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 11 }, (_, i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
              </FieldGrid>

              {dependents.length > 0 && (
                <div className="mt-5">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Dependent Details</p>
                  <div className="space-y-3">
                    {dependents.map((dep, idx) => (
                      <div key={idx} className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Relation</label>
                          <select
                            value={dep.relation}
                            onChange={e => {
                              const next = [...dependents];
                              next[idx] = { ...next[idx], relation: e.target.value };
                              setDependents(next);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-[12px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select</option>
                            {RELATION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Age</label>
                          <input
                            type="number"
                            value={dep.age || ''}
                            onChange={e => {
                              const next = [...dependents];
                              next[idx] = { ...next[idx], age: Number(e.target.value) };
                              setDependents(next);
                            }}
                            placeholder="Age"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-[12px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>

            {/* 6 · Family Employment */}
            <SectionCard id="family-emp" title="Family Member in Employment" icon={<Building size={16} />}>
              <ToggleButtons
                label="Is any family member employed in NMDC?"
                value={familyEmployeeActive}
                onChange={setFamilyEmployeeActive}
              />
              {familyEmployeeActive && (
                <div className="mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50/30">
                  <FieldGrid cols={2}>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Relation</label>
                      <select
                        value={familyEmpDetails.relation}
                        onChange={e => setFamilyEmpDetails(p => ({ ...p, relation: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        {RELATION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <EditableField label="Name" value={familyEmpDetails.name} onChange={v => setFamilyEmpDetails(p => ({ ...p, name: v }))} placeholder="Full name" />
                    <EditableField label="Designation" value={familyEmpDetails.designation} onChange={v => setFamilyEmpDetails(p => ({ ...p, designation: v }))} placeholder="Designation" />
                    <EditableField label="Location / Region" value={familyEmpDetails.location} onChange={v => setFamilyEmpDetails(p => ({ ...p, location: v }))} placeholder="Location" />
                    <EditableField label="Employee ID" value={familyEmpDetails.empId} onChange={v => setFamilyEmpDetails(p => ({ ...p, empId: v }))} placeholder="EMP-XXXXXX" />
                    <EditableField label="Phone" value={familyEmpDetails.phone} onChange={v => setFamilyEmpDetails(p => ({ ...p, phone: v }))} placeholder="Phone" type="tel" />
                    <EditableField label="Email" value={familyEmpDetails.email} onChange={v => setFamilyEmpDetails(p => ({ ...p, email: v }))} placeholder="Email" type="email" />
                  </FieldGrid>
                </div>
              )}
            </SectionCard>

            {/* 7 · Medical Grounds */}
            <SectionCard id="medical" title="Medical Grounds" icon={<Stethoscope size={16} />}>
              <ToggleButtons
                label="Requesting quarter allotment on medical grounds?"
                value={medicalRequired}
                onChange={setMedicalRequired}
              />
              {medicalRequired && (
                <div className="mt-4 p-4 rounded-xl border border-rose-100 bg-rose-50/20 space-y-4">
                  <FieldGrid cols={2}>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Reason</label>
                      <select
                        value={medicalReason}
                        onChange={e => setMedicalReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select reason</option>
                        {MEDICAL_REASON_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <EditableField label="Affected Member" value={medicalMember} onChange={setMedicalMember} placeholder="Self / Spouse / Son…" />
                  </FieldGrid>
                  <EditableTextarea label="Remarks" value={medicalRemarks} onChange={setMedicalRemarks} placeholder="Additional details" rows={2} />
                </div>
              )}

              {/* Medical document upload — standalone profile attachment */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Medical Certificate / Document</p>
                {(medDocInfo || m.medicalDocPath) ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                    <FileText size={18} className="text-blue-500 flex-shrink-0" />
                    <span className="text-[13px] text-gray-700 flex-1 truncate">
                      {medDocInfo?.name || String(m.medicalDocPath).split('/').pop()?.replace(/^\d+-/, '').replace(/_/g, ' ')}
                    </span>
                    {medDocInfo?.url && (
                      <a href={medDocInfo.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[12px] text-blue-600 hover:underline">
                        <ExternalLink size={12} /> View
                      </a>
                    )}
                    <button
                      onClick={() => { setMedDocInfo(null); fileInputRef.current?.click(); }}
                      className="text-[12px] text-gray-400 hover:text-gray-600"
                    >
                      Replace
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
                  >
                    <Upload size={20} className="text-gray-400" />
                    <p className="text-[13px] text-gray-500">Click to upload medical certificate</p>
                    <p className="text-[11px] text-gray-400">PDF, JPG, PNG up to 5 MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={e => setMedDocFile(e.target.files?.[0] ?? null)}
                />
                {medDocFile && (
                  <div className="mt-3 flex items-center gap-3">
                    <FileText size={14} className="text-blue-500 flex-shrink-0" />
                    <span className="text-[12px] text-gray-700 flex-1 truncate">{medDocFile.name}</span>
                    <button
                      onClick={handleMedDocUpload}
                      disabled={medDocUploading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    >
                      {medDocUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      {medDocUploading ? 'Uploading…' : 'Upload'}
                    </button>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* 8 · Service History (read-only table) */}
            <SectionCard id="service" title="Service History" icon={<History size={16} />}>
              {serviceHistory.length === 0 ? (
                <p className="text-[13px] text-gray-400 text-center py-6">No service history records available.</p>
              ) : (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Date of Joining', 'Date of Transfer', 'Designation', 'Region', 'Pay Scale'].map(h => (
                          <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider pb-2.5 pr-4 last:pr-0">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {serviceHistory.map((row, i) => (
                        <tr key={i} className="border-b border-gray-50 last:border-0">
                          <td className="py-2.5 pr-4 text-gray-700 whitespace-nowrap">{fmtDate(row.dateJoining)}</td>
                          <td className="py-2.5 pr-4 text-gray-700 whitespace-nowrap">
                            {row.dateTransfer ? fmtDate(row.dateTransfer) : <span className="text-emerald-600 font-medium">Present</span>}
                          </td>
                          <td className="py-2.5 pr-4 text-gray-800 font-medium">{row.designation}</td>
                          <td className="py-2.5 pr-4 text-gray-700">{row.region}</td>
                          <td className="py-2.5 text-gray-600">{row.payScale}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            {/* Bottom save */}
            <div className="flex justify-end pb-8">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
