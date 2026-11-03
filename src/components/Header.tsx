import React from 'react';
import { UserRole, SchoolInfo, AuthSession } from '../types/schedule';
import { 
  ShieldCheck, 
  GraduationCap, 
  UserCheck, 
  Share2, 
  Printer, 
  Search, 
  Lock, 
  KeyRound, 
  LogOut,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  schoolInfo: SchoolInfo;
  currentRole: UserRole;
  authSession: AuthSession | null;
  onRoleChange: (role: UserRole) => void;
  onOpenAuthModal: (tab?: 'auto' | 'admin' | 'guru' | 'kelas') => void;
  onLogout: () => void;
  onOpenShareModal: () => void;
  onPrintA3: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  schoolInfo,
  currentRole,
  authSession,
  onRoleChange,
  onOpenAuthModal,
  onLogout,
  onOpenShareModal,
  onPrintA3,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Logo & School Identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-blue-900 text-white flex items-center justify-center font-black text-sm tracking-tighter shadow-xs border border-blue-950 flex-shrink-0">
              SMADA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                  {schoolInfo.name}
                </h1>
                <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  SAS {schoolInfo.academicYear}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span>Jadwal Terintegrasi Kelas X, XI, & XII</span>
                <span aria-hidden="true">·</span>
                <span>Pasuruan, Jawa Timur</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-medium">Revisi v2 (0% Bentrok)</span>
              </div>
            </div>
          </div>

          {/* Controls: Search, Auth Status, Share, Print */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[180px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari guru, mapel, kelas..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ×
                </button>
              )}
            </div>

            {/* Account Status Badge or Login Button */}
            {authSession ? (
              <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-lg">
                {authSession.role === 'admin' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-md text-xs font-semibold shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="max-w-[140px] truncate" title={authSession.displayName}>
                      {authSession.adminRoleTitle || authSession.displayName}
                    </span>
                  </div>
                )}

                {authSession.role === 'guru' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-700 text-white rounded-md text-xs font-semibold shadow-2xs">
                    <UserCheck className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                    <span className="max-w-[130px] truncate" title={authSession.displayName}>
                      {authSession.lockedTeacher || 'Guru SAS'}
                    </span>
                  </div>
                )}

                {authSession.role === 'kelas' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-700 text-white rounded-md text-xs font-semibold shadow-2xs">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-200 shrink-0" />
                    <span className="font-bold">
                      Kelas {authSession.lockedClass}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  title="Keluar / Ganti Akun"
                  aria-label="Keluar"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuthModal('auto')}
                className="px-3 py-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                title="Masuk dengan Token Guru, Token Kelas, atau PIN Admin"
              >
                <KeyRound className="w-3.5 h-3.5 text-blue-700" />
                <span>Masuk dengan Token / PIN</span>
              </button>
            )}

            {/* Share Public Link Button */}
            <button
              type="button"
              onClick={onOpenShareModal}
              className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              title="Bagikan Tautan Jadwal ke Siswa / WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Bagikan</span>
            </button>

            {/* Quick Print A3 Button (Khusus Admin) */}
            {currentRole === 'admin' && (
              <button
                type="button"
                onClick={onPrintA3}
                className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                title="Cetak Jadwal Format A3 Landscape (Khusus Admin)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cetak A3</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
