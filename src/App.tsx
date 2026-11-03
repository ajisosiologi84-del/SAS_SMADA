import React, { useState, useEffect } from 'react';
import { 
  ScheduleSlot, 
  SchoolInfo, 
  UserRole, 
  ALL_CLASSES,
  AuthSession 
} from './types/schedule';
import { 
  getStoredSlots, 
  saveStoredSlots, 
  getStoredSchoolInfo, 
  saveStoredSchoolInfo, 
  resetToDefaultData,
  getStoredAuthSession,
  saveStoredAuthSession,
  verifyTokenOrPin
} from './utils/storage';

// Components
import { Header } from './components/Header';
import { MatrixView } from './components/MatrixView';
import { ClassView } from './components/ClassView';
import { TeacherView } from './components/TeacherView';
import { DailyAgendaView } from './components/DailyAgendaView';
import { StatsView } from './components/StatsView';
import { AdminPanel } from './components/AdminPanel';
import { SettingsView } from './components/SettingsView';
import { LoginPortalScreen } from './components/LoginPortalScreen';

// Modals
import { AdminAuthModal } from './components/Modals/AdminAuthModal';
import { EditSlotModal } from './components/Modals/EditSlotModal';
import { UploadModal } from './components/Modals/UploadModal';
import { ShareModal } from './components/Modals/ShareModal';

// Icons
import { 
  Grid3X3, 
  GraduationCap, 
  UserCheck, 
  CalendarDays, 
  BarChart3, 
  Settings2,
  Sliders,
  Bell,
  ShieldCheck,
  Lock,
  KeyRound
} from 'lucide-react';

export default function App() {
  // App state
  const [slots, setSlots] = useState<ScheduleSlot[]>(() => getStoredSlots());
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => getStoredSchoolInfo());
  
  // Auth Session state
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => getStoredAuthSession());
  const [role, setRole] = useState<UserRole>(() => {
    const session = getStoredAuthSession();
    return session ? session.role : 'siswa';
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    const session = getStoredAuthSession();
    return session ? session.role === 'admin' : false;
  });

  // Active navigation tab (matrix is ONLY for admin, students and classes default to class)
  const [activeTab, setActiveTab] = useState<'matrix' | 'class' | 'teacher' | 'agenda' | 'stats' | 'admin' | 'settings'>(() => {
    const session = getStoredAuthSession();
    if (session?.role === 'guru') return 'teacher';
    if (session?.role === 'kelas') return 'class';
    if (session?.role === 'admin') return 'matrix';
    return 'class';
  });

  // Selected filters / context
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    const session = getStoredAuthSession();
    return session?.lockedClass || 'X-1';
  });
  const [selectedTeacher, setSelectedTeacher] = useState<string>(() => {
    const session = getStoredAuthSession();
    return session?.lockedTeacher || '';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'auto' | 'admin' | 'guru' | 'kelas'>('auto');
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);

  // Read URL query params on initial mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      const urlRole = params.get('role');
      const urlClass = params.get('kelas');
      const urlGuru = params.get('guru');
      const urlTab = params.get('tab');

      // Auto-authenticate if valid token is provided in URL
      if (urlToken) {
        const verified = verifyTokenOrPin(urlToken);
        if (verified) {
          handleAuthSuccess(verified);
          return;
        }
      }

      // If user is logged in as guru or class, strictly maintain their designated scope
      const currentSession = getStoredAuthSession();
      if (currentSession?.role === 'guru') {
        setActiveTab('teacher');
        return;
      }
      if (currentSession?.role === 'kelas') {
        setActiveTab('class');
        if (currentSession.lockedClass) setSelectedClass(currentSession.lockedClass);
        return;
      }

      if (urlRole === 'admin') {
        if (!isAdminAuthenticated) {
          setAuthModalTab('admin');
          setShowAuthModal(true);
        }
      } else if (urlRole === 'guru') {
        setRole('guru');
        if (urlGuru) setSelectedTeacher(urlGuru);
        setActiveTab('teacher');
      }

      if (urlClass && ALL_CLASSES.includes(urlClass)) {
        setSelectedClass(urlClass);
        setActiveTab('class');
      }

      if (urlTab && ['matrix', 'class', 'teacher', 'agenda', 'stats'].includes(urlTab)) {
        if (urlTab === 'matrix') {
          // Matrix A3 is STRICTLY restricted to Admin
          if (currentSession?.role === 'admin' || isAdminAuthenticated) {
            setActiveTab('matrix');
          } else {
            setActiveTab('class');
          }
        } else {
          setActiveTab(urlTab as any);
        }
      }
    } catch (e) {
      console.error('Failed reading URL params:', e);
    }
  }, [isAdminAuthenticated]);

  // Ensure that if role is siswa or kelas, activeTab can never be matrix
  useEffect(() => {
    if ((role === 'siswa' || role === 'kelas') && activeTab === 'matrix') {
      setActiveTab('class');
    }
  }, [role, activeTab]);

  // Save changes to storage whenever slots or schoolInfo update
  const handleUpdateSlots = (newSlots: ScheduleSlot[]) => {
    setSlots(newSlots);
    saveStoredSlots(newSlots);
  };

  const handleUpdateSchoolInfo = (newInfo: SchoolInfo) => {
    setSchoolInfo(newInfo);
    saveStoredSchoolInfo(newInfo);
  };

  // Role switch handler
  const handleRoleChange = (targetRole: UserRole) => {
    if (targetRole === 'admin') {
      if (isAdminAuthenticated) {
        setRole('admin');
        setActiveTab('admin');
      } else {
        setAuthModalTab('admin');
        setShowAuthModal(true);
      }
    } else if (targetRole === 'guru') {
      if (role === 'guru') {
        setActiveTab('teacher');
      } else {
        setAuthModalTab('guru');
        setShowAuthModal(true);
      }
    } else if (targetRole === 'kelas') {
      if (role === 'kelas') {
        setActiveTab('class');
      } else {
        setAuthModalTab('kelas');
        setShowAuthModal(true);
      }
    } else {
      setRole('siswa');
      if (activeTab === 'admin' || activeTab === 'settings' || activeTab === 'matrix') {
        setActiveTab('class');
      }
    }
  };

  // Auth success with session
  const handleAuthSuccess = (session: AuthSession) => {
    setAuthSession(session);
    saveStoredAuthSession(session);
    setRole(session.role);
    setShowAuthModal(false);

    if (session.role === 'admin') {
      setIsAdminAuthenticated(true);
      setActiveTab('admin');
    } else if (session.role === 'guru') {
      setIsAdminAuthenticated(false);
      if (session.lockedTeacher) {
        setSelectedTeacher(session.lockedTeacher);
      }
      setActiveTab('teacher');
    } else if (session.role === 'kelas') {
      setIsAdminAuthenticated(false);
      if (session.lockedClass) {
        setSelectedClass(session.lockedClass);
      }
      setActiveTab('class');
    }
  };

  // Logout handler
  const handleLogout = () => {
    saveStoredAuthSession(null);
    setAuthSession(null);
    setRole('siswa');
    setIsAdminAuthenticated(false);
    setActiveTab('class');
  };

  // Slot CRUD handlers
  const handleOpenAddNewSlot = () => {
    setEditingSlot(null);
    setShowEditModal(true);
  };

  const handleOpenEditSlot = (slot: ScheduleSlot) => {
    setEditingSlot(slot);
    setShowEditModal(true);
  };

  const handleSaveSlot = (updatedSlot: ScheduleSlot) => {
    const exists = slots.some((s) => s.id === updatedSlot.id);
    let updated: ScheduleSlot[];
    if (exists) {
      updated = slots.map((s) => (s.id === updatedSlot.id ? updatedSlot : s));
    } else {
      updated = [...slots, updatedSlot];
    }
    handleUpdateSlots(updated);
  };

  const handleDeleteSlot = (slotId: string) => {
    const updated = slots.filter((s) => s.id !== slotId);
    handleUpdateSlots(updated);
  };

  const handleResetData = () => {
    const res = resetToDefaultData();
    setSlots(res.slots);
    setSchoolInfo(res.school);
  };

  // Quick Print trigger (Khusus Admin)
  const handlePrintA3 = () => {
    if (role !== 'admin') return;
    setActiveTab('matrix');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Jika pengguna belum login, langsung tampilkan Login Portal Screen terlebih dahulu!
  if (!authSession) {
    return (
      <LoginPortalScreen
        schoolInfo={schoolInfo}
        onLoginSuccess={handleAuthSuccess}
        onContinueAsStudent={() => {
          const studentSession: AuthSession = {
            role: 'siswa',
            tokenUsed: 'PUBLIK',
            displayName: 'Siswa / Tamu Publik',
            authenticatedAt: new Date().toISOString(),
          };
          handleAuthSuccess(studentSession);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header
        schoolInfo={schoolInfo}
        currentRole={role}
        authSession={authSession}
        onRoleChange={handleRoleChange}
        onOpenAuthModal={(tab) => {
          setAuthModalTab(tab || 'auto');
          setShowAuthModal(true);
        }}
        onLogout={handleLogout}
        onOpenShareModal={() => setShowShareModal(true)}
        onPrintA3={handlePrintA3}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Tab Navigation Bar */}
      <div className="bg-white border-b border-slate-200 shadow-2xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-1 sm:space-x-3 overflow-x-auto py-2">
            {/* If GURU: Guru ONLY accesses Portal Guru & Pengawas */}
            {role === 'guru' && (
              <button
                type="button"
                onClick={() => setActiveTab('teacher')}
                className="flex items-center gap-2 py-2 px-3.5 text-xs font-bold rounded-lg bg-blue-700 text-white shadow-xs whitespace-nowrap"
              >
                <UserCheck className="w-4 h-4 text-blue-200" />
                <span>Portal Guru & Pengawas SAS</span>
              </button>
            )}

            {/* If KELAS: Class ONLY accesses Jadwal Per Kelas */}
            {role === 'kelas' && (
              <button
                type="button"
                onClick={() => setActiveTab('class')}
                className="flex items-center gap-2 py-2 px-3.5 text-xs font-bold rounded-lg bg-purple-700 text-white shadow-xs whitespace-nowrap"
              >
                <GraduationCap className="w-4 h-4 text-purple-200" />
                <span>Jadwal Resmi Kelas {authSession?.lockedClass || selectedClass}</span>
              </button>
            )}

            {/* If ADMIN or SISWA: standard menus */}
            {role !== 'guru' && role !== 'kelas' && (
              <>
                {/* Matriks Terintegrasi (A3) - KHUSUS ADMIN (Tidak tampil di akun kelas/siswa) */}
                {role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('matrix')}
                    className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === 'matrix'
                        ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4 text-blue-700" />
                    <span>Matriks Terintegrasi (A3)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('class')}
                  className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'class'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-blue-700" />
                  <span>Jadwal Per Kelas</span>
                </button>

                {role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('teacher')}
                    className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === 'teacher'
                        ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-blue-700" />
                    <span>Portal Guru & Pengawas</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('agenda')}
                  className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'agenda'
                      ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <CalendarDays className="w-4 h-4 text-blue-700" />
                  <span>Agenda Harian</span>
                </button>

                {role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('stats')}
                    className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === 'stats'
                        ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-blue-700" />
                    <span>⚡ Cek Bentrok 100%</span>
                  </button>
                )}

                {/* Settings / Multi-Admin Menu */}
                <button
                  type="button"
                  onClick={() => {
                    if (role === 'admin' || isAdminAuthenticated) {
                      setActiveTab('settings');
                    } else {
                      setAuthModalTab('admin');
                      setShowAuthModal(true);
                    }
                  }}
                  className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'settings'
                      ? 'bg-blue-900 text-white shadow-xs font-bold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  title="Atur multi-admin, token guru/kelas, kop surat, tanda tangan, dan Google Sheets"
                >
                  <Sliders className="w-4 h-4 text-emerald-500" />
                  <span>Pengaturan & Token</span>
                </button>

                {role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('admin')}
                    className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === 'admin'
                        ? 'bg-slate-900 text-white shadow-xs font-bold'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Settings2 className="w-4 h-4 text-emerald-400" />
                    <span>Panel CRUD Admin</span>
                  </button>
                )}
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Role Notice Banners */}
        {role === 'guru' && (
          <div className="mb-4 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 no-print shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold">Portal Guru & Pengawas SAS (Akun Terverifikasi)</p>
                <p className="text-[11px] text-blue-800">
                  Hak akses Anda dikhususkan untuk Portal Guru & Pengawas SAS guna mengecek dan mencetak jadwal tugas mengawas.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-rose-700 hover:text-rose-900 font-semibold underline px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors self-end sm:self-auto"
            >
              Keluar Akun Guru
            </button>
          </div>
        )}

        {role === 'kelas' && (
          <div className="mb-4 p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 no-print shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-purple-100 rounded-lg text-purple-700">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold">Akun Resmi Kelas {authSession?.lockedClass || selectedClass} (Terverifikasi)</p>
                <p className="text-[11px] text-purple-800">
                  Hak akses per kelas dikhususkan untuk menu Jadwal Per Kelas dan cetak kartu ujian resmi.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-rose-700 hover:text-rose-900 font-semibold underline px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors self-end sm:self-auto"
            >
              Keluar Akun Kelas
            </button>
          </div>
        )}

        {role === 'admin' && (
          <div className="mb-4 p-3.5 bg-slate-900 text-white rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs no-print">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white/10 rounded-lg text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold">
                  Mode Multi-Admin Aktif: {authSession?.displayName || 'Administrator'} ({authSession?.adminRoleTitle || 'Super Admin'})
                </p>
                <p className="text-[11px] text-slate-300">
                  Akses penuh seluruh menu jadwal, manajemen CRUD slot, cek bentrok 100%, pengaturan stempel/TTD, dan token kelas/guru.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-rose-300 hover:text-white font-semibold underline px-2.5 py-1 hover:bg-white/10 rounded-lg transition-colors self-end sm:self-auto"
            >
              Keluar Admin
            </button>
          </div>
        )}

        {role === 'siswa' && (
          <div className="mb-4 p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 no-print">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-700 flex-shrink-0" />
              <span>
                <strong>Portal Jadwal Resmi Siswa:</strong> Pilih kelas Anda pada menu <strong>Jadwal Per Kelas</strong> untuk memantau waktu ujian, mengunduh JPG/Excel, dan mencetak jadwal resmi.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('auto');
                  setShowAuthModal(true);
                }}
                className="text-blue-800 underline font-bold hover:text-blue-950 text-xs flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Masuk Akun Guru / Kelas</span>
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="text-blue-800 underline font-semibold hover:text-blue-950"
              >
                Bagikan
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Integrated Matrix View - KHUSUS ADMIN (Tidak tampil di akun kelas/siswa) */}
        {activeTab === 'matrix' && role === 'admin' && (
          <MatrixView
            slots={slots}
            schoolInfo={schoolInfo}
            role={role}
            searchQuery={searchQuery}
            onEditSlot={handleOpenEditSlot}
            onAddNewSlot={handleOpenAddNewSlot}
            onOpenUpload={() => setShowUploadModal(true)}
            onPrintA3={handlePrintA3}
            onUpdateSlots={handleUpdateSlots}
          />
        )}

        {/* Tab 2: Single Class View */}
        {activeTab === 'class' && (
          <ClassView
            slots={slots}
            schoolInfo={schoolInfo}
            selectedClass={selectedClass}
            onSelectClass={setSelectedClass}
            role={role}
            onOpenShareModal={() => setShowShareModal(true)}
          />
        )}

        {/* Tab 3: Teacher Portal View */}
        {activeTab === 'teacher' && (
          <TeacherView
            slots={slots}
            schoolInfo={schoolInfo}
            initialTeacher={selectedTeacher}
          />
        )}

        {/* Tab 4: Daily Agenda Timeline View */}
        {activeTab === 'agenda' && (
          <DailyAgendaView
            slots={slots}
            schoolInfo={schoolInfo}
            onSelectClass={(cls) => {
              setSelectedClass(cls);
              setActiveTab('class');
            }}
          />
        )}

        {/* Tab 5: Statistics, Conflict Checker & 100% Conflict-Free Generator */}
        {activeTab === 'stats' && (
          <StatsView
            slots={slots}
            schoolInfo={schoolInfo}
            onUpdateSlots={handleUpdateSlots}
            onSelectTeacher={(name) => {
              setSelectedTeacher(name);
              setActiveTab('teacher');
            }}
          />
        )}

        {/* Tab 6: Admin Panel CRUD */}
        {activeTab === 'admin' && role === 'admin' && (
          <AdminPanel
            slots={slots}
            schoolInfo={schoolInfo}
            onUpdateSchoolInfo={handleUpdateSchoolInfo}
            onAddNewSlot={handleOpenAddNewSlot}
            onEditSlot={handleOpenEditSlot}
            onDeleteSlot={handleDeleteSlot}
            onOpenUpload={() => setShowUploadModal(true)}
            onResetData={handleResetData}
            onNavigateToSettings={() => setActiveTab('settings')}
            onUpdateSlots={handleUpdateSlots}
          />
        )}

        {/* Tab 7: Comprehensive Settings & Signatures */}
        {activeTab === 'settings' && (
          <SettingsView
            schoolInfo={schoolInfo}
            slots={slots}
            onUpdateSchoolInfo={handleUpdateSchoolInfo}
            onUpdateSlots={handleUpdateSlots}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-700">
            {schoolInfo.name} · Tahun Pelajaran {schoolInfo.academicYear}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Sistem Informasi Jadwal Sumatif Akhir Semester (SAS) Terintegrasi Kelas X, XI, & XII
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Terverifikasi Kurikulum Merdeka · Revisi v2 · 0% Bentrok Pengampu
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AdminAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        initialRoleTab={authModalTab}
      />

      <EditSlotModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingSlot(null);
        }}
        onSave={handleSaveSlot}
        onDelete={handleDeleteSlot}
        initialSlot={editingSlot}
        existingSlots={slots}
      />

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onImportSuccess={handleUpdateSlots}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        selectedClass={selectedClass}
      />
    </div>
  );
}
