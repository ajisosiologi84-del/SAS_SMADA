import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  RotateCcw, 
  Upload, 
  PenTool, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (base64Image: string) => void;
  title: string;
  signeeName: string;
  signeeTitle: string;
  currentSignature?: string;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  signeeName,
  signeeTitle,
  currentSignature,
}) => {
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const [inkColor, setInkColor] = useState<'#0f172a' | '#1e3a8a' | '#0369a1'>('#1e3a8a');
  const [lineWidth, setLineWidth] = useState<number>(2.5);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHasDrawn(false);
      setUploadedImage(null);
      setErrorMsg(null);
      // Wait for DOM
      setTimeout(() => {
        initCanvas();
      }, 100);
    }
  }, [isOpen, mode]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Support Retina/HiDPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = lineWidth;
    ctx.clearRect(0, 0, rect.width, rect.height);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
  };

  // Mouse / Touch drawing handlers
  const getCanvasPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const pos = getCanvasPos(clientX, clientY);
    lastPointRef.current = pos;

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x + 0.1, pos.y + 0.1);
    ctx.stroke();
    setHasDrawn(true);
  };

  const drawMove = (clientX: number, clientY: number) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPos = getCanvasPos(clientX, clientY);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    lastPointRef.current = currentPos;
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Berkas harus berupa gambar (PNG, JPG, atau WEBP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Ukuran berkas maksimal 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setUploadedImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSignature = () => {
    if (mode === 'upload') {
      if (uploadedImage) {
        onSave(uploadedImage);
        onClose();
      } else {
        setErrorMsg('Pilih berkas gambar tanda tangan terlebih dahulu.');
      }
    } else {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) {
        setErrorMsg('Silakan goreskan tanda tangan pada bidang kanvas terlebih dahulu.');
        return;
      }

      // Export transparent PNG
      const base64 = canvas.toDataURL('image/png');
      onSave(base64);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shadow-xs">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
              <p className="text-xs text-slate-500">{signeeTitle} · {signeeName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors hover:bg-slate-200/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Mode Tabs: Gambar Langsung vs Upload Gambar */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('draw')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                mode === 'draw'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Gores / Tanda Tangan di Layar</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                mode === 'upload'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah Berkas Gambar (Scan)</span>
            </button>
          </div>

          {/* Mode 1: Interactive Canvas Pad */}
          {mode === 'draw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                <span className="font-medium text-slate-500">Tanda tangan dengan jari / mouse di bawah:</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Warna Tinta:</span>
                  <button
                    type="button"
                    onClick={() => { setInkColor('#1e3a8a'); initCanvas(); }}
                    className={`w-5 h-5 rounded-full bg-blue-900 transition-transform ${inkColor === '#1e3a8a' ? 'ring-2 ring-blue-500 scale-110' : 'opacity-70'}`}
                    title="Tinta Biru Resmi"
                  />
                  <button
                    type="button"
                    onClick={() => { setInkColor('#0f172a'); initCanvas(); }}
                    className={`w-5 h-5 rounded-full bg-slate-900 transition-transform ${inkColor === '#0f172a' ? 'ring-2 ring-slate-500 scale-110' : 'opacity-70'}`}
                    title="Tinta Hitam"
                  />
                  <button
                    type="button"
                    onClick={() => { setInkColor('#0369a1'); initCanvas(); }}
                    className={`w-5 h-5 rounded-full bg-sky-700 transition-transform ${inkColor === '#0369a1' ? 'ring-2 ring-sky-500 scale-110' : 'opacity-70'}`}
                    title="Tinta Biru Terang"
                  />
                </div>
              </div>

              {/* Canvas Area with signature baseline */}
              <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 overflow-hidden cursor-crosshair group hover:border-blue-400 transition-colors">
                <canvas
                  ref={canvasRef}
                  onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
                  onMouseMove={(e) => drawMove(e.clientX, e.clientY)}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    startDrawing(touch.clientX, touch.clientY);
                  }}
                  onTouchMove={(e) => {
                    const touch = e.touches[0];
                    drawMove(touch.clientX, touch.clientY);
                  }}
                  onTouchEnd={stopDrawing}
                  className="w-full h-44 touch-none block bg-transparent"
                />

                {/* Signature Baseline Guide */}
                <div className="absolute left-6 right-6 bottom-9 border-b border-slate-300/80 pointer-events-none flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Garis Tanda Tangan</span>
                  <span>✕</span>
                </div>

                {!hasDrawn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 space-y-1">
                    <PenTool className="w-6 h-6 stroke-[1.5] text-slate-300 animate-pulse" />
                    <span className="text-xs">Sentuh atau tarik mouse di sini untuk membuat tanda tangan</span>
                  </div>
                )}
              </div>

              {/* Tools row under canvas */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="px-2.5 py-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors font-medium text-[11px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Hapus & Ulangi</span>
                </button>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span>Ketebalan:</span>
                  {[2, 3, 4].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => { setLineWidth(w); initCanvas(); }}
                      className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${
                        lineWidth === w ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {w === 2 ? 'Tipis' : w === 3 ? 'Sedang' : 'Tebal'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Upload File Image */}
          {mode === 'upload' && (
            <div className="space-y-3">
              <label className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50 hover:bg-blue-50/50 hover:border-blue-400 transition-colors">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-800">
                    Klik untuk memilih berkas tanda tangan
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mendukung berkas PNG transparan, JPG, atau WEBP (Maksimal 5MB)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Uploaded Image Preview */}
              {uploadedImage && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-14 bg-white border border-slate-300 rounded-lg flex items-center justify-center overflow-hidden p-1 shadow-2xs">
                      <img
                        src={uploadedImage}
                        alt="Pratinjau TTD"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Berkas Berhasil Dimuat</span>
                      </p>
                      <p className="text-[11px] text-slate-500">Siap disimpan sebagai tanda tangan resmi</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedImage(null)}
                    className="text-xs text-rose-600 hover:underline font-medium px-2 py-1"
                  >
                    Ganti
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Current Saved Signature Indicator */}
          {currentSignature && !uploadedImage && (
            <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-16 h-10 bg-white border border-blue-200 rounded flex items-center justify-center overflow-hidden">
                  <img src={currentSignature} alt="TTD Saat Ini" className="max-h-full max-w-full object-contain" />
                </div>
                <div>
                  <span className="font-semibold text-blue-900 block text-[11px]">Tanda Tangan Aktif Tersimpan</span>
                  <span className="text-[10px] text-blue-700">Sudah terpasang pada lembar cetak</span>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSaveSignature}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Gunakan & Simpan Tanda Tangan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
