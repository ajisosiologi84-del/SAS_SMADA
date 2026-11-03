import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Directories
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'app-config.json');
const SRC_CONFIG_FILE = path.join(__dirname, 'src', 'data', 'savedConfig.json');
const SLOTS_CACHE_FILE = path.join(DATA_DIR, 'cached-slots.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to get active config
function readActiveConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
    if (fs.existsSync(SRC_CONFIG_FILE)) {
      const data = fs.readFileSync(SRC_CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading config:', err);
  }
  return {
    webAppUrl: '',
    sheetName: 'Jadwal_SAS_SMAN2',
    lastSyncedAt: '',
    updatedAt: '',
  };
}

// --------------------------------------------------------------------------
// API ENDPOINTS
// --------------------------------------------------------------------------

// 1. GET /api/config -> Returns the globally saved Google Apps Script URL & config
app.get('/api/config', (_req: Request, res: Response) => {
  const config = readActiveConfig();
  res.json({
    status: 'success',
    config,
  });
});

// 2. POST /api/config -> Persists the Google Apps Script URL across all browsers/devices
app.post('/api/config', (req: Request, res: Response) => {
  try {
    const { webAppUrl, sheetName, lastSyncedAt } = req.body;
    const current = readActiveConfig();
    const updated = {
      ...current,
      webAppUrl: (webAppUrl !== undefined ? webAppUrl : current.webAppUrl || '').trim(),
      sheetName: sheetName || current.sheetName || 'Jadwal_SAS_SMAN2',
      lastSyncedAt: lastSyncedAt || current.lastSyncedAt || '',
      updatedAt: new Date().toISOString(),
    };

    // Save to persistent file
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');

    // Also update bundled file if writable
    try {
      fs.writeFileSync(SRC_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (e) {
      // Ignore if read-only in production
    }

    console.log(`[CONFIG] Google Apps Script URL updated globally: ${updated.webAppUrl}`);
    res.json({
      status: 'success',
      message: 'Konfigurasi Google Apps Script berhasil disimpan secara permanen di server.',
      config: updated,
    });
  } catch (err: any) {
    console.error('Error saving config:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 3. Proxy for Google Sheets to prevent CORS and guarantee reliable sync
app.all('/api/proxy-sheet', async (req: Request, res: Response) => {
  try {
    const config = readActiveConfig();
    const targetUrl = (req.query.url as string) || (req.body?.targetUrl as string) || config.webAppUrl;

    if (!targetUrl) {
      res.status(400).json({ status: 'error', message: 'URL Web App Google Apps Script belum disetel di server.' });
      return;
    }

    if (req.method === 'GET') {
      const action = req.query.action || 'ping';
      const cleanUrl = targetUrl.includes('?') 
        ? `${targetUrl}&action=${action}` 
        : `${targetUrl}?action=${action}`;

      const response = await fetch(cleanUrl);
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        res.json(json);
      } catch {
        res.send(text);
      }
    } else {
      // POST
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(req.body),
      });
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        res.json(json);
      } catch {
        res.send(text);
      }
    }
  } catch (err: any) {
    console.error('Proxy sheet error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 4. Slots Cache (Optional global slot sync)
app.get('/api/cached-slots', (_req: Request, res: Response) => {
  try {
    if (fs.existsSync(SLOTS_CACHE_FILE)) {
      const data = fs.readFileSync(SLOTS_CACHE_FILE, 'utf-8');
      res.json({ status: 'success', slots: JSON.parse(data) });
      return;
    }
  } catch {}
  res.json({ status: 'not_found', slots: null });
});

app.post('/api/cached-slots', (req: Request, res: Response) => {
  try {
    const { slots } = req.body;
    if (Array.isArray(slots) && slots.length > 0) {
      fs.writeFileSync(SLOTS_CACHE_FILE, JSON.stringify(slots, null, 2), 'utf-8');
      res.json({ status: 'success' });
      return;
    }
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
    return;
  }
  res.status(400).json({ status: 'error', message: 'Invalid slots data' });
});

// --------------------------------------------------------------------------
// VITE DEV / STATIC PRODUCTION SERVING
// --------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // In development mode, mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Full-stack application running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
