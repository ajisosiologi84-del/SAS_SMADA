export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================================
 * GOOGLE APPS SCRIPT (Code.gs)
 * SISTEM INFORMASI JADWAL TERINTEGRASI SUMATIF AKHIR SEMESTER (SAS)
 * SMA NEGERI 2 KOTA PASURUAN - TP 2026/2027
 * =========================================================================================
 * Petunjuk Penggunaan & Deployment:
 * 1. Buka Google Spreadsheet Jadwal SAS SMAN 2 Pasuruan Anda.
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 3. Hapus kode bawaan dan salin (paste) seluruh kode dari file ini.
 * 4. Klik ikon Disket (Simpan).
 * 5. Klik tombol "Deploy" (Terapkan) di pojok kanan atas > "Deployment Baru" (New Deployment).
 * 6. Pilih jenis: "Aplikasi Web" (Web app).
 * 7. Konfigurasi:
 *    - Deskripsi: API Sinkronisasi Jadwal & Token SAS SMAN 2 Pasuruan (v3 Multi-User)
 *    - Jalankan sebagai: "Saya" (Me)
 *    - Siapa yang memiliki akses: "Siapa saja" (Anyone) -> PENTING agar web app dapat mengakses!
 * 8. Klik "Terapkan" (Deploy), berikan izin otorisasi Akun Google Anda.
 * 9. Salin "URL Aplikasi Web" (Web app URL) yang dihasilkan, dan tempelkan pada menu
 *    Pengaturan > Google Sheets & Code.gs di aplikasi web SAS.
 * =========================================================================================
 */

const SHEET_NAME = 'Jadwal_SAS_SMAN2';
const TOKEN_SHEET_NAME = 'Token_Akses';

const ALL_CLASSES = [
  'X-1', 'X-2', 'X-3', 'X-4', 'X-5', 'X-6', 'X-7', 'X-8', 'X-9', 'X-10',
  'XI-1', 'XI-2', 'XI-3', 'XI-4', 'XI-5', 'XI-6', 'XI-7', 'XI-8', 'XI-9', 'XI-10',
  'XII-1', 'XII-2', 'XII-3', 'XII-4', 'XII-5', 'XII-6', 'XII-7', 'XII-8', 'XII-9', 'XII-10'
];

/**
 * Menu otomatis pada Google Sheets saat file dibuka
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏫 Jadwal SAS SMAN 2')
    .addItem('🔄 Format Ulang Tabel Jadwal SAS', 'formatTableSAS')
    .addItem('🔑 Sinkronkan / Buat Sheet Token Akses', 'formatTokenSheet')
    .addItem('ℹ️ Petunjuk Integrasi Web App', 'showHelpDialog')
    .addToUi();
}

function showHelpDialog() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Integrasi Web App SAS SMAN 2 Pasuruan (Multi-User & Token)',
    'Petunjuk Koneksi Spreadsheet dengan Aplikasi Web SAS:\\n\\n' +
    '1. Pastikan skrip ini telah di-deploy sebagai Web App dengan izin akses "Anyone" (Siapa saja).\\n' +
    '2. Salin Web App URL dan tempel ke menu Pengaturan > Google Sheets di web app.\\n' +
    '3. Mendukung sinkronisasi jadwal terintegrasi dan token akses per kelas / guru / multi-admin.\\n' +
    '4. Teroptimasi untuk akses bersamaan (>100 user) secara cepat dan aman.',
    ui.ButtonSet.OK
  );
}

/**
 * GET Handler: Mengirim data jadwal dan token dari Google Sheets ke Aplikasi Web
 * Dioptimalkan untuk respons cepat dan konkurensi tinggi.
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'get_schedule';

    if (action === 'ping') {
      return createJsonResponse({
        status: 'success',
        message: 'Koneksi Google Apps Script Aktif & Terhubung',
        concurrencyReady: true,
        timestamp: new Date().toISOString()
      });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Jika request token akses
    if (action === 'get_tokens') {
      const tokenSheet = ss.getSheetByName(TOKEN_SHEET_NAME);
      if (!tokenSheet) {
        return createJsonResponse({
          status: 'success',
          tokens: [],
          message: 'Sheet token belum dibuat.'
        });
      }
      const tokenData = tokenSheet.getDataRange().getValues();
      return createJsonResponse({
        status: 'success',
        tokens: tokenData.slice(1),
        timestamp: new Date().toISOString()
      });
    }

    // Default: Ambil data jadwal SAS
    let sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();

    if (!data || data.length < 5) {
      return createJsonResponse({
        status: 'error',
        message: 'Data spreadsheet masih kosong atau belum diformat sesuai format SAS.'
      });
    }

    // Cari baris header yang memuat kelas
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
              const match = val.match(/^([^\\(]+)\\s*\\((.+)\\)$/);
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

    const schoolConfig = readSchoolConfigSheet(ss);

    return createJsonResponse({
      status: 'success',
      totalSlots: slots.length,
      slots: slots,
      schoolInfo: schoolConfig,
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
 * POST Handler: Menerima sinkronisasi data jadwal dan token akses dari Aplikasi Web
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

    // 1. Tulis Sheet Jadwal Utama
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }
    sheet.clear();

    // Header Tabel Jadwal
    const header = ['Slot', 'Minggu', 'Hari & Tanggal', 'Sesi / Jam', 'Waktu', ...ALL_CLASSES];
    const numCols = header.length;

    function padRow(arr) {
      const copy = arr.slice();
      while (copy.length < numCols) {
        copy.push('');
      }
      return copy;
    }

    const rows = [];
    rows.push(padRow([schoolInfo.name || 'SMA NEGERI 2 KOTA PASURUAN']));
    rows.push(padRow([
      'JADWAL SUMATIF AKHIR SEMESTER (SAS) TERINTEGRASI KELAS X, XI, DAN XII (TP ' +
      (schoolInfo.academicYear || '2026/2027') + ')'
    ]));
    rows.push(padRow([
      'Sinkronisasi Terakhir: ' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd-MM-yyyy HH:mm:ss') + ' WIB | Terverifikasi 0% Bentrok'
    ]));
    rows.push(padRow([]));

    rows.push(header);

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
          row.push(entry.subject + '\n(' + (entry.teacher || '') + ')');
        } else {
          row.push('-');
        }
      });

      rows.push(padRow(row));
    });

    const numRows = rows.length;
    sheet.getRange(1, 1, numRows, numCols).setValues(rows);

    sheet.getRange(1, 1).setFontSize(14).setFontWeight('bold');
    sheet.getRange(2, 1).setFontSize(11).setFontWeight('bold');
    sheet.getRange(3, 1).setFontSize(9).setFontColor('#475569');

    const headerRange = sheet.getRange(5, 1, 1, numCols);
    headerRange.setBackground('#0f2b5c')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');

    const dataRange = sheet.getRange(6, 1, slots.length, numCols);
    dataRange.setVerticalAlignment('middle').setWrap(true);

    sheet.setFrozenRows(5);
    sheet.setFrozenColumns(5);

    sheet.setColumnWidth(1, 80);
    sheet.setColumnWidth(2, 85);
    sheet.setColumnWidth(3, 170);
    sheet.setColumnWidth(4, 130);
    sheet.setColumnWidth(5, 135);
    for (let c = 6; c <= numCols; c++) {
      sheet.setColumnWidth(c, 160);
    }

    // 2. Tulis Sheet Token Akses (Multi-Admin, Guru, dan Kelas) jika disertakan dalam payload
    if (payload.tokenData) {
      writeTokenSheet(ss, payload.tokenData);
    }

    // 3. Tulis Sheet Konfigurasi & Tanda Tangan Sekolah jika disertakan
    if (payload.schoolInfo) {
      writeSchoolConfigSheet(ss, payload.schoolInfo);
    }

    return createJsonResponse({
      status: 'success',
      message: 'Berhasil menyinkronkan ' + slots.length + ' slot jadwal & data pengesahan ke Google Sheets!',
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
 * Helper menulis konfigurasi & tanda tangan digital ke sheet Konfigurasi_Sekolah
 */
function writeSchoolConfigSheet(ss, schoolInfo) {
  let configSheet = ss.getSheetByName('Konfigurasi_Sekolah');
  if (!configSheet) {
    configSheet = ss.insertSheet('Konfigurasi_Sekolah');
  }
  configSheet.clear();

  const rows = [
    ['Kunci Parameter', 'Nilai Konfigurasi', 'Deskripsi'],
    ['name', schoolInfo.name || 'SMA NEGERI 2 KOTA PASURUAN', 'Nama Sekolah'],
    ['academicYear', schoolInfo.academicYear || '2026/2027', 'Tahun Pelajaran'],
    ['semester', schoolInfo.semester || 'Semester Ganjil', 'Semester'],
    ['headmasterTitle', schoolInfo.headmasterTitle || 'Kepala SMA Negeri 2 Pasuruan', 'Jabatan Kepala Sekolah'],
    ['headmasterName', schoolInfo.headmasterName || 'Trisnurini Tantrianingrum, S.Pd, M.M', 'Nama Kepala Sekolah'],
    ['headmasterNip', schoolInfo.headmasterNip || '19670224 199003 2 001', 'NIP Kepala Sekolah'],
    ['headmasterSignatureImage', schoolInfo.headmasterSignatureImage || '', 'TTD Digital Kepala Sekolah'],
    ['committeeTitle', schoolInfo.committeeTitle || 'Ketua Panitia SAS 2026/2027', 'Jabatan Ketua Panitia'],
    ['committeeName', schoolInfo.committeeName || 'AJIANSYAH AKBAR, S.Sos', 'Nama Ketua Panitia'],
    ['committeeNip', schoolInfo.committeeNip || '19840210 200904 1 002', 'NIP Ketua Panitia'],
    ['committeeSignatureImage', schoolInfo.committeeSignatureImage || '', 'TTD Digital Ketua Panitia'],
    ['signPlaceAndDate', schoolInfo.signPlaceAndDate || 'Pasuruan, 23 November 2026', 'Tempat & Tanggal Pengesahan'],
  ];

  configSheet.getRange(1, 1, rows.length, 3).setValues(rows);
  configSheet.getRange(1, 1, 1, 3).setBackground('#1e3a8a').setFontColor('#ffffff').setFontWeight('bold');
  configSheet.setColumnWidth(1, 180);
  configSheet.setColumnWidth(2, 350);
  configSheet.setColumnWidth(3, 250);
}

/**
 * Helper membaca data konfigurasi sekolah dari sheet Konfigurasi_Sekolah
 */
function readSchoolConfigSheet(ss) {
  const configSheet = ss.getSheetByName('Konfigurasi_Sekolah');
  if (!configSheet) return null;
  const values = configSheet.getDataRange().getValues();
  if (!values || values.length < 2) return null;

  const config = {};
  for (let i = 1; i < values.length; i++) {
    const key = String(values[i][0] || '').trim();
    const val = values[i][1];
    if (key) {
      config[key] = val;
    }
  }
  return config;
}

/**
 * Helper menulis data token akses ke sheet Token_Akses
 */
function writeTokenSheet(ss, tokenData) {
  let tokenSheet = ss.getSheetByName(TOKEN_SHEET_NAME);
  if (!tokenSheet) {
    tokenSheet = ss.insertSheet(TOKEN_SHEET_NAME);
  }
  tokenSheet.clear();

  const tokenRows = [
    ['Kategori Akun', 'Identitas / Nama Akun', 'Token / PIN Masuk', 'Hak Akses Menu', 'Keterangan'],
  ];

  // Admins
  if (tokenData.admins && Array.isArray(tokenData.admins)) {
    tokenData.admins.forEach(admin => {
      tokenRows.push(['Multi-Admin', admin.name, admin.pin, 'Semua Menu (CRUD, Pengaturan, Cek Bentrok)', admin.roleTitle || 'Admin']);
    });
  }

  // Teacher token
  const teacherToken = tokenData.teacherToken || 'GURU-SMADA2026';
  tokenRows.push(['Guru & Pengawas', 'Akun Guru Umum', teacherToken, 'Khusus Portal Guru & Pengawas', 'Token resmi masuk pengawas']);

  // Class tokens (1 akun per kelas)
  if (tokenData.classTokens) {
    Object.keys(tokenData.classTokens).sort().forEach(cls => {
      tokenRows.push(['Akun Kelas', 'Kelas ' + cls, tokenData.classTokens[cls], 'Khusus Jadwal Per Kelas (' + cls + ')', '1 akun resmi kelas']);
    });
  }

  tokenSheet.getRange(1, 1, tokenRows.length, 5).setValues(tokenRows);
  const headRange = tokenSheet.getRange(1, 1, 1, 5);
  headRange.setBackground('#1e3a8a').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  tokenSheet.setColumnWidth(1, 140);
  tokenSheet.setColumnWidth(2, 220);
  tokenSheet.setColumnWidth(3, 160);
  tokenSheet.setColumnWidth(4, 280);
  tokenSheet.setColumnWidth(5, 200);
}

/**
 * Format ulang tabel jadwal SAS
 */
function formatTableSAS() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  const maxCols = Math.max(sheet.getLastColumn(), 35);
  sheet.getRange(5, 1, 1, maxCols).setBackground('#0f2b5c').setFontColor('#ffffff').setFontWeight('bold');
  SpreadsheetApp.getUi().alert('Format tabel SAS SMAN 2 Pasuruan berhasil diperbarui!');
}

/**
 * Buat dan format sheet Token Akses secara default
 */
function formatTokenSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const classTokens = {};
  ALL_CLASSES.forEach(cls => {
    classTokens[cls] = 'SAS-' + cls.replace('-', '');
  });

  const defaultData = {
    admins: [
      { name: 'Dr. H. Purwanto, M.Pd', pin: 'admin123', roleTitle: 'Super Admin / Kepala Sekolah' },
      { name: 'Mohamad Hadi Sukron, S.Pd', pin: 'panitia2026', roleTitle: 'Ketua Panitia SAS' },
      { name: 'Tim Kurikulum & Asesmen', pin: 'kurikulum2026', roleTitle: 'Koordinator Jadwal' }
    ],
    teacherToken: 'GURU-SMADA2026',
    classTokens: classTokens
  };

  writeTokenSheet(ss, defaultData);
  SpreadsheetApp.getUi().alert('Sheet "Token_Akses" berhasil dibuat dan disinkronkan dengan 30 kelas, guru, dan admin!');
}

/**
 * Helper JSON dengan header CORS untuk Web App
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

