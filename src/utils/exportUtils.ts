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

  let container: HTMLDivElement | null = null;
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

    const isLandscape = orientation === 'landscape';
    // Target standardized staging widths:
    // Portrait A4 / F4: 800px width (crisp print resolution without clipping)
    // Landscape A4 / F4: 1120px
    // Landscape A3: 1600px
    const targetWidth = paperSize === 'a3' ? 1600 : isLandscape ? 1120 : 800;

    // Clone element to prevent screen size / responsive layout interference
    const clone = element.cloneNode(true) as HTMLElement;
    clone.id = `${elementId}-print-staging`;
    clone.style.width = `${targetWidth}px`;
    clone.style.minWidth = `${targetWidth}px`;
    clone.style.maxWidth = `${targetWidth}px`;
    clone.style.margin = '0';
    clone.style.boxShadow = 'none';
    clone.style.borderRadius = '0';
    clone.style.border = 'none';
    clone.style.padding = paperSize === 'f4' ? '28px 32px' : '20px 24px';
    clone.style.backgroundColor = '#ffffff';

    // Remove any horizontal overflow restriction or scrollbars in clone
    const overflowNodes = clone.querySelectorAll('.overflow-x-auto, .overflow-hidden, .overflow-y-auto');
    overflowNodes.forEach((node) => {
      (node as HTMLElement).style.overflow = 'visible';
      (node as HTMLElement).style.maxWidth = '100%';
    });

    // Ensure all tables in clone are fixed layout and 100% width
    const tables = clone.querySelectorAll('table');
    tables.forEach((t) => {
      t.style.width = '100%';
      t.style.tableLayout = 'fixed';
    });

    // Mount off-screen
    container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-99999px';
    container.style.top = '0';
    container.style.width = `${targetWidth}px`;
    container.style.zIndex = '-99999';
    container.style.backgroundColor = '#ffffff';
    container.appendChild(clone);
    document.body.appendChild(container);

    // Wait a brief tick for DOM and images to settle
    await new Promise((r) => setTimeout(r, 60));

    const imgData = await toPng(clone, {
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

    // Side margins in mm
    const marginX = paperSize === 'f4' ? 10 : 8;
    const marginY = paperSize === 'f4' ? 10 : 8;
    const maxPrintWidth = pdfWidth - marginX * 2;
    const maxPrintHeight = pdfHeight - marginY * 2;

    let renderWidth = maxPrintWidth;
    let renderHeight = renderWidth / imgRatio;
    const posX = (pdfWidth - renderWidth) / 2;

    // Check if content fits in 1 page (up to 20% overflow can be scaled down seamlessly)
    if (renderHeight <= maxPrintHeight * 1.25) {
      if (renderHeight > maxPrintHeight) {
        renderHeight = maxPrintHeight;
        renderWidth = renderHeight * imgRatio;
      }
      const adjustedPosX = (pdfWidth - renderWidth) / 2;
      let posY = marginY;
      if (renderHeight < maxPrintHeight * 0.9) {
        posY = Math.max(marginY, (pdfHeight - renderHeight) / 3);
      }
      pdf.addImage(imgData, 'PNG', adjustedPosX, posY, renderWidth, renderHeight, undefined, 'FAST');
    } else {
      // True multi-page document: slice across multiple pages cleanly
      let remainingHeight = renderHeight;
      let positionY = marginY;

      pdf.addImage(imgData, 'PNG', posX, positionY, renderWidth, renderHeight, undefined, 'FAST');
      remainingHeight -= maxPrintHeight;

      while (remainingHeight > 0) {
        pdf.addPage(format, orientation);
        positionY -= maxPrintHeight;
        pdf.addImage(imgData, 'PNG', posX, positionY, renderWidth, renderHeight, undefined, 'FAST');
        remainingHeight -= maxPrintHeight;
      }
    }

    pdf.save(`${filename}_${paperSize.toUpperCase()}.pdf`);
    return true;
  } catch (err) {
    console.error('Failed generating PDF:', err);
    return false;
  } finally {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

export interface MultiPageProgress {
  current: number;
  total: number;
  percent: number;
}

/**
 * Downloads multiple card sheets as a clean, unified, multi-page PDF document.
 * Each sheet is exactly 1 page (A4 / F4) with crystal-clear 2x resolution.
 */
export async function downloadTokenCardsAsMultiPagePDF(
  sheetElements: HTMLElement[],
  filename: string,
  paperSize: PaperSize = 'f4',
  onProgress?: (progress: MultiPageProgress) => void
): Promise<boolean> {
  if (!sheetElements || sheetElements.length === 0) return false;

  try {
    const format: string | [number, number] = paperSize === 'f4' ? [215, 330] : 'a4';
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Standard margins (8mm for A4, 10mm for F4)
    const marginX = paperSize === 'f4' ? 9 : 8;
    const marginY = paperSize === 'f4' ? 10 : 8;
    const maxPrintWidth = pdfWidth - marginX * 2;
    const maxPrintHeight = pdfHeight - marginY * 2;

    const total = sheetElements.length;

    for (let i = 0; i < total; i++) {
      const sheet = sheetElements[i];
      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          percent: Math.round(((i + 1) / total) * 100),
        });
      }

      if (i > 0) {
        pdf.addPage(format, 'portrait');
      }

      // Render sheet image at high resolution
      const imgData = await toPng(sheet, {
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

      const imgProps = pdf.getImageProperties(imgData);
      const imgRatio = imgProps.width / imgProps.height;

      let renderWidth = maxPrintWidth;
      let renderHeight = renderWidth / imgRatio;

      if (renderHeight > maxPrintHeight) {
        renderHeight = maxPrintHeight;
        renderWidth = renderHeight * imgRatio;
      }

      const posX = (pdfWidth - renderWidth) / 2;
      const posY = Math.max(marginY, (pdfHeight - renderHeight) / 2);

      pdf.addImage(imgData, 'PNG', posX, posY, renderWidth, renderHeight, undefined, 'FAST');
    }

    pdf.save(`${filename}_${paperSize.toUpperCase()}.pdf`);
    return true;
  } catch (err) {
    console.error('Failed generating multi-page card PDF:', err);
    return false;
  }
}

/**
 * Generates a single, combined PDF file for all class schedule cards in one go
 * by iterating through the class list and using the print-styling to append them as pages.
 */
export async function downloadAllClassSchedulesCombinedPDF(
  sheetElements: { className: string; element: HTMLElement }[],
  filename: string,
  paperSize: PaperSize = 'f4',
  onProgress?: (progress: MultiPageProgress & { className?: string }) => void
): Promise<boolean> {
  if (!sheetElements || sheetElements.length === 0) return false;

  try {
    const format: string | [number, number] = paperSize === 'f4' ? [215, 330] : 'a4';
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Standard margins (8mm for A4, 10mm for F4)
    const marginX = paperSize === 'f4' ? 10 : 8;
    const marginY = paperSize === 'f4' ? 10 : 8;
    const maxPrintWidth = pdfWidth - marginX * 2;
    const maxPrintHeight = pdfHeight - marginY * 2;

    const total = sheetElements.length;

    for (let i = 0; i < total; i++) {
      const { className, element } = sheetElements[i];
      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          percent: Math.round(((i + 1) / total) * 100),
          className,
        });
      }

      if (i > 0) {
        pdf.addPage(format, 'portrait');
      }

      // Render element image at high quality
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

      const imgProps = pdf.getImageProperties(imgData);
      const imgRatio = imgProps.width / imgProps.height;

      let renderWidth = maxPrintWidth;
      let renderHeight = renderWidth / imgRatio;

      if (renderHeight > maxPrintHeight) {
        renderHeight = maxPrintHeight;
        renderWidth = renderHeight * imgRatio;
      }

      const posX = (pdfWidth - renderWidth) / 2;
      const posY = Math.max(marginY, (pdfHeight - renderHeight) / 2);

      pdf.addImage(imgData, 'PNG', posX, posY, renderWidth, renderHeight, undefined, 'FAST');
    }

    pdf.save(`${filename}_${paperSize.toUpperCase()}.pdf`);
    return true;
  } catch (err) {
    console.error('Failed generating combined class schedules PDF:', err);
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

  let container: HTMLDivElement | null = null;
  try {
    const isA3 = elementId.includes('a3');
    const targetWidth = isA3 ? 1600 : 800;

    // Clone element
    const clone = element.cloneNode(true) as HTMLElement;
    clone.id = `${elementId}-img-staging`;
    clone.style.width = `${targetWidth}px`;
    clone.style.minWidth = `${targetWidth}px`;
    clone.style.maxWidth = `${targetWidth}px`;
    clone.style.margin = '0';
    clone.style.boxShadow = 'none';
    clone.style.borderRadius = '0';
    clone.style.border = 'none';
    clone.style.padding = '24px';
    clone.style.backgroundColor = '#ffffff';

    const overflowNodes = clone.querySelectorAll('.overflow-x-auto, .overflow-hidden, .overflow-y-auto');
    overflowNodes.forEach((node) => {
      (node as HTMLElement).style.overflow = 'visible';
      (node as HTMLElement).style.maxWidth = '100%';
    });

    const tables = clone.querySelectorAll('table');
    tables.forEach((t) => {
      t.style.width = '100%';
      t.style.tableLayout = 'fixed';
    });

    container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-99999px';
    container.style.top = '0';
    container.style.width = `${targetWidth}px`;
    container.style.zIndex = '-99999';
    container.style.backgroundColor = '#ffffff';
    container.appendChild(clone);
    document.body.appendChild(container);

    await new Promise((r) => setTimeout(r, 60));

    const fn = format === 'jpeg' ? toJpeg : toPng;
    const dataUrl = await fn(clone, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      filter: (node: HTMLElement) => {
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
  } finally {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}
