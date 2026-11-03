import React, { useState, useMemo } from 'react';
import { ScheduleSlot, SchoolInfo, ALL_CLASSES } from '../types/schedule';
import { 
  Search, 
  UserCheck, 
  Calendar, 
  Clock, 
  BookOpen, 
  Printer, 
  FileSpreadsheet, 
  ShieldCheck, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  KeyRound
} from 'lucide-react';
import { exportTeacherToExcel } from '../utils/exportUtils';
import { KopSurat } from './KopSurat';
import { PrintPdfModal } from './Modals/PrintPdfModal';
import { PrintTokenCardsModal } from './Modals/PrintTokenCardsModal';
import { getTeacherTokenConfig, getClassTokenConfig } from '../utils/storage';

interface TeacherViewProps {
  slots: ScheduleSlot[];
  schoolInfo: SchoolInfo;
  initialTeacher?: string;
}

export const TeacherView: React.FC<TeacherViewProps> = ({
  slots,
  schoolInfo,
  initialTeacher,
}) => {
  // Extract all distinct teachers
  const allTeachers = useMemo(() => {
    const teachersMap = new Map<string, number>();

    slots.forEach((slot) => {
      ALL_CLASSES.forEach((cls) => {
        const entry = slot.entries[cls];
        if (entry && entry.teacher) {
          const tName = entry.teacher.trim();
          teachersMap.set(tName, (teachersMap.get(tName) || 0) + 1);
        }
      });
    });

    return Array.from(teachersMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [slots]);

  const [selectedTeacher, setSelectedTeacher] = useState<string>(() => {
    if (initialTeacher) return initialTeacher;
    return allTeachers[0]?.name || 'Mohamad Hadi Sukron, S.Pd';
  });

  const [filterQuery, setFilterQuery] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showTokenCardModal, setShowTokenCardModal] = useState(false);

  // Filter teachers in selector
  const matchingTeachers = useMemo(() => {
    if (!filterQuery.trim()) return allTeachers;
    return allTeachers.filter((t) =>
      t.name.toLowerCase().includes(filterQuery.toLowerCase())
    );
  }, [allTeachers, filterQuery]);

  const currentTeacherIndex = useMemo(() => {
    return allTeachers.findIndex((t) => t.name === selectedTeacher);
  }, [allTeachers, selectedTeacher]);

  const handlePrevTeacher = () => {
    if (allTeachers.length === 0) return;
    const newIdx = (currentTeacherIndex - 1 + allTeachers.length) % allTeachers.length;
    setSelectedTeacher(allTeachers[newIdx].name);
  };

  const handleNextTeacher = () => {
    if (allTeachers.length === 0) return;
    const newIdx = (currentTeacherIndex + 1) % allTeachers.length;
    setSelectedTeacher(allTeachers[newIdx].name);
  };

  // Extract assignments for selected teacher
  const teacherAssignments = useMemo(() => {
    const list: {
      slot: ScheduleSlot;
      className: string;
      subject: string;
    }[] = [];

    slots.forEach((slot) => {
      ALL_CLASSES.forEach((cls) => {
        const entry = slot.entries[cls];
        if (
          entry &&
          entry.teacher.toLowerCase().includes(selectedTeacher.toLowerCase())
        ) {
          list.push({
            slot,
            className: cls,
            subject: entry.subject,
          });
        }
      });
    });

    return list;
  }, [slots, selectedTeacher]);

  // Group by day for clear schedule visualization
  const groupedByDay = useMemo(() => {
    const groups: Record<string, typeof teacherAssignments> = {};
    teacherAssignments.forEach((item) => {
      const day = item.slot.dayAndDate;
      if (!groups[day]) groups[day] = [];
      groups[day].push(item);
    });
    return groups;
  }, [teacherAssignments]);

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Teacher Selector Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs no-print space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-700" />
              <span>Portal Guru & Pengawas SAS SMAN 2 Pasuruan</span>
            </h3>
            <p className="text-xs text-slate-500">
              Pilih nama guru dari dropdown untuk melihat rincian jadwal mengawas dan menguji
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportTeacherToExcel(slots, selectedTeacher, schoolInfo)}
              className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unduh Excel Guru</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTokenCardModal(true)}
              className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Cetak kartu token akses resmi untuk Dewan Guru & Pengawas SAS"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-700" />
              <span>Kartu Token Guru</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              title="Buka opsi cetak & unduh PDF format A4 atau F4"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Unduh PDF (A4 / F4)</span>
            </button>
          </div>
        </div>

        {/* Search & Teacher Dropdown Selector */}
        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            {/* Primary Dropdown */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="teacher-dropdown" className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                  <span>Pilih Nama Guru / Pengawas:</span>
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  {currentTeacherIndex >= 0 ? `${currentTeacherIndex + 1} dari ${allTeachers.length} Guru` : `${allTeachers.length} Guru Terdaftar`}
                </span>
              </div>
              <div className="relative">
                <select
                  id="teacher-dropdown"
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs font-bold text-blue-950 bg-white border-2 border-blue-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs appearance-none cursor-pointer"
                >
                  {matchingTeachers.map((t, idx) => (
                    <option key={t.name} value={t.name}>
                      {idx + 1}. {t.name} — ({t.count} Sesi Pengawasan)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-blue-700 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Quick Filter Search */}
            <div className="sm:w-72">
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                Cari Nama di Daftar:
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterQuery(val);
                    if (val.trim()) {
                      const found = allTeachers.find((t) => t.name.toLowerCase().includes(val.toLowerCase()));
                      if (found) setSelectedTeacher(found.name);
                    }
                  }}
                  placeholder="Ketik nama untuk memfilter..."
                  className="w-full pl-8.5 pr-8 py-2.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
                />
                {filterQuery && (
                  <button
                    type="button"
                    onClick={() => setFilterQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
                    title="Hapus pencarian"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Stepper Navigation */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevTeacher}
                className="p-2.5 bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 rounded-xl shadow-xs transition-all"
                title="Guru Sebelumnya"
                aria-label="Guru Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextTeacher}
                className="p-2.5 bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 rounded-xl shadow-xs transition-all"
                title="Guru Berikutnya"
                aria-label="Guru Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {filterQuery && matchingTeachers.length < allTeachers.length && (
            <p className="text-[11px] text-blue-700 font-medium">
              Menampilkan {matchingTeachers.length} nama guru yang cocok dengan kata kunci &ldquo;{filterQuery}&rdquo;.
            </p>
          )}
        </div>

        {/* Teacher Overview Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
            <span className="text-[11px] text-blue-700 font-semibold block uppercase tracking-wider">
              Total Tugas Pengawasan / Ujian
            </span>
            <span className="text-xl font-black text-blue-950 mt-0.5 block">
              {teacherAssignments.length} Sesi
            </span>
          </div>

          <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
            <span className="text-[11px] text-emerald-700 font-semibold block uppercase tracking-wider">
              Jumlah Hari Bertugas
            </span>
            <span className="text-xl font-black text-emerald-950 mt-0.5 block">
              {Object.keys(groupedByDay).length} Hari
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-600 font-semibold block uppercase tracking-wider">
              Status Bentrok Jadwal
            </span>
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              0% Bentrok (Jadwal Aman)
            </span>
          </div>
        </div>
      </div>

      {/* Printable Teacher Duty Schedule Sheet */}
      <div
        id="teacher-print-card"
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto a4-print-target"
      >
        <KopSurat
          schoolInfo={schoolInfo}
          title="LEMBAR JADWAL PENGAWAS SUMATIF AKHIR SEMESTER (SAS)"
          subTitle={`GURU PENGAMPU / PENGAWAS: ${selectedTeacher} · TP ${schoolInfo.academicYear}`}
        />

        {/* Schedule Table */}
        <div className="border border-slate-300 rounded-lg my-3.5 overflow-hidden">
          <table className="w-full text-left border-collapse border border-slate-300 text-xs table-fixed">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <th className="px-1.5 py-2 border-r border-slate-700 text-center w-[6%]">No</th>
                <th className="px-2.5 py-2 border-r border-slate-700 w-[22%]">Hari & Tanggal</th>
                <th className="px-1.5 py-2 border-r border-slate-700 text-center w-[10%]">Sesi</th>
                <th className="px-2 py-2 border-r border-slate-700 text-center w-[15%] font-mono">Waktu</th>
                <th className="px-1.5 py-2 border-r border-slate-700 text-center w-[10%]">Kelas</th>
                <th className="px-2.5 py-2 border-r border-slate-700 w-[23%]">Mata Pelajaran</th>
                <th className="px-2 py-2 text-center w-[14%]">Paraf</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {teacherAssignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Tidak ada jadwal mengawas/menguji yang tercatat untuk {selectedTeacher}.
                  </td>
                </tr>
              ) : (
                teacherAssignments.map((item, idx) => {
                  const isEven = idx % 2 === 1;
                  return (
                    <tr
                      key={`${item.slot.id}-${item.className}`}
                      className={`${isEven ? 'bg-slate-50/70' : 'bg-white'} hover:bg-blue-50/30 transition-colors`}
                    >
                      <td className="px-1.5 py-1.5 border-r border-slate-300 text-center font-bold text-slate-800 text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="px-2.5 py-1.5 border-r border-slate-300 font-semibold text-slate-900 text-[11px] break-words leading-snug">
                        {item.slot.dayAndDate}
                      </td>
                      <td className="px-1.5 py-1.5 border-r border-slate-300 text-center text-slate-700 text-[11px]">
                        {item.slot.session}
                      </td>
                      <td className="px-2 py-1.5 border-r border-slate-300 text-center font-mono text-slate-900 font-semibold text-[11px]">
                        {item.slot.time}
                      </td>
                      <td className="px-1.5 py-1.5 border-r border-slate-300 text-center font-extrabold text-blue-900 text-[11px]">
                        {item.className}
                      </td>
                      <td className="px-2.5 py-1.5 border-r border-slate-300 font-medium text-slate-900 text-[11.5px] break-words leading-snug">
                        {item.subject}
                      </td>
                      <td className="px-2 py-1.5 text-center text-slate-400 text-[10px]">
                        .................
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info & signoff */}
        <div className="mt-6 pt-3 border-t border-slate-300 grid grid-cols-2 gap-6 text-xs text-slate-800">
          <div className="text-center px-2">
            <p className="text-[11px] text-slate-500 mb-0.5">Guru Pengawas yang bersangkutan,</p>
            <div className="h-16 flex items-center justify-center">
              <span className="text-[10px] text-slate-400 italic">(Tanda Tangan)</span>
            </div>
            <p className="font-bold text-slate-900 underline text-[11px]">{selectedTeacher}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">NIP. Guru Pengampu</p>
          </div>

          <div className="text-center relative px-2">
            <p className="text-[11px] text-slate-500 mb-0.5">{schoolInfo.signPlaceAndDate || 'Pasuruan, 23 November 2026'}</p>
            <p className="font-bold text-slate-900 leading-tight">{schoolInfo.committeeTitle || 'Ketua Panitia SAS 2026/2027'}</p>
            <div className="h-16 flex items-center justify-center relative my-0.5">
              {schoolInfo.committeeSignatureImage ? (
                <img
                  src={schoolInfo.committeeSignatureImage}
                  alt="TTD Ketua Panitia"
                  className="h-14 max-w-[130px] object-contain relative z-10"
                />
              ) : (
                <span className="text-[10px] text-slate-400 italic">(Tanda Tangan)</span>
              )}
            </div>
            <p className="font-bold text-slate-900 underline text-[11px] leading-tight">{schoolInfo.committeeName}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">NIP. {schoolInfo.committeeNip}</p>
          </div>
        </div>
      </div>

      {/* Print PDF Modal for Teacher Duty Schedule */}
      <PrintPdfModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        elementId="teacher-print-card"
        title={`Jadwal Mengawas SAS Guru: ${selectedTeacher}`}
        defaultFilename={`Jadwal_SAS_Guru_${selectedTeacher.replace(/[^a-zA-Z0-9]/g, '_')}`}
        defaultPaper="a4"
        defaultOrientation="portrait"
        allowA3={false}
      />

      {/* Print Official Token Cards Modal (For Teachers) */}
      <PrintTokenCardsModal
        isOpen={showTokenCardModal}
        onClose={() => setShowTokenCardModal(false)}
        schoolInfo={schoolInfo}
        teacherToken={getTeacherTokenConfig().defaultTeacherToken || 'GURU-SMADA2026'}
        classTokens={getClassTokenConfig().classTokens}
        initialTarget="teacher"
      />
    </div>
  );
};
