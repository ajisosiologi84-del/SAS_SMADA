import React, { useState } from 'react';
import { ScheduleSlot, SchoolInfo } from '../types/schedule';
import { 
  Plus, 
  Upload, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Save, 
  ShieldCheck, 
  Key, 
  School, 
  FileSpreadsheet, 
  Check, 
  AlertCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { setAdminPin } from '../utils/storage';
import { generate100PercentConflictFreeSchedule } from '../utils/conflictResolver';

interface AdminPanelProps {
  slots: ScheduleSlot[];
  schoolInfo: SchoolInfo;
  onUpdateSchoolInfo: (info: SchoolInfo) => void;
  onAddNewSlot: () => void;
  onEditSlot: (slot: ScheduleSlot) => void;
  onDeleteSlot: (slotId: string) => void;
  onOpenUpload: () => void;
  onResetData: () => void;
  onNavigateToSettings?: () => void;
  onUpdateSlots?: (newSlots: ScheduleSlot[]) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  slots,
  schoolInfo,
  onUpdateSchoolInfo,
  onAddNewSlot,
  onEditSlot,
  onDeleteSlot,
  onOpenUpload,
  onResetData,
  onNavigateToSettings,
  onUpdateSlots,
}) => {
  // School info form state
  const [infoForm, setInfoForm] = useState<SchoolInfo>({ ...schoolInfo });
  const [infoSaved, setInfoSaved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conflictSuccessMsg, setConflictSuccessMsg] = useState<string | null>(null);

  // New PIN state
  const [newPin, setNewPin] = useState('');
  const [pinSaved, setPinSaved] = useState(false);

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSchoolInfo(infoForm);
    setInfoSaved(true);
    setTimeout(() => setInfoSaved(false), 2500);
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length >= 4) {
      setAdminPin(newPin.trim());
      setNewPin('');
      setPinSaved(true);
      setTimeout(() => setPinSaved(false), 2500);
    }
  };

  const handleGenerateConflictFree = () => {
    if (!onUpdateSlots) return;
    setIsGenerating(true);
    setConflictSuccessMsg(null);

    setTimeout(() => {
      try {
        const { resolvedSlots, conflictsResolvedCount } = generate100PercentConflictFreeSchedule(slots);
        onUpdateSlots(resolvedSlots);
        setConflictSuccessMsg(
          conflictsResolvedCount > 0
            ? `${conflictsResolvedCount} bentrok berhasil diselesaikan! Jadwal kini 100% Bebas Bentrok.`
            : 'Semua 16 slot jadwal & 30 kelas sudah 100% Bebas Bentrok.'
        );
        setTimeout(() => setConflictSuccessMsg(null), 4000);
      } finally {
        setIsGenerating(false);
      }
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-5 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">Panel Kontrol Administrator SAS</h2>
            <p className="text-xs text-slate-300">
              Kelola data master jadwal (CRUD), unggah spreadsheet, dan perbarui data pengesahan sekolah
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onUpdateSlots && (
            <button
              type="button"
              onClick={handleGenerateConflictFree}
              disabled={isGenerating}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-60"
              title="Generate dan pastikan 100% jadwal bebas bentrok pengampu"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Memproses...' : '⚡ Generate Bebas Bentrok 100%'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onAddNewSlot}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Slot Baru</span>
          </button>
          <button
            type="button"
            onClick={onOpenUpload}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Unggah CSV / Excel</span>
          </button>
          {onNavigateToSettings && (
            <button
              type="button"
              onClick={onNavigateToSettings}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Pengaturan & Tanda Tangan</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh jadwal ke versi resmi awal (Revisi v2)? Semua perubahan manual akan dikembalikan.')) {
                onResetData();
              }
            }}
            className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data Resmi</span>
          </button>
        </div>
      </div>

      {conflictSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{conflictSuccessMsg}</span>
        </div>
      )}

      {/* Grid: Slots Management Table & School Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Slot CRUD List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Daftar Slot Ujian SAS ({slots.length} Slot)</h3>
              <p className="text-xs text-slate-500">Klik "Edit" untuk mengubah pengampu per kelas pada slot ini</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="px-3 py-2.5">Slot</th>
                  <th className="px-3 py-2.5">Minggu</th>
                  <th className="px-3 py-2.5">Hari & Tanggal</th>
                  <th className="px-3 py-2.5">Sesi & Waktu</th>
                  <th className="px-3 py-2.5 text-center">Kelas Terisi</th>
                  <th className="px-3 py-2.5 text-right">Aksi CRUD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slots.map((slot) => {
                  const filledCount = Object.values(slot.entries).filter((e) => e !== null && e.subject).length;

                  return (
                    <tr key={slot.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                        {slot.slotName}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                        {slot.week}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                        {slot.dayAndDate}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                        <div>{slot.session}</div>
                        <div className="text-[11px] font-mono text-slate-500">{slot.time}</div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          filledCount > 0 ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {filledCount} / 30
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditSlot(slot)}
                            className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit slot ini"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus ${slot.slotName}?`)) {
                                onDeleteSlot(slot.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Hapus slot ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Settings & Credentials */}
        <div className="space-y-6">
          {/* School & Sign-off Info Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center gap-2 mb-3">
              <School className="w-4 h-4 text-blue-700" />
              <h3 className="font-bold text-slate-900 text-sm">Data Pengesahan Kop & TTD</h3>
            </div>

            <form onSubmit={handleSaveInfo} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Satuan Pendidikan
                </label>
                <input
                  type="text"
                  value={infoForm.name}
                  onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tahun Pelajaran
                </label>
                <input
                  type="text"
                  value={infoForm.academicYear}
                  onChange={(e) => setInfoForm({ ...infoForm, academicYear: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Kepala Sekolah & Gelar
                </label>
                <input
                  type="text"
                  value={infoForm.headmasterName}
                  onChange={(e) => setInfoForm({ ...infoForm, headmasterName: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  NIP Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={infoForm.headmasterNip}
                  onChange={(e) => setInfoForm({ ...infoForm, headmasterNip: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Ketua Panitia SAS
                </label>
                <input
                  type="text"
                  value={infoForm.committeeName}
                  onChange={(e) => setInfoForm({ ...infoForm, committeeName: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  NIP Ketua Panitia
                </label>
                <input
                  type="text"
                  value={infoForm.committeeNip}
                  onChange={(e) => setInfoForm({ ...infoForm, committeeNip: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  {infoSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{infoSaved ? 'Data Tersimpan!' : 'Simpan Data Pengesahan'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change PIN Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-blue-700" />
              <h3 className="font-bold text-slate-900 text-sm">Ganti PIN Administrator</h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              PIN ini digunakan untuk membuka akses edit jadwal dari perangkat Anda.
            </p>

            <form onSubmit={handleChangePin} className="space-y-3 text-xs">
              <div>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="PIN baru (min. 4 karakter)"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <button
                type="submit"
                disabled={newPin.trim().length < 4}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-semibold rounded-lg transition-colors"
              >
                {pinSaved ? 'PIN Berhasil Diganti!' : 'Perbarui PIN'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
