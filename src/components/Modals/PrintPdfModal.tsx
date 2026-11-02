import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  Check, 
  Image as ImageIcon,
  Loader2,
  Sparkles
} from 'lucide-react';
import { 
  PaperSize, 
  PaperOrientation, 
  downloadElementAsPDF, 
  triggerPrintWithPaperSize,
  downloadElementAsImage 
} from '../../utils/exportUtils';

interface PrintPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  elementId: string;
  title: string;
  defaultFilename: string;
  defaultPaper?: PaperSize;
  defaultOrientation?: PaperOrientation;
  allowA3?: boolean;
}

export const PrintPdfModal: React.FC<PrintPdfModalProps> = ({
  isOpen,
  onClose,
  elementId,
  title,
  defaultFilename,
  defaultPaper = 'a4',
  defaultOrientation = 'portrait',
  allowA3 = false,
}) => {
  const [paperSize, setPaperSize] = useState<PaperSize>(defaultPaper);
  const [orientation, setOrientation] = useState<PaperOrientation>(defaultOrientation);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingJpg, setIsDownloadingJpg] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    setIsDownloadingPdf(true);
    setDownloadSuccess(null);
    try {
      const ok = await downloadElementAsPDF(
        elementId,
        defaultFilename,
        paperSize,
        orientation
      );
      if (ok) {
        setDownloadSuccess(`Berkas PDF (${paperSize.toUpperCase()}) berhasil diunduh!`);
        setTimeout(() => setDownloadSuccess(null), 3500);
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    triggerPrintWithPaperSize(elementId, paperSize, orientation);
  };

  const handleDownloadJPG = async () => {
    setIsDownloadingJpg(true);
    setDownloadSuccess(null);
    try {
      const ok = await downloadElementAsImage(elementId, defaultFilename, 'jpeg');
      if (ok) {
        setDownloadSuccess('Berkas Gambar JPG berhasil diunduh!');
        setTimeout(() => setDownloadSuccess(null), 3500);
      }
    } finally {
      setIsDownloadingJpg(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-modal-title"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Printer className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 id="print-modal-title" className="font-bold text-base text-white">
                Cetak & Unduh Dokumen
              </h3>
              <p className="text-xs text-blue-200 line-clamp-1">{title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {downloadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{downloadSuccess}</span>
            </div>
          )}

          {/* Paper Size Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              1. Pilih Format Kertas
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* A4 Option */}
              <button
                type="button"
                onClick={() => setPaperSize('a4')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  paperSize === 'a4'
                    ? 'border-blue-700 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-bold ${paperSize === 'a4' ? 'text-blue-900' : 'text-slate-900'}`}>
                    A4
                  </span>
                  {paperSize === 'a4' && <Check className="w-4 h-4 text-blue-700" />}
                </div>
                <div className="text-[11px] text-slate-500">210 × 297 mm</div>
                <div className="text-[10px] text-blue-600 font-medium mt-1">Standar Nasional</div>
              </button>

              {/* F4 / Folio Option */}
              <button
                type="button"
                onClick={() => setPaperSize('f4')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  paperSize === 'f4'
                    ? 'border-blue-700 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-bold ${paperSize === 'f4' ? 'text-blue-900' : 'text-slate-900'}`}>
                    F4 / Folio
                  </span>
                  {paperSize === 'f4' && <Check className="w-4 h-4 text-blue-700" />}
                </div>
                <div className="text-[11px] text-slate-500">215 × 330 mm</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-1">Standar Sekolah / Dinas</div>
              </button>

              {/* A3 Option (Optional for big matrix) */}
              {allowA3 ? (
                <button
                  type="button"
                  onClick={() => setPaperSize('a3')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    paperSize === 'a3'
                      ? 'border-blue-700 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-bold ${paperSize === 'a3' ? 'text-blue-900' : 'text-slate-900'}`}>
                      A3
                    </span>
                    {paperSize === 'a3' && <Check className="w-4 h-4 text-blue-700" />}
                  </div>
                  <div className="text-[11px] text-slate-500">297 × 420 mm</div>
                  <div className="text-[10px] text-purple-600 font-medium mt-1">Spanduk / Dinding</div>
                </button>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col justify-center">
                  <span className="text-xs font-semibold text-slate-400">Presisi Cetak</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Sesuai skala asli</span>
                </div>
              )}
            </div>
          </div>

          {/* Orientation Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              2. Orientasi Halaman
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  orientation === 'portrait'
                    ? 'border-blue-700 bg-blue-50 text-blue-900 ring-1 ring-blue-600'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-3.5 h-4.5 border-2 border-current rounded-xs" />
                <span>Portrait (Tegak)</span>
              </button>

              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  orientation === 'landscape'
                    ? 'border-blue-700 bg-blue-50 text-blue-900 ring-1 ring-blue-600'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-4.5 h-3.5 border-2 border-current rounded-xs" />
                <span>Landscape (Mendatar)</span>
              </button>
            </div>
          </div>

          {/* Action Choice Buttons */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            {/* Download PDF Direct */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf}
              className="w-full py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-[0.99] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Sedang Menghasilkan PDF {paperSize.toUpperCase()}...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-blue-200" />
                  <span>Unduh Dokumen PDF ({paperSize.toUpperCase()})</span>
                </>
              )}
            </button>

            {/* Print Directly */}
            <button
              type="button"
              onClick={handlePrint}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Cetak Sekarang (Dialog Browser / Printer Fisik)</span>
            </button>

            {/* Quick JPG download */}
            <button
              type="button"
              onClick={handleDownloadJPG}
              disabled={isDownloadingJpg}
              className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isDownloadingJpg ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Membuat Berkas Gambar...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Atau Unduh sebagai Gambar (JPG)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer info note */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Kop & Tanda Tangan Resmi Otomatis Disertakan</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-medium text-xs"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
