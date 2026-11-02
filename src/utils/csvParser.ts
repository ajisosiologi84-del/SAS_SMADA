import * as XLSX from 'xlsx';
import { ScheduleSlot, ScheduleEntry, ALL_CLASSES } from '../types/schedule';

export function parseCSVOrExcel(file: File): Promise<ScheduleSlot[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let workbook: XLSX.WorkBook;

        if (typeof data === 'string') {
          workbook = XLSX.read(data, { type: 'string' });
        } else {
          const arr = new Uint8Array(data as ArrayBuffer);
          workbook = XLSX.read(arr, { type: 'array' });
        }

        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rawJson: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Find header row containing X-1 or 'Slot'
        let headerRowIndex = -1;
        for (let r = 0; r < rawJson.length; r++) {
          const row = rawJson[r] || [];
          const rowStr = row.join(' ').toLowerCase();
          if (rowStr.includes('x-1') && (rowStr.includes('x-2') || rowStr.includes('slot'))) {
            headerRowIndex = r;
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error('Format tabel tidak dikenali. Baris header dengan kolom kelas (X-1, X-2, ...) tidak ditemukan.');
        }

        const headerRow: string[] = (rawJson[headerRowIndex] || []).map((h) => String(h || '').trim());

        // Map column indices
        const classColIndices: Record<string, number> = {};
        let slotCol = -1;
        let weekCol = -1;
        let dayCol = -1;
        let sessionCol = -1;
        let timeCol = -1;

        headerRow.forEach((colName, idx) => {
          const clean = colName.toUpperCase().replace(/\s+/g, '');
          if (clean === 'SLOT') slotCol = idx;
          else if (clean === 'MINGGU') weekCol = idx;
          else if (clean.includes('HARI') || clean.includes('TANGGAL')) dayCol = idx;
          else if (clean.includes('SESI') || clean.includes('JAM')) sessionCol = idx;
          else if (clean.includes('WAKTU')) timeCol = idx;
          else if (ALL_CLASSES.includes(clean)) {
            classColIndices[clean] = idx;
          }
        });

        const newSlots: ScheduleSlot[] = [];
        let currentWeek = 'Minggu 1';
        let currentDay = '';

        for (let r = headerRowIndex + 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.length === 0) continue;

          const slotNameRaw = String(row[slotCol] || '').trim();
          if (!slotNameRaw && !row[sessionCol] && !row[timeCol]) continue;

          const weekRaw = String(row[weekCol] || '').trim();
          if (weekRaw) currentWeek = weekRaw;

          const dayRaw = String(row[dayCol] || '').trim();
          if (dayRaw) currentDay = dayRaw;

          const sessionRaw = String(row[sessionCol] || '').trim();
          const timeRaw = String(row[timeCol] || '').trim();

          const slotId = `slot-${newSlots.length + 1}`;
          const entries: Record<string, ScheduleEntry | null> = {};

          ALL_CLASSES.forEach((cls) => {
            const colIdx = classColIndices[cls];
            if (colIdx !== undefined && row[colIdx] !== undefined) {
              const cellVal = String(row[colIdx] || '').trim();
              if (cellVal && cellVal !== '-' && cellVal !== 'null') {
                // Parse "Subject\n(Teacher)" or "Subject (Teacher)"
                const lines = cellVal.split(/\n|\r\n/);
                let subject = lines[0].trim();
                let teacher = '';

                if (lines.length > 1) {
                  teacher = lines.slice(1).join(' ').trim().replace(/^\(|\)$/g, '');
                } else {
                  // Try regex for "Subject (Teacher)"
                  const match = cellVal.match(/^([^(]+)\s*\((.+)\)$/);
                  if (match) {
                    subject = match[1].trim();
                    teacher = match[2].trim();
                  }
                }

                entries[cls] = { subject, teacher };
              } else {
                entries[cls] = null;
              }
            } else {
              entries[cls] = null;
            }
          });

          newSlots.push({
            id: slotId,
            slotName: slotNameRaw || `Slot ${newSlots.length + 1}`,
            week: currentWeek,
            dayAndDate: currentDay || 'Tanggal Belum Diatur',
            session: sessionRaw || `Sesi ${((newSlots.length % 2) + 1)}`,
            time: timeRaw || '07.30 - 09.30 WIB',
            entries,
          });
        }

        if (newSlots.length === 0) {
          throw new Error('Tidak ada baris jadwal yang valid dapat diekstrak dari file ini.');
        }

        resolve(newSlots);
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file'));
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}
