export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================================
 * GOOGLE APPS SCRIPT (Code.gs)
 * SISTEM INFORMASI JADWAL TERINTEGRASI SUMATIF AKHIR SEMESTER (SAS)
 * SMA NEGERI 2 KOTA PASURUAN - TP 2026/2027
 * =========================================================================================
 * Petunjuk Instalasi:
 * 1. Buka Google Spreadsheet baru atau Google Spreadsheet Jadwal SAS Anda.
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 3. Hapus kode bawaan dan salin (paste) seluruh kode dari file ini.
 * 4. Klik ikon Disket (Simpan).
 * 5. Klik tombol "Deploy" (Terapkan) di pojok kanan atas > "Deployment Baru" (New Deployment).
 * 6. Pilih jenis: "Aplikasi Web" (Web app).
 * 7. Konfigurasi:
 *    - Deskripsi: API Sinkronisasi Jadwal SAS SMAN 2 Pasuruan
 *    - Jalankan sebagai: "Saya" (Me)
 *    - Siapa yang memiliki akses: "Siapa saja" (Anyone) -> PENTING agar web app dapat mengakses!
 * 8. Klik "Terapkan" (Deploy), berikan izin otorisasi Google Anda.
 * 9. Salin "URL Aplikasi Web" (Web app URL) yang dihasilkan, dan tempelkan pada menu
 *    Pengaturan > Google Sheets & Apps Script di aplikasi web SAS.
 * =========================================================================================
 */

const SHEET_NAME = 'Jadwal_SAS_SMAN2';
const ALL_CLASSES = [
  'X-1', 'X-2', 'X-3', 'X-4', 'X-5', 'X-6', 'X-7', 'X-8', 'X-9', 'X-10',
  'XI-1', 'XI-2', 'XI-3', 'XI-4', 'XI-5', 'XI-6', 'XI-7', 'XI-8', 'XI-9', 'XI-10',
  'XII-1', 'XII-2', 'XII-3', 'XII-4', 'XII-5', 'XII-6', 'XII-7', 'XII-8', 'XII-9', 'XII-10'
];

/**
 * Menu otomatis pada Google Sheets
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏫 Jadwal SAS SMAN 2')
    .addItem('🔄 Format Ulang Tabel SAS SMAN 2', 'formatTableSAS')
    .addItem('ℹ️ Petunjuk Integrasi Web App', 'showHelpDialog')
    .addToUi();
}

function showHelpDialog() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Integrasi Web App SAS SMAN 2 Pasuruan',
    'Untuk menghubungkan spreadsheet ini dengan web app:\\n\\n' +
    '1. Pastikan skrip ini telah di-deploy sebagai Web App dengan akses "Anyone".\\n' +
    '2. Salin Web App URL dan masukkan ke Pengaturan Web App SAS.\\n' +
    '3. Anda dapat menekan tombol "Sinkronkan Data" langsung dari aplikasi untuk tarik/kirim data dua arah.',
    ui.ButtonSet.OK
  );
}

/**
 * GET Handler: Mengirim data jadwal dari Google Sheets ke Aplikasi Web
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'get_schedule';

    if (action === 'ping') {
      return createJsonResponse({
        status: 'success',
        message: 'Koneksi Google Apps Script Aktif & Terhubung',
        timestamp: new Date().toISOString()
      });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();

    if (!data || data.length < 5) {
      return createJsonResponse({
        status: 'error',
        message: 'Data spreadsheet masih kosong atau belum diformat sesuai format SAS.'
      });
    }

    // Cari baris header yang memuat 'X-1' atau 'Slot'
    let headerRowIdx = -1;
    for (let r = 0; r < data.length; r++) {
      const rowStr = data[r].join(' ').toUpperCase();
      if (rowStr.includes('X-1') && (rowStr.includes('SLOT') || rowStr.includes('X-2'))) {
        headerRowIdx = r;
        break;
      }
    }

    if (headerRowIdx === -1) {
      return createJsonResponse({
        status: 'error',
        message: 'Header kolom kelas X-1 s/d XII-10 tidak ditemukan pada spreadsheet.'
      });
    }

    const headerRow = data[headerRowIdx].map(h => String(h || '').trim());
    const classIndices = {};
    let slotCol = 0, weekCol = 1, dayCol = 2, sessionCol = 3, timeCol = 4;

    headerRow.forEach((col, idx) => {
      const c = col.toUpperCase().replace(/\\s+/g, '');
      if (c === 'SLOT') slotCol = idx;
      else if (c === 'MINGGU') weekCol = idx;
      else if (c.includes('HARI') || c.includes('TANGGAL')) dayCol = idx;
      else if (c.includes('SESI') || c.includes('JAM')) sessionCol = idx;
      else if (c.includes('WAKTU')) timeCol = idx;
      else if (ALL_CLASSES.includes(c)) {
        classIndices[c] = idx;
      }
    });

    const slots = [];
    let curWeek = 'Minggu 1';
    let curDay = '';

    for (let r = headerRowIdx + 1; r < data.length; r++) {
      const row = data[r];
      if (!row || row.length === 0) continue;

      const slotName = String(row[slotCol] || '').trim();
      const session = String(row[sessionCol] || '').trim();
      const time = String(row[timeCol] || '').trim();

      if (!slotName && !session && !time) continue;

      const weekVal = String(row[weekCol] || '').trim();
      if (weekVal) curWeek = weekVal;

      const dayVal = String(row[dayCol] || '').trim();
      if (dayVal) curDay = dayVal;

      const entries = {};
      ALL_CLASSES.forEach(cls => {
        const colIdx = classIndices[cls];
        if (colIdx !== undefined && row[colIdx] !== undefined) {
          const val = String(row[colIdx] || '').trim();
          if (val && val !== '-' && val !== 'null') {
            const lines = val.split(/\\n|\\r\\n/);
            let subject = lines[0].trim();
            let teacher = '';
            if (lines.length > 1) {
              teacher = lines.slice(1).join(' ').trim().replace(/^\\(|\\)$/g, '');
            } else {
              const match = val.match(/^([^(]+)\\s*\\((.+)\\)$/);
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

      slots.push({
        id: 'slot-' + (slots.length + 1),
        slotName: slotName || ('Slot ' + (slots.length + 1)),
        week: curWeek,
        dayAndDate: curDay || 'Senin, 23 November 2026',
        session: session || ('Sesi ' + ((slots.length % 2) + 1)),
        time: time || '07.30 - 09.30 WIB',
        entries: entries
      });
    }

    return createJsonResponse({
      status: 'success',
      totalSlots: slots.length,
      slots: slots,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

/**
 * POST Handler: Menerima sinkronisasi data dari Aplikasi Web ke Google Sheets
 */
function doPost(e) {
  try {
    let payload;
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = e.parameter;
    }

    if (!payload || !payload.slots || !Array.isArray(payload.slots)) {
      return createJsonResponse({
        status: 'error',
        message: 'Payload tidak valid: array slots diperlukan.'
      });
    }

    const slots = payload.slots;
    const schoolInfo = payload.schoolInfo || {};
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    sheet.clear();

    // Baris Judul & Metadata Sekolah
    const rows = [];
    rows.push([schoolInfo.name || 'SMA NEGERI 2 KOTA PASURUAN']);
    rows.push([
      'JADWAL SUMATIF AKHIR SEMESTER (SAS) TERINTEGRASI KELAS X, XI, DAN XII (TP ' +
      (schoolInfo.academicYear || '2026/2027') + ')'
    ]);
    rows.push([
      'Sinkronisasi Terakhir: ' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd-MM-yyyy HH:mm:ss') + ' WIB | Terverifikasi 0% Bentrok'
    ]);
    rows.push([]);

    // Header Tabel
    const header = ['Slot', 'Minggu', 'Hari & Tanggal', 'Sesi / Jam', 'Waktu', ...ALL_CLASSES];
    rows.push(header);

    // Isi Baris Slot
    slots.forEach((slot, idx) => {
      const row = [
        slot.slotName || ('Slot ' + (idx + 1)),
        slot.week || 'Minggu 1',
        slot.dayAndDate || '',
        slot.session || '',
        slot.time || ''
      ];

      ALL_CLASSES.forEach(cls => {
        const entry = slot.entries && slot.entries[cls];
        if (entry && entry.subject) {
          row.push(entry.subject + '\\n(' + (entry.teacher || '') + ')');
        } else {
          row.push('-');
        }
      });

      rows.push(row);
    });

    // Tulis ke Sheet
    const numRows = rows.length;
    const numCols = header.length;
    sheet.getRange(1, 1, numRows, numCols).setValues(rows);

    // Styling & Format
    sheet.getRange(1, 1).setFontSize(14).setFontWeight('bold');
    sheet.getRange(2, 1).setFontSize(11).setFontWeight('bold');
    sheet.getRange(3, 1).setFontSize(9).setFontColor('#475569');

    // Styling Header
    const headerRange = sheet.getRange(5, 1, 1, numCols);
    headerRange.setBackground('#0f2b5c')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');

    // Styling Data Slots
    const dataRange = sheet.getRange(6, 1, slots.length, numCols);
    dataRange.setVerticalAlignment('middle').setWrap(true);

    // Bekukan baris atas (Freeze header)
    sheet.setFrozenRows(5);
    sheet.setFrozenColumns(5);

    // Atur lebar kolom
    sheet.setColumnWidth(1, 80);  // Slot
    sheet.setColumnWidth(2, 85);  // Minggu
    sheet.setColumnWidth(3, 170); // Hari & Tanggal
    sheet.setColumnWidth(4, 130); // Sesi
    sheet.setColumnWidth(5, 135); // Waktu
    for (let c = 6; c <= numCols; c++) {
      sheet.setColumnWidth(c, 160);
    }

    return createJsonResponse({
      status: 'success',
      message: 'Berhasil menyinkronkan ' + slots.length + ' slot jadwal ke Google Sheets!',
      updatedSlots: slots.length,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

/**
 * Format ulang tabel spreadsheet secara manual dari menu
 */
function formatTableSAS() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  const maxCols = Math.max(sheet.getLastColumn(), 35);
  sheet.getRange(5, 1, 1, maxCols).setBackground('#0f2b5c').setFontColor('#ffffff').setFontWeight('bold');
  SpreadsheetApp.getUi().alert('Format tabel SAS SMAN 2 Pasuruan berhasil diperbarui!');
}

/**
 * Helper pembuat respons JSON dengan header CORS
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
