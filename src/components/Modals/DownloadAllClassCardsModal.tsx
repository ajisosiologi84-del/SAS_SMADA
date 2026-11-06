import React, { useState, useRef, useId } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Check, 
  Layers, 
  FileText, 
  Sparkles, 
  Loader2, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { ScheduleSlot, SchoolInfo, ALL_CLASSES } from '../../types/schedule';
import { 
  PaperSize, 
  downloadAllClassSchedulesCombinedPDF, 
  MultiPageProgress,
  triggerPrintWithPaperSize
} from '../../utils/exportUtils';
import { ClassScheduleCard } from '../Common/ClassScheduleCard';

interface DownloadAllClassCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: ScheduleSlot[];
  schoolInfo: SchoolInfo;
}

export const DownloadAllClassCardsModal: React.FC<DownloadAllClassCardsModalProps> = ({
  isOpen,
  onClose,
  slots,
  schoolInfo,
}) => {
  const [scope, setScope] = useState<'all' | 'x' | 'xi' | 'xii'>('all');
  const [paperSize, setPaperSize] = useState<PaperSize>('f4');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<(MultiPageProgress & { className?: string }) | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const containerId = useId().replace(/:/g, '-');
  const stagingContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Determine list of classes based on selected scope
  const targetClasses = ALL_CLASSES.filter((cls) => {
    if (scope === 'all') return true;
    if (scope === 'x') return cls.startsWith('X-');
    if (scope === 'xi') return cls.startsWith('XI-');
    if (scope === 'xii') return cls.startsWith('XII-');
    return true;
  });

  const handleDownloadAllCards = async () => {
    setIsGenerating(true);
    setProgress(null);
    setSuccessMessage(null);

    try {
      if (!stagingContainerRef.current) return;

      // Collect all rendered class schedule card elements
      const classElements: { className: string; element: HTMLElement }[] = [];
      for (const cls of targetClasses) {
        const el = stagingContainerRef.current.querySelector<HTMLElement>(`#class-card-staging-${cls}-${containerId}`);
        if (el) {
          classElements.push({ className: cls, element: el });
        }
      }

      if (classElements.length === 0) return;

      const filename = scope === 'all'
        ? `Semua_Kartu_Jadwal_30_Kelas_SAS_SMAN2_Pasuruan`
        : `Kartu_Jadwal_Kelas_Tingkat_${scope.toUpperCase()}_SAS_SMAN2_Pasuruan`;

      const ok = await downloadAllClassSchedulesCombinedPDF(
        classElements,
        filename,
        paperSize,
        (prog) => {
          setProgress(prog);
        }
      );

      if (ok) {
        setSuccessMessage(
          `✓ Berkas PDF gabungan (${classElements.length} Kelas / Halaman) berhasil diunduh secara lengkap!`
        );
        setTimeout(() => setSuccessMessage(null), 4500);
      }
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  const handlePrintAll = () => {
    triggerPrintWithPaperSize(`staging-all-classes-${containerId}`, paperSize, 'portrait');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-all-cards-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
              <Layers className="w-6 h-6 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 bg-white/10 px-2 py-0.5 rounded-full">
                  Fitur Khusus Administrator
                </span>
              </div>
              <h3 id="download-all-cards-title" className="font-extrabold text-base text-white mt-0.5">
                Download All Cards (PDF Gabungan Semua Kelas)
              </h3>
              <p className="text-xs text-indigo-200">
                Hasilkan satu berkas PDF utuh untuk seluruh kelas dalam sekali klik
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 font-semibold animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Scope Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              1. Pilih Lingkup Kelas yang Akan Digabungkan:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setScope('all')}
                disabled={isGenerating}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  scope === 'all'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="text-xs font-extrabold">Semua Kelas</div>
                <div className="text-[10px] text-slate-500 mt-0.5">30 Rombel (X, XI, XII)</div>
              </button>

              <button
                type="button"
                onClick={() => setScope('x')}
                disabled={isGenerating}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  scope === 'x'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="text-xs font-extrabold">Tingkat X</div>
                <div className="text-[10px] text-slate-500 mt-0.5">10 Rombel (X-1 s/d X-10)</div>
              </button>

              <button
                type="button"
                onClick={() => setScope('xi')}
                disabled={isGenerating}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  scope === 'xi'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="text-xs font-extrabold">Tingkat XI</div>
                <div className="text-[10px] text-slate-500 mt-0.5">10 Rombel (XI-1 s/d XI-10)</div>
              </button>

              <button
                type="button"
                onClick={() => setScope('xii')}
                disabled={isGenerating}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  scope === 'xii'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="text-xs font-extrabold">Tingkat XII</div>
                <div className="text-[10px] text-slate-500 mt-0.5">10 Rombel (XII-1 s/d XII-10)</div>
              </button>
            </div>
          </div>

          {/* Paper Size Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              2. Pilih Format Kertas PDF:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaperSize('f4')}
                disabled={isGenerating}
                className={`p-3 rounded-xl border text-left transition-all ${
                  paperSize === 'f4'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${paperSize === 'f4' ? 'text-indigo-950' : 'text-slate-900'}`}>
                    F4 / Folio (Direkomendasikan)
                  </span>
                  {paperSize === 'f4' && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">215 × 330 mm · Standar Sekolah & Dinas</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                  Ruang vertikal pas untuk tabel ujian + tata tertib + 3 tanda tangan
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaperSize('a4')}
                disabled={isGenerating}
                className={`p-3 rounded-xl border text-left transition-all ${
                  paperSize === 'a4'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${paperSize === 'a4' ? 'text-indigo-950' : 'text-slate-900'}`}>
                    A4 Standar
                  </span>
                  {paperSize === 'a4' && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">210 × 297 mm · Standar Internasional</div>
                <div className="text-[10px] text-blue-600 font-medium mt-1">
                  Format umum kertas dokumen
                </div>
              </button>
            </div>
          </div>

          {/* Document Summary Info */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Rangkuman Dokumen PDF Gabungan:</span>
              </span>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[11px]">
                {targetClasses.length} Halaman (1 Halaman / Kelas)
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Sistem akan mengiterasi seluruh daftar kelas secara otomatis dan menyusun setiap jadwal lengkap dengan Kop Surat Resmi, Tabel Ujian, Tata Tertib, serta Tanda Tangan Wali Kelas, Ketua Panitia SAS, dan Kepala Sekolah lengkap dengan stempel.
            </p>
          </div>

          {/* Progress bar when generating */}
          {isGenerating && progress && (
            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-950">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-700" />
                  <span>Memproses Kelas <strong>{progress.className}</strong>...</span>
                </span>
                <span>Halaman {progress.current} dari {progress.total} ({progress.percent}%)</span>
              </div>
              <div className="w-full bg-indigo-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-700 h-full rounded-full transition-all duration-200" 
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="text-[10px] text-indigo-600 text-center">
                Mohon tunggu sejenak, sedang mengonversi seluruh kartu ke dokumen PDF beresolusi tinggi...
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            {/* The primary button with exact label 'Download All Cards' */}
            <button
              type="button"
              onClick={handleDownloadAllCards}
              disabled={isGenerating}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-700 hover:bg-indigo-800 active:scale-[0.99] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
              title="Unduh seluruh kartu jadwal kelas dalam 1 file PDF gabungan"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Sedang Menggabungkan Seluruh Halaman ({progress ? `${progress.percent}%` : 'Memulai'})...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-indigo-200" />
                  <span>Download All Cards ({targetClasses.length} Kelas · PDF {paperSize.toUpperCase()})</span>
                </>
              )}
            </button>

            {/* Print Directly Action */}
            <button
              type="button"
              onClick={handlePrintAll}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Cetak Semua Halaman (Buka Dialog Cetak Browser)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Format Siap Cetak & Berkas Resmi Arsip Sekolah</span>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="text-slate-600 hover:text-slate-900 font-medium text-xs disabled:opacity-40"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Hidden/Staging DOM Container for batch rendering and native browser printing */}
      <div 
        id={`staging-all-classes-${containerId}`}
        ref={stagingContainerRef}
        aria-hidden="true"
        className="fixed -left-[99999px] top-0 opacity-0 pointer-events-none print:opacity-100 print:left-0 print:top-0 print:static"
        style={{ width: '800px' }}
      >
        {targetClasses.map((cls) => (
          <div 
            key={`staging-cls-${cls}`}
            className="class-schedule-page mb-6 print:mb-0 print:break-after-page"
          >
            <ClassScheduleCard
              id={`class-card-staging-${cls}-${containerId}`}
              className={cls}
              slots={slots}
              schoolInfo={schoolInfo}
              containerClassName="border-0 shadow-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
