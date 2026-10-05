import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { platform } from './src/engine/vantageManager.ts';
import { DEFAULT_ASSETS_CSV, DEFAULT_LIABILITIES_CSV } from './src/engine/defaultData.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Platform with datasets from /data/ or fallback
function initPlatform() {
  try {
    const txPath = path.resolve(process.cwd(), 'data/transactions.csv');
    const assetPath = path.resolve(process.cwd(), 'data/assets.csv');
    const liabPath = path.resolve(process.cwd(), 'data/liabilities.csv');

    let txCsv = '';
    let assetCsv = DEFAULT_ASSETS_CSV;
    let liabCsv = DEFAULT_LIABILITIES_CSV;

    if (fs.existsSync(txPath)) {
      txCsv = fs.readFileSync(txPath, 'utf-8');
    }
    if (fs.existsSync(assetPath)) {
      assetCsv = fs.readFileSync(assetPath, 'utf-8');
    }
    if (fs.existsSync(liabPath)) {
      liabCsv = fs.readFileSync(liabPath, 'utf-8');
    }

    platform.initialize(txCsv, assetCsv, liabCsv, '2026-10-01');
    console.log('[VANTAGE] Platform engine initialized successfully.');
  } catch (err) {
    console.error('[VANTAGE] Error initializing platform with local CSVs:', err);
  }
}

initPlatform();

// API Endpoints — Deterministic Financial Intelligence
app.get('/api/overview', (_req: Request, res: Response) => {
  res.json(platform.getOverview());
});

app.get('/api/wealth', (_req: Request, res: Response) => {
  res.json(platform.getWealth());
});

app.get('/api/cashflow', (_req: Request, res: Response) => {
  res.json(platform.getCashFlow());
});

app.get('/api/trends', (_req: Request, res: Response) => {
  res.json(platform.getTrends());
});

app.get('/api/risks', (_req: Request, res: Response) => {
  res.json(platform.getRisks());
});

app.get('/api/anomalies', (_req: Request, res: Response) => {
  res.json(platform.getAnomalies());
});

app.get('/api/recommendations', (_req: Request, res: Response) => {
  res.json(platform.getRecommendations());
});

app.get('/api/data-quality', (_req: Request, res: Response) => {
  res.json(platform.getDataQuality());
});

app.get('/api/transactions', (req: Request, res: Response) => {
  const limit = parseInt((req.query.limit as string) || '100', 10);
  const status = (req.query.status as string) || 'ALL';
  const search = (req.query.search as string) || '';
  res.json(platform.getTransactions(limit, status, search));
});

app.post('/api/scenario', (req: Request, res: Response) => {
  try {
    const input = req.body;
    const result = platform.runScenario(input);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Scenario calculation failed' });
  }
});

app.post('/api/copilot', async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question string is required' });
    }
    const response = await platform.askCopilot(question, process.env.GEMINI_API_KEY);
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Copilot assistant error' });
  }
});

app.post('/api/reset', (_req: Request, res: Response) => {
  initPlatform();
  res.json({ message: 'Dataset reset to original challenge files', overview: platform.getOverview() });
});

app.post('/api/upload', (req: Request, res: Response) => {
  try {
    const { transactionsCsv, assetsCsv, liabilitiesCsv, snapshotDate } = req.body;
    if (!transactionsCsv) {
      return res.status(400).json({ error: 'transactionsCsv is required' });
    }

    const effectiveAssets = assetsCsv || DEFAULT_ASSETS_CSV;
    const effectiveLiab = liabilitiesCsv || DEFAULT_LIABILITIES_CSV;
    const effectiveDate = snapshotDate || '2026-10-01';

    platform.initialize(transactionsCsv, effectiveAssets, effectiveLiab, effectiveDate);
    res.json({
      message: 'New CSV payload parsed, validated, and normalized successfully',
      dataQuality: platform.getDataQuality(),
      overview: platform.getOverview()
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'CSV Ingestion failed' });
  }
});

// Mount Vite or serve static assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VANTAGE] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
