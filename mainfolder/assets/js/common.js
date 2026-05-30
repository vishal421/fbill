/* ==========================================================
   common.js  —  Fuel Bill Generator
   Handles: template switching, form rendering, live preview,
   zoom slider, and PNG download via server.
   ========================================================== */

var templateIndex = 0;
var template      = null;

/* ----------------------------------------------------------
   Called once on page ready (from index.html inline script)
   ---------------------------------------------------------- */
async function onInit() {
  await onTemplateSelected();
  initZoomSlider();
}

/* ----------------------------------------------------------
   Switch active template and rebuild the whole form
   ---------------------------------------------------------- */
async function onTemplateSelected() {
  var checked = document.querySelector('input[name="template"]:checked');
  templateIndex = checked ? parseInt(checked.value, 10) : 0;
  template = templates[templateIndex];

  // Rebuild dynamic sections (texture, logo, optional, data)
  renderTemplateForm(template);

  // Fetch + inject template HTML/CSS into #template-container
  await template.render();

  // Apply current zoom to newly rendered container
  applyCurrentZoom();

  // Push current form values into the freshly-rendered receipt
  generate(template);
}

/* ----------------------------------------------------------
   Build the four dynamic panels from template config
   ---------------------------------------------------------- */
function renderTemplateForm(tmpl) {
  var cfg = tmpl.getConfig();

  /* ── Paper Texture (text-only pill buttons) ── */
  var texSection = document.getElementById('section-paper-texture');
  var texList    = cfg.paperTextureList || [];
  if (texList.length === 0) {
    texSection.style.display = 'none';
  } else {
    texSection.style.display = '';
    var texBody = texSection.querySelector('.panel-body');
    texBody.innerHTML = '';
    texList.forEach(function(f, i) {
      var lbl = document.createElement('label');
      lbl.className = 'texture-pill';
      var isDefault = f.default || i === 0;
      lbl.innerHTML =
        '<input type="radio" name="' + f.id + '" value="' + f.uri + '" ' + (isDefault ? 'checked' : '') + ' />' +
        '<span>' + f.name + '</span>';
      lbl.querySelector('input').addEventListener('change', function() { generate(tmpl); });
      texBody.appendChild(lbl);
    });
  }

  /* ── Pump Logo ── */
  var logoSection = document.getElementById('section-pump-logo');
  var logoList    = cfg.pumpLogoList || [];
  if (logoList.length === 0) {
    logoSection.style.display = 'none';
  } else {
    logoSection.style.display = '';
    var logoBody = logoSection.querySelector('.panel-body');
    logoBody.innerHTML = '';
    logoList.forEach(function(f, i) {
      var lbl = document.createElement('label');
      lbl.className = 'logo-tile';
      var isDefault = f.default || i === 0;
      lbl.innerHTML =
        '<input type="radio" name="' + f.id + '" value="' + f.uri + '" ' + (isDefault ? 'checked' : '') + ' />' +
        '<img src="' + f.uri + '" alt="' + f.name + '" />' +
        '<span>' + f.name + '</span>';
      lbl.querySelector('input').addEventListener('change', function() { generate(tmpl); });
      logoBody.appendChild(lbl);
    });
  }

  /* ── Optional Fields ── */
  var optSection = document.getElementById('section-optional-fields');
  var optList    = cfg.optionalFieldList || [];
  if (optList.length === 0) {
    optSection.style.display = 'none';
  } else {
    optSection.style.display = '';
    var optBody = optSection.querySelector('.panel-body');
    optBody.innerHTML = '';
    optList.forEach(function(f) {
      var lbl = document.createElement('label');
      lbl.className = 'opt-field-label';
      lbl.innerHTML =
        '<input type="checkbox" class="optional-fields" name="' + f.id + '" value="' + f.value + '" ' + (f.checked ? 'checked' : '') + ' />' +
        f.name;
      lbl.querySelector('input').addEventListener('change', function() { generate(tmpl); });
      optBody.appendChild(lbl);
    });
  }

  /* ── Data Fields ── */
  var dataSection = document.getElementById('section-data');
  var fieldList   = cfg.fieldList || [];
  if (fieldList.length === 0) {
    dataSection.style.display = 'none';
  } else {
    dataSection.style.display = '';
    var dataRow = dataSection.querySelector('.panel-body .row');
    dataRow.innerHTML = '';
    fieldList.forEach(function(f) {
      var col = document.createElement('div');
      // Address gets full width; everything else half-width
      col.className = (f.id === 'address' || f.id === 'name') ? 'col-sm-12' : 'col-sm-6';
      col.innerHTML =
        '<div class="data-field-group">' +
          '<label>' + f.name + '</label>' +
          '<input type="text" class="text-input" name="' + f.id + '" value="' + (f.defaultValue || '') + '" />' +
        '</div>';
      col.querySelector('input').addEventListener('input', function() { generate(tmpl); });
      dataRow.appendChild(col);
    });
  }
}

/* ----------------------------------------------------------
   Read every form control and push values into the receipt
   ---------------------------------------------------------- */
function generate(tmpl) {
  if (!tmpl) return;
  var data = {};

  // Texture
  var texRadio = document.querySelector('#section-paper-texture input[type="radio"]:checked');
  if (texRadio) data['texture'] = texRadio.value;

  // Logo
  var logoRadio = document.querySelector('#section-pump-logo input[type="radio"]:checked');
  if (logoRadio) data['pumpLogo'] = logoRadio.value;

  // Optional checkboxes
  document.querySelectorAll('#section-optional-fields input[type="checkbox"]').forEach(function(cb) {
    data[cb.name] = cb.checked ? cb.value : '';
  });

  // Text inputs
  document.querySelectorAll('#section-data input[type="text"]').forEach(function(inp) {
    data[inp.name] = inp.value;
  });

  tmpl.renderData(data);
}

/* ----------------------------------------------------------
   Zoom slider  (range 0–100 maps to 50%–150% scale)
   ---------------------------------------------------------- */
function applyCurrentZoom() {
  var slider    = document.getElementById('percentage-slider');
  var container = document.getElementById('template-container');
  if (!slider || !container) return;
  var zoom = 50 + parseInt(slider.value, 10);
  container.style.zoom = zoom + '%';
  var lbl = document.getElementById('zoom-label');
  if (lbl) lbl.textContent = zoom + '%';
}

function initZoomSlider() {
  var slider = document.getElementById('percentage-slider');
  if (!slider) return;

  // Apply initial zoom
  applyCurrentZoom();

  slider.addEventListener('input', function() {
    applyCurrentZoom();
  });
}

/* ----------------------------------------------------------
   PNG Download  — POST outerHTML to /api/download-receipt
   ---------------------------------------------------------- */
function downloadReceipt() {
  var btn       = document.getElementById('downloadButton');
  var container = document.getElementById('template-container');
  if (!container) return;

  var origLabel = btn.textContent;
  btn.disabled    = true;
  btn.textContent = '⏳ Generating…';

  // Temporarily remove zoom/transform so we capture true size
  var prevZoom  = container.style.zoom      || '';
  var prevTx    = container.style.transform || '';
  container.style.zoom      = '100%';
  container.style.transform = 'none';

  setTimeout(function() {
    var width  = container.offsetWidth;
    var height = container.offsetHeight;
    var html   = container.outerHTML;

    // Restore visual state
    container.style.zoom      = prevZoom;
    container.style.transform = prevTx;

    fetch('/api/download-receipt', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ html: html, width: width, height: height }),
    })
    .then(function(res) {
      if (!res.ok) return res.json().then(function(e) { throw new Error(e.error || 'Server error ' + res.status); });
      return res.blob();
    })
    .then(function(blob) {
      var url = URL.createObjectURL(blob);
      var a   = document.createElement('a');
      a.href     = url;
      a.download = 'fuel-receipt.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    })
    .catch(function(err) {
      console.error('Download failed:', err);
      alert('Download failed: ' + err.message);
    })
    .finally(function() {
      btn.disabled    = false;
      btn.textContent = origLabel;
    });
  }, 80);
}
