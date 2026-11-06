import React from 'react';
import { ScheduleSlot, SchoolInfo } from '../../types/schedule';
import { KopSurat } from '../KopSurat';
import { AlertTriangle } from 'lucide-react';

interface ClassScheduleCardProps {
  className: string;
  slots: ScheduleSlot[];
  schoolInfo: SchoolInfo;
  id?: string;
  containerClassName?: string;
}

export const ClassScheduleCard: React.FC<ClassScheduleCardProps> = ({
  className,
  slots,
  schoolInfo,
  id,
  containerClassName = '',
}) => {
  // Extract all slots that have exams for this specific class
  const classSchedule = slots
    .map((slot) => {
      const entry = slot.entries[className];
      return {
        slot,
        entry,
      };
    })
    .filter((item) => item.entry !== null && item.entry.subject.trim() !== '');

  return (
    <div
      id={id}
      className={`class-schedule-page bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8 max-w-4xl mx-auto a4-print-target ${containerClassName}`}
    >
      {/* Formal Kop Surat */}
      <KopSurat
        schoolInfo={schoolInfo}
        title="JADWAL SUMATIF AKHIR SEMESTER (SAS) GANJIL"
        subTitle={`KELAS: ${className} · TAHUN PELAJARAN ${schoolInfo.academicYear}`}
      />

      {/* Schedule Table */}
      <div className="border border-slate-300 rounded-lg my-3.5 overflow-hidden">
        <table className="w-full text-left border-collapse border border-slate-300 text-xs table-fixed">
          <thead>
            <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
              <th className="px-1.5 py-2 border-r border-slate-700 text-center w-[6%]">No</th>
              <th className="px-1.5 py-2 border-r border-slate-700 text-center w-[9%]">Minggu</th>
              <th className="px-2.5 py-2 border-r border-slate-700 w-[19%]">Hari & Tanggal</th>
              <th className="px-1.5 py-2 border-r border-slate-700 text-center w-[9%]">Sesi</th>
              <th className="px-2 py-2 border-r border-slate-700 text-center w-[15%] font-mono">Waktu</th>
              <th className="px-2.5 py-2 border-r border-slate-700 w-[21%]">Mata Pelajaran</th>
              <th className="px-2.5 py-2 w-[21%]">Guru Pengampu / Pengawas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {classSchedule.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-500">
                  Tidak ada jadwal ujian terdaftar untuk kelas {className}.
                </td>
              </tr>
            ) : (
              classSchedule.map((item, idx) => {
                const isEven = idx % 2 === 1;
                return (
                  <tr
                    key={item.slot.id}
                    className={`${isEven ? 'bg-slate-50/70' : 'bg-white'} hover:bg-blue-50/30 transition-colors`}
                  >
                    <td className="px-1.5 py-1.5 border-r border-slate-300 text-center font-bold text-slate-800 text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="px-1.5 py-1.5 border-r border-slate-300 text-center text-slate-600 font-medium text-[11px]">
                      {item.slot.week}
                    </td>
                    <td className="px-2.5 py-1.5 border-r border-slate-300 font-semibold text-slate-900 text-[11px] break-words leading-snug">
                      {item.slot.dayAndDate}
                    </td>
                    <td className="px-1.5 py-1.5 border-r border-slate-300 text-center text-slate-700 text-[11px]">
                      {item.slot.session}
                    </td>
                    <td className="px-2 py-1.5 border-r border-slate-300 text-center font-mono text-slate-900 font-semibold text-[11px]">
                      {item.slot.time}
                    </td>
                    <td className="px-2.5 py-1.5 border-r border-slate-300 font-bold text-blue-950 text-[11.5px] break-words leading-snug">
                      {item.entry?.subject}
                    </td>
                    <td className="px-2.5 py-1.5 text-slate-800 text-[11px] break-words leading-snug font-medium">
                      {item.entry?.teacher}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Tata Tertib Peserta SAS 2026/2027 */}
      <div className="mt-4 p-3 rounded-lg border border-slate-200 bg-slate-50/80 text-xs text-slate-700 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase tracking-wide text-[11px]">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Tata Tertib Peserta Sumatif Akhir Semester (SAS):</span>
        </div>
        <ol className="list-decimal list-inside space-y-0.5 text-[10.5px] leading-relaxed text-slate-600 pl-1">
          {(schoolInfo.examRules && schoolInfo.examRules.length > 0 ? schoolInfo.examRules : [
            'Peserta didik wajib hadir di ruang ujian selambat-lambatnya 15 menit sebelum bel masuk dibunyikan.',
            'Mengenakan pakaian seragam sekolah rapi, atribut lengkap, dan bersepatu hitam sesuai ketentuan hari.',
            'Membawa kartu peserta SAS dan perlengkapan alat tulis pribadi (dilarang saling meminjam alat tulis).',
            'Perangkat gawai / Handphone (HP) wajib dimatikan atau dikumpulkan di depan ruang ujian sesuai instruksi pengawas.',
            'Dilarang berbuat curang, menyontek, atau bekerja sama dalam bentuk apa pun selama ujian berlangsung.',
          ]).map((rule, rIdx) => (
            <li key={rIdx}>{rule}</li>
          ))}
        </ol>
      </div>

      {/* Sign-off / Lembar Pengesahan */}
      <div className="mt-6 pt-3 border-t border-slate-300 grid grid-cols-3 gap-2 text-xs text-slate-800">
        <div className="text-center px-1">
          <p className="text-[11px] text-slate-500 mb-0.5">Mengetahui,</p>
          <p className="font-bold text-slate-900 leading-tight">Wali Kelas {className}</p>
          <div className="h-16 flex items-center justify-center">
            <span className="text-[10px] text-slate-400 italic">(Tanda Tangan)</span>
          </div>
          <p className="font-bold text-slate-900 underline text-[11px]">( ............................................ )</p>
          <p className="text-[10px] text-slate-500 mt-0.5">NIP. -</p>
        </div>

        <div className="text-center relative px-1">
          <p className="text-[11px] text-slate-500 mb-0.5">Panitia Pelaksana,</p>
          <p className="font-bold text-slate-900 leading-tight">{schoolInfo.committeeTitle || 'Ketua Panitia SAS'}</p>
          <div className="h-16 flex items-center justify-center relative my-0.5">
            {schoolInfo.committeeSignatureImage ? (
              <img
                src={schoolInfo.committeeSignatureImage}
                alt="TTD Ketua Panitia"
                className="h-14 max-w-[130px] object-contain relative z-10"
              />
            ) : (
              <span className="text-[10px] text-slate-400 italic">(Tanda Tangan)</span>
            )}
          </div>
          <p className="font-bold text-slate-900 underline text-[11px] leading-tight">{schoolInfo.committeeName}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">NIP. {schoolInfo.committeeNip}</p>
        </div>

        <div className="text-center relative px-1">
          <p className="text-[11px] text-slate-500 mb-0.5">{schoolInfo.signPlaceAndDate || 'Pasuruan, 23 November 2026'}</p>
          <p className="font-bold text-slate-900 leading-tight">{schoolInfo.headmasterTitle || 'Kepala SMA Negeri 2 Pasuruan'}</p>
          <div className="h-16 flex items-center justify-center relative my-0.5">
            {schoolInfo.headmasterStampImage && (
              <img
                src={schoolInfo.headmasterStampImage}
                alt="Stempel Sekolah"
                className="absolute left-1/4 -top-1 w-16 h-16 object-contain opacity-75 pointer-events-none"
              />
            )}
            {schoolInfo.headmasterSignatureImage ? (
              <img
                src={schoolInfo.headmasterSignatureImage}
                alt="TTD Kepala Sekolah"
                className="h-14 max-w-[130px] object-contain relative z-10"
              />
            ) : (
              <span className="text-[10px] text-slate-400 italic">(Tanda Tangan & Cap Resmi)</span>
            )}
          </div>
          <p className="font-bold text-slate-900 underline text-[11px] leading-tight">{schoolInfo.headmasterName}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">NIP. {schoolInfo.headmasterNip}</p>
        </div>
      </div>
    </div>
  );
};
