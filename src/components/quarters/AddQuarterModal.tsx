import React, { useState } from 'react';
import {
  ArrowLeft, Building2, MapPin, Layers, Bath, IndianRupee,
  Zap, Droplets, Home, CheckCircle, Info, Wind, Flame,
  Plus,
} from 'lucide-react';
import type { CreateQuarterInput } from '../../types/quarters';

interface Props {
  onClose: () => void;
  onSubmit: (input: CreateQuarterInput) => Promise<void>;
  submitting: boolean;
}

const QUARTER_TYPES = ['TYPE_A', 'TYPE_B', 'TYPE_C', 'TYPE_D', 'TYPE_E', 'TYPE_F', 'TYPE_VI', 'TYPE_V'];
const BHK_OPTIONS = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Studio'];
const FACING_OPTIONS = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'];
const HOUSING_STYLES = ['Flat', 'Independent House', 'Row House', 'Bungalow'];
const FURNISHING_OPTIONS = ['Unfurnished', 'Semi-furnished', 'Fully-furnished'];
const WATER_HEATING_OPTIONS = ['Electric Geyser', 'Solar', 'Gas', 'None'];
const RENOVATION_OPTIONS = ['Good', 'Needs Minor Repair', 'Recently Renovated', 'Under Renovation'];
const AVAILABILITY_OPTIONS = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'UNDER_MAINTENANCE'];
const RESIDENT_TYPES = ['Permanent', 'Temporary', 'Transit'];

const defaultForm = (): CreateQuarterInput => ({
  unit_number: '',
  quarter_number: '',
  quarter_type: '',
  bhk_config: '',
  quota: '',
  counter_no: '',
  block_name: '',
  location_area: '',
  region: '',
  district: '',
  pin_code: '',
  address: '',
  floor_number: 0,
  total_floors: 1,
  facing: '',
  total_area_sqft: 0,
  area_sqft: 0,
  resident_type: '',
  toilet_western: false,
  toilet_indian: false,
  toilet_type: '',
  parking_details: '',
  current_availability_status: 'AVAILABLE',
  monthly_rent: 0,
  electricity_rate: 0,
  water_charges: 0,
  penalty_terms: '',
  pooja_room: false,
  electrical_fixtures: '',
  power_backup: false,
  water_heating: '',
  lift_access: false,
  kitchen_exhaust: false,
  housing_style: '',
  balcony: false,
  renovation_status: '',
  furnishing_status: '',
  description: '',
  estate_id: null,
});

type StepId = 'basic' | 'location' | 'structure' | 'toilet' | 'financials' | 'features';

const STEPS: { id: StepId; label: string; icon: React.ReactNode }[] = [
  { id: 'basic',      label: 'Basic Info',       icon: <Info size={14} /> },
  { id: 'location',   label: 'Location',         icon: <MapPin size={14} /> },
  { id: 'structure',  label: 'Structure',        icon: <Layers size={14} /> },
  { id: 'toilet',     label: 'Toilet & Parking', icon: <Bath size={14} /> },
  { id: 'financials', label: 'Financials',       icon: <IndianRupee size={14} /> },
  { id: 'features',   label: 'Features',         icon: <CheckCircle size={14} /> },
];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors';
const selectCls = `${inputCls} appearance-none`;

function BoolToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
        value
          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
      }`}
    >
      <CheckCircle size={13} className={value ? 'opacity-100' : 'opacity-40'} />
      {label}
    </button>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-5">
        <span className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

export function AddQuarterModal({ onClose, onSubmit, submitting }: Props) {
  const [form, setForm] = useState<CreateQuarterInput>(defaultForm());
  const [activeStep, setActiveStep] = useState<StepId>('basic');
  const [error, setError] = useState('');

  function set<K extends keyof CreateQuarterInput>(key: K, value: CreateQuarterInput[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function setNum<K extends keyof CreateQuarterInput>(key: K, raw: string) {
    const n = parseFloat(raw);
    set(key, (isNaN(n) ? 0 : n) as CreateQuarterInput[K]);
  }

  async function handleSubmit() {
    if (!form.quarter_number.trim()) { setError('Quarter number is required.'); setActiveStep('basic'); return; }
    if (!form.quarter_type) { setError('Quarter type is required.'); setActiveStep('basic'); return; }
    if (!form.bhk_config) { setError('BHK configuration is required.'); setActiveStep('basic'); return; }
    setError('');
    await onSubmit(form);
  }

  const stepIdx = STEPS.findIndex(s => s.id === activeStep);

  return (
    <div className="fixed inset-0 z-[900] bg-gray-50 flex flex-col" style={{ fontFamily: 'inherit' }}>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex-none bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4 shadow-sm">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="h-5 w-px bg-gray-200" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Building2 size={14} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight">New Quarter</h1>
            <p className="text-[11px] text-gray-400 leading-tight">Add to estate inventory</p>
          </div>
        </div>

        <div className="flex-1" />

        {error && (
          <span className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
            {error}
          </span>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          <Plus size={14} />
          {submitting ? 'Creating…' : 'Create Quarter'}
        </button>
      </div>

      {/* ── Step nav ─────────────────────────────────────────────── */}
      <div className="flex-none bg-white border-b border-gray-100 px-6 py-0">
        <div className="flex">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveStep(s.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeStep === s.id
                  ? 'border-blue-600 text-blue-600'
                  : i < stepIdx
                  ? 'border-emerald-400 text-emerald-600 hover:border-emerald-500'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
              }`}
            >
              {s.icon}
              {s.label}
              {i < stepIdx && (
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[9px] font-bold">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable body ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

          {/* BASIC INFO */}
          {activeStep === 'basic' && (
            <SectionCard title="Basic Information" icon={<Info size={13} />}>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Quarter Number" required>
                  <input className={inputCls} value={form.quarter_number} onChange={e => set('quarter_number', e.target.value)} placeholder="e.g. V/001" />
                </Field>
                <Field label="Unit Number">
                  <input className={inputCls} value={form.unit_number} onChange={e => set('unit_number', e.target.value)} placeholder="e.g. VI/001" />
                </Field>
                <Field label="Quarter Type" required>
                  <select className={selectCls} value={form.quarter_type} onChange={e => set('quarter_type', e.target.value)}>
                    <option value="">Select type…</option>
                    {QUARTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="BHK Configuration" required>
                  <select className={selectCls} value={form.bhk_config} onChange={e => set('bhk_config', e.target.value)}>
                    <option value="">Select…</option>
                    {BHK_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="QUOTA">
                  <input className={inputCls} value={form.quota} onChange={e => set('quota', e.target.value)} placeholder="e.g. EQ, SS, GENERAL" />
                </Field>
                <Field label="Counter No.">
                  <input className={inputCls} value={form.counter_no} onChange={e => set('counter_no', e.target.value)} placeholder="Counter number" />
                </Field>
                <Field label="Resident Type">
                  <select className={selectCls} value={form.resident_type} onChange={e => set('resident_type', e.target.value)}>
                    <option value="">Select…</option>
                    {RESIDENT_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Housing Style">
                  <select className={selectCls} value={form.housing_style} onChange={e => set('housing_style', e.target.value)}>
                    <option value="">Select…</option>
                    {HOUSING_STYLES.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </Field>
                <Field label="Furnishing Status">
                  <select className={selectCls} value={form.furnishing_status} onChange={e => set('furnishing_status', e.target.value)}>
                    <option value="">Select…</option>
                    {FURNISHING_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="Current Availability">
                  <select className={selectCls} value={form.current_availability_status} onChange={e => set('current_availability_status', e.target.value)}>
                    {AVAILABILITY_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Description">
                  <textarea className={inputCls} rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional description of the quarter…" />
                </Field>
              </div>
            </SectionCard>
          )}

          {/* LOCATION */}
          {activeStep === 'location' && (
            <SectionCard title="Location Details" icon={<MapPin size={13} />}>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Sector / Region">
                  <input className={inputCls} value={form.region} onChange={e => set('region', e.target.value)} placeholder="e.g. North Delhi" />
                </Field>
                <Field label="Location / Area">
                  <input className={inputCls} value={form.location_area} onChange={e => set('location_area', e.target.value)} placeholder="e.g. Sector 12" />
                </Field>
                <Field label="District">
                  <input className={inputCls} value={form.district} onChange={e => set('district', e.target.value)} placeholder="District name" />
                </Field>
                <Field label="PIN Code">
                  <input className={inputCls} value={form.pin_code} onChange={e => set('pin_code', e.target.value)} placeholder="6-digit PIN" maxLength={6} />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Full Address">
                  <textarea className={inputCls} rows={3} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full postal address…" />
                </Field>
              </div>
            </SectionCard>
          )}

          {/* STRUCTURE */}
          {activeStep === 'structure' && (
            <SectionCard title="Floor & Structure" icon={<Layers size={13} />}>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Block Name">
                  <input className={inputCls} value={form.block_name} onChange={e => set('block_name', e.target.value)} placeholder="e.g. Block A" />
                </Field>
                <Field label="Floor Number">
                  <input className={inputCls} type="number" min={0} value={form.floor_number || ''} onChange={e => setNum('floor_number', e.target.value)} placeholder="0" />
                </Field>
                <Field label="Total Floors in Building">
                  <input className={inputCls} type="number" min={1} value={form.total_floors || ''} onChange={e => setNum('total_floors', e.target.value)} placeholder="1" />
                </Field>
                <Field label="Facing">
                  <select className={selectCls} value={form.facing} onChange={e => set('facing', e.target.value)}>
                    <option value="">Select…</option>
                    {FACING_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="Total Area (Sq.Ft)">
                  <input className={inputCls} type="number" min={0} value={form.total_area_sqft || ''} onChange={e => setNum('total_area_sqft', e.target.value)} placeholder="e.g. 1200" />
                </Field>
                <Field label="Plinth Area (Sq.Ft)">
                  <input className={inputCls} type="number" min={0} value={form.area_sqft || ''} onChange={e => setNum('area_sqft', e.target.value)} placeholder="e.g. 900" />
                </Field>
                <Field label="Renovation Status">
                  <select className={selectCls} value={form.renovation_status} onChange={e => set('renovation_status', e.target.value)}>
                    <option value="">Select…</option>
                    {RENOVATION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
              </div>
            </SectionCard>
          )}

          {/* TOILET & PARKING */}
          {activeStep === 'toilet' && (
            <SectionCard title="Toilet Configuration & Parking" icon={<Bath size={13} />}>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Toilet Type</p>
                  <div className="flex flex-wrap gap-3">
                    <BoolToggle label="Western Toilet" value={form.toilet_western} onChange={v => {
                      set('toilet_western', v);
                      set('toilet_type', v && form.toilet_indian ? 'Both' : v ? 'Western' : form.toilet_indian ? 'Indian' : '');
                    }} />
                    <BoolToggle label="Indian Toilet" value={form.toilet_indian} onChange={v => {
                      set('toilet_indian', v);
                      set('toilet_type', form.toilet_western && v ? 'Both' : v ? 'Indian' : form.toilet_western ? 'Western' : '');
                    }} />
                  </div>
                  {form.toilet_type && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700">
                      Derived toilet type: <span className="font-bold">{form.toilet_type}</span>
                    </div>
                  )}
                </div>
                <Field label="Parking Details">
                  <input className={inputCls} value={form.parking_details} onChange={e => set('parking_details', e.target.value)} placeholder="e.g. 1 covered slot, Bay C-12" />
                </Field>
              </div>
            </SectionCard>
          )}

          {/* FINANCIALS */}
          {activeStep === 'financials' && (
            <SectionCard title="Financial Details" icon={<IndianRupee size={13} />}>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Monthly Rent (₹)">
                  <input className={inputCls} type="number" min={0} value={form.monthly_rent || ''} onChange={e => setNum('monthly_rent', e.target.value)} placeholder="0" />
                </Field>
                <Field label="Electricity Rate (₹/unit)">
                  <input className={inputCls} type="number" min={0} value={form.electricity_rate || ''} onChange={e => setNum('electricity_rate', e.target.value)} placeholder="0" />
                </Field>
                <Field label="Water Charges (₹/month)">
                  <input className={inputCls} type="number" min={0} value={form.water_charges || ''} onChange={e => setNum('water_charges', e.target.value)} placeholder="0" />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Penalty Terms">
                  <textarea className={inputCls} rows={3} value={form.penalty_terms} onChange={e => set('penalty_terms', e.target.value)} placeholder="Describe penalty terms for late payment, damage, etc." />
                </Field>
              </div>
            </SectionCard>
          )}

          {/* FEATURES */}
          {activeStep === 'features' && (
            <SectionCard title="Amenities & Features" icon={<CheckCircle size={13} />}>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Available Amenities</p>
                  <div className="flex flex-wrap gap-3">
                    <BoolToggle label="Pooja Room" value={form.pooja_room} onChange={v => set('pooja_room', v)} />
                    <BoolToggle label="Balcony" value={form.balcony} onChange={v => set('balcony', v)} />
                    <BoolToggle label="Kitchen Exhaust" value={form.kitchen_exhaust} onChange={v => set('kitchen_exhaust', v)} />
                    <BoolToggle label="Lift Access" value={form.lift_access} onChange={v => set('lift_access', v)} />
                    <BoolToggle label="Power Backup" value={form.power_backup} onChange={v => set('power_backup', v)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Water Heating">
                    <select className={selectCls} value={form.water_heating} onChange={e => set('water_heating', e.target.value)}>
                      <option value="">Select…</option>
                      {WATER_HEATING_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </Field>
                  <Field label="Electrical Fixtures">
                    <input className={inputCls} value={form.electrical_fixtures} onChange={e => set('electrical_fixtures', e.target.value)} placeholder="e.g. Standard, Premium" />
                  </Field>
                </div>
              </div>
            </SectionCard>
          )}

        </div>
      </div>

      {/* ── Bottom nav ───────────────────────────────────────────── */}
      <div className="flex-none bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => { if (stepIdx > 0) setActiveStep(STEPS[stepIdx - 1].id); }}
          disabled={stepIdx === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>

        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveStep(s.id)}
              className={`rounded-full transition-all ${
                i === stepIdx
                  ? 'w-6 h-2 bg-blue-600'
                  : i < stepIdx
                  ? 'w-2 h-2 bg-emerald-400'
                  : 'w-2 h-2 bg-gray-200 hover:bg-gray-300'
              }`}
              title={s.label}
            />
          ))}
        </div>

        {stepIdx < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setActiveStep(STEPS[stepIdx + 1].id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Plus size={14} />
            {submitting ? 'Creating…' : 'Create Quarter'}
          </button>
        )}
      </div>

    </div>
  );
}
