import { ScheduleSlot, SchoolInfo } from '../types/schedule';
import { INITIAL_SCHEDULE_SLOTS, DEFAULT_SCHOOL_INFO } from '../data/initialSchedule';

const STORAGE_KEY_SLOTS = 'sman2_sas_slots_v3';
const STORAGE_KEY_SCHOOL = 'sman2_sas_school_info_v3';
const STORAGE_KEY_PIN = 'sman2_sas_admin_pin';

export function getStoredSlots(): ScheduleSlot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SLOTS);
    if (!raw) return INITIAL_SCHEDULE_SLOTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_SCHEDULE_SLOTS;
  } catch (e) {
    console.error('Error reading slots from storage:', e);
    return INITIAL_SCHEDULE_SLOTS;
  }
}

export function saveStoredSlots(slots: ScheduleSlot[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SLOTS, JSON.stringify(slots));
  } catch (e) {
    console.error('Error saving slots to storage:', e);
  }
}

export function getStoredSchoolInfo(): SchoolInfo {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCHOOL);
    if (!raw) return DEFAULT_SCHOOL_INFO;
    return { ...DEFAULT_SCHOOL_INFO, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_SCHOOL_INFO;
  }
}

export function saveStoredSchoolInfo(info: SchoolInfo): void {
  try {
    localStorage.setItem(STORAGE_KEY_SCHOOL, JSON.stringify(info));
  } catch (e) {
    console.error('Error saving school info:', e);
  }
}

export function getAdminPin(): string {
  return localStorage.getItem(STORAGE_KEY_PIN) || 'admin123';
}

export function setAdminPin(pin: string): void {
  localStorage.setItem(STORAGE_KEY_PIN, pin);
}

export function resetToDefaultData(): { slots: ScheduleSlot[]; school: SchoolInfo } {
  localStorage.removeItem(STORAGE_KEY_SLOTS);
  localStorage.removeItem(STORAGE_KEY_SCHOOL);
  localStorage.removeItem('sman2_sas_slots_v2');
  localStorage.removeItem('sman2_sas_school_info');
  return {
    slots: INITIAL_SCHEDULE_SLOTS,
    school: DEFAULT_SCHOOL_INFO,
  };
}
