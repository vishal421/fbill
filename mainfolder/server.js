'use strict';
const express = require('express');
const path    = require('path');

const app  = express();
const ROOT = __dirname;

app.use(express.json({ limit: '2mb' }));
app.use(express.static(ROOT));

// Landing page — index.html (Render always serves this at /)
app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

// Generator tool
app.get('/generator', (req, res) => {
  res.sendFile(path.join(ROOT, 'generator.html'));
});

// Food Bill Generator
app.get('/food-bill', (req, res) => {
  res.sendFile(path.join(ROOT, 'food-generator.html'));
});

/* ── PNG Download ── */
app.post('/api/download-receipt', async (req, res) => {
  const { html, width, height } = req.body;
  if (!html) return res.status(400).json({ error: 'Missing html' });

  let browser;
  try {
    const puppeteerCore = require('puppeteer-core');
    const chromium      = require('@sparticuz/chromium');
    const executablePath = await chromium.executablePath();

    browser = await puppeteerCore.launch({
      executablePath,
      headless: chromium.headless,
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox',
             '--disable-dev-shm-usage', '--disable-gpu'],
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();
    await page.setViewport({
      width:  (width  || 300) + 40,
      height: (height || 900) + 40,
      deviceScaleFactor: 3,
    });

    const BASE = `http://localhost:${PORT}`;
    const pageHtml = `<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8"/>
  <base href="${BASE}/"/>
  <link rel="stylesheet" href="${BASE}/assets/css/common.css"/>
  <link rel="stylesheet" href="${BASE}/templates/template-1/style.css"/>
  <link rel="stylesheet" href="${BASE}/templates/template-2/style.css"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{background:transparent;overflow:hidden;padding:12px;width:${(width||300)+24}px}
    .template-container{transform:none!important;filter:none!important;zoom:1!important;box-shadow:none!important}
  </style>
</head><body>${html}</body></html>`;

    await page.setContent(pageHtml, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1200));

    const el = await page.$('.template-container');
    if (!el) throw new Error('.template-container not found');

    const buf = await el.screenshot({ type: 'png', omitBackground: true });
    res.set({
      'Content-Type':        'image/png',
      'Content-Disposition': 'attachment; filename="fuel-receipt.png"',
      'Content-Length':      buf.length,
    });
    res.end(buf);

  } catch (err) {
    console.error('Screenshot error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
