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
  AlertTriangle,
  KeyRound,
  Layers
} from 'lucide-react';
import { exportClassToExcel, downloadElementAsImage } from '../utils/exportUtils';
import { KopSurat } from './KopSurat';
import { ClassScheduleCard } from './Common/ClassScheduleCard';
import { PrintPdfModal } from './Modals/PrintPdfModal';
import { PrintTokenCardsModal } from './Modals/PrintTokenCardsModal';
import { DownloadAllClassCardsModal } from './Modals/DownloadAllClassCardsModal';
import { getClassTokenConfig, getTeacherTokenConfig } from '../utils/storage';

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
  const [showTokenCardModal, setShowTokenCardModal] = useState(false);
  const [showDownloadAllCardsModal, setShowDownloadAllCardsModal] = useState(false);

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
      {role === 'kelas' && (
        <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-emerald-500/10 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-950 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
              🎓
            </div>
            <div>
              <p className="font-bold text-slate-900">
                Terautentikasi: Akun Resmi Kelas {selectedClass}
              </p>
              <p className="text-[11px] text-slate-600">
                Hak akses Anda dibatasi khusus untuk melihat, mencetak PDF/JPG, dan mengunduh jadwal resmi Kelas {selectedClass}.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-300 shrink-0">
            Akses Terkunci: Kelas {selectedClass}
          </span>
        </div>
      )}

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

            {role === 'admin' && (
              <>
                {/* Single Combined PDF for All Classes in One Go */}
                <button
                  type="button"
                  onClick={() => setShowDownloadAllCardsModal(true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 active:scale-[0.98] rounded-lg flex items-center gap-1.5 shadow-xs transition-all ring-1 ring-indigo-400"
                  title="Hasilkan 1 file PDF gabungan untuk semua kelas sekaligus (Download All Cards)"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Download All Cards</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowTokenCardModal(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                  title={`Cetak kartu token akses resmi untuk Kelas ${selectedClass}`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                  <span>Kartu Token Kelas</span>
                </button>
              </>
            )}

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
      <ClassScheduleCard
        id="class-print-card"
        className={selectedClass}
        slots={slots}
        schoolInfo={schoolInfo}
      />

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

      {/* Print Official Token Cards Modal */}
      <PrintTokenCardsModal
        isOpen={showTokenCardModal}
        onClose={() => setShowTokenCardModal(false)}
        schoolInfo={schoolInfo}
        teacherToken={getTeacherTokenConfig().defaultTeacherToken || 'GURU-SMADA2026'}
        classTokens={getClassTokenConfig().classTokens}
        initialTarget="single-class"
        initialSelectedClass={selectedClass}
      />

      {/* Combined Single PDF for All Classes Modal */}
      <DownloadAllClassCardsModal
        isOpen={showDownloadAllCardsModal}
        onClose={() => setShowDownloadAllCardsModal(false)}
        slots={slots}
        schoolInfo={schoolInfo}
      />
    </div>
  );
};
