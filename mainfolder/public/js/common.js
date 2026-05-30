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

  // --- Paper Texture (Visual Tiles) ---
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
      label.className = 'visual-tile';
      label.innerHTML = `
        <input type="radio" name="${field.id}" value="${field.uri}" ${field.default ? 'checked' : ''} />
        <img class="tile-thumb" src="${field.uri}" alt="${field.name}" onerror="this.style.background='#e2e8f0'" />
        <span class="tile-name">${field.name}</span>
      `;
      label.querySelector('input').addEventListener('change', () => generate(tmpl));
      body.appendChild(label);
    });
  }

  // --- Pump Logo (Visual Tiles) ---
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
      label.className = 'visual-tile';
      label.innerHTML = `
        <input type="radio" name="${field.id}" value="${field.uri}" ${field.default ? 'checked' : ''} />
        <img class="tile-thumb-logo" src="${field.uri}" alt="${field.name}" onerror="this.style.background='#f1f3f5'" />
        <span class="tile-name">${field.name}</span>
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

    // Auto-generate on input changes
    body.querySelectorAll('input[type="text"]').forEach(input => {
      input.addEventListener('input', () => generate(tmpl));
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

/* ========== PDF DOWNLOAD (via Puppeteer on server) ========== */
async function downloadReceiptPDF() {
  const btn = document.getElementById('btn-download');
  const receiptEl = document.getElementById('template-container');

  if (!receiptEl) return;

  btn.disabled = true;
  btn.textContent = '⏳ Generating...';

  try {
    const prevZoom      = receiptEl.style.zoom || '';
    const prevTransform = receiptEl.style.transform || '';
    receiptEl.style.zoom      = '100%';
    receiptEl.style.transform = 'none';

    await new Promise(r => setTimeout(r, 80));

    const width  = receiptEl.offsetWidth;
    const height = receiptEl.offsetHeight;
    const html = receiptEl.outerHTML;

    receiptEl.style.zoom      = prevZoom;
    receiptEl.style.transform = prevTransform;

    const response = await fetch('/api/download-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, width, height }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${response.status}`);
    }

    const blob = await response.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'fuel-receipt.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

  } catch (err) {
    console.error('Download failed:', err);
    alert('Download failed: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '⬇ Download PNG';
  }
}
