import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface TokenQrCodeProps {
  token: string;
  size?: number;
  className?: string;
  darkColor?: string;
}

export const TokenQrCode: React.FC<TokenQrCodeProps> = ({ 
  token, 
  size = 72, 
  className = '',
  darkColor = '#0f172a'
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    const rawToken = (token || '').trim();
    if (!rawToken) return;

    // Directly encode ONLY the token string (e.g. "SAS-X1" or "GURU-SMADA2026")
    // When scanned by any camera, it will return the exact token text directly.
    QRCode.toDataURL(rawToken, {
      width: size * 3, // High-density for 300 DPI print clarity
      margin: 1,
      color: {
        dark: darkColor,
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error('Error generating token QR:', err));
  }, [token, size, darkColor]);

  if (!dataUrl) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className={`bg-slate-100 rounded border border-slate-200 flex items-center justify-center animate-pulse ${className}`}
      >
        <span className="text-[8px] text-slate-400 font-mono font-bold">QR...</span>
      </div>
    );
  }

  return (
    <img 
      src={dataUrl} 
      alt={`QR Token: ${token}`}
      style={{ width: size, height: size }}
      className={`rounded border border-slate-200 bg-white object-contain ${className}`}
    />
  );
};
