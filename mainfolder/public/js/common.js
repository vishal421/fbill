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
    // 1. Temporarily strip zoom + rotation so html2canvas captures at 1:1 real pixels
    const prevZoom      = receiptEl.style.zoom || '';
    const prevTransform = receiptEl.style.transform || '';
    receiptEl.style.zoom      = '100%';
    receiptEl.style.transform = 'none';

    await new Promise(r => setTimeout(r, 100));

    const receiptWidth  = receiptEl.offsetWidth;
    const receiptHeight = receiptEl.offsetHeight;
    const SCALE = 3; // render at 3× for sharp output

    // 2. Capture the receipt (backgroundColor null so zig-zag mask area is transparent)
    const receiptCanvas = await html2canvas(receiptEl, {
      scale: SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      width:  receiptWidth,
      height: receiptHeight,
      scrollX: 0,
      scrollY: 0,
      logging: false,
    });

    // Restore zoom/transform
    receiptEl.style.zoom      = prevZoom;
    receiptEl.style.transform = prevTransform;

    // 3. Create a final canvas with WHITE background + zig-zag serrations drawn as
    //    actual cut-out triangles — matching the CSS conic-gradient mask exactly.
    const W = receiptCanvas.width;   // receiptWidth  × SCALE
    const H = receiptCanvas.height;  // receiptHeight × SCALE

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width  = W;
    finalCanvas.height = H;
    const ctx = finalCanvas.getContext('2d');

    // Tooth dimensions (must match CSS: 5px wide, 51% height each side)
    const toothW = 5 * SCALE;              // width of one zig-zag tooth
    const toothH = Math.round(H * 0.51);  // height of top/bottom mask zone

    // --- Build clip path: full rect minus zig-zag bites at top and bottom ---
    ctx.beginPath();

    // ── TOP EDGE: zig-zag pointing DOWN into the receipt ──
    // We walk left→right drawing upward triangles (the "missing" parts are the
    // valleys between teeth, which we skip past the top edge).
    ctx.moveTo(0, toothH);
    let x = 0;
    while (x < W) {
      const mid = x + toothW / 2;
      const end = x + toothW;
      // Peak of tooth (points up, outside the receipt = clipped away)
      ctx.lineTo(mid, 0);
      // Back down to the inner edge
      ctx.lineTo(Math.min(end, W), toothH);
      x = end;
    }

    // Right side straight down to bottom tooth zone
    ctx.lineTo(W, H - toothH);

    // ── BOTTOM EDGE: zig-zag pointing UP into the receipt ──
    // Walk right→left
    x = W;
    while (x > 0) {
      const mid = x - toothW / 2;
      const start = x - toothW;
      ctx.lineTo(mid, H);          // valley points down (outside)
      ctx.lineTo(Math.max(start, 0), H - toothH);
      x = start;
    }

    ctx.lineTo(0, toothH);
    ctx.closePath();
    ctx.clip();

    // 4. Fill clipped area with white (paper background), then draw receipt on top
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(receiptCanvas, 0, 0);

    // 5. Build PDF exactly the size of the canvas — no A4, no margins
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
