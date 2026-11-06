import { 
  ScheduleSlot, 
  SchoolInfo, 
  AdminAccount, 
  TeacherTokenConfig, 
  ClassTokenConfig, 
  AuthSession,
  ALL_CLASSES 
} from '../types/schedule';
import { INITIAL_SCHEDULE_SLOTS, DEFAULT_SCHOOL_INFO } from '../data/initialSchedule';
import bundledConfig from '../data/savedConfig.json';

const STORAGE_KEY_SLOTS = 'sman2_sas_slots_v3';
const STORAGE_KEY_SCHOOL = 'sman2_sas_school_info_v3';
const STORAGE_KEY_PIN = 'sman2_sas_admin_pin';
const STORAGE_KEY_ADMINS = 'sman2_sas_multi_admins_v1';
const STORAGE_KEY_TEACHER_TOKENS = 'sman2_sas_teacher_tokens_v1';
const STORAGE_KEY_CLASS_TOKENS = 'sman2_sas_class_tokens_v1';
const STORAGE_KEY_AUTH_SESSION = 'sman2_sas_active_auth_v1';

export const DEFAULT_ADMINS: AdminAccount[] = [
  {
    id: 'admin-super',
    name: 'Trisnurini Tantrianingrum, S.Pd, M.M',
    username: 'superadmin',
    pin: 'admin123',
    roleTitle: 'Super Admin / Kepala Sekolah',
    createdAt: '2026-11-01',
    isActive: true,
  },
  {
    id: 'admin-panitia',
    name: 'AJIANSYAH AKBAR, S.Sos',
    username: 'panitia',
    pin: 'panitia2026',
    roleTitle: 'Ketua Panitia SAS 2026/2027',
    createdAt: '2026-11-01',
    isActive: true,
  },
  {
    id: 'admin-kurikulum',
    name: 'Tim Kurikulum & Asesmen',
    username: 'kurikulum',
    pin: 'kurikulum2026',
    roleTitle: 'Koordinator Jadwal & Proktor',
    createdAt: '2026-11-01',
    isActive: true,
  },
];

export const DEFAULT_TEACHER_TOKENS: TeacherTokenConfig = {
  defaultTeacherToken: 'GURU-SMADA2026',
  customTeacherTokens: {},
};

export function generateDefaultClassTokens(): Record<string, string> {
  const tokens: Record<string, string> = {};
  ALL_CLASSES.forEach((cls) => {
    // E.g., 'X-1' -> 'SAS-X1', 'XI-5' -> 'SAS-XI5', 'XII-10' -> 'SAS-XII10'
    const cleanCls = cls.replace('-', '');
    tokens[cls] = `SAS-${cleanCls}`;
  });
  return tokens;
}

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
    const fallbackUrl = bundledConfig?.webAppUrl || DEFAULT_SCHOOL_INFO.googleSync?.webAppUrl || '';
    
    if (!raw) {
      return {
        ...DEFAULT_SCHOOL_INFO,
        googleSync: {
          ...DEFAULT_SCHOOL_INFO.googleSync,
          webAppUrl: fallbackUrl,
        },
      };
    }

    const parsed = JSON.parse(raw);
    const merged: SchoolInfo = { ...DEFAULT_SCHOOL_INFO, ...parsed };

    // Smart migration for official school officers & digital signatures
    if (!merged.headmasterName || merged.headmasterName === 'Drs. H. Ahmad Fauzi, M.Pd.') {
      merged.headmasterName = DEFAULT_SCHOOL_INFO.headmasterName;
      merged.headmasterNip = DEFAULT_SCHOOL_INFO.headmasterNip;
    }
    if (!merged.headmasterSignatureImage && DEFAULT_SCHOOL_INFO.headmasterSignatureImage) {
      merged.headmasterSignatureImage = DEFAULT_SCHOOL_INFO.headmasterSignatureImage;
    }

    if (!merged.committeeName || merged.committeeName === 'Didik Suryadi, S.Pd.') {
      merged.committeeName = DEFAULT_SCHOOL_INFO.committeeName;
      merged.committeeNip = DEFAULT_SCHOOL_INFO.committeeNip;
    }
    if (!merged.committeeSignatureImage && DEFAULT_SCHOOL_INFO.committeeSignatureImage) {
      merged.committeeSignatureImage = DEFAULT_SCHOOL_INFO.committeeSignatureImage;
    }

    // If localStorage has empty, missing, or old placeholder webAppUrl, populate from active fallback
    const isOldPlaceholderUrl = merged.googleSync?.webAppUrl?.includes('AKfycbwH_rv-76X15KJYlzPSWjo2F5zVrVVA4hK7K06ItYOPdEijEbYOHMVETpz8htQZ_JoDig');
    if ((!merged.googleSync?.webAppUrl || merged.googleSync.webAppUrl.trim() === '' || isOldPlaceholderUrl) && fallbackUrl) {
      merged.googleSync = {
        ...merged.googleSync,
        webAppUrl: fallbackUrl,
      };
    }

    return merged;
  } catch (e) {
    return DEFAULT_SCHOOL_INFO;
  }
}

export function saveStoredSchoolInfo(info: SchoolInfo): void {
  try {
    localStorage.setItem(STORAGE_KEY_SCHOOL, JSON.stringify(info));

    // Automatically sync Google Apps Script URL to backend server across all browsers
    if (info.googleSync?.webAppUrl) {
      saveGlobalServerConfig({
        webAppUrl: info.googleSync.webAppUrl,
        sheetName: info.googleSync.sheetName || 'Jadwal_SAS_SMAN2',
        lastSyncedAt: info.googleSync.lastSyncedAt || '',
      }).catch((e) => console.warn('Background server config sync error:', e));
    }
  } catch (e) {
    console.error('Error saving school info:', e);
  }
}

/**
 * Fetch persistent Google Apps Script URL and global configuration from backend server
 */
export async function fetchGlobalServerConfig(): Promise<{ webAppUrl?: string; sheetName?: string; lastSyncedAt?: string } | null> {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.status === 'success' && json?.config) {
      return json.config;
    }
  } catch (err) {
    // offline or static fallback
  }
  return null;
}

/**
 * Persist Google Apps Script URL and global configuration to backend server
 */
export async function saveGlobalServerConfig(config: { webAppUrl: string; sheetName?: string; lastSyncedAt?: string }): Promise<boolean> {
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to save global server config:', err);
    return false;
  }
}

export function getAdminPin(): string {
  return localStorage.getItem(STORAGE_KEY_PIN) || 'admin123';
}

export function setAdminPin(pin: string): void {
  localStorage.setItem(STORAGE_KEY_PIN, pin);
}

// Multi-Admin Management
export function getAdminAccounts(): AdminAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMINS);
    if (!raw) return DEFAULT_ADMINS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((a: AdminAccount) => {
        if (a.id === 'admin-panitia' || a.name === 'Mohamad Hadi Sukron, S.Pd' || a.name === 'Didik Suryadi, S.Pd.') {
          return { ...a, name: 'AJIANSYAH AKBAR, S.Sos', roleTitle: 'Ketua Panitia SAS 2026/2027' };
        }
        if (a.id === 'admin-super' || a.name === 'Dr. H. Purwanto, M.Pd' || a.name === 'Drs. H. Ahmad Fauzi, M.Pd.') {
          return { ...a, name: 'Trisnurini Tantrianingrum, S.Pd, M.M', roleTitle: 'Kepala SMA Negeri 2 Pasuruan' };
        }
        return a;
      });
    }
    return DEFAULT_ADMINS;
  } catch {
    return DEFAULT_ADMINS;
  }
}

export function saveAdminAccounts(admins: AdminAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(admins));
  } catch (e) {
    console.error('Error saving admins:', e);
  }
}

// Teacher Tokens
export function getTeacherTokenConfig(): TeacherTokenConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEACHER_TOKENS);
    if (!raw) return DEFAULT_TEACHER_TOKENS;
    return { ...DEFAULT_TEACHER_TOKENS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_TEACHER_TOKENS;
  }
}

export function saveTeacherTokenConfig(config: TeacherTokenConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_TEACHER_TOKENS, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving teacher token config:', e);
  }
}

// Class Tokens (1 Token Per Kelas)
export function getClassTokenConfig(): ClassTokenConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLASS_TOKENS);
    if (!raw) return { classTokens: generateDefaultClassTokens() };
    const parsed = JSON.parse(raw);
    if (parsed && parsed.classTokens && Object.keys(parsed.classTokens).length > 0) {
      return parsed;
    }
    return { classTokens: generateDefaultClassTokens() };
  } catch {
    return { classTokens: generateDefaultClassTokens() };
  }
}

export function saveClassTokenConfig(config: ClassTokenConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CLASS_TOKENS, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving class token config:', e);
  }
}

// Persistent Auth Session
export function getStoredAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredAuthSession(session: AuthSession | null): void {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
    }
  } catch (e) {
    console.error('Error saving auth session:', e);
  }
}

// Centralized Token / Credential Verification
export function verifyTokenOrPin(input: string): AuthSession | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();

  // 1. Check Multi-Admin credentials
  const admins = getAdminAccounts();
  // Check exact pin match, username match, or legacy admin pin
  const legacyPin = getAdminPin();
  const matchedAdmin = admins.find(
    (a) => a.isActive && (a.pin === trimmed || a.username.toLowerCase() === trimmed.toLowerCase())
  );

  if (matchedAdmin || trimmed === legacyPin || trimmed === 'admin123') {
    return {
      role: 'admin',
      tokenUsed: trimmed,
      displayName: matchedAdmin ? matchedAdmin.name : 'Administrator SAS',
      adminId: matchedAdmin ? matchedAdmin.id : 'admin-super',
      adminRoleTitle: matchedAdmin ? matchedAdmin.roleTitle : 'Super Admin',
      authenticatedAt: new Date().toISOString(),
    };
  }

  // 2. Check Teacher Tokens
  const teacherConfig = getTeacherTokenConfig();
  if (
    upper === teacherConfig.defaultTeacherToken.toUpperCase() ||
    upper === 'GURU' ||
    upper === 'GURU-SMADA' ||
    upper === 'GURU2026'
  ) {
    return {
      role: 'guru',
      tokenUsed: trimmed,
      displayName: 'Guru / Pengawas SAS',
      authenticatedAt: new Date().toISOString(),
    };
  }

  // Check individual teacher token if mapped
  if (teacherConfig.customTeacherTokens) {
    for (const [tName, tToken] of Object.entries(teacherConfig.customTeacherTokens)) {
      if (tToken.toUpperCase() === upper) {
        return {
          role: 'guru',
          tokenUsed: trimmed,
          displayName: tName,
          lockedTeacher: tName,
          authenticatedAt: new Date().toISOString(),
        };
      }
    }
  }

  // 3. Check Class Tokens (1 Token Per Kelas)
  const classConfig = getClassTokenConfig();
  for (const [cls, token] of Object.entries(classConfig.classTokens)) {
    if (token.toUpperCase() === upper) {
      return {
        role: 'kelas',
        tokenUsed: trimmed,
        displayName: `Peserta Didik Kelas ${cls}`,
        lockedClass: cls,
        authenticatedAt: new Date().toISOString(),
      };
    }
  }

  // Also match standard fallback patterns e.g. 'KELAS-X-1', 'SAS-X1'
  for (const cls of ALL_CLASSES) {
    const compact = cls.replace('-', '');
    if (
      upper === `SAS-${compact}` ||
      upper === `KELAS-${compact}` ||
      upper === `KELAS-${cls}` ||
      upper === cls.toUpperCase()
    ) {
      return {
        role: 'kelas',
        tokenUsed: trimmed,
        displayName: `Peserta Didik Kelas ${cls}`,
        lockedClass: cls,
        authenticatedAt: new Date().toISOString(),
      };
    }
  }

  return null;
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
