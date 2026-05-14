import { useCallback } from 'react';
import type { RefObject } from 'react';
import {
  quartersService,
  type QuarterRequest,
  type QuarterAllotmentCycle,
  type QuarterTenantRequest,
  type QuarterGuestInfo,
} from '../services/quartersService';
import type { Quarter } from '../services/quartersService';
import { DEMO_MODE } from '../mocks/demoData';
import { isOccupiedStatus, isAllottedStatus } from '../components/quarters/quarterShared';
import type { DPFilter, PrefItem, NewRequestForm } from '../types/quarterRequests';
import type { UserDTO } from '../types/user.types';

interface LoadDataSetters {
  setRequests: (v: QuarterRequest[] | ((prev: QuarterRequest[]) => QuarterRequest[])) => void;
  setActiveCycle: (v: QuarterAllotmentCycle | null) => void;
  setTenantRequests: (v: QuarterTenantRequest[]) => void;
  setDpFilter: (v: DPFilter) => void;
  setLoading: (v: boolean) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  isEO: boolean;
  eoMode: 'self' | 'employee' | null;
  user: UserDTO | null;
}

interface LoadModalSetters {
  setModalLoading: (v: boolean) => void;
  setModalQuarters: (v: Quarter[]) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  modalSearch: string;
  modalBhk: string;
  modalFurnishing: string;
  modalSortBy: string;
  modalGroundFloor: boolean;
  modalRecentlyRenovated: boolean;
  modalLocationArea: string;
  modalWesternToilet: boolean;
  modalIndianToilet: boolean;
  modalCarParking: boolean;
  modalPoojaRoom: boolean;
  modalBalcony: boolean;
  modalKitchenExhaust: boolean;
  modalLiftAccess: boolean;
  modalIndependentHouse: boolean;
  modalHousingStyle: string;
  prefs: PrefItem[];
}

interface LoadAllotNowSetters {
  setAllotNowLoading: (v: boolean) => void;
  setAllotNowQuarters: (v: Quarter[]) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  showAllotNowPicker: boolean;
  allotNowSearch: string;
  user: UserDTO | null;
  form: NewRequestForm;
}

interface LoadManualAllotSetters {
  setManualAllotLoading: (v: boolean) => void;
  setManualAllotQuarters: (v: Quarter[]) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  manualAllotPickerOpen: boolean;
  manualAllotSearch: string;
}

interface LoadGuestInfoSetters {
  setGuestInfoLoading: (v: boolean) => void;
  setGuestInfoList: (v: QuarterGuestInfo[]) => void;
  allotmentId: string | undefined;
}

interface DpScrollSetters {
  dpScrollRef: RefObject<HTMLDivElement>;
  setDpCanScrollLeft: (v: boolean) => void;
  setDpCanScrollRight: (v: boolean) => void;
}

export function useQuarterRequestsData(
  loadData_: LoadDataSetters,
  loadModal_: LoadModalSetters,
  loadAllotNow_: LoadAllotNowSetters,
  loadManualAllot_: LoadManualAllotSetters,
  loadGuest_: LoadGuestInfoSetters,
  dpScroll_: DpScrollSetters,
) {
  const loadData = useCallback(async () => {
    /* DEMO_MODE: data is pre-loaded from mock state; live fetch disabled
    if (!loadData_.user) return;
    loadData_.setLoading(true);
    try {
      const isEmployeeMode = loadData_.isEO && loadData_.eoMode === 'employee';
      const [reqs, cycle, tReqs] = await Promise.all([
        isEmployeeMode
          ? quartersService.getAllRequests()
          : quartersService.getMyRequests(loadData_.user.id),
        quartersService.getActiveCycle(),
        isEmployeeMode
          ? quartersService.getAllTenantRequests()
          : quartersService.getMyTenantRequests(loadData_.user.id),
      ]);
      const normalised = reqs.map((r: any) => ({
        ...r,
        allotment: Array.isArray(r.allotment) ? (r.allotment[0] ?? null) : r.allotment,
      }));
      loadData_.setRequests(normalised as QuarterRequest[]);
      loadData_.setActiveCycle(cycle);
      loadData_.setTenantRequests(tReqs);

      if (isEmployeeMode) {
        const hasOccupied  = normalised.some((r: any) => isOccupiedStatus(r.request_status));
        const hasAllocated = normalised.some((r: any) => isAllottedStatus(r.request_status) && r.allotment?.approval_status === 'APPROVED');
        const hasAllotted  = normalised.some((r: any) => isAllottedStatus(r.request_status) && r.allotment?.approval_status === 'PENDING');
        const hasSubmitted = normalised.some((r: any) => r.request_status === 'SUBMITTED');
        loadData_.setDpFilter(
          hasOccupied ? 'occupied' : hasAllocated ? 'allocated_em' : hasAllotted ? 'allotted' : hasSubmitted ? 'submitted' : 'occupied'
        );
      }
    } catch {
      loadData_.addToast('Failed to load data', 'error');
    } finally {
      loadData_.setLoading(false);
    }
    */
  }, [loadData_.user, loadData_.addToast, loadData_.isEO, loadData_.eoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadModalQuarters = useCallback(async () => {
    loadModal_.setModalLoading(true);
    try {
      const data = await quartersService.getQuarters({
        occupancy_status: 'AVAILABLE',
        search: loadModal_.modalSearch || undefined,
        bhk_config: loadModal_.modalBhk || undefined,
        furnishing_status: loadModal_.modalFurnishing || undefined,
      });
      let filtered = data.filter(q => !loadModal_.prefs.find(p => p.quarter.id === q.id));
      if (loadModal_.modalGroundFloor) filtered = filtered.filter(q => q.floor_number === 0);
      if (loadModal_.modalRecentlyRenovated) filtered = filtered.filter(q => q.renovation_status?.toLowerCase().includes('renovated'));
      if (loadModal_.modalLocationArea.trim()) {
        const la = loadModal_.modalLocationArea.trim().toLowerCase();
        filtered = filtered.filter(q =>
          q.location_area?.toLowerCase().includes(la) || q.region?.toLowerCase().includes(la)
        );
      }
      if (loadModal_.modalWesternToilet) filtered = filtered.filter(q => q.toilet_western === true);
      if (loadModal_.modalIndianToilet) filtered = filtered.filter(q => q.toilet_indian === true);
      if (loadModal_.modalCarParking) filtered = filtered.filter(q => !!q.parking_details?.trim());
      if (loadModal_.modalPoojaRoom) filtered = filtered.filter(q => q.pooja_room === true);
      if (loadModal_.modalBalcony) filtered = filtered.filter(q => q.balcony === true);
      if (loadModal_.modalKitchenExhaust) filtered = filtered.filter(q => q.kitchen_exhaust === true);
      if (loadModal_.modalLiftAccess) filtered = filtered.filter(q => q.lift_access === true);
      if (loadModal_.modalIndependentHouse) filtered = filtered.filter(q => q.housing_style?.toLowerCase().includes('independent'));
      if (loadModal_.modalHousingStyle) filtered = filtered.filter(q => q.housing_style === loadModal_.modalHousingStyle);
      if (loadModal_.modalSortBy === 'rent_asc') filtered = [...filtered].sort((a, b) => a.monthly_rent - b.monthly_rent);
      else if (loadModal_.modalSortBy === 'rent_desc') filtered = [...filtered].sort((a, b) => b.monthly_rent - a.monthly_rent);
      loadModal_.setModalQuarters(filtered);
    } catch {
      loadModal_.addToast('Failed to load quarters', 'error');
    } finally {
      loadModal_.setModalLoading(false);
    }
  }, [ // eslint-disable-line react-hooks/exhaustive-deps
    loadModal_.modalSearch, loadModal_.modalBhk, loadModal_.modalFurnishing, loadModal_.modalSortBy,
    loadModal_.modalGroundFloor, loadModal_.modalRecentlyRenovated, loadModal_.modalLocationArea,
    loadModal_.modalWesternToilet, loadModal_.modalIndianToilet, loadModal_.modalCarParking,
    loadModal_.modalPoojaRoom, loadModal_.modalBalcony, loadModal_.modalKitchenExhaust,
    loadModal_.modalLiftAccess, loadModal_.modalIndependentHouse, loadModal_.modalHousingStyle,
    loadModal_.prefs, loadModal_.addToast,
  ]);

  const loadAllotNowQuarters = useCallback(async () => {
    if (!loadAllotNow_.showAllotNowPicker) return;
    loadAllotNow_.setAllotNowLoading(true);
    try {
      const data = await quartersService.getQuarters({
        occupancy_status: 'AVAILABLE',
        search: loadAllotNow_.allotNowSearch || undefined,
        bhk_config: (loadAllotNow_.user?.bhkEntitlement || loadAllotNow_.form.required_bhk_config) || undefined,
      });
      loadAllotNow_.setAllotNowQuarters(data);
    } catch {
      loadAllotNow_.addToast('Failed to load quarters', 'error');
    } finally {
      loadAllotNow_.setAllotNowLoading(false);
    }
  }, [ // eslint-disable-line react-hooks/exhaustive-deps
    loadAllotNow_.showAllotNowPicker,
    loadAllotNow_.allotNowSearch,
    loadAllotNow_.user?.bhkEntitlement,
    loadAllotNow_.form.required_bhk_config,
    loadAllotNow_.addToast,
  ]);

  const loadManualAllotQuarters = useCallback(async () => {
    if (!loadManualAllot_.manualAllotPickerOpen) return;
    loadManualAllot_.setManualAllotLoading(true);
    try {
      const data = await quartersService.getQuarters({
        occupancy_status: 'AVAILABLE',
        search: loadManualAllot_.manualAllotSearch || undefined,
      });
      loadManualAllot_.setManualAllotQuarters(data);
    } catch {
      loadManualAllot_.addToast('Failed to load quarters', 'error');
    } finally {
      loadManualAllot_.setManualAllotLoading(false);
    }
  }, [loadManualAllot_.manualAllotPickerOpen, loadManualAllot_.manualAllotSearch, loadManualAllot_.addToast]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadGuestInfo = useCallback(async () => {
    const allotmentId = loadGuest_.allotmentId;
    if (!allotmentId) return;
    loadGuest_.setGuestInfoLoading(true);
    try {
      const list = await quartersService.getGuestInfo(allotmentId);
      loadGuest_.setGuestInfoList(list);
    } catch {} finally {
      loadGuest_.setGuestInfoLoading(false);
    }
  }, [loadGuest_.allotmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateDpScrollState = useCallback(() => {
    const el = dpScroll_.dpScrollRef.current;
    if (!el) return;
    dpScroll_.setDpCanScrollLeft(el.scrollLeft > 2);
    dpScroll_.setDpCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    loadData,
    loadModalQuarters,
    loadAllotNowQuarters,
    loadManualAllotQuarters,
    loadGuestInfo,
    updateDpScrollState,
  };
}
