import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle, X, ArrowRight } from 'lucide-react';
import { parseCSVOrExcel } from '../../utils/csvParser';
import { ScheduleSlot } from '../../types/schedule';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (slots: ScheduleSlot[]) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ScheduleSlot[] | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setLoading(true);

    try {
      const slots = await parseCSVOrExcel(selectedFile);
      setParsedPreview(slots);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memproses file. Pastikan format tabel memiliki kolom kelas X-1 s/d XII-10.');
      setParsedPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (parsedPreview && parsedPreview.length > 0) {
      onImportSuccess(parsedPreview);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Unggah Jadwal SAS (CSV / Excel)</h3>
              <p className="text-xs text-slate-500">Perbarui jadwal terintegrasi melalui berkas spreadsheet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              file
                ? 'border-emerald-400 bg-emerald-50/20'
                : 'border-slate-300 hover:border-blue-500 bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <FileSpreadsheet className={`w-10 h-10 mx-auto mb-2 ${file ? 'text-emerald-600' : 'text-slate-400'}`} />
              <p className="text-xs font-semibold text-slate-800">
                {file ? file.name : 'Klik untuk memilih file atau seret ke sini'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Format didukung: CSV (.csv), Excel (.xlsx, .xls)
              </p>
            </label>
          </div>

          {loading && (
            <div className="text-center py-4 text-xs text-slate-500">
              Sedang memproses dan memvalidasi struktur tabel...
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Format Berkas Tidak Sesuai</p>
                <p className="mt-0.5 text-[11px]">{error}</p>
              </div>
            </div>
          )}

          {parsedPreview && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs mb-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>Validasi Berhasil: {parsedPreview.length} Slot Terdeteksi</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Berkas berhasil dibaca dengan pemetaan kolom kelas X-1 sampai XII-10.
                Mengeklik "Terapkan Jadwal Baru" akan memperbarui database jadwal SAS aktif.
              </p>
            </div>
          )}

          {/* Guidelines */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">Petunjuk Format Berkas:</p>
            <p>1. Baris header wajib memuat nama-nama kelas: X-1, X-2 ... XII-10.</p>
            <p>2. Setiap sel mata pelajaran dapat memuat nama guru di baris kedua dalam tanda kurung.</p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!parsedPreview || loading}
              onClick={handleApply}
              className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors ${
                parsedPreview && !loading
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Terapkan Jadwal Baru</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
