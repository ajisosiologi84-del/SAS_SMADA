import React, { useState, useMemo } from 'react';
import { ScheduleSlot, SchoolInfo, ALL_CLASSES, GRADE_GROUPS } from '../types/schedule';
import { Calendar, Clock, BookOpen, User, CheckCircle2, ChevronRight } from 'lucide-react';

interface DailyAgendaViewProps {
  slots: ScheduleSlot[];
  schoolInfo: SchoolInfo;
  onSelectClass: (className: string) => void;
}

export const DailyAgendaView: React.FC<DailyAgendaViewProps> = ({
  slots,
  schoolInfo,
  onSelectClass,
}) => {
  // Extract distinct days
  const distinctDays = useMemo(() => {
    const map = new Map<string, ScheduleSlot[]>();
    slots.forEach((s) => {
      const day = s.dayAndDate;
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(s);
    });
    return Array.from(map.entries()).map(([day, daySlots]) => ({
      day,
      week: daySlots[0]?.week || 'Minggu 1',
      slots: daySlots,
    }));
  }, [slots]);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const currentDayData = distinctDays[selectedDayIndex] || distinctDays[0];

  return (
    <div className="space-y-6">
      {/* Day Selector Pills */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs no-print space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-700" />
            <h3 className="font-bold text-slate-900 text-sm">Agenda & Timeline Harian SAS</h3>
          </div>
          <span className="text-xs text-slate-500">
            Total {distinctDays.length} Hari Pelaksanaan
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {distinctDays.map((item, idx) => {
            const isSelected = selectedDayIndex === idx;
            return (
              <button
                key={item.day}
                type="button"
                onClick={() => setSelectedDayIndex(idx)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border text-left ${
                  isSelected
                    ? 'bg-blue-700 text-white border-blue-800 shadow-xs ring-2 ring-blue-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                  {item.week}
                </div>
                <div>{item.day}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda Cards */}
      {currentDayData && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-blue-200 font-semibold uppercase tracking-wider block">
                {currentDayData.week}
              </span>
              <h2 className="text-lg sm:text-xl font-bold mt-0.5">
                {currentDayData.day}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>{currentDayData.slots.length} Sesi Terjadwal</span>
            </div>
          </div>

          {/* Slots of this day */}
          <div className="space-y-6">
            {currentDayData.slots.map((slot) => {
              // Group entries of this slot by Grade
              const entriesX = GRADE_GROUPS['X'].map((c) => ({ cls: c, entry: slot.entries[c] })).filter((i) => i.entry);
              const entriesXI = GRADE_GROUPS['XI'].map((c) => ({ cls: c, entry: slot.entries[c] })).filter((i) => i.entry);
              const entriesXII = GRADE_GROUPS['XII'].map((c) => ({ cls: c, entry: slot.entries[c] })).filter((i) => i.entry);

              return (
                <div
                  key={slot.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
                >
                  <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded bg-blue-900 text-white font-bold text-xs">
                        {slot.slotName}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {slot.session}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700 bg-white px-3 py-1 rounded border border-slate-200">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{slot.time}</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* Grade X */}
                    {entriesX.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-900 mb-2">
                          <span className="w-2 h-2 rounded-full bg-blue-700"></span>
                          <span>KELAS X ({entriesX.length} Ruang Ujian)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
                          {entriesX.map(({ cls, entry }) => (
                            <div
                              key={cls}
                              onClick={() => onSelectClass(cls)}
                              className="p-2.5 bg-blue-50/40 rounded-lg border border-blue-100 hover:border-blue-300 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs px-1.5 py-0.5 rounded bg-blue-900 text-white">
                                  {cls}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                              <p className="font-semibold text-xs text-slate-900 line-clamp-1">
                                {entry?.subject}
                              </p>
                              <p className="text-[10px] text-slate-500 line-clamp-1">
                                {entry?.teacher}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grade XI */}
                    {entriesXI.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-xs font-bold text-teal-900 mb-2">
                          <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                          <span>KELAS XI ({entriesXI.length} Ruang Ujian)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
                          {entriesXI.map(({ cls, entry }) => (
                            <div
                              key={cls}
                              onClick={() => onSelectClass(cls)}
                              className="p-2.5 bg-teal-50/40 rounded-lg border border-teal-100 hover:border-teal-300 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs px-1.5 py-0.5 rounded bg-teal-900 text-white">
                                  {cls}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-teal-400 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                              <p className="font-semibold text-xs text-slate-900 line-clamp-1">
                                {entry?.subject}
                              </p>
                              <p className="text-[10px] text-slate-500 line-clamp-1">
                                {entry?.teacher}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grade XII */}
                    {entriesXII.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 mb-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                          <span>KELAS XII ({entriesXII.length} Ruang Ujian)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
                          {entriesXII.map(({ cls, entry }) => (
                            <div
                              key={cls}
                              onClick={() => onSelectClass(cls)}
                              className="p-2.5 bg-indigo-50/40 rounded-lg border border-indigo-100 hover:border-indigo-300 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs px-1.5 py-0.5 rounded bg-indigo-950 text-white">
                                  {cls}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                              <p className="font-semibold text-xs text-slate-900 line-clamp-1">
                                {entry?.subject}
                              </p>
                              <p className="text-[10px] text-slate-500 line-clamp-1">
                                {entry?.teacher}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
