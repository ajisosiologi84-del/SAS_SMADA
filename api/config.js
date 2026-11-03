// Vercel Serverless Function for /api/config
import fs from 'fs';
import path from 'path';

let inMemoryConfig = {
  webAppUrl: '',
  sheetName: 'Jadwal_SAS_SMAN2',
  lastSyncedAt: '',
  updatedAt: '',
};

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Try reading from bundled savedConfig.json if available
  try {
    const configPath = path.join(process.cwd(), 'src', 'data', 'savedConfig.json');
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (data.webAppUrl && !inMemoryConfig.webAppUrl) {
        inMemoryConfig = { ...inMemoryConfig, ...data };
      }
    }
  } catch (e) {
    // ignore
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { webAppUrl, sheetName, lastSyncedAt } = body || {};

    inMemoryConfig = {
      ...inMemoryConfig,
      webAppUrl: (webAppUrl !== undefined ? webAppUrl : inMemoryConfig.webAppUrl || '').trim(),
      sheetName: sheetName || inMemoryConfig.sheetName || 'Jadwal_SAS_SMAN2',
      lastSyncedAt: lastSyncedAt || inMemoryConfig.lastSyncedAt || '',
      updatedAt: new Date().toISOString(),
    };

    res.status(200).json({
      status: 'success',
      message: 'Konfigurasi Google Apps Script berhasil disimpan.',
      config: inMemoryConfig,
    });
    return;
  }

  // GET
  res.status(200).json({
    status: 'success',
    config: inMemoryConfig,
  });
}
