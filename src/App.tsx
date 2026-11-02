import React, { useState, useEffect } from 'react';
import { 
  ScheduleSlot, 
  SchoolInfo, 
  UserRole, 
  ALL_CLASSES 
} from './types/schedule';
import { 
  getStoredSlots, 
  saveStoredSlots, 
  getStoredSchoolInfo, 
  saveStoredSchoolInfo, 
  resetToDefaultData 
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
  Bell
} from 'lucide-react';

export default function App() {
  // App state
  const [slots, setSlots] = useState<ScheduleSlot[]>(() => getStoredSlots());
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => getStoredSchoolInfo());
  const [role, setRole] = useState<UserRole>('siswa');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'matrix' | 'class' | 'teacher' | 'agenda' | 'stats' | 'admin' | 'settings'>('matrix');

  // Selected filters / context
  const [selectedClass, setSelectedClass] = useState<string>('X-1');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);

  // Read URL query params on initial mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get('role');
      const urlClass = params.get('kelas');
      const urlGuru = params.get('guru');
      const urlTab = params.get('tab');

      if (urlRole === 'admin') {
        // Require auth before admin
        setShowAuthModal(true);
      } else if (urlRole === 'guru') {
        setRole('guru');
        if (urlGuru) {
          setSelectedTeacher(urlGuru);
          setActiveTab('teacher');
        }
      } else if (urlRole === 'siswa') {
        setRole('siswa');
      }

      if (urlClass && ALL_CLASSES.includes(urlClass)) {
        setSelectedClass(urlClass);
        setActiveTab('class');
      }

      if (urlTab && ['matrix', 'class', 'teacher', 'agenda', 'stats'].includes(urlTab)) {
        setActiveTab(urlTab as any);
      }
    } catch (e) {
      console.error('Failed reading URL params:', e);
    }
  }, []);

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
        setShowAuthModal(true);
      }
    } else {
      setRole(targetRole);
      if (activeTab === 'admin') {
        setActiveTab('matrix');
      }
    }
  };

  // Admin Auth success
  const handleAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    setRole('admin');
    setShowAuthModal(false);
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

  // Quick Print trigger
  const handlePrintA3 = () => {
    setActiveTab('matrix');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header
        schoolInfo={schoolInfo}
        currentRole={role}
        onRoleChange={handleRoleChange}
        onOpenShareModal={() => setShowShareModal(true)}
        onPrintA3={handlePrintA3}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Tab Navigation Bar */}
      <div className="bg-white border-b border-slate-200 shadow-2xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-1 sm:space-x-4 overflow-x-auto py-2">
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'matrix'
                  ? 'bg-blue-50 text-blue-900 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Grid3X3 className="w-4 h-4 text-blue-700" />
              <span>Matriks Terintegrasi (A3)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('class')}
              className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'class'
                  ? 'bg-blue-50 text-blue-900 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-blue-700" />
              <span>Jadwal Per Kelas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('teacher')}
              className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'teacher'
                  ? 'bg-blue-50 text-blue-900 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <UserCheck className="w-4 h-4 text-blue-700" />
              <span>Portal Guru & Pengawas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('agenda')}
              className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'agenda'
                  ? 'bg-blue-50 text-blue-900 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-blue-700" />
              <span>Agenda Harian</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'stats'
                  ? 'bg-blue-50 text-blue-900 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-blue-700" />
              <span>⚡ Cek Bentrok 100%</span>
            </button>

            {/* Menu Pengaturan / Settings */}
            <button
              type="button"
              onClick={() => {
                if (role === 'admin' || isAdminAuthenticated) {
                  setActiveTab('settings');
                } else {
                  setShowAuthModal(true);
                }
              }}
              className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="Atur kop surat, tanda tangan kepala sekolah & ketua panitia, logo, dan tata tertib"
            >
              <Sliders className="w-4 h-4 text-emerald-500" />
              <span>Pengaturan & TTD</span>
            </button>

            {role === 'admin' && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'admin'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Settings2 className="w-4 h-4 text-emerald-400" />
                <span>Panel CRUD Admin</span>
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Notice Banner for Public / Siswa mode */}
        {role === 'siswa' && (
          <div className="mb-4 p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-700 flex-shrink-0" />
              <span>
                <strong>Mode Publik / Siswa:</strong> Anda dapat melihat jadwal lengkap, memilih kelas, dan mencetak jadwal ujian resmi tanpa hambatan.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="text-blue-800 underline font-semibold hover:text-blue-950 flex-shrink-0 ml-2"
            >
              Bagikan
            </button>
          </div>
        )}

        {/* Tab 1: Integrated Matrix View */}
        {activeTab === 'matrix' && (
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
