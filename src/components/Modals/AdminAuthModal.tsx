import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  UserCheck, 
  GraduationCap, 
  Sparkles,
  CheckCircle2,
  HelpCircle,
  QrCode
} from 'lucide-react';
import { AuthSession } from '../../types/schedule';
import { verifyTokenOrPin, getTeacherTokenConfig, getClassTokenConfig, getAdminAccounts } from '../../utils/storage';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: AuthSession) => void;
  initialRoleTab?: 'auto' | 'admin' | 'guru' | 'kelas';
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialRoleTab = 'auto'
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'auto' | 'admin' | 'guru' | 'kelas'>(initialRoleTab);
  const [successSession, setSuccessSession] = useState<AuthSession | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError('Silakan masukkan token atau PIN akun Anda.');
      return;
    }

    const session = verifyTokenOrPin(tokenInput);

    if (session) {
      // If user is on a specific tab, ensure it matches or auto-detect
      if (activeTab === 'admin' && session.role !== 'admin') {
        setError('Token yang dimasukkan bukan token akun Admin.');
        return;
      }
      if (activeTab === 'guru' && session.role !== 'guru') {
        setError('Token yang dimasukkan bukan token akun Guru.');
        return;
      }
      if (activeTab === 'kelas' && session.role !== 'kelas') {
        setError('Token yang dimasukkan bukan token akun Kelas.');
        return;
      }

      setError('');
      setSuccessSession(session);
      setTimeout(() => {
        onSuccess(session);
        setSuccessSession(null);
        setTokenInput('');
      }, 700);
    } else {
      setError('Token / PIN tidak ditemukan atau tidak valid. Silakan periksa kembali.');
    }
  };

  const teacherConfig = getTeacherTokenConfig();
  const classConfig = getClassTokenConfig();
  const adminAccounts = getAdminAccounts();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-blue-200 flex items-center justify-center border border-white/10">
              <KeyRound className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Autentikasi Hak Akses Aplikasi</h3>
              <p className="text-xs text-blue-200">Masuk Akun Admin, Guru, atau Kelas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/80 px-4 pt-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('auto');
              setError('');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'auto'
                ? 'border-blue-700 text-blue-900 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Deteksi Otomatis</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setError('');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'admin'
                ? 'border-blue-700 text-blue-900 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('guru');
              setError('');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'guru'
                ? 'border-blue-700 text-blue-900 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Guru</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('kelas');
              setError('');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'kelas'
                ? 'border-blue-700 text-blue-900 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
            <span>Kelas</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {successSession ? (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-center space-y-2 animate-in zoom-in-95">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-sm font-bold text-emerald-900">
                Autentikasi Berhasil!
              </p>
              <p className="text-xs text-emerald-700">
                Masuk sebagai: <strong>{successSession.displayName}</strong>
                {successSession.adminRoleTitle ? ` (${successSession.adminRoleTitle})` : ''}
              </p>
              <p className="text-[11px] text-slate-500">
                Mengarahkan ke menu yang diizinkan...
              </p>
            </div>
          ) : (
            <>
              {/* Context Description */}
              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {activeTab === 'auto' && (
                  <p>
                    Ketik atau tempel <strong>Token Akun Guru</strong>, <strong>Token Akun Kelas</strong>, atau <strong>PIN Admin</strong>. Sistem akan mendeteksi hak akses Anda secara otomatis.
                  </p>
                )}
                {activeTab === 'admin' && (
                  <p>
                    <strong>Akses Multi-Admin:</strong> Akses penuh seluruh menu jadwal, manajemen CRUD slot, pengaturan stempel/TTD, dan sinkronisasi Google Sheets.
                  </p>
                )}
                {activeTab === 'guru' && (
                  <p>
                    <strong>Akses Akun Guru:</strong> Khusus membuka dan memfilter <strong>Portal Guru & Pengawas SAS</strong> untuk memeriksa jadwal bertugas dan unduh jadwal pribadi.
                  </p>
                )}
                {activeTab === 'kelas' && (
                  <p>
                    <strong>Akses Akun Kelas:</strong> Hak akses khusus membuka menu <strong>Jadwal Per Kelas</strong> terdaftar (1 akun token per kelas).
                  </p>
                )}
              </div>

              {/* Input Token / PIN */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                  <span>{activeTab === 'admin' ? 'Masukkan PIN / Kata Sandi Admin:' : 'Masukkan Token / PIN Akun:'}</span>
                  <span className="text-[11px] font-normal text-slate-500 lowercase flex items-center gap-1">
                    <QrCode className="w-3 h-3 text-blue-600" />
                    <span>hasil pindai QR kartu</span>
                  </span>
                </label>
                <div className="relative flex items-center">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={activeTab === 'admin' ? 'password' : 'text'}
                    value={tokenInput}
                    onChange={(e) => {
                      setTokenInput(e.target.value);
                      setError('');
                    }}
                    placeholder={
                      activeTab === 'guru' 
                        ? 'Contoh: GURU-SMADA2026' 
                        : activeTab === 'kelas'
                        ? 'Contoh: SAS-X1, SAS-XI2, SAS-XII1'
                        : 'Masukkan Token atau PIN Admin...'
                    }
                    autoFocus
                    className="w-full pl-9 pr-20 py-2.5 border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        if (text) {
                          setTokenInput(text.trim());
                          setError('');
                        }
                      } catch {}
                    }}
                    className="absolute right-2 px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
                    title="Tempel teks token yang baru saja dipindai dari kartu"
                  >
                    Tempel
                  </button>
                </div>
                {error && (
                  <p className="text-xs text-rose-600 mt-2 flex items-center gap-1.5 font-medium animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </p>
                )}
                <p className="text-[10px] text-slate-500 mt-1.5">
                  💡 <strong>Tip Pindai:</strong> Arahkan kamera HP Anda ke QR Code pada Kartu Token. Kode token akan langsung terbaca otomatis (bukan berupa link web).
                </p>
              </div>

              {/* Security Notice */}
              <div className="pt-2 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 border-t border-slate-100">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Token dan PIN bersifat rahasia. Hubungi Panitia SAS jika Anda belum menerima kartu token.</span>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 active:scale-[0.99] rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verifikasi & Masuk</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

