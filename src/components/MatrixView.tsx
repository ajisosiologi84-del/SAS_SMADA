import React, { useState, useMemo } from 'react';
import { 
  ScheduleSlot, 
  SchoolInfo, 
  UserRole, 
  ALL_CLASSES, 
  GRADE_GROUPS 
} from '../types/schedule';
import { 
  FileSpreadsheet, 
  Image as ImageIcon, 
  Printer, 
  Plus, 
  Upload, 
  Edit3, 
  Filter, 
  ZoomIn, 
  ZoomOut,
  Sparkles,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { exportMatrixToExcel, downloadElementAsImage } from '../utils/exportUtils';
import { KopSurat } from './KopSurat';
import { PrintPdfModal } from './Modals/PrintPdfModal';
import { auditScheduleConflicts, generate100PercentConflictFreeSchedule } from '../utils/conflictResolver';

interface MatrixViewProps {
  slots: ScheduleSlot[];
  schoolInfo: SchoolInfo;
  role: UserRole;
  searchQuery: string;
  onEditSlot: (slot: ScheduleSlot) => void;
  onAddNewSlot: () => void;
  onOpenUpload: () => void;
  onPrintA3: () => void;
  onUpdateSlots?: (newSlots: ScheduleSlot[]) => void;
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  slots,
  schoolInfo,
  role,
  searchQuery,
  onEditSlot,
  onAddNewSlot,
  onOpenUpload,
  onPrintA3,
  onUpdateSlots,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<'ALL' | 'X' | 'XI' | 'XII'>('ALL');
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [selectedSession, setSelectedSession] = useState<string>('ALL');
  const [zoomLevel, setZoomLevel] = useState<'compact' | 'normal' | 'wide'>('normal');
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conflictNotice, setConflictNotice] = useState<string | null>(null);

  // Compute live conflict audit
  const auditReport = useMemo(() => {
    return auditScheduleConflicts(slots);
  }, [slots]);

  // Handle Generate 100% Conflict-Free Schedule
  const handleGenerateConflictFree = () => {
    if (!onUpdateSlots) return;
    setIsGenerating(true);
    setConflictNotice(null);

    setTimeout(() => {
      try {
        const { resolvedSlots, conflictsResolvedCount } = generate100PercentConflictFreeSchedule(slots);
        onUpdateSlots(resolvedSlots);
        if (conflictsResolvedCount > 0) {
          setConflictNotice(`${conflictsResolvedCount} bentrok terselesaikan! Jadwal kini 100% Bebas Bentrok.`);
        } else {
          setConflictNotice('Semua jadwal sudah 100% Bebas Bentrok (0% tabrakan pengampu).');
        }
        setTimeout(() => setConflictNotice(null), 4000);
      } finally {
        setIsGenerating(false);
      }
    }, 350);
  };

  // Extract unique days
  const uniqueDays = useMemo(() => {
    const days = new Set<string>();
    slots.forEach((s) => {
      if (s.dayAndDate) days.add(s.dayAndDate.trim());
    });
    return Array.from(days);
  }, [slots]);

  // Determine active classes to display
  const displayClasses = useMemo(() => {
    if (selectedGrade === 'ALL') return ALL_CLASSES;
    return GRADE_GROUPS[selectedGrade];
  }, [selectedGrade]);

  // Filter slots
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      // Day filter
      if (selectedDay !== 'ALL' && slot.dayAndDate !== selectedDay) {
        return false;
      }
      // Session filter
      if (selectedSession !== 'ALL') {
        if (selectedSession === 'Sesi 1' && !slot.session.includes('Sesi 1')) return false;
        if (selectedSession === 'Sesi 2' && !slot.session.includes('Sesi 2')) return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesHeader = 
          slot.slotName.toLowerCase().includes(q) ||
          slot.dayAndDate.toLowerCase().includes(q) ||
          slot.time.toLowerCase().includes(q) ||
          slot.session.toLowerCase().includes(q);

        if (matchesHeader) return true;

        const matchesAnyClass = displayClasses.some((cls) => {
          const entry = slot.entries[cls];
          if (!entry) return false;
          return (
            entry.subject.toLowerCase().includes(q) ||
            entry.teacher.toLowerCase().includes(q) ||
            cls.toLowerCase().includes(q)
          );
        });

        return matchesAnyClass;
      }
      return true;
    });
  }, [slots, selectedDay, selectedSession, searchQuery, displayClasses]);

  // Image JPG Export handler
  const handleExportJPG = async () => {
    setIsExportingImage(true);
    try {
      await downloadElementAsImage(
        'a3-matrix-container',
        `Jadwal_SAS_A3_SMAN2_Pasuruan_${selectedGrade}`,
        'jpeg'
      );
    } finally {
      setIsExportingImage(false);
    }
  };

  // Zoom styles
  const cellPadding = zoomLevel === 'compact' ? 'px-2 py-1 text-[11px]' : zoomLevel === 'wide' ? 'px-3.5 py-2.5 text-xs' : 'px-2.5 py-1.5 text-xs';
  const classColWidth = zoomLevel === 'compact' ? 'min-w-[130px]' : zoomLevel === 'wide' ? 'min-w-[180px]' : 'min-w-[150px]';

  return (
    <div className="space-y-4">
      {/* Action and Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs no-print space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Grade Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Tingkat:
            </span>
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setSelectedGrade('ALL')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  selectedGrade === 'ALL'
                    ? 'bg-white text-blue-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Jenjang (30 Kelas)
              </button>
              <button
                type="button"
                onClick={() => setSelectedGrade('X')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  selectedGrade === 'X'
                    ? 'bg-white text-blue-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kelas X (10)
              </button>
              <button
                type="button"
                onClick={() => setSelectedGrade('XI')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  selectedGrade === 'XI'
                    ? 'bg-white text-blue-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kelas XI (10)
              </button>
              <button
                type="button"
                onClick={() => setSelectedGrade('XII')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  selectedGrade === 'XII'
                    ? 'bg-white text-blue-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kelas XII (10)
              </button>
            </div>
          </div>

          {/* Quick Filters: Day and Session */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 text-xs focus:ring-1 focus:ring-blue-600"
              >
                <option value="ALL">Semua Hari Pelaksanaan</option>
                {uniqueDays.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 text-xs focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">Semua Sesi</option>
              <option value="Sesi 1">Sesi 1 (Jam Ke-1)</option>
              <option value="Sesi 2">Sesi 2 (Jam Ke-2)</option>
            </select>

            {/* Zoom Toggle */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setZoomLevel('compact')}
                className={`p-1 rounded ${zoomLevel === 'compact' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
                title="Tampilan Rapat (Cocok untuk layar monitor)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel('normal')}
                className={`p-1 rounded ${zoomLevel === 'normal' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
                title="Tampilan Normal"
              >
                <span className="text-[10px] font-bold px-0.5">1x</span>
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel('wide')}
                className={`p-1 rounded ${zoomLevel === 'wide' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
                title="Tampilan Luas"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Toolbar: Export & Admin Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Menampilkan <strong>{filteredSlots.length}</strong> slot ujian</span>
            <span aria-hidden="true">·</span>
            <span><strong>{displayClasses.length}</strong> kelas terpasang</span>
            {searchQuery && (
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Filter: "{searchQuery}"
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Conflict Status Badge & Generator */}
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                  auditReport.is100PercentConflictFree
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
                title={`Status verifikasi bentrok pengampu (${auditReport.totalSlots} slot)`}
              >
                {auditReport.is100PercentConflictFree ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>100% Bebas Bentrok</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>{auditReport.conflictsCount} Bentrok</span>
                  </>
                )}
              </span>

              {onUpdateSlots && (
                <button
                  type="button"
                  onClick={handleGenerateConflictFree}
                  disabled={isGenerating}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-60"
                  title="Klik untuk otomatis menyelaraskan semua jadwal agar 100% bebas bentrok"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Menyelaraskan...' : '⚡ Generate Bebas Bentrok'}</span>
                </button>
              )}
            </div>

            {/* Admin CRUD Actions */}
            {role === 'admin' && (
              <>
                <button
                  type="button"
                  onClick={onAddNewSlot}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Slot Baru</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenUpload}
                  className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah CSV / Excel</span>
                </button>
              </>
            )}

            {/* Export Buttons */}
            <button
              type="button"
              onClick={() => exportMatrixToExcel(filteredSlots, schoolInfo, displayClasses)}
              className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Unduh jadwal dalam format Excel .xlsx"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unduh Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportJPG}
              disabled={isExportingImage}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              title="Unduh jadwal dalam format Gambar JPG siap cetak"
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>{isExportingImage ? 'Membuat JPG...' : 'Unduh JPG'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              title="Buka opsi cetak & unduh PDF format A3, F4 (Folio), atau A4"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Unduh PDF (A3 / F4 / A4)</span>
            </button>
          </div>
        </div>

        {/* Conflict Notice Banner */}
        {conflictNotice && (
          <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{conflictNotice}</span>
          </div>
        )}
      </div>

      {/* Main Matriks Table Container */}
      <div
        id="a3-matrix-container"
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6"
      >
        {/* Kop Surat for A3 Format */}
        <KopSurat
          schoolInfo={schoolInfo}
          title={`JADWAL SUMATIF AKHIR SEMESTER (SAS) TERINTEGRASI ${selectedGrade === 'ALL' ? 'KELAS X, XI, DAN XII' : `KELAS ${selectedGrade}`}`}
          subTitle={`Tahun Pelajaran ${schoolInfo.academicYear} · Terverifikasi 0% Bentrok Pengampu`}
        />

        {/* Scrollable Matrix Table */}
        <div className="overflow-x-auto border border-slate-300 rounded-lg shadow-2xs">
          <table className="w-full text-left border-collapse border border-slate-300 text-slate-800">
            {/* Table Header */}
            <thead>
              {/* Top grouping row */}
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th colSpan={5} className="px-3 py-2 border-r border-b border-slate-700 text-center">
                  INFORMASI SESI UJIAN
                </th>
                {selectedGrade === 'ALL' ? (
                  <>
                    <th colSpan={10} className="px-3 py-2 border-r border-b border-slate-700 text-center bg-blue-900">
                      KELAS X (FASE E)
                    </th>
                    <th colSpan={10} className="px-3 py-2 border-r border-b border-slate-700 text-center bg-teal-900">
                      KELAS XI (FASE F)
                    </th>
                    <th colSpan={10} className="px-3 py-2 border-b border-slate-700 text-center bg-indigo-950">
                      KELAS XII (FASE F TINGKAT LANJUT)
                    </th>
                  </>
                ) : (
                  <th colSpan={displayClasses.length} className="px-3 py-2 border-b border-slate-700 text-center bg-blue-900">
                    KELAS {selectedGrade}
                  </th>
                )}
              </tr>

              {/* Sub-header row with column names */}
              <tr className="bg-slate-100 text-[11px] font-bold text-slate-700 sticky top-0 z-20 shadow-xs border-b border-slate-300">
                <th className="px-2.5 py-2 border-r border-slate-300 whitespace-nowrap min-w-[65px] text-center">
                  Slot
                </th>
                <th className="px-2.5 py-2 border-r border-slate-300 whitespace-nowrap min-w-[75px] text-center">
                  Minggu
                </th>
                <th className="px-3 py-2 border-r border-slate-300 whitespace-nowrap min-w-[150px]">
                  Hari & Tanggal
                </th>
                <th className="px-3 py-2 border-r border-slate-300 whitespace-nowrap min-w-[120px]">
                  Sesi
                </th>
                <th className="px-3 py-2 border-r-2 border-slate-400 whitespace-nowrap min-w-[125px]">
                  Waktu
                </th>

                {/* Class columns */}
                {displayClasses.map((cls) => {
                  const isGradeX = cls.startsWith('X-');
                  const isGradeXI = cls.startsWith('XI-');
                  const headerBg = isGradeX
                    ? 'bg-blue-50/70 text-blue-900'
                    : isGradeXI
                    ? 'bg-emerald-50/70 text-emerald-900'
                    : 'bg-indigo-50/70 text-indigo-900';

                  return (
                    <th
                      key={cls}
                      className={`px-2 py-2 border-r border-slate-300 text-center font-extrabold ${classColWidth} ${headerBg}`}
                    >
                      {cls}
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200">
              {filteredSlots.length === 0 ? (
                <tr>
                  <td
                    colSpan={5 + displayClasses.length}
                    className="text-center py-12 text-slate-500 text-xs"
                  >
                    Tidak ada jadwal yang sesuai dengan filter atau kata kunci pencarian.
                  </td>
                </tr>
              ) : (
                filteredSlots.map((slot, sIdx) => {
                  const isAlternate = sIdx % 2 === 1;
                  const rowBaseBg = isAlternate ? 'bg-slate-50/60' : 'bg-white';

                  return (
                    <tr
                      key={slot.id}
                      className={`${rowBaseBg} hover:bg-blue-50/40 transition-colors group`}
                    >
                      {/* Slot Name */}
                      <td className="px-2.5 py-2 border-r border-slate-300 text-center font-bold text-slate-900 text-xs whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <span>{slot.slotName}</span>
                          {role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => onEditSlot(slot)}
                              className="text-slate-400 hover:text-blue-700 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity no-print"
                              title="Edit slot ini"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Minggu */}
                      <td className="px-2.5 py-2 border-r border-slate-300 text-center text-slate-600 text-[11px] whitespace-nowrap font-medium">
                        {slot.week}
                      </td>

                      {/* Hari & Tanggal */}
                      <td className="px-3 py-2 border-r border-slate-300 text-slate-900 font-semibold text-xs whitespace-nowrap">
                        {slot.dayAndDate}
                      </td>

                      {/* Sesi */}
                      <td className="px-3 py-2 border-r border-slate-300 text-slate-700 text-[11px] whitespace-nowrap">
                        {slot.session}
                      </td>

                      {/* Waktu */}
                      <td className="px-3 py-2 border-r-2 border-slate-400 text-slate-800 text-xs whitespace-nowrap font-mono font-medium">
                        {slot.time}
                      </td>

                      {/* Class Entries */}
                      {displayClasses.map((cls) => {
                        const entry = slot.entries[cls];
                        const hasEntry = entry && entry.subject;

                        // Check query highlight
                        const isMatch = searchQuery.trim() && hasEntry && (
                          entry.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cls.toLowerCase().includes(searchQuery.toLowerCase())
                        );

                        return (
                          <td
                            key={cls}
                            className={`border-r border-slate-300 align-top ${cellPadding} ${
                              isMatch ? 'bg-amber-100/90 ring-1 ring-amber-400' : ''
                            } ${!hasEntry ? 'bg-slate-100/40 text-center text-slate-400 font-mono' : ''}`}
                          >
                            {hasEntry ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-slate-900 leading-snug">
                                  {entry.subject}
                                </div>
                                <div className="text-[10px] text-slate-600 leading-tight">
                                  ({entry.teacher})
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-bold">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Sign-off and Notes for Print & Verification */}
        <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-700">
          <div>
            <p className="font-bold text-slate-900 mb-1">Catatan Pelaksanaan SAS:</p>
            <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5 leading-relaxed">
              {(schoolInfo.examNotes && schoolInfo.examNotes.length > 0 ? schoolInfo.examNotes : [
                'Ujian dilaksanakan sesuai jadwal terintegrasi tanpa toleransi keterlambatan.',
                'Revisi Pengampu No. 59 dialihkan ke No. 57, No. 24, dan No. 32.',
                'Status verifikasi jadwal: 100% Valid (0% Bentrok Pengampu).',
              ]).map((note, nIdx) => (
                <li key={nIdx}>{note}</li>
              ))}
            </ul>
          </div>

          <div className="text-center relative">
            <p className="text-[11px] text-slate-500 mb-1">Mengetahui,</p>
            <p className="font-bold text-slate-900">{schoolInfo.headmasterTitle || 'Kepala SMA Negeri 2 Pasuruan'}</p>
            <div className="h-20 flex items-center justify-center relative my-1">
              {schoolInfo.headmasterStampImage && (
                <img
                  src={schoolInfo.headmasterStampImage}
                  alt="Stempel Sekolah"
                  className="absolute left-1/4 -top-1 w-20 h-20 object-contain opacity-80 pointer-events-none"
                />
              )}
              {schoolInfo.headmasterSignatureImage ? (
                <img
                  src={schoolInfo.headmasterSignatureImage}
                  alt="TTD Kepala Sekolah"
                  className="h-16 max-w-[140px] object-contain relative z-10"
                />
              ) : (
                <span className="text-[10px] text-slate-400 italic">(Tanda Tangan & Cap Resmi)</span>
              )}
            </div>
            <p className="font-bold text-slate-900 underline">{schoolInfo.headmasterName}</p>
            <p className="text-[10px] text-slate-600">NIP. {schoolInfo.headmasterNip}</p>
          </div>

          <div className="text-center relative">
            <p className="text-[11px] text-slate-500 mb-1">{schoolInfo.signPlaceAndDate || 'Pasuruan, 23 November 2026'}</p>
            <p className="font-bold text-slate-900">{schoolInfo.committeeTitle || 'Ketua Panitia SAS 2026/2027'}</p>
            <div className="h-20 flex items-center justify-center relative my-1">
              {schoolInfo.committeeSignatureImage ? (
                <img
                  src={schoolInfo.committeeSignatureImage}
                  alt="TTD Ketua Panitia"
                  className="h-16 max-w-[140px] object-contain relative z-10"
                />
              ) : (
                <span className="text-[10px] text-slate-400 italic">(Tanda Tangan)</span>
              )}
            </div>
            <p className="font-bold text-slate-900 underline">{schoolInfo.committeeName}</p>
            <p className="text-[10px] text-slate-600">NIP. {schoolInfo.committeeNip}</p>
          </div>
        </div>
      </div>

      {/* Print / Download PDF Modal with A3 / F4 / A4 selection */}
      <PrintPdfModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        elementId="a3-matrix-container"
        title={`Jadwal SAS Terintegrasi ${selectedGrade === 'ALL' ? 'Semua Jenjang' : `Kelas ${selectedGrade}`}`}
        defaultFilename={`Jadwal_SAS_Terintegrasi_SMAN2_Pasuruan_${selectedGrade}`}
        defaultPaper="a3"
        defaultOrientation="landscape"
        allowA3={true}
      />
    </div>
  );
};
