import React, { useState, useId, useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Check, 
  Scissors, 
  KeyRound, 
  GraduationCap, 
  Users, 
  ShieldAlert, 
  FileText,
  QrCode,
  Layers,
  Sparkles,
  Loader2
} from 'lucide-react';
import { SchoolInfo, ALL_CLASSES } from '../../types/schedule';
import { 
  PaperSize, 
  downloadElementAsPDF, 
  triggerPrintWithPaperSize,
  downloadTokenCardsAsMultiPagePDF,
  MultiPageProgress 
} from '../../utils/exportUtils';
import { TokenQrCode } from '../Common/TokenQrCode';

interface PrintTokenCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolInfo: SchoolInfo;
  teacherToken: string;
  classTokens: Record<string, string>;
  initialTarget?: 'all-classes' | 'grade-x' | 'grade-xi' | 'grade-xii' | 'teacher' | 'single-class';
  initialSelectedClass?: string;
}

const CARDS_PER_SHEET = 4; // Standard 2x2 grid for A4/F4 paper

export const PrintTokenCardsModal: React.FC<PrintTokenCardsModalProps> = ({
  isOpen,
  onClose,
  schoolInfo,
  teacherToken,
  classTokens,
  initialTarget = 'all-classes',
  initialSelectedClass = 'X-1',
}) => {
  const [target, setTarget] = useState<'all-classes' | 'grade-x' | 'grade-xi' | 'grade-xii' | 'teacher' | 'single-class'>(initialTarget);
  const [selectedClass, setSelectedClass] = useState<string>(initialSelectedClass);
  const [paperSize, setPaperSize] = useState<PaperSize>('f4');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<MultiPageProgress | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const containerId = useId().replace(/:/g, '-');
  const printElementId = `token-cards-sheet-${containerId}`;
  const sheetsContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Filter items according to target
  let itemsToRender: { type: 'class' | 'teacher'; id: string; index: number; isDuplicate?: boolean }[] = [];

  if (target === 'teacher') {
    // 4 teacher cards on 1 sheet
    itemsToRender = [
      { type: 'teacher', id: 'guru-1', index: 0 },
      { type: 'teacher', id: 'guru-2', index: 1 },
      { type: 'teacher', id: 'guru-3', index: 2 },
      { type: 'teacher', id: 'guru-4', index: 3 },
    ];
  } else if (target === 'single-class') {
    // 4 copies of single class (Wali Kelas, Ketua Kelas, Piket, Arsip)
    itemsToRender = [
      { type: 'class', id: selectedClass, index: 0, isDuplicate: true },
      { type: 'class', id: selectedClass, index: 1, isDuplicate: true },
      { type: 'class', id: selectedClass, index: 2, isDuplicate: true },
      { type: 'class', id: selectedClass, index: 3, isDuplicate: true },
    ];
  } else {
    let classes: string[] = [];
    if (target === 'all-classes') {
      classes = [...ALL_CLASSES];
    } else if (target === 'grade-x') {
      classes = ALL_CLASSES.filter((c) => c.startsWith('X-'));
    } else if (target === 'grade-xi') {
      classes = ALL_CLASSES.filter((c) => c.startsWith('XI-'));
    } else if (target === 'grade-xii') {
      classes = ALL_CLASSES.filter((c) => c.startsWith('XII-'));
    }

    itemsToRender = classes.map((cls, idx) => ({
      type: 'class',
      id: cls,
      index: idx,
    }));
  }

  // Chunk items into sheets of 4 cards
  const sheets: typeof itemsToRender[] = [];
  for (let i = 0; i < itemsToRender.length; i += CARDS_PER_SHEET) {
    sheets.push(itemsToRender.slice(i, i + CARDS_PER_SHEET));
  }

  const appDisplayUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sassmada.vercel.app';

  // Native Print
  const handlePrint = () => {
    triggerPrintWithPaperSize(printElementId, paperSize, 'portrait');
  };

  // Direct Multi-Page PDF Download of ALL Cards
  const handleDownloadAllCardsPDF = async () => {
    setIsDownloading(true);
    setDownloadSuccess(null);
    setDownloadProgress(null);

    try {
      if (!sheetsContainerRef.current) return;

      const sheetDoms = Array.from(
        sheetsContainerRef.current.querySelectorAll<HTMLElement>(`.sheet-page-${containerId}`)
      );

      if (sheetDoms.length === 0) return;

      const filename = target === 'teacher'
        ? `Kartu_Token_Guru_SAS_SMAN2_${paperSize.toUpperCase()}`
        : target === 'single-class'
        ? `Kartu_Token_Kelas_${selectedClass}_SAS_SMAN2_${paperSize.toUpperCase()}`
        : target === 'all-classes'
        ? `Semua_Kartu_Token_Kelas_SAS_SMAN2_${paperSize.toUpperCase()}`
        : `Kartu_Token_${target.toUpperCase()}_SAS_SMAN2_${paperSize.toUpperCase()}`;

      const ok = await downloadTokenCardsAsMultiPagePDF(
        sheetDoms,
        filename,
        paperSize,
        (progress) => {
          setDownloadProgress(progress);
        }
      );

      if (ok) {
        setDownloadSuccess(
          `✓ Berkas PDF (${sheetDoms.length} Lembar / ${itemsToRender.length} Kartu) berhasil diunduh secara lengkap!`
        );
        setTimeout(() => setDownloadSuccess(null), 4500);
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  // Render Class Card
  const renderClassCard = (className: string, cardIndex: number, isDuplicate = false) => {
    const token = classTokens[className] || `SAS-${className.replace('-', '')}`;
    const grade = className.startsWith('X-') ? 'X' : className.startsWith('XI-') ? 'XI' : 'XII';

    return (
      <div 
        key={`card-${className}-${cardIndex}`}
        className="token-card-item border-2 border-dashed border-slate-300 rounded-xl p-3 bg-white text-slate-800 flex flex-col justify-between relative shadow-2xs print:shadow-none break-inside-avoid print:border-slate-400"
        style={{ minHeight: '345px' }}
      >
        {/* Scissor Cut Indicator */}
        <div className="absolute -top-2.5 right-4 bg-white px-1 text-slate-400 flex items-center gap-1 text-[8px] font-mono no-print">
          <Scissors className="w-3 h-3 rotate-90 text-slate-500" />
          <span>POTONG</span>
        </div>

        {/* Card Header */}
        <div className="border-b border-slate-200 pb-2 flex items-center gap-2.5">
          {schoolInfo.schoolLogoImage ? (
            <img 
              src={schoolInfo.schoolLogoImage} 
              alt="Logo SMAN 2 Pasuruan" 
              className="w-10 h-10 object-contain shrink-0" 
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs">
              SMADA
            </div>
          )}
          <div className="leading-tight flex-1">
            <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">
              PANITIA SUMATIF AKHIR SEMESTER (SAS) GANJIL
            </span>
            <h4 className="text-[11px] font-extrabold text-blue-950 uppercase leading-none mt-0.5">
              SMA NEGERI 2 KOTA PASURUAN
            </h4>
            <p className="text-[8px] text-slate-500 mt-0.5">
              Tahun Pelajaran 2026/2027 &middot; Jl. Panglima Sudirman No. 27
            </p>
          </div>
        </div>

        {/* Title & Badge */}
        <div className="my-1.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white rounded-lg p-2 text-center shadow-2xs">
          <div className="text-[8.5px] uppercase font-bold tracking-widest text-blue-200">
            KARTU LOGIN RESMI SISWA
          </div>
          <div className="text-base font-extrabold tracking-wide text-white mt-0.5">
            KELAS {className}
          </div>
          <div className="text-[8px] text-blue-200">
            Jenjang Tingkat {grade} {isDuplicate ? `(Salinan #${cardIndex + 1})` : ''}
          </div>
        </div>

        {/* Token Box */}
        <div className="bg-slate-50 border border-slate-300 rounded-lg p-2 text-center space-y-1">
          <div className="text-[8.5px] uppercase font-extrabold tracking-wider text-slate-600 flex items-center justify-center gap-1">
            <KeyRound className="w-3 h-3 text-amber-600" />
            <span>KODE TOKEN RAHASIA KELAS:</span>
          </div>
          <div className="text-xl font-mono font-black tracking-widest text-blue-950 bg-white py-1 px-2 rounded-md border border-slate-300 shadow-inner">
            {token}
          </div>
          <div className="text-[7.5px] text-rose-600 font-semibold flex items-center justify-center gap-1">
            <ShieldAlert className="w-2.5 h-2.5 shrink-0" />
            <span>Khusus siswa kelas {className}. Jangan disebarkan ke kelas lain.</span>
          </div>
        </div>

        {/* Scannable Token QR Code */}
        <div className="my-1.5 p-2 bg-blue-50/70 rounded-lg border border-blue-200 flex items-center gap-2.5">
          <div className="shrink-0 text-center">
            <TokenQrCode token={token} size={54} darkColor="#1e3a8a" />
            <span className="text-[7px] font-mono font-bold text-blue-900 block mt-0.5 tracking-tight">
              SCAN = TOKEN
            </span>
          </div>

          <div className="flex-1 text-[8.5px] text-slate-700 leading-tight">
            <span className="font-bold text-blue-950 block mb-0.5 flex items-center gap-1">
              <QrCode className="w-3 h-3 text-blue-700" />
              <span>QR Menghasilkan Token Langsung:</span>
            </span>
            <p className="text-[8px] text-slate-600 mb-1 leading-snug">
              Pindai dengan kamera HP / Scanner. Kode token <code className="font-mono font-extrabold text-blue-950 bg-white px-1 py-0.2 rounded border border-blue-200">{token}</code> langsung terbaca otomatis (bukan tautan web).
            </p>
            <div className="text-[7.5px] text-slate-500 pt-0.5 border-t border-blue-200/60 flex items-center justify-between">
              <span>Alamat: {appDisplayUrl}</span>
              <span className="font-bold text-blue-800">1 Akun / Rombel</span>
            </div>
          </div>
        </div>

        {/* Card Footer / Signature */}
        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-600">
          <div>
            <span>Kota Pasuruan, Nopember 2026</span>
            <span className="font-bold block text-slate-800">Mengetahui, Ketua Panitia SAS</span>
          </div>

          <div className="text-right">
            {schoolInfo.committeeSignatureImage ? (
              <img 
                src={schoolInfo.committeeSignatureImage} 
                alt="TTD Ketua Panitia" 
                className="h-6 object-contain ml-auto" 
              />
            ) : (
              <div className="h-5" />
            )}
            <span className="font-extrabold text-slate-900 underline block leading-none">
              {schoolInfo.committeeName || 'Drs. H. M. Zainuri, M.Pd'}
            </span>
            <span className="text-[7.5px] text-slate-500">
              NIP. {schoolInfo.committeeNip || '19680512 199412 1 002'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Render Teacher Card
  const renderTeacherCard = (cardIndex: number) => {
    return (
      <div 
        key={`card-teacher-${cardIndex}`}
        className="token-card-item border-2 border-dashed border-slate-300 rounded-xl p-3 bg-white text-slate-800 flex flex-col justify-between relative shadow-2xs print:shadow-none break-inside-avoid print:border-slate-400"
        style={{ minHeight: '345px' }}
      >
        {/* Scissor Cut Indicator */}
        <div className="absolute -top-2.5 right-4 bg-white px-1 text-slate-400 flex items-center gap-1 text-[8px] font-mono no-print">
          <Scissors className="w-3 h-3 rotate-90 text-slate-500" />
          <span>POTONG</span>
        </div>

        {/* Header */}
        <div className="border-b border-slate-200 pb-2 flex items-center gap-2.5">
          {schoolInfo.schoolLogoImage ? (
            <img 
              src={schoolInfo.schoolLogoImage} 
              alt="Logo SMAN 2 Pasuruan" 
              className="w-10 h-10 object-contain shrink-0" 
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-emerald-900 text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs">
              SMADA
            </div>
          )}
          <div className="leading-tight flex-1">
            <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">
              PANITIA SUMATIF AKHIR SEMESTER (SAS) GANJIL
            </span>
            <h4 className="text-[11px] font-extrabold text-emerald-950 uppercase leading-none mt-0.5">
              SMA NEGERI 2 KOTA PASURUAN
            </h4>
            <p className="text-[8px] text-slate-500 mt-0.5">
              Tahun Pelajaran 2026/2027 &middot; Jl. Panglima Sudirman No. 27
            </p>
          </div>
        </div>

        {/* Title */}
        <div className="my-1.5 bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 text-white rounded-lg p-2 text-center shadow-2xs">
          <div className="text-[8.5px] uppercase font-bold tracking-widest text-emerald-200">
            KARTU AKSES RESMI DEWAN GURU & PENGAWAS
          </div>
          <div className="text-base font-extrabold tracking-wide text-white mt-0.5 flex items-center justify-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-300" />
            <span>PORTAL GURU & PENGAWAS SAS</span>
          </div>
          <div className="text-[8px] text-emerald-200">
            Akses: Jadwal Mengajar, Mengawas & Cetak Jadwal Pribadi
          </div>
        </div>

        {/* Token Box */}
        <div className="bg-emerald-50/70 border border-emerald-300 rounded-lg p-2 text-center space-y-1">
          <div className="text-[8.5px] uppercase font-extrabold tracking-wider text-emerald-800 flex items-center justify-center gap-1">
            <KeyRound className="w-3 h-3 text-emerald-700" />
            <span>TOKEN LOGIN RESMI GURU & PENGAWAS:</span>
          </div>
          <div className="text-xl font-mono font-black tracking-widest text-emerald-950 bg-white py-1 px-2 rounded-md border border-emerald-300 shadow-inner">
            {teacherToken}
          </div>
          <div className="text-[7.5px] text-slate-600">
            Gunakan token ini untuk membuka seluruh jadwal mengajar & jadwal mengawas Anda.
          </div>
        </div>

        {/* Scannable Token QR Code */}
        <div className="my-1.5 p-2 bg-emerald-50/70 rounded-lg border border-emerald-200 flex items-center gap-2.5">
          <div className="shrink-0 text-center">
            <TokenQrCode token={teacherToken} size={54} darkColor="#064e3b" />
            <span className="text-[7px] font-mono font-bold text-emerald-900 block mt-0.5 tracking-tight">
              SCAN = TOKEN
            </span>
          </div>

          <div className="flex-1 text-[8.5px] text-slate-700 leading-tight">
            <span className="font-bold text-emerald-950 block mb-0.5 flex items-center gap-1">
              <QrCode className="w-3 h-3 text-emerald-700" />
              <span>QR Menghasilkan Token Langsung:</span>
            </span>
            <p className="text-[8px] text-slate-600 mb-1 leading-snug">
              Pindai dengan kamera HP / Scanner. Kode token <code className="font-mono font-extrabold text-emerald-950 bg-white px-1 py-0.2 rounded border border-emerald-200">{teacherToken}</code> langsung terbaca otomatis (bukan tautan web).
            </p>
            <div className="text-[7.5px] text-slate-500 pt-0.5 border-t border-emerald-200/60 flex items-center justify-between">
              <span>Alamat: {appDisplayUrl}</span>
              <span className="font-bold text-emerald-800">Portal Guru</span>
            </div>
          </div>
        </div>

        {/* Footer & Signature */}
        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-600">
          <div>
            <span>Kota Pasuruan, Nopember 2026</span>
            <span className="font-bold block text-slate-800">Mengetahui, Ketua Panitia SAS</span>
          </div>

          <div className="text-right">
            {schoolInfo.committeeSignatureImage ? (
              <img 
                src={schoolInfo.committeeSignatureImage} 
                alt="TTD Ketua Panitia" 
                className="h-6 object-contain ml-auto" 
              />
            ) : (
              <div className="h-5" />
            )}
            <span className="font-extrabold text-slate-900 underline block leading-none">
              {schoolInfo.committeeName || 'Drs. H. M. Zainuri, M.Pd'}
            </span>
            <span className="text-[7.5px] text-slate-500">
              NIP. {schoolInfo.committeeNip || '19680512 199412 1 002'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 font-sans">
      <div 
        className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Printer className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Cetak &amp; Unduh Semua Kartu Token Akses SAS
              </h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Format resmi tersusun rapi per lembar (A4 / F4) &middot; Siap cetak atau unduh langsung dalam 1 file PDF lengkap
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {/* Target Selector */}
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Pilih Target Kartu yang Dicetak / Diunduh:
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs"
              >
                <option value="all-classes">🎓 Semua 30 Kelas (Lengkap 8 Lembar @ 4 Kartu)</option>
                <option value="grade-x">🎓 Seluruh Jenjang Kelas X (10 Kelas · 3 Lembar)</option>
                <option value="grade-xi">🎓 Seluruh Jenjang Kelas XI (10 Kelas · 3 Lembar)</option>
                <option value="grade-xii">🎓 Seluruh Jenjang Kelas XII (10 Kelas · 3 Lembar)</option>
                <option value="single-class">🎓 1 Kelas Tertentu Saja (4 Salinan Kartu)</option>
                <option value="teacher">👤 Kartu Token Guru &amp; Pengawas SAS (4 Kartu)</option>
              </select>
            </div>

            {/* Sub-selector for single class OR paper size */}
            {target === 'single-class' ? (
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Kelas:
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs"
                >
                  {ALL_CLASSES.map((cls) => (
                    <option key={cls} value={cls}>
                      Kelas {cls} (Token: {classTokens[cls] || 'SAS-' + cls.replace('-', '')})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Format Kertas:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaperSize('f4')}
                    className={`py-2 px-2.5 rounded-lg border font-bold text-center text-xs transition-colors ${
                      paperSize === 'f4'
                        ? 'border-blue-700 bg-blue-50 text-blue-900 shadow-2xs'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    F4 / Folio (215x330)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperSize('a4')}
                    className={`py-2 px-2.5 rounded-lg border font-bold text-center text-xs transition-colors ${
                      paperSize === 'a4'
                        ? 'border-blue-700 bg-blue-50 text-blue-900 shadow-2xs'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    A4 (210x297)
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons: Print All & Download All PDF */}
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors text-xs"
                title="Buka dialog cetak browser untuk mencetak seluruh lembar kartu secara langsung"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Semua</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadAllCardsPDF}
                disabled={isDownloading}
                className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors text-xs"
                title="Download All Cards: Unduh seluruh kartu ke dalam 1 file PDF lengkap multi-halaman"
                data-testid="download-all-cards-token-btn"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isDownloading ? 'Memproses...' : 'Download All Cards (PDF)'}</span>
              </button>
            </div>
          </div>

          {/* Progress / Status Notice */}
          {downloadProgress && (
            <div className="p-3 bg-blue-50 border border-blue-300 text-blue-900 rounded-xl text-xs space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-700" />
                  <span>Sedang membuat PDF: Memproses Lembar {downloadProgress.current} dari {downloadProgress.total}...</span>
                </span>
                <span>{downloadProgress.percent}%</span>
              </div>
              <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-700 h-full transition-all duration-150"
                  style={{ width: `${downloadProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {downloadSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/70 flex flex-col items-center gap-6">
          {/* Quick Notice Banner */}
          <div className="w-full max-w-4xl bg-blue-900 text-white p-3 rounded-xl shadow-xs text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 no-print">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-300 shrink-0" />
              <span>
                Menampilkan <strong>{itemsToRender.length} Kartu</strong> yang terbagi ke dalam <strong>{sheets.length} Lembar Kertas</strong> (@ 4 kartu per lembar).
              </span>
            </div>
            <span className="text-[11px] font-semibold text-blue-200">
              Format Kertas: {paperSize.toUpperCase()} (Tepat 4 Kartu/Lembar)
            </span>
          </div>

          {/* Printable Page Container */}
          <div id={printElementId} ref={sheetsContainerRef} className="w-full max-w-4xl space-y-6">
            {sheets.map((sheetItems, sheetIdx) => (
              <div
                key={`sheet-${sheetIdx}`}
                id={`${printElementId}-sheet-${sheetIdx}`}
                className={`token-sheet-page sheet-page-${containerId} bg-white p-5 sm:p-7 shadow-lg border border-slate-300 rounded-xl space-y-4 print:shadow-none print:border-none print:m-0 print:p-6`}
                style={{
                  pageBreakAfter: sheetIdx === sheets.length - 1 ? 'auto' : 'always',
                  breakAfter: sheetIdx === sheets.length - 1 ? 'auto' : 'page',
                }}
              >
                {/* Formal Sheet Header */}
                <div className="border-b-2 border-slate-800 pb-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-slate-900 uppercase tracking-tight text-[11px]">
                      DOKUMEN KREDENSIAL TOKEN RESMI SAS 2026/2027 &middot; SMAN 2 KOTA PASURUAN
                    </span>
                    <p className="text-[9.5px] text-slate-500 mt-0.5">
                      Lembar ke-{sheetIdx + 1} dari {sheets.length} &middot; Format: {paperSize.toUpperCase()} &middot; Dicetak: {new Date().toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-900 font-extrabold px-2.5 py-1 rounded-md border border-blue-200 shrink-0">
                    Lembar {sheetIdx + 1} / {sheets.length} ({sheetItems.length} Kartu)
                  </span>
                </div>

                {/* 2x2 Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sheetItems.map((item) => {
                    if (item.type === 'teacher') {
                      return renderTeacherCard(item.index);
                    }
                    return renderClassCard(item.id, item.index, item.isDuplicate);
                  })}
                </div>

                {/* Formal Sheet Footer */}
                <div className="pt-2 border-t border-slate-200 text-center text-[9.5px] text-slate-500 font-mono flex items-center justify-center gap-2">
                  <Scissors className="w-3.5 h-3.5 text-slate-400" />
                  <span>Gunting mengikuti garis putus-putus untuk dibagikan kepada masing-masing Wali Kelas / Pengawas SAS.</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
          <span className="text-slate-500 text-[11px]">
            &bull; Seluruh 30 token kelas dan token guru terlindungi &middot; Dilengkapi tanda tangan resmi Ketua Panitia &amp; QR Code teks langsung.
          </span>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak ({sheets.length} Lembar)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadAllCardsPDF}
              disabled={isDownloading}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF ({itemsToRender.length} Kartu)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
