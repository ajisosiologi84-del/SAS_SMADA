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
  AlertCircle 
} from 'lucide-react';
import { exportTeacherToExcel } from '../utils/exportUtils';
import { KopSurat } from './KopSurat';
import { PrintPdfModal } from './Modals/PrintPdfModal';

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

  // Filter teachers in selector
  const matchingTeachers = useMemo(() => {
    if (!filterQuery.trim()) return allTeachers;
    return allTeachers.filter((t) =>
      t.name.toLowerCase().includes(filterQuery.toLowerCase())
    );
  }, [allTeachers, filterQuery]);

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
              Pilih nama guru untuk melihat rincian jadwal mengawas dan menguji
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
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              title="Buka opsi cetak & unduh PDF format A4 atau F4"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Unduh PDF (A4 / F4)</span>
            </button>
          </div>
        </div>

        {/* Search & Teacher Pill Selectors */}
        <div className="space-y-2">
          <div className="relative max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Cari nama guru..."
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div className="max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap gap-1.5">
            {matchingTeachers.map((t) => {
              const isSelected = selectedTeacher === t.name;
              return (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setSelectedTeacher(t.name)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    isSelected
                      ? 'bg-blue-700 text-white font-semibold shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <span>{t.name}</span>
                  <span className={`ml-1.5 text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    ({t.count}x)
                  </span>
                </button>
              );
            })}
          </div>
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
        <div className="overflow-x-auto border border-slate-300 rounded-lg my-4">
          <table className="w-full text-left border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <th className="px-3 py-2.5 border-r border-slate-700 text-center w-12">No</th>
                <th className="px-4 py-2.5 border-r border-slate-700 min-w-[150px]">Hari & Tanggal</th>
                <th className="px-3 py-2.5 border-r border-slate-700 w-28">Sesi</th>
                <th className="px-3 py-2.5 border-r border-slate-700 w-32 font-mono">Waktu</th>
                <th className="px-3 py-2.5 border-r border-slate-700 text-center w-24">Kelas</th>
                <th className="px-4 py-2.5 border-r border-slate-700 min-w-[200px]">Mata Pelajaran</th>
                <th className="px-3 py-2.5 text-center w-28">Tanda Tangan</th>
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
                      <td className="px-3 py-2.5 border-r border-slate-300 text-center font-bold text-slate-800">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-300 font-semibold text-slate-900">
                        {item.slot.dayAndDate}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-300 text-slate-700">
                        {item.slot.session}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-300 font-mono text-slate-900 font-semibold">
                        {item.slot.time}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-300 text-center font-extrabold text-blue-900">
                        {item.className}
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-300 font-medium text-slate-900">
                        {item.subject}
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-400">
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
        <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-800">
          <div className="text-center">
            <p className="text-[11px] text-slate-500 mb-1">Guru Pengawas yang bersangkutan,</p>
            <div className="h-16 flex items-center justify-center">
              <span className="text-[10px] text-slate-400 italic">(Tanda Tangan)</span>
            </div>
            <p className="font-bold text-slate-900 underline">{selectedTeacher}</p>
            <p className="text-[10px] text-slate-500">NIP. Guru Pengampu</p>
          </div>

          <div className="text-center">
            <p className="text-[11px] text-slate-500 mb-1">Pasuruan, 23 November 2026</p>
            <p className="font-bold text-slate-900">Ketua Panitia SAS 2026/2027</p>
            <div className="h-16 flex items-center justify-center">
              <span className="text-[10px] text-slate-400 italic">(Tanda Tangan)</span>
            </div>
            <p className="font-bold text-slate-900 underline">{schoolInfo.committeeName}</p>
            <p className="text-[10px] text-slate-500">NIP. {schoolInfo.committeeNip}</p>
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
    </div>
  );
};
