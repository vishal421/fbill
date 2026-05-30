const express = require('express');
const path = require('path');
const puppeteerCore = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ─────────────────────────────────────────────
   POST /api/download-receipt
   Body: { html: string, width: number, height: number }
   Returns: PNG — exact pixel-perfect copy of on-screen preview
            including zig-zag CSS mask, textures, fonts, logos
───────────────────────────────────────────── */
app.post('/api/download-receipt', async (req, res) => {
  const { html, width, height } = req.body;
  if (!html) return res.status(400).json({ error: 'Missing html' });

  let browser;
  try {
    // @sparticuz/chromium bundles a Chromium binary that works on Render / Lambda
    const executablePath = await chromium.executablePath();

    browser = await puppeteerCore.launch({
      executablePath,
      headless: chromium.headless,
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
      ],
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();

    // 3× device pixel ratio = sharp, high-res output
    await page.setViewport({
      width:  (width  || 300) + 40,
      height: (height || 900) + 40,
      deviceScaleFactor: 3,
    });

    const BASE = `http://localhost:${PORT}`;

    const pageHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <base href="${BASE}/"/>
  <link rel="stylesheet" href="${BASE}/css/common.css"/>
  <link rel="stylesheet" href="${BASE}/css/template-1.css"/>
  <link rel="stylesheet" href="${BASE}/css/template-3.css"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: transparent;
      overflow: hidden;
      padding: 12px;
      width: ${(width || 300) + 24}px;
    }
    /* Strip preview-only decoration so the download looks clean */
    .template-container {
      transform: none !important;
      filter: none !important;
      zoom: 1 !important;
      box-shadow: none !important;
    }
  </style>
</head>
<body>${html}</body>
</html>`;

    await page.setContent(pageHtml, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for web fonts + background images to fully paint
    await new Promise(r => setTimeout(r, 1200));

    // Screenshot just the receipt element — all CSS effects are captured natively
    const el = await page.$('.template-container');
    if (!el) throw new Error('.template-container not found');

    const imgBuffer = await el.screenshot({ type: 'png', omitBackground: true });

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename="fuel-receipt.png"',
      'Content-Length': imgBuffer.length,
    });
    res.end(imgBuffer);

  } catch (err) {
    console.error('Screenshot error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Fuel Receipt Generator → http://localhost:${PORT}`);
});
