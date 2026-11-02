import * as XLSX from 'xlsx';
import { toJpeg, toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { ScheduleSlot, SchoolInfo, ALL_CLASSES } from '../types/schedule';

export function exportMatrixToExcel(slots: ScheduleSlot[], schoolInfo: SchoolInfo, classes: readonly string[] = ALL_CLASSES) {
  const wb = XLSX.utils.book_new();

  // Create rows for integrated matrix
  const headers = ['No', 'Minggu', 'Hari & Tanggal', 'Sesi', 'Waktu', ...classes];
  const rows: any[][] = [
    [schoolInfo.name],
    [`JADWAL SUMATIF AKHIR SEMESTER (SAS) GANJIL TP ${schoolInfo.academicYear}`],
    [`${schoolInfo.address} - ${schoolInfo.city}`],
    [],
    headers,
  ];

  slots.forEach((slot, index) => {
    const row = [
      index + 1,
      slot.week,
      slot.dayAndDate,
      slot.session,
      slot.time,
    ];

    classes.forEach((cls) => {
      const entry = slot.entries[cls];
      if (entry && entry.subject) {
        row.push(`${entry.subject}\n(${entry.teacher})`);
      } else {
        row.push('-');
      }
    });

    rows.push(row);
  });

  // Footer notes and sign off
  rows.push([]);
  rows.push(['', '', '', '', `Pasuruan, 23 November 2026`]);
  rows.push(['', '', 'Mengetahui,', '', '', 'Ketua Panitia SAS']);
  rows.push(['', '', 'Kepala SMA Negeri 2 Pasuruan', '', '', schoolInfo.committeeName]);
  rows.push([]);
  rows.push([]);
  rows.push(['', '', schoolInfo.headmasterName, '', '', `NIP. ${schoolInfo.committeeNip}`]);
  rows.push(['', '', `NIP. ${schoolInfo.headmasterNip}`]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },  // No
    { wch: 10 }, // Minggu
    { wch: 24 }, // Hari Tanggal
    { wch: 18 }, // Sesi
    { wch: 18 }, // Waktu
    ...classes.map(() => ({ wch: 28 })),
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Jadwal SAS Terintegrasi');
  XLSX.writeFile(wb, `Jadwal_SAS_SMAN2_Pasuruan_Terintegrasi_${schoolInfo.academicYear.replace('/', '-')}.xlsx`);
}

export function exportClassToExcel(slots: ScheduleSlot[], className: string, schoolInfo: SchoolInfo) {
  const wb = XLSX.utils.book_new();

  const headers = ['No', 'Minggu', 'Hari & Tanggal', 'Sesi / Jam', 'Waktu', 'Mata Pelajaran', 'Guru Pengampu / Pengawas'];
  const rows: any[][] = [
    [schoolInfo.name],
    [`JADWAL SUMATIF AKHIR SEMESTER (SAS) GANJIL KELAS ${className}`],
    [`Tahun Pelajaran ${schoolInfo.academicYear} | ${schoolInfo.city}`],
    [],
    headers,
  ];

  let no = 1;
  slots.forEach((slot) => {
    const entry = slot.entries[className];
    if (entry && entry.subject) {
      rows.push([
        no++,
        slot.week,
        slot.dayAndDate,
        slot.session,
        slot.time,
        entry.subject,
        entry.teacher,
      ]);
    }
  });

  rows.push([]);
  rows.push(['', '', '', '', 'Pasuruan, 23 November 2026']);
  rows.push(['', '', 'Wali Kelas / Panitia SAS,', '', 'Kepala Sekolah,']);
  rows.push([]);
  rows.push([]);
  rows.push(['', '', '( ____________________ )', '', schoolInfo.headmasterName]);
  rows.push(['', '', '', '', `NIP. ${schoolInfo.headmasterNip}`]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 10 },
    { wch: 24 },
    { wch: 18 },
    { wch: 18 },
    { wch: 32 },
    { wch: 32 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, `Kelas ${className}`);
  XLSX.writeFile(wb, `Jadwal_SAS_Kelas_${className}_SMAN2_Pasuruan.xlsx`);
}

export function exportTeacherToExcel(slots: ScheduleSlot[], teacherName: string, schoolInfo: SchoolInfo) {
  const wb = XLSX.utils.book_new();

  const headers = ['No', 'Minggu', 'Hari & Tanggal', 'Sesi', 'Waktu', 'Kelas', 'Mata Pelajaran'];
  const rows: any[][] = [
    [schoolInfo.name],
    [`JADWAL MENGAWAS / UJIAN SAS GURU: ${teacherName}`],
    [`Tahun Pelajaran ${schoolInfo.academicYear}`],
    [],
    headers,
  ];

  let no = 1;
  slots.forEach((slot) => {
    ALL_CLASSES.forEach((cls) => {
      const entry = slot.entries[cls];
      if (entry && entry.teacher.toLowerCase().includes(teacherName.toLowerCase())) {
        rows.push([
          no++,
          slot.week,
          slot.dayAndDate,
          slot.session,
          slot.time,
          cls,
          entry.subject,
        ]);
      }
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 10 },
    { wch: 24 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
    { wch: 32 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Jadwal Guru');
  const safeName = teacherName.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Jadwal_Guru_${safeName}.xlsx`);
}

export type PaperSize = 'a4' | 'f4' | 'a3';
export type PaperOrientation = 'portrait' | 'landscape';

export async function downloadElementAsPDF(
  elementId: string,
  filename: string,
  paperSize: PaperSize = 'a4',
  orientation: PaperOrientation = 'portrait'
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) return false;

  try {
    let format: string | [number, number] = 'a4';

    if (paperSize === 'f4') {
      // Standard F4 / Folio (Indonesia): 215mm x 330mm
      format = orientation === 'portrait' ? [215, 330] : [330, 215];
    } else if (paperSize === 'a3') {
      format = 'a3';
    } else {
      format = 'a4';
    }

    const imgData = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      filter: (node: HTMLElement) => {
        if (node.classList && (node.classList.contains('no-export') || node.classList.contains('no-print'))) {
          return false;
        }
        return true;
      },
    });

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const imgRatio = imgProps.width / imgProps.height;

    let renderWidth = pdfWidth - 12; // 6mm margin
    let renderHeight = renderWidth / imgRatio;

    if (renderHeight > pdfHeight - 12) {
      renderHeight = pdfHeight - 12;
      renderWidth = renderHeight * imgRatio;
    }

    const marginX = (pdfWidth - renderWidth) / 2;
    const marginY = 6;

    pdf.addImage(imgData, 'PNG', marginX, marginY, renderWidth, renderHeight, undefined, 'FAST');
    pdf.save(`${filename}_${paperSize.toUpperCase()}.pdf`);
    return true;
  } catch (err) {
    console.error('Failed generating PDF:', err);
    return false;
  }
}

export function triggerPrintWithPaperSize(
  elementId: string,
  paperSize: PaperSize,
  orientation: PaperOrientation = 'portrait'
) {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  // Remove previous print classes
  element.classList.remove(
    'a4-print-target',
    'a4-landscape-print-target',
    'f4-print-target',
    'f4-landscape-print-target',
    'a3-print-target'
  );

  if (paperSize === 'f4') {
    element.classList.add(orientation === 'portrait' ? 'f4-print-target' : 'f4-landscape-print-target');
  } else if (paperSize === 'a3') {
    element.classList.add('a3-print-target');
  } else {
    element.classList.add(orientation === 'portrait' ? 'a4-print-target' : 'a4-landscape-print-target');
  }

  setTimeout(() => {
    window.print();
  }, 100);
}

export async function downloadElementAsImage(
  elementId: string,
  filename: string,
  format: 'jpeg' | 'png' = 'jpeg'
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) return false;

  try {
    const fn = format === 'jpeg' ? toJpeg : toPng;
    const dataUrl = await fn(element, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      filter: (node: HTMLElement) => {
        // Exclude elements marked as no-print or action buttons
        if (node.classList && (node.classList.contains('no-export') || node.classList.contains('no-print'))) {
          return false;
        }
        return true;
      },
    });

    const link = document.createElement('a');
    link.download = `${filename}.${format === 'jpeg' ? 'jpg' : 'png'}`;
    link.href = dataUrl;
    link.click();
    return true;
  } catch (err) {
    console.error('Failed to export image:', err);
    return false;
  }
}
