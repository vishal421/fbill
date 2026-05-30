/* ========== APP STATE ========== */
let templates = [];
let templateIndex = 0;
let template = null;

/* ========== INIT ========== */
document.addEventListener('DOMContentLoaded', async () => {
  templates = [
    new Template1('template-container'),
    new Template3('template-container'),
  ];

  // Template radio change
  document.querySelectorAll('input[name="template"]').forEach(radio => {
    radio.addEventListener('change', onTemplateSelected);
  });

  // Generate button
  document.getElementById('btn-generate').addEventListener('click', () => {
    generate(template);
  });

  // Download PDF button
  document.getElementById('btn-download').addEventListener('click', downloadReceiptPDF);

  // Zoom slider
  initZoomSlider();

  // Initial render
  await onTemplateSelected();
});

/* ========== TEMPLATE SELECTION ========== */
async function onTemplateSelected() {
  const checked = document.querySelector('input[name="template"]:checked');
  templateIndex = checked ? Number(checked.value) : 0;
  template = templates[templateIndex];

  renderTemplateForm(template);
  await template.render();
  generate(template);
}

/* ========== FORM BUILDER ========== */
function renderTemplateForm(tmpl) {
  const config = tmpl.getConfig();

  // --- Paper Texture ---
  const textureSection = document.getElementById('section-paper-texture');
  const paperTextureList = config.paperTextureList || [];
  if (paperTextureList.length === 0) {
    textureSection.style.display = 'none';
  } else {
    textureSection.style.display = '';
    const body = textureSection.querySelector('.section-body');
    body.innerHTML = '';
    paperTextureList.forEach(field => {
      const label = document.createElement('label');
      label.className = 'option-label';
      label.innerHTML = `
        <input type="radio" name="${field.id}" value="${field.uri}" ${field.default ? 'checked' : ''} />
        ${field.name}
      `;
      label.querySelector('input').addEventListener('change', () => generate(tmpl));
      body.appendChild(label);
    });
  }

  // --- Pump Logo ---
  const logoSection = document.getElementById('section-pump-logo');
  const pumpLogoList = config.pumpLogoList || [];
  if (pumpLogoList.length === 0) {
    logoSection.style.display = 'none';
  } else {
    logoSection.style.display = '';
    const body = logoSection.querySelector('.section-body');
    body.innerHTML = '';
    pumpLogoList.forEach(field => {
      const label = document.createElement('label');
      label.className = 'option-label';
      label.innerHTML = `
        <input type="radio" name="${field.id}" value="${field.uri}" ${field.default ? 'checked' : ''} />
        ${field.name}
      `;
      label.querySelector('input').addEventListener('change', () => generate(tmpl));
      body.appendChild(label);
    });
  }

  // --- Optional Fields ---
  const optSection = document.getElementById('section-optional-fields');
  const optionalFieldList = config.optionalFieldList || [];
  if (optionalFieldList.length === 0) {
    optSection.style.display = 'none';
  } else {
    optSection.style.display = '';
    const body = optSection.querySelector('.section-body');
    body.innerHTML = '';
    optionalFieldList.forEach(field => {
      const label = document.createElement('label');
      label.className = 'option-label';
      label.innerHTML = `
        <input type="checkbox" name="${field.id}" value="${field.value}" ${field.checked ? 'checked' : ''} />
        ${field.name}
      `;
      label.querySelector('input').addEventListener('change', () => generate(tmpl));
      body.appendChild(label);
    });
  }

  // --- Data Fields ---
  const dataSection = document.getElementById('section-data');
  const fieldList = config.fieldList || [];
  if (fieldList.length === 0) {
    dataSection.style.display = 'none';
  } else {
    dataSection.style.display = '';
    const body = dataSection.querySelector('.fields-grid');
    body.innerHTML = '';
    fieldList.forEach(field => {
      const group = document.createElement('div');
      group.className = 'field-group';
      group.innerHTML = `
        <label for="field_${field.id}">${field.name}</label>
        <input type="text" id="field_${field.id}" name="${field.id}" value="${field.defaultValue || ''}" />
      `;
      body.appendChild(group);
    });
  }
}

/* ========== GENERATE ========== */
function generate(tmpl) {
  const data = {};

  // Texture
  const textureRadio = document.querySelector('#section-paper-texture input[type="radio"]:checked');
  if (textureRadio) data['texture'] = textureRadio.value;

  // Logo
  const logoRadio = document.querySelector('#section-pump-logo input[type="radio"]:checked');
  if (logoRadio) data['pumpLogo'] = logoRadio.value;

  // Optional fields (checkboxes)
  document.querySelectorAll('#section-optional-fields input[type="checkbox"]').forEach(cb => {
    data[cb.name] = cb.checked ? cb.value : '';
  });

  // Data fields
  document.querySelectorAll('#section-data input[type="text"]').forEach(input => {
    data[input.name] = input.value;
  });

  tmpl.renderData(data);
}

/* ========== ZOOM ========== */
function initZoomSlider() {
  const slider = document.getElementById('percentage-slider');
  const label = document.getElementById('slider-value');
  const container = document.getElementById('template-container');

  if (!slider) return;

  slider.addEventListener('input', function () {
    const val = this.value;
    label.textContent = val + '%';
    container.style.zoom = `${val}%`;
  });
}

/* ========== PDF DOWNLOAD ========== */
async function downloadReceiptPDF() {
  const btn = document.getElementById('btn-download');
  const receiptEl = document.getElementById('template-container');

  if (!receiptEl) return;

  btn.disabled = true;
  btn.textContent = '⏳ Generating...';

  try {
    // 1. Strip zoom + rotation so html2canvas captures at true 1:1 pixels
    const prevZoom      = receiptEl.style.zoom || '';
    const prevTransform = receiptEl.style.transform || '';
    receiptEl.style.zoom      = '100%';
    receiptEl.style.transform = 'none';

    await new Promise(r => setTimeout(r, 120));

    const receiptWidth  = receiptEl.offsetWidth;
    const receiptHeight = receiptEl.offsetHeight;
    const SCALE = 3;

    // 2. Capture receipt as-is (rectangular, with texture)
    const receiptCanvas = await html2canvas(receiptEl, {
      scale: SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',   // solid white — no transparency issues
      width:  receiptWidth,
      height: receiptHeight,
      scrollX: 0,
      scrollY: 0,
      logging: false,
    });

    // Restore
    receiptEl.style.zoom      = prevZoom;
    receiptEl.style.transform = prevTransform;

    const W = receiptCanvas.width;   // receiptWidth  × SCALE
    const H = receiptCanvas.height;  // receiptHeight × SCALE

    // 3. Build final canvas: draw receipt, then erase top & bottom
    //    with zig-zag triangles so the PDF matches the preview edges.
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width  = W;
    finalCanvas.height = H;
    const ctx = finalCanvas.getContext('2d');

    // Draw the captured receipt first
    ctx.drawImage(receiptCanvas, 0, 0);

    // ── Zig-zag parameters (match CSS: tooth width 5px × SCALE, depth = 51% of half) ──
    // CSS: bottom/5px 51% repeat-x  →  tooth pitch = 5px, zone height = 51% of H/2
    const pitch  = 5 * SCALE;                     // horizontal pitch of one tooth
    const depth  = Math.round(H * 0.51 * 0.5);    // how deep the cut goes from edge

    // Erase colour = white (same as receipt background)
    ctx.fillStyle = '#ffffff';

    // ── TOP edge: erase downward-pointing triangles ──
    // Each tooth: a triangle whose TIP points DOWN into the receipt.
    // Between teeth the full depth is erased (rectangular strip at very top).
    // Simpler approach: erase the whole top strip, then draw the receipt-coloured
    // triangles back in. Even simpler: draw white triangles that "bite" downward.
    //
    //   0        pitch/2      pitch
    //   |----^----|----^----|      ← receipt content starts here (depth from top)
    //        |         |
    //   zig  peak  zig peak        ← peaks are at y=0 (top edge, kept)
    //
    // We draw filled triangles pointing DOWN (into receipt) with white,
    // covering the "valley" between teeth.
    for (let x = 0; x < W; x += pitch) {
      // Valley triangle: base at y=0, tip points down to y=depth
      ctx.beginPath();
      ctx.moveTo(x,             0);          // left corner of valley
      ctx.lineTo(x + pitch / 2, depth);      // tip of valley (pointing down into receipt)
      ctx.lineTo(x + pitch,     0);          // right corner of valley
      ctx.closePath();
      ctx.fill();
      // Also erase everything above the peak row (the flat strip above depth)
      // — handled by erasing a full rect above the zig line below.
    }
    // Erase the very top flat strip (above the deepest valley point = nothing,
    // the triangles above already handle it). But we need the outer background white:
    // actually the valleys between teeth IS what we drew. The "teeth" peaks stay.
    // No extra strip needed for top.

    // ── BOTTOM edge: erase upward-pointing triangles ──
    for (let x = 0; x < W; x += pitch) {
      ctx.beginPath();
      ctx.moveTo(x,             H);               // left corner of valley (at bottom)
      ctx.lineTo(x + pitch / 2, H - depth);        // tip pointing UP into receipt
      ctx.lineTo(x + pitch,     H);               // right corner
      ctx.closePath();
      ctx.fill();
    }

    // 4. Build PDF exactly the size of the canvas — receipt width, auto height
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [W, H],
      compress: true,
    });

    const imgData = finalCanvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, W, H);
    pdf.save('fuel-receipt.pdf');

  } catch (err) {
    console.error('PDF generation failed:', err);
    alert('PDF generation failed. Please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = '⬇ Download PDF';
  }
}
