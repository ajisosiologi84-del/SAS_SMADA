import React from 'react';
import { SchoolInfo } from '../types/schedule';

interface KopSuratProps {
  schoolInfo: SchoolInfo;
  title?: string;
  subTitle?: string;
  className?: string;
}

export const KopSurat: React.FC<KopSuratProps> = ({
  schoolInfo,
  title,
  subTitle,
  className = '',
}) => {
  return (
    <div className={`border-b-2 border-slate-900 pb-3 mb-4 text-center ${className}`}>
      <div className="flex items-center justify-between gap-4">
        {/* School Logo */}
        <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center rounded border border-slate-300 bg-slate-50 text-slate-700 overflow-hidden">
          {schoolInfo.schoolLogoImage ? (
            <img
              src={schoolInfo.schoolLogoImage}
              alt="Logo Sekolah"
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <div className="text-center font-bold text-xs leading-tight">
              <span className="block text-blue-900 font-extrabold text-sm">SMADA</span>
              <span className="text-[9px] text-slate-500">PASURUAN</span>
            </div>
          )}
        </div>

        {/* School Details */}
        <div className="flex-1 text-center">
          <h4 className="text-xs font-semibold tracking-wider text-slate-600 uppercase">
            {schoolInfo.governmentTitle || 'PEMERINTAH PROVINSI JAWA TIMUR · DINAS PENDIDIKAN'}
          </h4>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight uppercase">
            {schoolInfo.name}
          </h2>
          <p className="text-[11px] text-slate-600 mt-0.5">
            {schoolInfo.address}
          </p>
          <p className="text-[10px] text-slate-500">
            Laman: {schoolInfo.website || 'www.sman2pasuruan.sch.id'} · Surel: {schoolInfo.email || 'info@sman2pasuruan.sch.id'}
          </p>
        </div>

        {/* Right Badge / Curriculum */}
        <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center rounded border border-slate-300 bg-slate-50 text-slate-700">
          <div className="text-center text-[10px] leading-tight">
            <span className="block font-bold text-slate-800 uppercase">{schoolInfo.curriculum?.split(' ')[0] || 'KURIKULUM'}</span>
            <span className="font-semibold text-blue-700 uppercase">{schoolInfo.curriculum?.split(' ')[1] || 'MERDEKA'}</span>
            <span className="block text-[8px] text-slate-500">SAS {schoolInfo.academicYear}</span>
          </div>
        </div>
      </div>

      {(title || subTitle) && (
        <div className="mt-3 pt-2 border-t border-slate-200">
          {title && (
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wide">
              {title}
            </h3>
          )}
          {subTitle && (
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {subTitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
