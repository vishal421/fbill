const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ─────────────────────────────────────────────
   POST /api/download-receipt
   Body: { html: string, width: number, height: number }
   Returns: PNG image of the receipt with all CSS effects intact
            (zig-zag mask, textures, fonts, logos — everything)
───────────────────────────────────────────── */
app.post('/api/download-receipt', async (req, res) => {
  const { html, width, height } = req.body;
  if (!html) return res.status(400).json({ error: 'Missing html' });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
      ],
    });

    const page = await browser.newPage();

    // Device pixel ratio 3 = same as scale:3 in html2canvas → sharp output
    await page.setViewport({ width: width + 40, height: height + 40, deviceScaleFactor: 3 });

    const BASE = `http://localhost:${PORT}`;

    // Full standalone page — loads all assets from our own server
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
      /* Give a little room so zig-zag edges aren't clipped */
      padding: 10px;
      width: ${width + 20}px;
    }
    /* Remove preview-only decoration */
    .template-container {
      transform: none !important;
      filter: none !important;
      zoom: 1 !important;
      box-shadow: none !important;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;

    await page.setContent(pageHtml, { waitUntil: 'networkidle0', timeout: 30000 });

    // Extra wait for webfonts and background-images to paint
    await new Promise(r => setTimeout(r, 1000));

    // Screenshot the exact receipt element — Puppeteer respects CSS mask, zig-zag, all effects
    const el = await page.$('.template-container');
    if (!el) throw new Error('.template-container not found in rendered page');

    const imgBuffer = await el.screenshot({ type: 'png', omitBackground: true });

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename="fuel-receipt.png"',
      'Content-Length': imgBuffer.length,
    });
    res.end(imgBuffer);

  } catch (err) {
    console.error('Puppeteer error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Fuel Receipt Generator running on http://localhost:${PORT}`);
});
