import React, { useState, useId } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Check, 
  Scissors, 
  KeyRound, 
  GraduationCap, 
  Users, 
  Globe, 
  ShieldAlert, 
  FileText,
  FileCheck2,
  QrCode
} from 'lucide-react';
import { SchoolInfo, ALL_CLASSES } from '../../types/schedule';
import { PaperSize, downloadElementAsPDF, triggerPrintWithPaperSize } from '../../utils/exportUtils';
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
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const containerId = useId().replace(/:/g, '-');
  const printElementId = `token-cards-sheet-${containerId}`;

  if (!isOpen) return null;

  // Filter classes according to selected target
  let classesToRender: string[] = [];
  if (target === 'all-classes') {
    classesToRender = [...ALL_CLASSES];
  } else if (target === 'grade-x') {
    classesToRender = ALL_CLASSES.filter((c) => c.startsWith('X-'));
  } else if (target === 'grade-xi') {
    classesToRender = ALL_CLASSES.filter((c) => c.startsWith('XI-'));
  } else if (target === 'grade-xii') {
    classesToRender = ALL_CLASSES.filter((c) => c.startsWith('XII-'));
  } else if (target === 'single-class') {
    // Render 4 copies for the single class (for Wali Kelas, Ketua Kelas, Guru Piket, Arsip)
    classesToRender = [selectedClass, selectedClass, selectedClass, selectedClass];
  }

  // Current app URL
  const appDisplayUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sman2pasuruan.sch.id/sas';

  const handlePrint = () => {
    triggerPrintWithPaperSize(printElementId, paperSize, 'portrait');
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    setDownloadSuccess(null);
    try {
      const filename = target === 'teacher' 
        ? `Kartu_Token_Guru_SAS_SMAN2_${paperSize.toUpperCase()}`
        : target === 'single-class'
        ? `Kartu_Token_Kelas_${selectedClass}_SAS_SMAN2_${paperSize.toUpperCase()}`
        : `Kartu_Token_Kelas_${target.toUpperCase()}_SAS_SMAN2_${paperSize.toUpperCase()}`;
      
      const ok = await downloadElementAsPDF(printElementId, filename, paperSize, 'portrait');
      if (ok) {
        setDownloadSuccess(`Berkas PDF Kartu Token (${paperSize.toUpperCase()}) berhasil diunduh!`);
        setTimeout(() => setDownloadSuccess(null), 3500);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Reusable Single Class Card
  const renderClassCard = (className: string, index: number, isDuplicate = false) => {
    const token = classTokens[className] || `SAS-${className.replace('-', '')}`;
    const grade = className.startsWith('X-') ? 'X' : className.startsWith('XI-') ? 'XI' : 'XII';

    return (
      <div 
        key={`${className}-${index}`}
        className="border-2 border-dashed border-slate-300 rounded-xl p-3 bg-white text-slate-800 flex flex-col justify-between relative shadow-2xs break-inside-avoid print:shadow-none"
        style={{ minHeight: '345px' }}
      >
        {/* Cut Mark Icon */}
        <div className="absolute -top-2.5 -right-2 bg-white px-1 text-slate-400 flex items-center gap-0.5 text-[9px] font-mono no-print">
          <Scissors className="w-3 h-3 rotate-90 text-slate-500" />
          <span>POTONG</span>
        </div>

        {/* Card Header */}
        <div className="border-b border-slate-200 pb-2 flex items-center gap-2">
          {schoolInfo.schoolLogoImage ? (
            <img 
              src={schoolInfo.schoolLogoImage} 
              alt="Logo Sekolah" 
              className="w-10 h-10 object-contain shrink-0" 
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              SMADA
            </div>
          )}
          <div className="leading-tight flex-1">
            <h5 className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
              PANITIA SUMATIF AKHIR SEMESTER (SAS) GANJIL
            </h5>
            <h4 className="text-[11px] font-extrabold text-blue-950 uppercase">
              SMA NEGERI 2 KOTA PASURUAN
            </h4>
            <p className="text-[8.5px] text-slate-600 font-medium">
              Tahun Pelajaran 2026/2027 · Jl. Panglima Sudirman No. 27
            </p>
          </div>
        </div>

        {/* Title & Badge */}
        <div className="my-2 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-lg p-2 text-center shadow-2xs">
          <div className="text-[9px] uppercase font-bold tracking-widest text-blue-200">
            KARTU LOGIN RESMI SISWA
          </div>
          <div className="text-base font-extrabold tracking-wide text-white mt-0.5">
            KELAS {className}
          </div>
          <div className="text-[8.5px] text-blue-200">
            Jenjang Tingkat {grade} {isDuplicate ? `(Salinan #${index + 1})` : ''}
          </div>
        </div>

        {/* Token Box */}
        <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-center space-y-1">
          <div className="text-[9px] uppercase font-extrabold tracking-wider text-slate-500 flex items-center justify-center gap-1">
            <KeyRound className="w-3 h-3 text-amber-600" />
            <span>KODE TOKEN RAHASIA KELAS:</span>
          </div>
          <div className="text-xl font-mono font-black tracking-widest text-blue-900 bg-white py-1 px-2 rounded border border-slate-200 shadow-inner">
            {token}
          </div>
          <div className="text-[8px] text-rose-600 font-semibold flex items-center justify-center gap-1">
            <ShieldAlert className="w-2.5 h-2.5" />
            <span>Hanya untuk siswa kelas {className}. Jangan disebarkan ke kelas lain.</span>
          </div>
        </div>

        {/* Real Scannable Token QR Code (Direct Token Text Output, NOT a link) */}
        <div className="my-2 p-2 bg-blue-50/70 rounded-lg border border-blue-200 flex items-center gap-2.5">
          <div className="shrink-0 text-center">
            <TokenQrCode token={token} size={58} darkColor="#1e3a8a" />
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
              Pindai dengan kamera HP / Scanner. QR Code langsung menghasilkan teks token <code className="font-mono font-extrabold text-blue-900 bg-white px-1 py-0.2 rounded border border-blue-200">{token}</code> (bukan link web).
            </p>
            <div className="text-[7.5px] text-slate-500 pt-0.5 border-t border-blue-200/60 flex items-center justify-between">
              <span>Akses: {appDisplayUrl}</span>
              <span className="font-bold text-blue-800">1 Akun / Kelas</span>
            </div>
          </div>
        </div>

        {/* Card Footer / Signature */}
        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-600">
          <div>
            <span>Pasuruan, Nopember 2026</span>
            <span className="font-bold block text-slate-800">Ketua Panitia SAS,</span>
          </div>

          <div className="text-right">
            {schoolInfo.committeeSignatureImage ? (
              <img 
                src={schoolInfo.committeeSignatureImage} 
                alt="TTD Ketua Panitia" 
                className="h-7 object-contain ml-auto" 
              />
            ) : (
              <div className="h-6" />
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

  // Reusable Teacher Card (Portal Guru & Pengawas)
  const renderTeacherCard = (index: number) => {
    return (
      <div 
        key={`teacher-card-${index}`}
        className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-white text-slate-800 flex flex-col justify-between relative shadow-2xs break-inside-avoid print:shadow-none"
        style={{ minHeight: '360px' }}
      >
        {/* Cut Mark Icon */}
        <div className="absolute -top-2.5 -right-2 bg-white px-1 text-slate-400 flex items-center gap-0.5 text-[9px] font-mono no-print">
          <Scissors className="w-3 h-3 rotate-90 text-slate-500" />
          <span>POTONG</span>
        </div>

        {/* Header */}
        <div className="border-b border-slate-200 pb-2.5 flex items-center gap-2.5">
          {schoolInfo.schoolLogoImage ? (
            <img 
              src={schoolInfo.schoolLogoImage} 
              alt="Logo Sekolah" 
              className="w-11 h-11 object-contain shrink-0" 
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              SMADA
            </div>
          )}
          <div className="leading-tight flex-1">
            <h5 className="text-[9.5px] uppercase tracking-wider text-slate-500 font-bold">
              PANITIA SUMATIF AKHIR SEMESTER (SAS) GANJIL
            </h5>
            <h4 className="text-[12px] font-extrabold text-blue-950 uppercase">
              SMA NEGERI 2 KOTA PASURUAN
            </h4>
            <p className="text-[9px] text-slate-600 font-medium">
              Tahun Pelajaran 2026/2027 · Jl. Panglima Sudirman No. 27
            </p>
          </div>
        </div>

        {/* Title */}
        <div className="my-2.5 bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 text-white rounded-lg p-2.5 text-center shadow-2xs">
          <div className="text-[9.5px] uppercase font-bold tracking-widest text-emerald-200">
            KARTU AKSES PORTAL KHUSUS GURU & PENGAWAS
          </div>
          <div className="text-base font-extrabold tracking-wide text-white mt-0.5 flex items-center justify-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-300" />
            <span>DEWAN GURU & PENGAWAS SAS</span>
          </div>
          <div className="text-[9px] text-emerald-200">
            Hak Akses: Memantau Jadwal & Filter Jadwal Mengajar/Mengawas Pribadi
          </div>
        </div>

        {/* Token Box */}
        <div className="bg-emerald-50/70 border border-emerald-300 rounded-lg p-3 text-center space-y-1">
          <div className="text-[9.5px] uppercase font-extrabold tracking-wider text-emerald-800 flex items-center justify-center gap-1">
            <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
            <span>TOKEN LOGIN RESMI GURU & PENGAWAS:</span>
          </div>
          <div className="text-2xl font-mono font-black tracking-widest text-emerald-950 bg-white py-1.5 px-3 rounded-lg border border-emerald-300 shadow-inner">
            {teacherToken}
          </div>
          <div className="text-[8.5px] text-slate-600">
            Gunakan token ini untuk membuka seluruh jadwal mengajar & jadwal mengawas Anda.
          </div>
        </div>

        {/* Real Scannable Token QR Code (Direct Token Text Output, NOT a link) */}
        <div className="my-2.5 p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-300 flex items-center gap-3">
          <div className="shrink-0 text-center">
            <TokenQrCode token={teacherToken} size={64} darkColor="#064e3b" />
            <span className="text-[7.5px] font-mono font-bold text-emerald-900 block mt-0.5 tracking-tight">
              SCAN = TOKEN
            </span>
          </div>

          <div className="flex-1 text-[9px] text-slate-700 leading-tight">
            <span className="font-bold text-emerald-950 block mb-0.5 flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-emerald-700" />
              <span>QR Menghasilkan Token Guru Langsung:</span>
            </span>
            <p className="text-[8.5px] text-slate-600 mb-1 leading-snug">
              Pindai dengan kamera HP / aplikasi QR Scanner. QR Code akan <strong>langsung memunculkan token</strong> <code className="font-mono font-extrabold text-emerald-950 bg-white px-1.5 py-0.5 rounded border border-emerald-300">{teacherToken}</code> untuk disalin ke kolom login (bukan berupa tautan).
            </p>
            <div className="text-[8px] text-slate-500 pt-1 border-t border-emerald-200 flex items-center justify-between">
              <span>Alamat Aplikasi: {appDisplayUrl}</span>
              <span className="font-bold text-emerald-800">Portal Guru & Pengawas</span>
            </div>
          </div>
        </div>

        {/* Footer & Signature */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-600">
          <div>
            <span>Kota Pasuruan, Nopember 2026</span>
            <span className="font-bold block text-slate-800">Mengetahui, Ketua Panitia SAS</span>
          </div>

          <div className="text-right">
            {schoolInfo.committeeSignatureImage ? (
              <img 
                src={schoolInfo.committeeSignatureImage} 
                alt="TTD Ketua Panitia" 
                className="h-8 object-contain ml-auto" 
              />
            ) : (
              <div className="h-7" />
            )}
            <span className="font-extrabold text-slate-900 underline block leading-none">
              {schoolInfo.committeeName || 'Drs. H. M. Zainuri, M.Pd'}
            </span>
            <span className="text-[8px] text-slate-500">
              NIP. {schoolInfo.committeeNip || '19680512 199412 1 002'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
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
                Cetak Kartu Token Akses Resmi SAS
              </h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Format kartu siap cetak (A4 / F4) dilengkapi garis potong rapi untuk dibagikan ke Guru dan Kelas
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

        {/* Modal Controls Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Target Selector */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Pilih Target Kartu:
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="all-classes">🎓 Semua 30 Kelas (5 Lembar @ 6 Kartu)</option>
                <option value="grade-x">🎓 Kelas Jenjang X (10 Rombel)</option>
                <option value="grade-xi">🎓 Kelas Jenjang XI (10 Rombel)</option>
                <option value="grade-xii">🎓 Kelas Jenjang XII (10 Rombel)</option>
                <option value="single-class">🎓 1 Kelas Tertentu (4 Kartu Salinan)</option>
                <option value="teacher">👤 Kartu Token Guru & Pengawas SAS (4 Kartu)</option>
              </select>
            </div>

            {/* Single class selector if selected */}
            {target === 'single-class' ? (
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Kelas:
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                  Ukuran Kertas Cetak:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaperSize('a4')}
                    className={`py-2 px-3 rounded-lg border font-bold text-center transition-colors ${
                      paperSize === 'a4'
                        ? 'border-blue-700 bg-blue-50 text-blue-900 shadow-2xs'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    A4 (210 x 297 mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperSize('f4')}
                    className={`py-2 px-3 rounded-lg border font-bold text-center transition-colors ${
                      paperSize === 'f4'
                        ? 'border-blue-700 bg-blue-50 text-blue-900 shadow-2xs'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    F4 (215 x 330 mm)
                  </button>
                </div>
              </div>
            )}

            {/* Print & Download Actions */}
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak (Print)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Menyimpan...' : 'Unduh PDF'}</span>
              </button>
            </div>
          </div>

          {downloadSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/60 flex justify-center">
          {/* Printable Page Container */}
          <div 
            id={printElementId}
            className="bg-white p-5 sm:p-7 shadow-lg border border-slate-300 rounded-xl w-full max-w-3xl space-y-4"
          >
            {/* Header info for Panitia printout */}
            <div className="border-b-2 border-slate-800 pb-2 flex items-center justify-between text-xs">
              <div>
                <span className="font-extrabold text-slate-900 uppercase">
                  DOKUMEN KREDENSIAL TOKEN RESMI SAS 2026/2027
                </span>
                <p className="text-[10px] text-slate-500">
                  Dicetak pada: {new Date().toLocaleString('id-ID')} · Format Kertas: {paperSize.toUpperCase()}
                </p>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded border border-slate-300">
                {target === 'teacher' ? '4 Kartu Guru' : `${classesToRender.length} Kartu Kelas`}
              </span>
            </div>

            {/* Cards Grid: 2 columns grid for clean cut cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {target === 'teacher' ? (
                <>
                  {renderTeacherCard(0)}
                  {renderTeacherCard(1)}
                  {renderTeacherCard(2)}
                  {renderTeacherCard(3)}
                </>
              ) : (
                classesToRender.map((cls, idx) => 
                  renderClassCard(cls, idx, target === 'single-class')
                )
              )}
            </div>

            {/* Footer cut instruction */}
            <div className="pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 font-mono flex items-center justify-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-slate-400" />
              <span>Gunting mengikuti garis putus-putus untuk membagikan kartu ke masing-masing Guru / Wali Kelas.</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500">
            Kerahasiaan token terlindungi &middot; Tanda tangan Ketua Panitia otomatis disertakan
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
