import React, { useState } from 'react';
import { 
  SchoolInfo, 
  ScheduleSlot, 
  ALL_CLASSES,
  SessionTimePreset,
  GoogleSyncConfig
} from '../types/schedule';
import { 
  Save, 
  Check, 
  RotateCcw, 
  Upload, 
  Trash2, 
  Plus, 
  School, 
  FileSignature, 
  ListChecks, 
  RefreshCw, 
  Key, 
  Download, 
  AlertTriangle, 
  Clock,
  FileSpreadsheet,
  Copy,
  ExternalLink,
  CheckCircle2,
  Send,
  DownloadCloud,
  Layers,
  Settings2,
  PenTool
} from 'lucide-react';
import { getAdminPin, setAdminPin } from '../utils/storage';
import { GOOGLE_APPS_SCRIPT_CODE } from '../data/appScriptCode';
import { DigitalSignatureModal } from './Modals/DigitalSignatureModal';

interface SettingsViewProps {
  schoolInfo: SchoolInfo;
  slots: ScheduleSlot[];
  onUpdateSchoolInfo: (info: SchoolInfo) => void;
  onUpdateSlots: (slots: ScheduleSlot[]) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  schoolInfo,
  slots,
  onUpdateSchoolInfo,
  onUpdateSlots,
  onResetData,
}) => {
  // Active settings subtab
  const [activeSubTab, setActiveSubTab] = useState<'kop' | 'ttd' | 'time' | 'sheets' | 'rules' | 'batch' | 'backup'>('kop');

  // Form state for schoolInfo
  const [form, setForm] = useState<SchoolInfo>({
    ...schoolInfo,
    examRules: [...(schoolInfo.examRules || [])],
    examNotes: [...(schoolInfo.examNotes || [])],
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Session Times state
  const [sessionTimes, setSessionTimes] = useState<SessionTimePreset>(() => {
    return schoolInfo.sessionTimes || {
      session1: '07.30 - 09.30 WIB',
      session2: '10.30 - 12.00 WIB',
      fridaySession1: '07.00 - 09.00 WIB',
      fridaySession2: '09.00 - 11.00 WIB',
    };
  });
  const [timeSuccessMessage, setTimeSuccessMessage] = useState<string | null>(null);

  // Google Sheets Sync state
  const [googleSync, setGoogleSync] = useState<GoogleSyncConfig>(() => {
    return schoolInfo.googleSync || {
      webAppUrl: '',
      sheetName: 'Jadwal_SAS_SMAN2',
      lastSyncedAt: '',
    };
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // New rule input
  const [newRule, setNewRule] = useState('');
  const [newNote, setNewNote] = useState('');

  // Batch find and replace states
  const [batchType, setBatchType] = useState<'teacher' | 'subject'>('teacher');
  const [targetFrom, setTargetFrom] = useState('');
  const [targetTo, setTargetTo] = useState('');
  const [batchMessage, setBatchMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // PIN state
  const [adminPin, setAdminPinInput] = useState('');
  const [pinMessage, setPinMessage] = useState(false);

  // Digital Signature Modal state & Toast
  const [signatureModal, setSignatureModal] = useState<{
    isOpen: boolean;
    target: 'committee' | 'headmaster';
    title: string;
    signeeName: string;
    signeeTitle: string;
    currentSignature?: string;
  }>({
    isOpen: false,
    target: 'committee',
    title: 'Tanda Tangan Digital Ketua Panitia SAS',
    signeeName: form.committeeName,
    signeeTitle: form.committeeTitle,
    currentSignature: form.committeeSignatureImage,
  });
  const [signatureNotice, setSignatureNotice] = useState<string | null>(null);

  const handleSaveSignatureFromModal = (base64: string) => {
    if (signatureModal.target === 'committee') {
      const updated = {
        ...form,
        committeeSignatureImage: base64,
        sessionTimes,
        googleSync,
      };
      setForm(updated);
      onUpdateSchoolInfo(updated);
      setSignatureNotice('✓ Tanda tangan digital Ketua Panitia berhasil disimpan & aktif untuk cetak A4/F4/A3!');
      setTimeout(() => setSignatureNotice(null), 4000);
    } else {
      const updated = {
        ...form,
        headmasterSignatureImage: base64,
        sessionTimes,
        googleSync,
      };
      setForm(updated);
      onUpdateSchoolInfo(updated);
      setSignatureNotice('✓ Tanda tangan digital Kepala Sekolah berhasil disimpan & aktif untuk cetak A4/F4/A3!');
      setTimeout(() => setSignatureNotice(null), 4000);
    }
  };

  // Unique teachers and subjects for batch replace
  const { uniqueTeachers, uniqueSubjects } = React.useMemo(() => {
    const teachers = new Set<string>();
    const subjects = new Set<string>();

    slots.forEach((slot) => {
      ALL_CLASSES.forEach((cls) => {
        const entry = slot.entries[cls];
        if (entry?.teacher) teachers.add(entry.teacher.trim());
        if (entry?.subject) subjects.add(entry.subject.trim());
      });
    });

    return {
      uniqueTeachers: Array.from(teachers).sort(),
      uniqueSubjects: Array.from(subjects).sort(),
    };
  }, [slots]);

  // Handle general save
  const handleSave = () => {
    const updated = {
      ...form,
      sessionTimes,
      googleSync,
    };
    onUpdateSchoolInfo(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Handle image upload helper with auto-save
  const handleImageUpload = (
    field: 'schoolLogoImage' | 'headmasterSignatureImage' | 'headmasterStampImage' | 'committeeSignatureImage',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        const updated = {
          ...form,
          [field]: base64,
          sessionTimes,
          googleSync,
        };
        setForm(updated);
        onUpdateSchoolInfo(updated);
        if (field === 'committeeSignatureImage') {
          setSignatureNotice('✓ Berkas tanda tangan digital Ketua Panitia berhasil diunggah & disimpan!');
          setTimeout(() => setSignatureNotice(null), 4000);
        } else if (field === 'headmasterSignatureImage') {
          setSignatureNotice('✓ Berkas tanda tangan digital Kepala Sekolah berhasil diunggah & disimpan!');
          setTimeout(() => setSignatureNotice(null), 4000);
        } else if (field === 'schoolLogoImage') {
          setSignatureNotice('✓ Logo sekolah berhasil diunggah & disimpan!');
          setTimeout(() => setSignatureNotice(null), 4000);
        } else if (field === 'headmasterStampImage') {
          setSignatureNotice('✓ Stempel sekolah berhasil diunggah & disimpan!');
          setTimeout(() => setSignatureNotice(null), 4000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // =========================================================================
  // 1. PENGATURAN PERUBAHAN JAM SETIAP SESI SECARA OTOMATIS
  // =========================================================================
  const handleApplySessionTimesToAll = () => {
    let count = 0;
    const updatedSlots = slots.map((slot) => {
      let newTime = slot.time;
      const isFriday = slot.dayAndDate.toLowerCase().includes('jumat');

      if (slot.session.includes('Sesi 1') || slot.session.toLowerCase().includes('jam ke-1')) {
        newTime = isFriday ? sessionTimes.fridaySession1 : sessionTimes.session1;
        count++;
      } else if (slot.session.includes('Sesi 2') || slot.session.toLowerCase().includes('jam ke-2')) {
        newTime = isFriday ? sessionTimes.fridaySession2 : sessionTimes.session2;
        count++;
      }

      return {
        ...slot,
        time: newTime,
      };
    });

    onUpdateSlots(updatedSlots);
    const updatedInfo = { ...form, sessionTimes, googleSync };
    setForm(updatedInfo);
    onUpdateSchoolInfo(updatedInfo);

    setTimeSuccessMessage(`Berhasil memperbarui waktu ujian pada ${count} sesi slot jadwal secara serentak!`);
    setTimeout(() => setTimeSuccessMessage(null), 4000);
  };

  const handleApplyPreset = (preset: 'standard' | '120min' | 'ramadhan') => {
    if (preset === '120min') {
      setSessionTimes({
        session1: '07.30 - 09.30 WIB',
        session2: '10.00 - 12.00 WIB',
        fridaySession1: '07.00 - 09.00 WIB',
        fridaySession2: '09.30 - 11.30 WIB',
      });
    } else if (preset === 'standard') {
      setSessionTimes({
        session1: '07.30 - 09.00 WIB',
        session2: '09.30 - 11.00 WIB',
        fridaySession1: '07.00 - 08.30 WIB',
        fridaySession2: '09.00 - 10.30 WIB',
      });
    } else if (preset === 'ramadhan') {
      setSessionTimes({
        session1: '07.30 - 08.30 WIB',
        session2: '09.00 - 10.00 WIB',
        fridaySession1: '07.00 - 08.00 WIB',
        fridaySession2: '08.30 - 09.30 WIB',
      });
    }
  };

  // =========================================================================
  // 2. INTEGRASI GOOGLE SHEETS & GOOGLE APPS SCRIPT
  // =========================================================================
  const handleTestGoogleConnection = async () => {
    if (!googleSync.webAppUrl.trim()) {
      setSyncStatus({ text: 'Masukkan URL Web App Google Apps Script terlebih dahulu!', type: 'error' });
      return;
    }

    setIsTestingConnection(true);
    setSyncStatus(null);
    try {
      const url = googleSync.webAppUrl.includes('?') 
        ? `${googleSync.webAppUrl}&action=ping` 
        : `${googleSync.webAppUrl}?action=ping`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.status === 'success') {
        setSyncStatus({ text: 'Koneksi Berhasil! Google Apps Script siap digunakan.', type: 'success' });
      } else {
        setSyncStatus({ text: `Respon diterima: ${json.message || 'Format tidak dikenal'}`, type: 'error' });
      }
    } catch (err: any) {
      setSyncStatus({
        text: `Gagal menghubungi Apps Script. Pastikan Web App di-deploy dengan akses "Anyone" (Siapa saja): ${err.message}`,
        type: 'error',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handlePullFromGoogleSheets = async () => {
    if (!googleSync.webAppUrl.trim()) {
      setSyncStatus({ text: 'Masukkan URL Web App Google Apps Script terlebih dahulu!', type: 'error' });
      return;
    }

    setIsPulling(true);
    setSyncStatus(null);
    try {
      const url = googleSync.webAppUrl.includes('?') 
        ? `${googleSync.webAppUrl}&action=get_schedule` 
        : `${googleSync.webAppUrl}?action=get_schedule`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.status === 'success' && Array.isArray(json.slots) && json.slots.length > 0) {
        onUpdateSlots(json.slots);
        const now = new Date().toLocaleString('id-ID');
        const updatedSync = { ...googleSync, lastSyncedAt: now };
        setGoogleSync(updatedSync);
        onUpdateSchoolInfo({ ...form, googleSync: updatedSync });
        setSyncStatus({ text: `Sinkronisasi Sukses: Berhasil menarik ${json.slots.length} slot jadwal dari Google Sheets!`, type: 'success' });
      } else {
        setSyncStatus({ text: json.message || 'Gagal membaca slot jadwal dari Google Sheets.', type: 'error' });
      }
    } catch (err: any) {
      setSyncStatus({ text: `Gagal menarik data dari Google Sheets: ${err.message}`, type: 'error' });
    } finally {
      setIsPulling(false);
    }
  };

  const handlePushToGoogleSheets = async () => {
    if (!googleSync.webAppUrl.trim()) {
      setSyncStatus({ text: 'Masukkan URL Web App Google Apps Script terlebih dahulu!', type: 'error' });
      return;
    }

    setIsPushing(true);
    setSyncStatus(null);
    try {
      const payload = {
        action: 'sync_schedule',
        schoolInfo: form,
        slots,
      };

      await fetch(googleSync.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      const now = new Date().toLocaleString('id-ID');
      const updatedSync = { ...googleSync, lastSyncedAt: now };
      setGoogleSync(updatedSync);
      onUpdateSchoolInfo({ ...form, googleSync: updatedSync });
      setSyncStatus({ text: `Berhasil mengekspor & menyinkronkan seluruh ${slots.length} slot jadwal ke Google Sheets!`, type: 'success' });
    } catch (err: any) {
      setSyncStatus({ text: `Gagal mengirim data ke Google Sheets: ${err.message}`, type: 'error' });
    } finally {
      setIsPushing(false);
    }
  };

  const handleCopyAppScriptCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleDownloadAppScriptFile = () => {
    const blob = new Blob([GOOGLE_APPS_SCRIPT_CODE], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Rule management helpers
  const handleAddRule = () => {
    if (newRule.trim()) {
      setForm((prev) => ({
        ...prev,
        examRules: [...prev.examRules, newRule.trim()],
      }));
      setNewRule('');
    }
  };

  const handleRemoveRule = (index: number) => {
    setForm((prev) => ({
      ...prev,
      examRules: prev.examRules.filter((_, i) => i !== index),
    }));
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      setForm((prev) => ({
        ...prev,
        examNotes: [...prev.examNotes, newNote.trim()],
      }));
      setNewNote('');
    }
  };

  const handleRemoveNote = (index: number) => {
    setForm((prev) => ({
      ...prev,
      examNotes: prev.examNotes.filter((_, i) => i !== index),
    }));
  };

  // Batch execute
  const handleExecuteBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFrom || !targetTo.trim()) {
      setBatchMessage({ text: 'Pilih data asal dan ketik data pengganti!', type: 'error' });
      return;
    }

    let changeCount = 0;
    const updatedSlots = slots.map((slot) => {
      const updatedEntries = { ...slot.entries };
      ALL_CLASSES.forEach((cls) => {
        const entry = updatedEntries[cls];
        if (entry) {
          if (batchType === 'teacher' && entry.teacher.toLowerCase() === targetFrom.toLowerCase()) {
            updatedEntries[cls] = { ...entry, teacher: targetTo.trim() };
            changeCount++;
          } else if (batchType === 'subject' && entry.subject.toLowerCase() === targetFrom.toLowerCase()) {
            updatedEntries[cls] = { ...entry, subject: targetTo.trim() };
            changeCount++;
          }
        }
      });
      return { ...slot, entries: updatedEntries };
    });

    onUpdateSlots(updatedSlots);
    setBatchMessage({
      text: `Berhasil mengubah ${changeCount} penugasan dari "${targetFrom}" menjadi "${targetTo.trim()}"!`,
      type: 'success',
    });
    setTargetFrom('');
    setTargetTo('');
    setTimeout(() => setBatchMessage(null), 4000);
  };

  // Backup & Restore
  const handleDownloadBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      schoolInfo: { ...form, sessionTimes, googleSync },
      slots,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Jadwal_SAS_SMAN2_${form.academicYear.replace('/', '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.schoolInfo && Array.isArray(parsed.slots)) {
            setForm(parsed.schoolInfo);
            if (parsed.schoolInfo.sessionTimes) setSessionTimes(parsed.schoolInfo.sessionTimes);
            if (parsed.schoolInfo.googleSync) setGoogleSync(parsed.schoolInfo.googleSync);
            onUpdateSchoolInfo(parsed.schoolInfo);
            onUpdateSlots(parsed.slots);
            alert('Data jadwal dan pengaturan berhasil dipulihkan dari berkas cadangan!');
          } else {
            alert('Format berkas JSON cadangan tidak valid.');
          }
        } catch (err) {
          alert('Gagal membaca berkas cadangan JSON.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Save Action */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-blue-700" />
            <span>Pengaturan Lengkap Sistem & Pengesahan Dokumen SAS</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur data lembaga, kop surat, tanda tangan resmi, jam sesi otomatis, dan integrasi Google Sheets
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('ttd');
              setSignatureModal({
                isOpen: true,
                target: 'committee',
                title: 'Tanda Tangan Digital Ketua Panitia SAS',
                signeeName: form.committeeName,
                signeeTitle: form.committeeTitle,
                currentSignature: form.committeeSignatureImage,
              });
            }}
            className="px-3.5 py-2 bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <PenTool className="w-3.5 h-3.5 text-blue-700" />
            <span>Upload / Gores TTD Panitia</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? 'Tersimpan!' : 'Simpan Semua Pengaturan'}</span>
          </button>
        </div>
      </div>

      {/* Settings Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto text-xs font-semibold text-slate-600">
        <button
          type="button"
          onClick={() => setActiveSubTab('kop')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeSubTab === 'kop'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Kop Surat & Lembaga</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('ttd')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeSubTab === 'ttd'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileSignature className="w-4 h-4" />
          <span>Tanda Tangan & Pengesahan</span>
          {form.committeeSignatureImage && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" title="TTD Panitia Aktif" />
          )}
        </button>

        {/* Tab Baru 1: Pengaturan Waktu & Jam Sesi Otomatis */}
        <button
          type="button"
          onClick={() => setActiveSubTab('time')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeSubTab === 'time'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Waktu & Jam Sesi Otomatis</span>
        </button>

        {/* Tab Baru 2: Integrasi Google Sheets & Apps Script */}
        <button
          type="button"
          onClick={() => setActiveSubTab('sheets')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeSubTab === 'sheets'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Google Sheets & Code.gs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('rules')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeSubTab === 'rules'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ListChecks className="w-4 h-4" />
          <span>Tata Tertib & Catatan SAS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('batch')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeSubTab === 'batch'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Ganti Massal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('backup')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeSubTab === 'backup'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Cadangan, PIN & Reset</span>
        </button>
      </div>

      {/* Toast Notice Banner for Signatures & Auto-save */}
      {signatureNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{signatureNotice}</span>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUBTAB 1: KOP SURAT & LEMBAGA */}
      {/* ================================================================= */}
      {activeSubTab === 'kop' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Informasi Satuan Pendidikan & Kop Surat Resmi</h3>
            <p className="text-xs text-slate-500">
              Data ini akan muncul di bagian atas kop surat cetak matriks A3 dan lembar cetak kelas/guru A4.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Instansi Induk (Baris Pertama Kop Surat)
              </label>
              <input
                type="text"
                value={form.governmentTitle}
                onChange={(e) => setForm({ ...form, governmentTitle: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                placeholder="PEMERINTAH PROVINSI JAWA TIMUR · DINAS PENDIDIKAN"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Sekolah
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold"
                placeholder="SMA NEGERI 2 KOTA PASURUAN"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Judul Agenda / Ujian
              </label>
              <input
                type="text"
                value={form.subTitle}
                onChange={(e) => setForm({ ...form, subTitle: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="Jadwal Terintegrasi Sumatif Akhir Semester (SAS) Ganjil"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tahun Pelajaran
              </label>
              <input
                type="text"
                value={form.academicYear}
                onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="2026/2027"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Semester & Kurikulum
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  placeholder="Semester Ganjil"
                />
                <input
                  type="text"
                  value={form.curriculum}
                  onChange={(e) => setForm({ ...form, curriculum: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  placeholder="Kurikulum Merdeka"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Alamat Lengkap Sekolah
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="Jl. Panglima Sudirman No. 162, Purworejo, Kota Pasuruan, Jawa Timur 67115"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kota / Wilayah
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="Kota Pasuruan"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Website & Email Resmi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  placeholder="www.sman2pasuruan.sch.id"
                />
                <input
                  type="text"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  placeholder="info@sman2pasuruan.sch.id"
                />
              </div>
            </div>
          </div>

          {/* Logo Upload Section */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 text-xs mb-2">Unggah Logo Sekolah (Kop Surat Kiri)</h4>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-20 h-20 rounded-lg border border-slate-300 bg-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xs">
                {form.schoolLogoImage ? (
                  <img
                    src={form.schoolLogoImage}
                    alt="Logo Sekolah"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="text-center font-bold text-xs text-blue-900">
                    <span className="block font-extrabold">SMADA</span>
                    <span className="text-[9px] text-slate-400">PASURUAN</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5 text-xs text-center sm:text-left">
                <p className="font-semibold text-slate-800">
                  {form.schoolLogoImage ? 'Logo Kustom Aktif' : 'Menggunakan Monogram Standar SMAN 2 Pasuruan'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Dianjurkan menggunakan berkas PNG transparan atau JPG beresolusi jelas (maks. 2MB).
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                  <label className="px-3 py-1.5 bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 rounded-md font-semibold cursor-pointer transition-colors flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Berkas Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('schoolLogoImage', e)}
                      className="hidden"
                    />
                  </label>
                  {form.schoolLogoImage && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, schoolLogoImage: '' })}
                      className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-md font-medium transition-colors"
                    >
                      Hapus Logo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUBTAB 2: TANDA TANGAN & PENGESAHAN */}
      {/* ================================================================= */}
      {activeSubTab === 'ttd' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Pengaturan Tanda Tangan & Pengesahan Resmi</h3>
            <p className="text-xs text-slate-500">
              Ubah nama, NIP, tanggal penetapan, serta unggah tanda tangan digital dan stempel sekolah untuk dokumen cetak.
            </p>
          </div>

          <div className="max-w-md text-xs">
            <label className="block font-semibold text-slate-700 mb-1">
              Tempat & Tanggal Penetapan Dokumen
            </label>
            <input
              type="text"
              value={form.signPlaceAndDate}
              onChange={(e) => setForm({ ...form, signPlaceAndDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              placeholder="Pasuruan, 23 November 2026"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Kepala Sekolah */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 text-xs">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <FileSignature className="w-4 h-4 text-blue-700" />
                <h4 className="font-bold text-slate-900">Pejabat Kepala Sekolah</h4>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jabatan Pengesahan
                </label>
                <input
                  type="text"
                  value={form.headmasterTitle}
                  onChange={(e) => setForm({ ...form, headmasterTitle: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-600"
                  placeholder="Kepala SMA Negeri 2 Pasuruan"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={form.headmasterName}
                  onChange={(e) => setForm({ ...form, headmasterName: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-600 font-bold"
                  placeholder="Drs. H. Ahmad Fauzi, M.Pd."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  NIP Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={form.headmasterNip}
                  onChange={(e) => setForm({ ...form, headmasterNip: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-600 font-mono"
                  placeholder="19680512 199303 1 005"
                />
              </div>

              {/* Signature Image Upload & Digital Draw for Kepala Sekolah */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-800">
                    Tanda Tangan Digital Kepala Sekolah
                  </label>
                  {form.headmasterSignatureImage ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      TTD Aktif
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      Belum Ada TTD
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <div className="w-32 h-20 border border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden p-1 flex-shrink-0">
                    {form.headmasterSignatureImage ? (
                      <img
                        src={form.headmasterSignatureImage}
                        alt="TTD KS"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <PenTool className="w-5 h-5 mx-auto mb-0.5 stroke-[1.5]" />
                        <span className="text-[9px] block">Belum ada</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSignatureModal({
                            isOpen: true,
                            target: 'headmaster',
                            title: 'Tanda Tangan Digital Kepala Sekolah',
                            signeeName: form.headmasterName,
                            signeeTitle: form.headmasterTitle,
                            currentSignature: form.headmasterSignatureImage,
                          });
                        }}
                        className="px-2.5 py-1.5 bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 rounded-md font-semibold text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <PenTool className="w-3 h-3" />
                        <span>Gores di Layar</span>
                      </button>

                      <label className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-semibold text-[11px] cursor-pointer flex items-center gap-1 transition-colors">
                        <Upload className="w-3 h-3 text-slate-500" />
                        <span>Unggah Scan</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload('headmasterSignatureImage', e)}
                          className="hidden"
                        />
                      </label>

                      {form.headmasterSignatureImage && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...form, headmasterSignatureImage: '' };
                            setForm(updated);
                            onUpdateSchoolInfo(updated);
                            setSignatureNotice('Tanda tangan Kepala Sekolah berhasil dihapus.');
                            setTimeout(() => setSignatureNotice(null), 3000);
                          }}
                          className="px-2 py-1.5 text-[11px] text-rose-600 hover:bg-rose-50 rounded-md font-medium transition-colors"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Bisa digambar langsung di layar sentuh/mouse atau unggah berkas PNG transparan/JPG.
                    </p>
                  </div>
                </div>
              </div>

              {/* School Stamp Upload */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block font-semibold text-slate-700 mb-1">
                  Gambar Cap / Stempel Sekolah (Opsional)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-16 border border-slate-300 rounded bg-white flex items-center justify-center overflow-hidden">
                    {form.headmasterStampImage ? (
                      <img
                        src={form.headmasterStampImage}
                        alt="Stempel"
                        className="max-h-full max-w-full object-contain opacity-80"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Belum ada</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold cursor-pointer block text-center">
                      Unggah Stempel
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload('headmasterStampImage', e)}
                        className="hidden"
                      />
                    </label>
                    {form.headmasterStampImage && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...form, headmasterStampImage: '' };
                          setForm(updated);
                          onUpdateSchoolInfo(updated);
                          setSignatureNotice('Stempel sekolah berhasil dihapus.');
                          setTimeout(() => setSignatureNotice(null), 3000);
                        }}
                        className="text-[11px] text-rose-600 hover:underline block"
                      >
                        Hapus Stempel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Ketua Panitia SAS */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-blue-700" />
                  <h4 className="font-bold text-slate-900">Ketua Panitia SAS</h4>
                </div>
                {form.committeeSignatureImage ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    TTD Digital Aktif
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Belum Ada TTD
                  </span>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jabatan Kepanitiaan
                </label>
                <input
                  type="text"
                  value={form.committeeTitle}
                  onChange={(e) => setForm({ ...form, committeeTitle: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-600"
                  placeholder="Ketua Panitia SAS 2026/2027"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar Ketua Panitia
                </label>
                <input
                  type="text"
                  value={form.committeeName}
                  onChange={(e) => setForm({ ...form, committeeName: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-600 font-bold"
                  placeholder="Didik Suryadi, S.Pd."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  NIP Ketua Panitia
                </label>
                <input
                  type="text"
                  value={form.committeeNip}
                  onChange={(e) => setForm({ ...form, committeeNip: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-600 font-mono"
                  placeholder="19750820 200212 1 004"
                />
              </div>

              {/* Committee Signature Image Upload & Digital Canvas Pad */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-800">
                    Tanda Tangan Digital Ketua Panitia SAS
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Cetak A4 / F4 / A3
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <div className="w-32 h-20 border border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden p-1 flex-shrink-0">
                    {form.committeeSignatureImage ? (
                      <img
                        src={form.committeeSignatureImage}
                        alt="TTD Panitia"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <PenTool className="w-5 h-5 mx-auto mb-0.5 stroke-[1.5]" />
                        <span className="text-[9px] block">Belum ada</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSignatureModal({
                            isOpen: true,
                            target: 'committee',
                            title: 'Tanda Tangan Digital Ketua Panitia SAS',
                            signeeName: form.committeeName,
                            signeeTitle: form.committeeTitle,
                            currentSignature: form.committeeSignatureImage,
                          });
                        }}
                        className="px-2.5 py-1.5 bg-blue-700 text-white hover:bg-blue-800 rounded-md font-bold text-[11px] flex items-center gap-1 transition-colors shadow-2xs"
                      >
                        <PenTool className="w-3 h-3" />
                        <span>Gores di Layar</span>
                      </button>

                      <label className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-semibold text-[11px] cursor-pointer flex items-center gap-1 transition-colors">
                        <Upload className="w-3 h-3 text-slate-500" />
                        <span>Unggah Scan</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload('committeeSignatureImage', e)}
                          className="hidden"
                        />
                      </label>

                      {form.committeeSignatureImage && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...form, committeeSignatureImage: '' };
                            setForm(updated);
                            onUpdateSchoolInfo(updated);
                            setSignatureNotice('Tanda tangan Ketua Panitia berhasil dihapus.');
                            setTimeout(() => setSignatureNotice(null), 3000);
                          }}
                          className="px-2 py-1.5 text-[11px] text-rose-600 hover:bg-rose-50 rounded-md font-medium transition-colors"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Pilih <span className="font-semibold text-slate-700">"Gores di Layar"</span> untuk tanda tangan langsung dengan jari/mouse, atau pilih <span className="font-semibold text-slate-700">"Unggah Scan"</span> jika sudah memiliki file gambar PNG/JPG.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUBTAB 3: PENGATURAN PERUBAHAN JAM SETIAP SESI SECARA OTOMATIS */}
      {/* ================================================================= */}
      {activeSubTab === 'time' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-700" />
                <span>Pengaturan Perubahan Jam Sesi Ujian Otomatis</span>
              </h3>
              <p className="text-xs text-slate-500">
                Ubah jam mulai dan selesai pada setiap sesi secara serentak ke seluruh 16 slot jadwal (misal: Sesi 1 menjadi 07.30 - 09.30 WIB).
              </p>
            </div>

            {/* Preset Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500 font-semibold mr-1">Preset Cepat:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('120min')}
                className="px-2.5 py-1 bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 rounded text-xs font-semibold transition-colors"
                title="Sesi 1: 07.30 - 09.30 | Sesi 2: 10.00 - 12.00"
              >
                120 Menit (07.30 - 09.30)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('standard')}
                className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded text-xs font-semibold transition-colors"
                title="Sesi 1: 07.30 - 09.00 | Sesi 2: 09.30 - 11.00"
              >
                Standar 90 Menit
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('ramadhan')}
                className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded text-xs font-semibold transition-colors"
                title="Sesi 1: 07.30 - 08.30 | Sesi 2: 09.00 - 10.00"
              >
                Singkat 60 Menit
              </button>
            </div>
          </div>

          {/* Form Inputs for Sessions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Hari Reguler (Senin - Kamis) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900">Jam Sesi Hari Reguler (Senin s/d Kamis)</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Waktu Sesi 1 (Jam Ke-1)
                </label>
                <input
                  type="text"
                  value={sessionTimes.session1}
                  onChange={(e) => setSessionTimes({ ...sessionTimes, session1: e.target.value })}
                  placeholder="07.30 - 09.30 WIB"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-mono font-medium focus:ring-1 focus:ring-blue-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Contoh: <code className="font-mono text-slate-700 font-semibold">07.30 - 09.30 WIB</code> (120 menit)
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Waktu Sesi 2 (Jam Ke-2)
                </label>
                <input
                  type="text"
                  value={sessionTimes.session2}
                  onChange={(e) => setSessionTimes({ ...sessionTimes, session2: e.target.value })}
                  placeholder="10.00 - 11.30 WIB"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-mono font-medium focus:ring-1 focus:ring-blue-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Contoh: <code className="font-mono text-slate-700 font-semibold">10.00 - 12.00 WIB</code> atau <code className="font-mono text-slate-700 font-semibold">09.30 - 11.00 WIB</code>
                </p>
              </div>
            </div>

            {/* Hari Khusus / Jumat */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900">Jam Sesi Hari Jumat (Menyesuaikan Sholat Jumat)</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Waktu Jumat Sesi 1 (Jam Ke-1)
                </label>
                <input
                  type="text"
                  value={sessionTimes.fridaySession1}
                  onChange={(e) => setSessionTimes({ ...sessionTimes, fridaySession1: e.target.value })}
                  placeholder="07.00 - 08.30 WIB"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-mono font-medium focus:ring-1 focus:ring-blue-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Hari Jumat biasanya dimulai lebih awal: <code className="font-mono text-slate-700 font-semibold">07.00 - 08.30 WIB</code>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Waktu Jumat Sesi 2 (Jam Ke-2)
                </label>
                <input
                  type="text"
                  value={sessionTimes.fridaySession2}
                  onChange={(e) => setSessionTimes({ ...sessionTimes, fridaySession2: e.target.value })}
                  placeholder="09.00 - 10.30 WIB"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-mono font-medium focus:ring-1 focus:ring-blue-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Selesai sebelum ibadah Sholat Jumat: <code className="font-mono text-slate-700 font-semibold">09.00 - 10.30 WIB</code>
                </p>
              </div>
            </div>
          </div>

          {timeSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{timeSuccessMessage}</span>
            </div>
          )}

          {/* Action Trigger */}
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-blue-950">
                Terapkan Konfigurasi Waktu Ini ke Seluruh Jadwal
              </p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Sistem akan secara otomatis menyisir seluruh 16 slot pada database dan mengganti kolom Waktu sesuai Sesi 1 atau Sesi 2.
              </p>
            </div>

            <button
              type="button"
              onClick={handleApplySessionTimesToAll}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-2 flex-shrink-0 transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span>Terapkan Jam Baru ke Semua Data</span>
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUBTAB 4: INTEGRASI GOOGLE SHEETS & GOOGLE APPS SCRIPT (Code.gs) */}
      {/* ================================================================= */}
      {activeSubTab === 'sheets' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Integrasi Google Sheets & Google Apps Script (Code.gs)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Sinkronkan data jadwal SAS SMAN 2 Kota Pasuruan secara dua arah langsung dengan Google Spreadsheet menggunakan skrip Google Apps Script.
            </p>
          </div>

          {/* URL & Status Box */}
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                URL Web App Google Apps Script:
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="url"
                  value={googleSync.webAppUrl}
                  onChange={(e) => setGoogleSync({ ...googleSync, webAppUrl: e.target.value })}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white text-xs font-mono focus:ring-1 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={handleTestGoogleConnection}
                  disabled={isTestingConnection}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 flex-shrink-0 transition-colors shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                  <span>{isTestingConnection ? 'Menguji...' : 'Uji Koneksi'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                URL ini diperoleh setelah menerapkan (Deploy) skrip <code className="font-mono font-semibold text-slate-800">Code.gs</code> sebagai Aplikasi Web di Google Sheets.
              </p>
            </div>

            {/* Sync Status Feedback */}
            {syncStatus && (
              <div
                className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  syncStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : syncStatus.type === 'info'
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {syncStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{syncStatus.text}</span>
              </div>
            )}

            {/* Action Buttons: Pull & Push */}
            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 text-[11px]">
                Waktu Sinkronisasi Terakhir: <strong className="text-slate-800">{googleSync.lastSyncedAt || 'Belum pernah disinkronkan'}</strong>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePullFromGoogleSheets}
                  disabled={isPulling}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                  title="Tarik data jadwal terbaru dari Google Sheets ke dalam aplikasi"
                >
                  <DownloadCloud className={`w-4 h-4 ${isPulling ? 'animate-bounce' : ''}`} />
                  <span>{isPulling ? 'Menarik Data...' : 'Tarik Data dari Google Sheets'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePushToGoogleSheets}
                  disabled={isPushing}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                  title="Kirim dan timpa jadwal dari aplikasi ke Google Spreadsheet"
                >
                  <Send className={`w-4 h-4 ${isPushing ? 'animate-pulse' : ''}`} />
                  <span>{isPushing ? 'Mengirim...' : 'Kirim Data ke Google Sheets'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tutorial & Code.gs Display Box */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Kode Google Apps Script (Code.gs)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Salin kode di bawah ini dan tempelkan pada Google Apps Script di spreadsheet Anda.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAppScriptCode}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Kode Tersalin!' : 'Salin Seluruh Code.gs'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadAppScriptFile}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Unduh File Code.gs</span>
                </button>
              </div>
            </div>

            {/* Step-by-step Guide */}
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
              <p className="font-bold">Langkah-langkah Memasang di Google Sheets:</p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800 pl-1 leading-relaxed">
                <li>Buka Google Spreadsheet baru atau Google Spreadsheet jadwal SAS SMAN 2 Pasuruan Anda.</li>
                <li>Klik menu <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.</li>
                <li>Hapus kode bawaan di dalam editor, lalu klik tombol <strong>"Salin Seluruh Code.gs"</strong> di atas dan tempelkan (Ctrl+V) ke editor Apps Script.</li>
                <li>Klik tombol <strong>Simpan (ikon Disket)</strong>.</li>
                <li>Klik tombol biru <strong>Deploy (Terapkan)</strong> di pojok kanan atas &gt; pilih <strong>New deployment (Deployment baru)</strong>.</li>
                <li>Klik ikon roda gigi jenis deployment &gt; pilih <strong>Web app (Aplikasi web)</strong>.</li>
                <li>Pada pilihan <strong>Execute as</strong>: pilih <em>Me (email Anda)</em>. Pada <strong>Who has access</strong>: pilih <em>Anyone (Siapa saja)</em>.</li>
                <li>Klik <strong>Deploy</strong>, lalu berikan otorisasi izin akun Google Anda.</li>
                <li>Salin <strong>Web App URL</strong> yang dihasilkan (berakhiran <code>/exec</code>) dan tempelkan ke kolom URL di atas!</li>
              </ol>
            </div>

            {/* Code Snippet Box */}
            <div className="relative">
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono leading-relaxed overflow-x-auto max-h-96 border border-slate-800">
                <code>{GOOGLE_APPS_SCRIPT_CODE}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUBTAB 5: TATA TERTIB & CATATAN SAS */}
      {/* ================================================================= */}
      {activeSubTab === 'rules' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Tata Tertib Peserta Didik & Catatan Pelaksanaan SAS</h3>
            <p className="text-xs text-slate-500">
              Dapat ditambah, diedit, atau dihapus sesuai kebutuhan dan regulasi panitia sekolah.
            </p>
          </div>

          {/* Tata Tertib Peserta */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              Tata Tertib Peserta Didik (Muncul di Cetak Jadwal Per Kelas)
            </h4>

            <div className="space-y-2">
              {form.examRules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <span className="font-bold text-slate-500 w-5 text-right">{idx + 1}.</span>
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => {
                      const updated = [...form.examRules];
                      updated[idx] = e.target.value;
                      setForm({ ...form, examRules: updated });
                    }}
                    className="flex-1 bg-white px-2.5 py-1 border border-slate-300 rounded text-slate-900 text-xs focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Hapus butir ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                placeholder="Tambah butir tata tertib baru..."
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <button
                type="button"
                onClick={handleAddRule}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Butir</span>
              </button>
            </div>
          </div>

          {/* Catatan Pelaksanaan SAS */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              Catatan Kaki Pelaksanaan SAS (Muncul di Cetak Matriks A3)
            </h4>

            <div className="space-y-2">
              {form.examNotes.map((note, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <span className="font-bold text-slate-500 w-5 text-right">{idx + 1}.</span>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => {
                      const updated = [...form.examNotes];
                      updated[idx] = e.target.value;
                      setForm({ ...form, examNotes: updated });
                    }}
                    className="flex-1 bg-white px-2.5 py-1 border border-slate-300 rounded text-slate-900 text-xs focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveNote(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Hapus catatan ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                placeholder="Tambah catatan pelaksanaan baru..."
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <button
                type="button"
                onClick={handleAddNote}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Catatan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUBTAB 6: BATCH FIND & REPLACE */}
      {/* ================================================================= */}
      {activeSubTab === 'batch' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Ganti Massal Guru / Mata Pelajaran (Batch Replace)</h3>
            <p className="text-xs text-slate-500">
              Ubah nama guru pengampu atau nama mata pelajaran secara serentak di seluruh 16 slot dan 30 kelas.
            </p>
          </div>

          <form onSubmit={handleExecuteBatch} className="max-w-xl space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Pilih Tipe Data yang Ingin Diganti:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setBatchType('teacher');
                    setTargetFrom('');
                  }}
                  className={`py-2 px-3 rounded-lg border text-center font-semibold transition-colors ${
                    batchType === 'teacher'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Nama Guru Pengampu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBatchType('subject');
                    setTargetFrom('');
                  }}
                  className={`py-2 px-3 rounded-lg border text-center font-semibold transition-colors ${
                    batchType === 'subject'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Nama Mata Pelajaran
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Data Lama yang Akan Diganti (Pilih dari yang terdaftar):
              </label>
              <select
                value={targetFrom}
                onChange={(e) => setTargetFrom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                required
              >
                <option value="">-- Pilih {batchType === 'teacher' ? 'Guru' : 'Mata Pelajaran'} --</option>
                {(batchType === 'teacher' ? uniqueTeachers : uniqueSubjects).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Data Baru Pengganti:
              </label>
              <input
                type="text"
                value={targetTo}
                onChange={(e) => setTargetTo(e.target.value)}
                placeholder={`Ketik nama baru ${batchType === 'teacher' ? 'guru & gelar (contoh: Didik Suryadi, M.Pd.)' : 'mata pelajaran'}...`}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>

            {batchMessage && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  batchMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {batchMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{batchMessage.text}</span>
              </div>
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Terapkan Penggantian ke Seluruh Jadwal</span>
            </button>
          </form>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUBTAB 7: CADANGAN, PIN & RESET */}
      {/* ================================================================= */}
      {activeSubTab === 'backup' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Cadangan Database, Keamanan PIN & Pemulihan</h3>
            <p className="text-xs text-slate-500">
              Ekspor seluruh data jadwal dan kop surat ke berkas JSON atau pulihkan data bila diperlukan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Backup & Restore */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Cadangkan & Pulihkan Berkas JSON</span>
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Menyimpan seluruh konfigurasi nama sekolah, tanda tangan, tata tertib, dan 16 slot jadwal lengkap ke berkas lokal komputer.
              </p>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Berkas Cadangan (.json)</span>
                </button>

                <label className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs text-center">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pulihkan dari Berkas Cadangan (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Change Admin PIN */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Key className="w-4 h-4 text-blue-600" />
                <span>Ganti PIN Administrator</span>
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                PIN ini melindungi hak akses CRUD dan menu pengaturan agar tidak sembarang diubah oleh pihak yang tidak berwenang.
              </p>

              <div className="space-y-2 pt-1">
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  placeholder="PIN baru (minimal 4 karakter)"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <button
                  type="button"
                  disabled={adminPin.trim().length < 4}
                  onClick={() => {
                    setAdminPin(adminPin.trim());
                    setAdminPinInput('');
                    setPinMessage(true);
                    setTimeout(() => setPinMessage(false), 2500);
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold rounded-lg transition-colors"
                >
                  {pinMessage ? 'PIN Berhasil Disimpan!' : 'Simpan PIN Baru'}
                </button>
              </div>
            </div>
          </div>

          {/* Factory Reset */}
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Reset ke Data Asli SAS SMAN 2 Pasuruan (Revisi v2)</span>
              </h4>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Mengembalikan seluruh 16 slot jadwal dan kop surat ke versi resmi awal. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh jadwal dan pengaturan ke versi resmi awal?')) {
                  onResetData();
                  alert('Data berhasil direset ke versi awal.');
                }
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 flex-shrink-0 transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data Bawaan</span>
            </button>
          </div>
        </div>
      )}

      {/* Digital Signature Drawing & Upload Modal */}
      <DigitalSignatureModal
        isOpen={signatureModal.isOpen}
        onClose={() => setSignatureModal((prev) => ({ ...prev, isOpen: false }))}
        onSave={handleSaveSignatureFromModal}
        title={signatureModal.title}
        signeeName={signatureModal.signeeName}
        signeeTitle={signatureModal.signeeTitle}
        currentSignature={signatureModal.currentSignature}
      />
    </div>
  );
};

