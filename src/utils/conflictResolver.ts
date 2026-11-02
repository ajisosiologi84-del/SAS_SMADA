import { ScheduleSlot, ScheduleEntry, ALL_CLASSES } from '../types/schedule';

export interface ConflictItem {
  slotId: string;
  slotName: string;
  dayAndDate: string;
  session: string;
  time: string;
  teacher: string;
  classes: string[];
  subjects: string[];
}

export interface ConflictAuditReport {
  timestamp: string;
  totalSlots: number;
  totalAssignments: number;
  uniqueTeachers: number;
  conflictsCount: number;
  conflictFreePercentage: number;
  is100PercentConflictFree: boolean;
  conflicts: ConflictItem[];
  slotAudits: {
    slotId: string;
    slotName: string;
    dayAndDate: string;
    session: string;
    time: string;
    assignedTeachersCount: number;
    hasConflict: boolean;
    conflictingTeachers: string[];
  }[];
}

/**
 * Memeriksa seluruh slot dan kelas untuk mendeteksi bentrok pengampu
 */
export function auditScheduleConflicts(slots: ScheduleSlot[]): ConflictAuditReport {
  const conflicts: ConflictItem[] = [];
  const teacherSet = new Set<string>();
  let totalAssignments = 0;

  const slotAudits = slots.map((slot) => {
    const teacherToClasses = new Map<string, { classes: string[]; subjects: string[] }>();
    let assignedCount = 0;

    ALL_CLASSES.forEach((cls) => {
      const entry = slot.entries[cls];
      if (entry && entry.subject && entry.teacher) {
        totalAssignments++;
        const tName = entry.teacher.trim();
        const sName = entry.subject.trim();
        teacherSet.add(tName);
        assignedCount++;

        if (!teacherToClasses.has(tName)) {
          teacherToClasses.set(tName, { classes: [], subjects: [] });
        }
        teacherToClasses.get(tName)!.classes.push(cls);
        teacherToClasses.get(tName)!.subjects.push(sName);
      }
    });

    const conflictingTeachers: string[] = [];

    teacherToClasses.forEach((data, tName) => {
      if (data.classes.length > 1) {
        conflictingTeachers.push(tName);
        conflicts.push({
          slotId: slot.id,
          slotName: slot.slotName,
          dayAndDate: slot.dayAndDate,
          session: slot.session,
          time: slot.time,
          teacher: tName,
          classes: data.classes,
          subjects: data.subjects,
        });
      }
    });

    return {
      slotId: slot.id,
      slotName: slot.slotName,
      dayAndDate: slot.dayAndDate,
      session: slot.session,
      time: slot.time,
      assignedTeachersCount: assignedCount,
      hasConflict: conflictingTeachers.length > 0,
      conflictingTeachers,
    };
  });

  const conflictsCount = conflicts.length;
  const is100PercentConflictFree = conflictsCount === 0;
  const conflictFreePercentage = is100PercentConflictFree
    ? 100
    : Math.max(0, Math.round(((totalAssignments - conflictsCount * 2) / Math.max(1, totalAssignments)) * 100));

  return {
    timestamp: new Date().toLocaleString('id-ID', {
      dateStyle: 'full',
      timeStyle: 'medium',
    }),
    totalSlots: slots.length,
    totalAssignments,
    uniqueTeachers: teacherSet.size,
    conflictsCount,
    conflictFreePercentage,
    is100PercentConflictFree,
    conflicts,
    slotAudits,
  };
}

/**
 * Generate dan selesaikan semua bentrok pengampu secara otomatis hingga 100% Bebas Bentrok
 */
export function generate100PercentConflictFreeSchedule(slots: ScheduleSlot[]): {
  resolvedSlots: ScheduleSlot[];
  conflictsResolvedCount: number;
  report: ConflictAuditReport;
} {
  // Buat deep copy dari slots
  const newSlots: ScheduleSlot[] = slots.map((s) => ({
    ...s,
    entries: { ...s.entries },
  }));

  // Kumpulkan pool guru dan mata pelajaran dari data yang ada
  const allTeachers: string[] = [];
  const subjectTeachersMap = new Map<string, Set<string>>();

  newSlots.forEach((slot) => {
    ALL_CLASSES.forEach((cls) => {
      const entry = slot.entries[cls];
      if (entry && entry.teacher && entry.subject) {
        const t = entry.teacher.trim();
        const s = entry.subject.trim();
        if (!allTeachers.includes(t)) allTeachers.push(t);

        if (!subjectTeachersMap.has(s)) {
          subjectTeachersMap.set(s, new Set());
        }
        subjectTeachersMap.get(s)!.add(t);
      }
    });
  });

  let totalResolved = 0;

  // Lakukan iterasi perbaikan bentrok pada setiap slot
  newSlots.forEach((slot) => {
    const assignedInThisSlot = new Set<string>();

    ALL_CLASSES.forEach((cls) => {
      const entry = slot.entries[cls];
      if (entry && entry.subject && entry.teacher) {
        const currentTeacher = entry.teacher.trim();

        if (assignedInThisSlot.has(currentTeacher)) {
          // Bentrok terdeteksi! Guru sudah mengajar di kelas lain pada slot ini.
          // Cari guru pengganti yang belum bertugas di slot ini
          const eligibleForSubject = Array.from(subjectTeachersMap.get(entry.subject.trim()) || []);
          let substituteTeacher = eligibleForSubject.find((t) => !assignedInThisSlot.has(t));

          if (!substituteTeacher) {
            // Jika tidak ada guru mapel sama yang luang, cari guru lain yang belum bertugas di slot ini
            substituteTeacher = allTeachers.find((t) => !assignedInThisSlot.has(t));
          }

          if (substituteTeacher) {
            slot.entries[cls] = {
              subject: entry.subject,
              teacher: substituteTeacher,
            };
            assignedInThisSlot.add(substituteTeacher);
            totalResolved++;
          }
        } else {
          assignedInThisSlot.add(currentTeacher);
        }
      }
    });
  });

  // Jalankan audit akhir
  const finalReport = auditScheduleConflicts(newSlots);

  return {
    resolvedSlots: newSlots,
    conflictsResolvedCount: totalResolved,
    report: finalReport,
  };
}
