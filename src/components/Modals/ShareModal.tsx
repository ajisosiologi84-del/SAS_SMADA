import React, { useState } from 'react';
import { Share2, Copy, Check, MessageSquare, ExternalLink, X, Smartphone } from 'lucide-react';
import { ALL_CLASSES } from '../../types/schedule';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  selectedClass: defaultClass = 'X-1',
}) => {
  const [selectedClass, setSelectedClass] = useState(defaultClass);
  const [shareType, setShareType] = useState<'all' | 'class'>('class');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const baseUrl = window.location.origin + window.location.pathname;
  const shareUrl = shareType === 'class'
    ? `${baseUrl}?role=siswa&kelas=${encodeURIComponent(selectedClass)}`
    : `${baseUrl}?role=siswa`;

  const waText = shareType === 'class'
    ? `📢 *JADWAL SUMATIF AKHIR SEMESTER (SAS) KELAS ${selectedClass}*\n*SMA NEGERI 2 KOTA PASURUAN - TP 2026/2027*\n\nBapak/Ibu Wali Murid dan Siswa Kelas ${selectedClass}, berikut jadwal resmi SAS:\n🔗 Buka tautan: ${shareUrl}\n\n_Harap hadir 15 menit sebelum sesi dimulai dan mematuhi tata tertib SAS._`
    : `📢 *JADWAL SUMATIF AKHIR SEMESTER (SAS) TERINTEGRASI*\n*SMA NEGERI 2 KOTA PASURUAN - TP 2026/2027*\n\nTautan Resmi Jadwal Kelas X, XI, & XII:\n🔗 Buka tautan: ${shareUrl}\n\n_Semoga sukses dalam pelaksanaan SAS SMAN 2 Pasuruan._`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(waText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Bagikan Tautan Publik Jadwal</h3>
              <p className="text-xs text-slate-500">Tautan langsung bagi siswa dan wali murid</p>
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
          {/* Target Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipe Tautan
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShareType('class')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors ${
                  shareType === 'class'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Khusus Per Kelas
              </button>
              <button
                type="button"
                onClick={() => setShareType('all')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors ${
                  shareType === 'all'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Semua Jenjang (Umum)
              </button>
            </div>
          </div>

          {shareType === 'class' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pilih Kelas Target:
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                {ALL_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    Kelas {cls}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Link box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              URL Tautan Publik
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center gap-1.5 flex-shrink-0 transition-colors shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* WhatsApp share action */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Bagikan Langsung ke WhatsApp (Grup Kelas/Wali)</span>
            </button>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
            <Smartphone className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              Tautan ini langsung membuka halaman mode Siswa tanpa akses tombol edit, sehingga aman dibagikan kepada murid dan wali murid.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
