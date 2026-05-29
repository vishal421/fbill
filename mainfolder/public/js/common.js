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

  // Print button
  document.getElementById('btn-print').addEventListener('click', () => {
    window.print();
  });

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

  // Disable button while generating
  btn.disabled = true;
  btn.textContent = '⏳ Generating...';

  try {
    // Temporarily reset zoom/transform so html2canvas captures at 1:1
    const prevZoom = receiptEl.style.zoom || '100%';
    const prevTransform = receiptEl.style.transform;
    receiptEl.style.zoom = '100%';
    receiptEl.style.transform = 'none';

    // Wait a tick for layout to settle after resetting zoom
    await new Promise(r => setTimeout(r, 80));

    // Measure the actual receipt element
    const receiptWidth = receiptEl.offsetWidth;   // ~295px
    const receiptHeight = receiptEl.offsetHeight; // dynamic content height

    // Render to canvas at 3× for sharp output
    const canvas = await html2canvas(receiptEl, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,  // preserve transparent zig-zag edges
      width: receiptWidth,
      height: receiptHeight,
      scrollX: 0,
      scrollY: 0,
      logging: false,
    });

    // Restore zoom/transform
    receiptEl.style.zoom = prevZoom;
    receiptEl.style.transform = prevTransform || '';

    // Canvas pixel dimensions
    const imgWidth  = canvas.width;   // receiptWidth  × 3
    const imgHeight = canvas.height;  // receiptHeight × 3

    // Convert canvas px → PDF pt (1 pt = 1.333... px at 96dpi)
    // We target the receipt's real-world width in mm. 295px ≈ 78mm at 96dpi.
    // jsPDF "px" unit maps 1:1 with canvas pixels when we set format exactly.
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      // format = [width, height] in the unit above — use canvas pixel size
      format: [imgWidth, imgHeight],
      compress: true,
    });

    const imgData = canvas.toDataURL('image/png');

    // Place image filling the entire PDF page exactly
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    pdf.save('fuel-receipt.pdf');

  } catch (err) {
    console.error('PDF generation failed:', err);
    alert('PDF generation failed. Please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = '⬇ Download PDF';
  }
}
