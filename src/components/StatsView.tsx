import React, { useState, useMemo } from 'react';
import { ScheduleSlot, SchoolInfo, ALL_CLASSES } from '../types/schedule';
import { 
  BarChart3, 
  CheckCircle2, 
  ShieldCheck, 
  Users, 
  BookOpen, 
  Layers, 
  Sparkles, 
  AlertTriangle, 
  RefreshCw, 
  Printer, 
  FileCheck, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { 
  auditScheduleConflicts, 
  generate100PercentConflictFreeSchedule, 
  ConflictAuditReport 
} from '../utils/conflictResolver';
import { PrintPdfModal } from './Modals/PrintPdfModal';

interface StatsViewProps {
  slots: ScheduleSlot[];
  schoolInfo: SchoolInfo;
  onUpdateSlots?: (newSlots: ScheduleSlot[]) => void;
  onSelectTeacher?: (teacherName: string) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ 
  slots, 
  schoolInfo, 
  onUpdateSlots, 
  onSelectTeacher 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);
  const [showDetailedSlots, setShowDetailedSlots] = useState(false);
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Compute live audit report
  const auditReport: ConflictAuditReport = useMemo(() => {
    return auditScheduleConflicts(slots);
  }, [slots]);

  // Compute statistics on teachers and subjects
  const teacherStats = useMemo(() => {
    const teacherCounts = new Map<string, number>();
    const subjectCounts = new Map<string, number>();

    slots.forEach((slot) => {
      ALL_CLASSES.forEach((cls) => {
        const entry = slot.entries[cls];
        if (entry && entry.subject && entry.teacher) {
          const tName = entry.teacher.trim();
          const sName = entry.subject.trim();
          teacherCounts.set(tName, (teacherCounts.get(tName) || 0) + 1);
          subjectCounts.set(sName, (subjectCounts.get(sName) || 0) + 1);
        }
      });
    });

    const sortedTeachers = Array.from(teacherCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const sortedSubjects = Array.from(subjectCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      sortedTeachers,
      sortedSubjects,
    };
  }, [slots]);

  // Handle Generate 100% Conflict-Free Schedule
  const handleGenerateConflictFree = () => {
    if (!onUpdateSlots) return;

    setIsGenerating(true);
    setGenerationNotice(null);

    // Give visual feedback and process solver
    setTimeout(() => {
      try {
        const { resolvedSlots, conflictsResolvedCount, report } = generate100PercentConflictFreeSchedule(slots);
        onUpdateSlots(resolvedSlots);

        if (conflictsResolvedCount > 0) {
          setGenerationNotice(
            `Berhasil! ${conflictsResolvedCount} jadwal bentrok berhasil diselaraskan otomatis. Seluruh jadwal kini 100% Bebas Bentrok (0% bentrok).`
          );
        } else {
          setGenerationNotice(
            'Verifikasi selesai! Semua 16 slot jadwal dan 30 kelas sudah 100% bebas bentrok tanpa ada tumpang tindih pengampu.'
          );
        }
      } catch (err) {
        console.error('Failed to generate conflict-free schedule:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Hero: Conflict Checker & 100% Conflict-Free Generator */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-800 overflow-hidden relative">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-xs font-semibold text-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Verifikator Jadwal Otomatis SAS TP {schoolInfo.academicYear}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Cek Semua Jadwal & Generator Bebas Bentrok 100%
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Memindai seluruh <strong>{auditReport.totalSlots} slot waktu</strong> dan{' '}
              <strong>30 ruang kelas</strong> (Kelas X, XI, XII). Memastikan setiap guru hanya bertugas di satu tempat pada satu sesi tanpa tabrakan jadwal mengawas/menguji.
            </p>

            {/* Audit Status Indicator */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                  auditReport.is100PercentConflictFree
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                }`}
              >
                {auditReport.is100PercentConflictFree ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>STATUS: 100% BEBAS BENTROK (0 BENTROK)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>DITEMUKAN {auditReport.conflictsCount} POTENSI BENTROK</span>
                  </>
                )}
              </div>

              <span className="text-[11px] text-slate-400">
                Diaudit pada: {auditReport.timestamp}
              </span>
            </div>
          </div>

          {/* Action Trigger Box */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              type="button"
              onClick={handleGenerateConflictFree}
              disabled={isGenerating}
              className="py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-blue-900/40 border border-blue-400/30 transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Memproses Seluruh Jadwal...' : '⚡ Generate Bebas Bentrok 100%'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-white/10 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Cetak / Unduh PDF Laporan (A4/F4)</span>
            </button>
          </div>
        </div>

        {/* Notice Toast */}
        {generationNotice && (
          <div className="mt-5 p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center gap-3 text-xs text-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="flex-1 font-medium">{generationNotice}</div>
            <button
              type="button"
              onClick={() => setGenerationNotice(null)}
              className="text-emerald-300 hover:text-white text-xs px-2 py-0.5"
            >
              Tutup
            </button>
          </div>
        )}
      </div>

      {/* Printable Audit Certificate / Report Container */}
      <div id="audit-report-card" className="space-y-6">
        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1 font-semibold">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Total Slot Waktu</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{auditReport.totalSlots} Sesi</div>
            <p className="text-[11px] text-slate-400 mt-0.5">16 Slot (Minggu 1 & 2)</p>
          </div>

          <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1 font-semibold">
              <Users className="w-4 h-4 text-teal-600" />
              <span>Guru Bertugas</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{auditReport.uniqueTeachers} Guru</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Tercatat dalam jadwal</p>
          </div>

          <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1 font-semibold">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <span>Total Penugasan</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{auditReport.totalAssignments} Mata Ujian</div>
            <p className="text-[11px] text-slate-400 mt-0.5">30 kelas × 16 sesi</p>
          </div>

          <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Persentase Bebas Bentrok</span>
            </div>
            <div className="text-2xl font-black text-emerald-700">
              {auditReport.conflictFreePercentage}%
            </div>
            <p className="text-[11px] text-emerald-600 mt-0.5 font-bold">
              {auditReport.is100PercentConflictFree ? '100% Terverifikasi Aman' : 'Ada Bentrok'}
            </p>
          </div>
        </div>

        {/* Conflict List (if any) */}
        {auditReport.conflicts.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Daftar Bentrok Jadwal Pengampu ({auditReport.conflicts.length} Kejadian)</span>
            </div>
            <p className="text-xs text-amber-800">
              Guru berikut terdaftar mengajar di lebih dari 1 kelas pada sesi dan jam yang sama. Klik tombol <strong>"⚡ Generate Bebas Bentrok 100%"</strong> di atas untuk menyelesaikan secara instan.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {auditReport.conflicts.map((c, i) => (
                <div key={i} className="bg-white p-3.5 rounded-lg border border-amber-200 text-xs space-y-1.5 shadow-2xs">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>{c.teacher}</span>
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-semibold">
                      Bentrok {c.classes.length} Kelas
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    <strong>Slot:</strong> {c.slotName} ({c.dayAndDate}, {c.time})
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    <strong>Kelas:</strong> {c.classes.join(', ')} ({c.subjects.join(' / ')})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slot-by-Slot Audit Breakdown Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Hasil Audit Per Slot Waktu ({auditReport.slotAudits.length} Slot)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Verifikasi status 30 ruang kelas dan kesesuaian guru pengampu per sesi
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDetailedSlots(!showDetailedSlots)}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              <span>{showDetailedSlots ? 'Sembunyikan Rincian' : 'Tampilkan Rincian Lengkap'}</span>
              {showDetailedSlots ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="px-3.5 py-2.5 w-12 text-center">No</th>
                  <th className="px-3.5 py-2.5 min-w-[130px]">Nama Slot</th>
                  <th className="px-3.5 py-2.5 min-w-[160px]">Hari & Tanggal</th>
                  <th className="px-3.5 py-2.5 min-w-[140px]">Sesi & Jam</th>
                  <th className="px-3.5 py-2.5 text-center w-28">Kelas Terisi</th>
                  <th className="px-3.5 py-2.5 text-center w-36">Status Bentrok</th>
                  <th className="px-3.5 py-2.5 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditReport.slotAudits.map((slotAudit, idx) => {
                  const isExpanded = expandedSlotId === slotAudit.slotId;
                  const originalSlot = slots.find((s) => s.id === slotAudit.slotId);

                  return (
                    <React.Fragment key={slotAudit.slotId}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3.5 py-2.5 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-slate-900">
                          {slotAudit.slotName}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-700">
                          {slotAudit.dayAndDate}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-700 font-mono text-[11px]">
                          {slotAudit.session} · {slotAudit.time}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-semibold text-slate-800">
                          {slotAudit.assignedTeachersCount} / 30
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          {slotAudit.hasConflict ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              {slotAudit.conflictingTeachers.length} Bentrok
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              0% Bebas Bentrok
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => setExpandedSlotId(isExpanded ? null : slotAudit.slotId)}
                            className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 underline"
                          >
                            {isExpanded ? 'Tutup' : 'Lihat'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Slot Detail showing all classes in this slot */}
                      {isExpanded && originalSlot && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={7} className="px-4 py-3 border-y border-slate-200">
                            <div className="space-y-2">
                              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                Daftar Pengampu & Mapel 30 Kelas pada {originalSlot.slotName}:
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-[11px]">
                                {ALL_CLASSES.map((cls) => {
                                  const entry = originalSlot.entries[cls];
                                  return (
                                    <div key={cls} className="bg-white p-2 rounded border border-slate-200">
                                      <div className="font-bold text-blue-900">{cls}</div>
                                      <div className="text-slate-800 font-medium truncate" title={entry?.subject || '-'}>
                                        {entry?.subject || '-'}
                                      </div>
                                      <div className="text-slate-500 text-[10px] truncate" title={entry?.teacher || '-'}>
                                        {entry?.teacher || '-'}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Teacher Workload Table & Subject Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Teacher Workload */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-700" />
              <span>Distribusi Beban Mengawas Guru ({teacherStats.sortedTeachers.length} Guru)</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Banyaknya sesi pengawasan / mata ujian yang ditangani setiap guru
            </p>

            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
              {teacherStats.sortedTeachers.map((t, idx) => (
                <div
                  key={t.name}
                  onClick={() => onSelectTeacher && onSelectTeacher(t.name)}
                  className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-3">
                    <span className="text-[11px] font-mono text-slate-400 w-5 text-right">
                      {idx + 1}.
                    </span>
                    <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-700">
                      {t.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${Math.min(100, t.count * 6)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-mono w-14 text-right">
                      {t.count} sesi
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Breakdown */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-700" />
              <span>Frekuensi Mata Pelajaran Diujikan ({teacherStats.sortedSubjects.length} Mapel)</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Total ruang kelas yang melaksanakan ujian mata pelajaran tersebut
            </p>

            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
              {teacherStats.sortedSubjects.map((s, idx) => (
                <div key={s.name} className="py-2.5 px-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-3">
                    <span className="text-[11px] font-mono text-slate-400 w-5 text-right">
                      {idx + 1}.
                    </span>
                    <span className="text-xs font-medium text-slate-800 truncate">
                      {s.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {s.count} kelas
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Print PDF Modal */}
      <PrintPdfModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        elementId="audit-report-card"
        title="Laporan Hasil Audit Jadwal Bebas Bentrok SAS"
        defaultFilename={`Audit_Bebas_Bentrok_SAS_SMAN2_Pasuruan_${schoolInfo.academicYear.replace('/', '-')}`}
        defaultPaper="a4"
        defaultOrientation="portrait"
        allowA3={false}
      />
    </div>
  );
};
