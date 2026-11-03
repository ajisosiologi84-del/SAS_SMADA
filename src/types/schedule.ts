export interface ScheduleEntry {
  subject: string;
  teacher: string;
}

export interface ScheduleSlot {
  id: string;
  slotName: string;
  week: string;
  dayAndDate: string;
  session: string;
  time: string;
  entries: Record<string, ScheduleEntry | null>;
}

export type UserRole = 'admin' | 'guru' | 'kelas' | 'siswa';

export interface AdminAccount {
  id: string;
  name: string;
  username: string;
  pin: string;
  roleTitle: string;
  createdAt: string;
  isActive: boolean;
}

export interface TeacherTokenConfig {
  defaultTeacherToken: string;
  customTeacherTokens?: Record<string, string>;
}

export interface ClassTokenConfig {
  classTokens: Record<string, string>;
}

export interface AuthSession {
  role: UserRole;
  tokenUsed: string;
  displayName: string;
  adminId?: string;
  adminRoleTitle?: string;
  lockedClass?: string;
  lockedTeacher?: string;
  authenticatedAt: string;
}

export interface SchoolInfo {
  name: string;
  subTitle: string;
  academicYear: string;
  semester: string;
  governmentTitle: string;
  address: string;
  city: string;
  website: string;
  email: string;
  curriculum: string;
  signPlaceAndDate: string;
  // Kepala Sekolah
  headmasterTitle: string;
  headmasterName: string;
  headmasterNip: string;
  headmasterSignatureImage?: string; // base64 or URL
  headmasterStampImage?: string; // base64 or URL
  // Ketua Panitia
  committeeTitle: string;
  committeeName: string;
  committeeNip: string;
  committeeSignatureImage?: string; // base64 or URL
  // School Logo & Stamp
  schoolLogoImage?: string; // base64 or URL
  schoolRightBadgeText?: string;
  // Rules & Notes
  examRules: string[];
  examNotes: string[];
  // Sesi Waktu Otomatis
  sessionTimes?: SessionTimePreset;
  // Google Sheets Integration
  googleSync?: GoogleSyncConfig;
}

export interface SessionTimePreset {
  session1: string; // Default: 07.30 - 09.00 WIB
  session2: string; // Default: 09.30 - 11.00 WIB
  fridaySession1: string; // Default: 07.00 - 08.30 WIB
  fridaySession2: string; // Default: 09.00 - 10.30 WIB
}

export interface GoogleSyncConfig {
  webAppUrl: string;
  spreadsheetId?: string;
  sheetName?: string;
  lastSyncedAt?: string;
}

export const ALL_CLASSES: string[] = [
  'X-1', 'X-2', 'X-3', 'X-4', 'X-5', 'X-6', 'X-7', 'X-8', 'X-9', 'X-10',
  'XI-1', 'XI-2', 'XI-3', 'XI-4', 'XI-5', 'XI-6', 'XI-7', 'XI-8', 'XI-9', 'XI-10',
  'XII-1', 'XII-2', 'XII-3', 'XII-4', 'XII-5', 'XII-6', 'XII-7', 'XII-8', 'XII-9', 'XII-10',
];

export const GRADE_GROUPS = {
  'X': ['X-1', 'X-2', 'X-3', 'X-4', 'X-5', 'X-6', 'X-7', 'X-8', 'X-9', 'X-10'],
  'XI': ['XI-1', 'XI-2', 'XI-3', 'XI-4', 'XI-5', 'XI-6', 'XI-7', 'XI-8', 'XI-9', 'XI-10'],
  'XII': ['XII-1', 'XII-2', 'XII-3', 'XII-4', 'XII-5', 'XII-6', 'XII-7', 'XII-8', 'XII-9', 'XII-10'],
} as const;
