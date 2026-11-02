import React, { useState, useMemo } from 'react';
import { X, Trash2, Check, Clock, Calendar, Bookmark, GraduationCap } from 'lucide-react';
import { ScheduleSlot, ScheduleEntry, ALL_CLASSES, GRADE_GROUPS } from '../../types/schedule';

interface EditSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (slot: ScheduleSlot) => void;
  onDelete?: (slotId: string) => void;
  initialSlot?: ScheduleSlot | null;
  existingSlots: ScheduleSlot[];
}

export const EditSlotModal: React.FC<EditSlotModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialSlot,
  existingSlots,
}) => {
  const isEditing = Boolean(initialSlot);

  // Form states
  const [slotName, setSlotName] = useState(initialSlot?.slotName || `Slot ${existingSlots.length + 1}`);
  const [week, setWeek] = useState(initialSlot?.week || 'Minggu 1');
  const [dayAndDate, setDayAndDate] = useState(initialSlot?.dayAndDate || 'Senin, 23 November 2026');
  const [session, setSession] = useState(initialSlot?.session || 'Sesi 1 (Jam Ke-1)');
  const [time, setTime] = useState(initialSlot?.time || '07.30 - 09.30 WIB');
  const [activeGradeTab, setActiveGradeTab] = useState<'ALL' | 'X' | 'XI' | 'XII'>('ALL');

  // Entries for 30 classes
  const [entries, setEntries] = useState<Record<string, ScheduleEntry | null>>(() => {
    if (initialSlot?.entries) {
      return { ...initialSlot.entries };
    }
    const initial: Record<string, ScheduleEntry | null> = {};
    ALL_CLASSES.forEach((c) => {
      initial[c] = null;
    });
    return initial;
  });

  // Extract suggestions for subjects and teachers
  const { allSubjects, allTeachers } = useMemo(() => {
    const subjects = new Set<string>();
    const teachers = new Set<string>();
    existingSlots.forEach((s) => {
      Object.values(s.entries).forEach((e) => {
        if (e?.subject) subjects.add(e.subject.trim());
        if (e?.teacher) teachers.add(e.teacher.trim());
      });
    });
    return {
      allSubjects: Array.from(subjects).sort(),
      allTeachers: Array.from(teachers).sort(),
    };
  }, [existingSlots]);

  if (!isOpen) return null;

  const handleEntryChange = (className: string, field: 'subject' | 'teacher', value: string) => {
    setEntries((prev) => {
      const current = prev[className] || { subject: '', teacher: '' };
      const updated = { ...current, [field]: value };
      if (!updated.subject.trim() && !updated.teacher.trim()) {
        return { ...prev, [className]: null };
      }
      return { ...prev, [className]: updated };
    });
  };

  const handleClearClass = (className: string) => {
    setEntries((prev) => ({
      ...prev,
      [className]: null,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSlot: ScheduleSlot = {
      id: initialSlot?.id || `slot-${Date.now()}`,
      slotName: slotName.trim() || `Slot`,
      week: week.trim(),
      dayAndDate: dayAndDate.trim(),
      session: session.trim(),
      time: time.trim(),
      entries,
    };
    onSave(updatedSlot);
    onClose();
  };

  const filteredClasses = activeGradeTab === 'ALL'
    ? ALL_CLASSES
    : GRADE_GROUPS[activeGradeTab];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {isEditing ? `Edit Jadwal: ${initialSlot?.slotName}` : 'Tambah Slot Jadwal Ujian SAS'}
              </h3>
              <p className="text-xs text-slate-500">Kelola mata pelajaran dan pengawas untuk setiap kelas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Label Slot
              </label>
              <input
                type="text"
                value={slotName}
                onChange={(e) => setSlotName(e.target.value)}
                placeholder="Misal: Slot 1"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Minggu Ke-
              </label>
              <select
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-600"
              >
                <option value="Minggu 1">Minggu 1</option>
                <option value="Minggu 2">Minggu 2</option>
                <option value="Minggu 3">Minggu 3</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Hari & Tanggal
              </label>
              <input
                type="text"
                value={dayAndDate}
                onChange={(e) => setDayAndDate(e.target.value)}
                placeholder="Senin, 23 Nov 2026"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Sesi Ujian
              </label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-600"
              >
                <option value="Sesi 1 (Jam Ke-1)">Sesi 1 (Jam Ke-1)</option>
                <option value="Sesi 2 (Jam Ke-2)">Sesi 2 (Jam Ke-2)</option>
                <option value="Sesi Khusus">Sesi Khusus</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Waktu Pelaksanaan
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="07.30 - 09.00 WIB"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>
          </div>

          {/* Datalists for Autocomplete */}
          <datalist id="subject-list">
            {allSubjects.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <datalist id="teacher-list">
            {allTeachers.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>

          {/* Class Entries Section */}
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Penugasan Mata Pelajaran & Pengawas Per Kelas (30 Kelas)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Kosongkan jika kelas tersebut tidak ada ujian pada slot ini
                </p>
              </div>

              {/* Grade Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
                {(['ALL', 'X', 'XI', 'XII'] as const).map((grade) => (
                  <button
                    type="button"
                    key={grade}
                    onClick={() => setActiveGradeTab(grade)}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      activeGradeTab === grade
                        ? 'bg-white text-blue-800 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {grade === 'ALL' ? 'Semua (30)' : `Kelas ${grade} (10)`}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredClasses.map((className) => {
                const entry = entries[className];
                const hasData = entry && (entry.subject || entry.teacher);

                return (
                  <div
                    key={className}
                    className={`p-3 rounded-lg border transition-all ${
                      hasData
                        ? 'bg-blue-50/40 border-blue-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-white">
                        {className}
                      </span>
                      {hasData && (
                        <button
                          type="button"
                          onClick={() => handleClearClass(className)}
                          className="text-[10px] text-slate-400 hover:text-rose-600 transition-colors"
                          title="Kosongkan kelas ini"
                        >
                          Kosongkan
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div>
                        <input
                          type="text"
                          list="subject-list"
                          value={entry?.subject || ''}
                          onChange={(e) => handleEntryChange(className, 'subject', e.target.value)}
                          placeholder="Mata Pelajaran..."
                          className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          list="teacher-list"
                          value={entry?.teacher || ''}
                          onChange={(e) => handleEntryChange(className, 'teacher', e.target.value)}
                          placeholder="Guru Pengampu / Gelar..."
                          className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Yakin ingin menghapus ${initialSlot?.slotName}?`)) {
                    onDelete(initialSlot!.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Slot Ini
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                Simpan Perubahan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
