import React, { useState } from 'react';
import { 
  ScheduleSlot, 
  SchoolInfo, 
  UserRole, 
  ALL_CLASSES, 
  GRADE_GROUPS 
} from '../types/schedule';
import { 
  Printer, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  Share2, 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { exportClassToExcel, downloadElementAsImage } from '../utils/exportUtils';
import { KopSurat } from './KopSurat';
import { PrintPdfModal } from './Modals/PrintPdfModal';

interface ClassViewProps {
  slots: ScheduleSlot[];
  schoolInfo: SchoolInfo;
  selectedClass: string;
  onSelectClass: (className: string) => void;
  role: UserRole;
  onOpenShareModal: () => void;
}

export const ClassView: React.FC<ClassViewProps> = ({
  slots,
  schoolInfo,
  selectedClass,
  onSelectClass,
  role,
  onOpenShareModal,
}) => {
  const [activeGradeTab, setActiveGradeTab] = useState<'X' | 'XI' | 'XII'>(() => {
    if (selectedClass.startsWith('XII-')) return 'XII';
    if (selectedClass.startsWith('XI-')) return 'XI';
    return 'X';
  });

  const [isExportingImage, setIsExportingImage] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Extract all slots that have exams for this specific class
  const classSchedule = slots
    .map((slot) => {
      const entry = slot.entries[selectedClass];
      return {
        slot,
        entry,
      };
    })
    .filter((item) => item.entry !== null && item.entry.subject.trim() !== '');

  const totalExams = classSchedule.length;

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  const handleExportJPG = async () => {
    setIsExportingImage(true);
    try {
      await downloadElementAsImage(
        'class-print-card',
        `Jadwal_SAS_Kelas_${selectedClass}_SMAN2_Pasuruan`,
        'jpeg'
      );
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Selector Navigation */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs no-print space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Pilih Kelas Peserta Didik:</h3>
            <p className="text-xs text-slate-500">Lihat jadwal harian dan cetak kartu ujian resmi per kelas</p>
          </div>

          {/* Grade Tab Selector */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
            {(['X', 'XI', 'XII'] as const).map((grade) => (
              <button
                key={grade}
                type="button"
                onClick={() => {
                  setActiveGradeTab(grade);
                  // Auto-select first class in grade if current selection is not in that grade
                  if (!selectedClass.startsWith(`${grade}-`)) {
                    onSelectClass(`${grade}-1`);
                  }
                }}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeGradeTab === grade
                    ? 'bg-white text-blue-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tingkat {grade}
              </button>
            ))}
          </div>
        </div>

        {/* Individual Class Buttons */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-2 border-t border-slate-100">
          {GRADE_GROUPS[activeGradeTab].map((cls) => {
            const isSelected = selectedClass === cls;
            return (
              <button
                key={cls}
                type="button"
                onClick={() => onSelectClass(cls)}
                className={`py-2 px-1 text-center text-xs font-bold rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-blue-700 text-white border-blue-800 shadow-xs ring-2 ring-blue-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                {cls}
              </button>
            );
          })}
        </div>

        {/* Class Actions Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-900">Kelas {selectedClass}</span>
            <span aria-hidden="true">·</span>
            <span>Total <strong>{totalExams}</strong> Mata Ujian</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Jadwal Terverifikasi
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenShareModal}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Bagikan Tautan Kelas</span>
            </button>

            <button
              type="button"
              onClick={() => exportClassToExcel(slots, selectedClass, schoolInfo)}
              className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unduh Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportJPG}
              disabled={isExportingImage}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>{isExportingImage ? 'Membuat JPG...' : 'Unduh JPG'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              title="Buka pilihan cetak & unduh PDF format A4 atau F4"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Unduh PDF (A4 / F4)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Schedule Card for Selected Class */}
      <div
        id="class-print-card"
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto a4-print-target"
      >
        {/* Formal Kop Surat */}
        <KopSurat
          schoolInfo={schoolInfo}
          title={`JADWAL SUMATIF AKHIR SEMESTER (SAS) GANJIL`}
          subTitle={`KELAS: ${selectedClass} · TAHUN PELAJARAN ${schoolInfo.academicYear}`}
        />

        {/* Schedule Table */}
        <div className="overflow-x-auto border border-slate-300 rounded-lg my-4">
          <table className="w-full text-left border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <th className="px-3 py-2.5 border-r border-slate-700 text-center w-12">No</th>
                <th className="px-3 py-2.5 border-r border-slate-700 w-24">Minggu</th>
                <th className="px-4 py-2.5 border-r border-slate-700 min-w-[150px]">Hari & Tanggal</th>
                <th className="px-3 py-2.5 border-r border-slate-700 w-28">Sesi</th>
                <th className="px-3 py-2.5 border-r border-slate-700 w-32 font-mono">Waktu</th>
                <th className="px-4 py-2.5 border-r border-slate-700 min-w-[200px]">Mata Pelajaran</th>
                <th className="px-4 py-2.5 min-w-[200px]">Guru Pengampu / Pengawas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {classSchedule.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Tidak ada jadwal ujian terdaftar untuk kelas {selectedClass}.
                  </td>
                </tr>
              ) : (
                classSchedule.map((item, idx) => {
                  const isEven = idx % 2 === 1;
                  return (
                    <tr
                      key={item.slot.id}
                      className={`${isEven ? 'bg-slate-50/70' : 'bg-white'} hover:bg-blue-50/30 transition-colors`}
                    >
                      <td className="px-3 py-2.5 border-r border-slate-300 text-center font-bold text-slate-800">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-300 text-slate-600 font-medium">
                        {item.slot.week}
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
                      <td className="px-4 py-2.5 border-r border-slate-300 font-bold text-blue-950">
                        {item.entry?.subject}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">
                        {item.entry?.teacher}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Tata Tertib Peserta SAS 2026/2027 */}
        <div className="mt-6 p-4 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase tracking-wide">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Tata Tertib Peserta Sumatif Akhir Semester (SAS):</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-slate-600 pl-1">
            {(schoolInfo.examRules && schoolInfo.examRules.length > 0 ? schoolInfo.examRules : [
              'Peserta didik wajib hadir di ruang ujian selambat-lambatnya 15 menit sebelum bel masuk dibunyikan.',
              'Mengenakan pakaian seragam sekolah rapi, atribut lengkap, dan bersepatu hitam sesuai ketentuan hari.',
              'Membawa kartu peserta SAS dan perlengkapan alat tulis pribadi (dilarang saling meminjam alat tulis).',
              'Perangkat gawai / Handphone (HP) wajib dimatikan atau dikumpulkan di depan ruang ujian sesuai instruksi pengawas.',
              'Dilarang berbuat curang, menyontek, atau bekerja sama dalam bentuk apa pun selama ujian berlangsung.',
            ]).map((rule, rIdx) => (
              <li key={rIdx}>{rule}</li>
            ))}
          </ol>
        </div>

        {/* Sign-off / Lembar Pengesahan */}
        <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-800">
          <div className="text-center">
            <p className="text-[11px] text-slate-500 mb-1">Mengetahui,</p>
            <p className="font-bold text-slate-900">Wali Kelas {selectedClass}</p>
            <div className="h-20 flex items-center justify-center">
              <span className="text-[10px] text-slate-400 italic">(Tanda Tangan)</span>
            </div>
            <p className="font-bold text-slate-900 underline">( ............................................ )</p>
            <p className="text-[10px] text-slate-500">NIP. -</p>
          </div>

          <div className="text-center relative">
            <p className="text-[11px] text-slate-500 mb-1">{schoolInfo.signPlaceAndDate || 'Pasuruan, 23 November 2026'}</p>
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
            <p className="text-[10px] text-slate-500">NIP. {schoolInfo.headmasterNip}</p>
          </div>
        </div>
      </div>

      {/* Print & Download PDF Modal with A4 / F4 selection */}
      <PrintPdfModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        elementId="class-print-card"
        title={`Jadwal SAS Ganjil Kelas ${selectedClass}`}
        defaultFilename={`Jadwal_SAS_Kelas_${selectedClass}_SMAN2_Pasuruan`}
        defaultPaper="a4"
        defaultOrientation="portrait"
        allowA3={false}
      />
    </div>
  );
};
