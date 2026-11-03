import React, { useState } from 'react';
import { 
  KeyRound, 
  Lock, 
  ShieldCheck, 
  UserCheck, 
  GraduationCap, 
  AlertCircle, 
  QrCode, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Eye,
  EyeOff,
  School,
  ExternalLink,
  Clipboard
} from 'lucide-react';
import { SchoolInfo, AuthSession } from '../types/schedule';
import { verifyTokenOrPin } from '../utils/storage';

interface LoginPortalScreenProps {
  schoolInfo: SchoolInfo;
  onLoginSuccess: (session: AuthSession) => void;
  onContinueAsStudent: () => void;
}

export const LoginPortalScreen: React.FC<LoginPortalScreenProps> = ({
  schoolInfo,
  onLoginSuccess,
  onContinueAsStudent,
}) => {
  const [activeTab, setActiveTab] = useState<'auto' | 'admin' | 'guru' | 'kelas'>('auto');
  const [tokenInput, setTokenInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [pasteNotice, setPasteNotice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError('Harap masukkan Token atau PIN Anda.');
      return;
    }

    setIsVerifying(true);
    setError('');

    setTimeout(() => {
      const session = verifyTokenOrPin(tokenInput.trim());
      setIsVerifying(false);

      if (!session) {
        if (activeTab === 'admin') {
          setError('PIN atau kredensial Administrator tidak cocok.');
        } else if (activeTab === 'guru') {
          setError('Token Guru tidak valid. Periksa kartu token resmi Anda.');
        } else if (activeTab === 'kelas') {
          setError('Token Kelas tidak cocok. Pastikan memasukkan token kelas Anda (contoh: SAS-X1).');
        } else {
          setError('Token atau PIN tidak dikenali. Pastikan Anda memasukkan kode yang benar.');
        }
        return;
      }

      // Check tab-specific enforcement if user selected a specific tab
      if (activeTab === 'admin' && session.role !== 'admin') {
        setError('Kode ini bukan PIN Administrator.');
        return;
      }
      if (activeTab === 'guru' && session.role !== 'guru') {
        setError('Kode ini bukan Token Guru & Pengawas.');
        return;
      }
      if (activeTab === 'kelas' && session.role !== 'kelas') {
        setError('Kode ini bukan Token Kelas.');
        return;
      }

      onLoginSuccess(session);
    }, 150);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setTokenInput(text.trim());
        setError('');
        setPasteNotice(true);
        setTimeout(() => setPasteNotice(false), 2000);
      }
    } catch {
      setError('Tidak dapat membaca clipboard. Izinkan akses clipboard atau ketik token secara manual.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Bar Branding */}
      <header className="relative z-10 px-4 sm:px-8 py-5 flex items-center justify-between border-b border-white/10 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          {schoolInfo.schoolLogoImage ? (
            <img 
              src={schoolInfo.schoolLogoImage} 
              alt="Logo SMAN 2 Pasuruan" 
              className="w-10 h-10 object-contain drop-shadow" 
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-white shadow-lg text-sm">
              SMADA
            </div>
          )}
          <div>
            <span className="text-[10px] tracking-widest uppercase font-bold text-blue-300 block">
              PEMERINTAH PROVINSI JAWA TIMUR
            </span>
            <h1 className="text-sm sm:text-base font-extrabold text-white leading-tight">
              SMA NEGERI 2 KOTA PASURUAN
            </h1>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            SAS {schoolInfo.academicYear || '2026/2027'}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            Revisi v2 (0% Bentrok)
          </span>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-200">
          {/* Card Hero Header */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-7 text-center relative">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center mb-3 shadow-inner">
              <KeyRound className="w-7 h-7 text-amber-400" />
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Portal Akses Aplikasi SAS
            </h2>
            <p className="text-xs text-blue-200 mt-1 max-w-sm mx-auto leading-relaxed">
              Silakan masukkan <strong>Token Guru</strong>, <strong>Token Kelas</strong>, atau <strong>PIN Administrator</strong> untuk masuk.
            </p>
          </div>

          {/* Role Navigation Tabs */}
          <div className="grid grid-cols-4 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('auto');
                setError('');
              }}
              className={`py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                activeTab === 'auto'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Otomatis</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('guru');
                setError('');
              }}
              className={`py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                activeTab === 'guru'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'hover:text-slate-900'
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
              className={`py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                activeTab === 'kelas'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
              <span>Kelas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setError('');
              }}
              className={`py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                activeTab === 'admin'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Admin</span>
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
            {/* Context Message */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
              {activeTab === 'auto' && (
                <p>
                  ⚡ <strong>Deteksi Pintar:</strong> Masukkan Token Guru, Token Kelas, atau PIN Admin Anda. Sistem otomatis mengenali hak akses Anda.
                </p>
              )}
              {activeTab === 'guru' && (
                <p>
                  👤 <strong>Portal Guru & Pengawas SAS:</strong> Masukkan Token Guru resmi dari Panitia untuk memeriksa jadwal mengajar dan jadwal mengawas pribadi.
                </p>
              )}
              {activeTab === 'kelas' && (
                <p>
                  🎓 <strong>Jadwal Resmi Kelas:</strong> Masukkan Token Kelas unik kelas Anda (1 akun per rombel) untuk melihat dan mencetak jadwal ujian kelas.
                </p>
              )}
              {activeTab === 'admin' && (
                <p>
                  🛡️ <strong>Kepanitiaan SAS (Multi-Admin):</strong> Masukkan PIN atau kredensial Administrator untuk akses penuh seluruh menu dan pengaturan sistem.
                </p>
              )}
            </div>

            {/* Input Token / PIN */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wide">
                <label htmlFor="login-token-input">
                  {activeTab === 'admin' ? 'Masukkan PIN / Kata Sandi Admin:' : 'Masukkan Token / PIN Akun:'}
                </label>
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 lowercase tracking-normal"
                >
                  <Clipboard className="w-3 h-3" />
                  <span>{pasteNotice ? 'Berhasil Ditempel!' : 'tempel dari QR'}</span>
                </button>
              </div>

              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  id="login-token-input"
                  type={activeTab === 'admin' && !showPassword ? 'password' : 'text'}
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
                      : activeTab === 'admin'
                      ? 'Masukkan PIN Admin...'
                      : 'Ketik atau tempel token di sini...'
                  }
                  autoFocus
                  className="w-full pl-10 pr-12 py-3 border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-mono"
                />

                {activeTab === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    title={showPassword ? 'Sembunyikan' : 'Tampilkan PIN'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <p className="text-[10px] text-slate-500 pt-0.5">
                💡 <strong>Scan QR:</strong> Pindai QR Code pada Kartu Token dengan kamera HP Anda untuk menyalin kode token secara instan (bukan link web).
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isVerifying || !tokenInput.trim()}
              className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
            >
              <span>{isVerifying ? 'Memverifikasi...' : 'Masuk ke Aplikasi SAS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <span className="bg-white px-3">Atau Akses Terbuka</span>
              </div>
            </div>

            {/* Public Student Access Button */}
            <button
              type="button"
              onClick={onContinueAsStudent}
              className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <GraduationCap className="w-4 h-4 text-blue-700" />
              <span>Masuk sebagai Siswa (Lihat Jadwal Per Kelas)</span>
            </button>
          </form>

          {/* Card Footer Security Assurance */}
          <div className="bg-slate-50 p-4 border-t border-slate-100 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Kerahasiaan akun terjamin &middot; Hubungi Panitia SAS jika belum menerima token</span>
          </div>
        </div>
      </main>

      {/* Footer System Info */}
      <footer className="relative z-10 px-4 py-4 text-center text-xs text-slate-400 border-t border-white/10 backdrop-blur-xs">
        <p className="font-medium">
          Aplikasi Jadwal Terintegrasi SAS SMA Negeri 2 Kota Pasuruan &middot; Tahun Pelajaran 2026/2027
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Jl. Panglima Sudirman No. 27, Kota Pasuruan, Jawa Timur
        </p>
      </footer>
    </div>
  );
};
