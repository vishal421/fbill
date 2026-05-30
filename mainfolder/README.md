# Fuel Receipt Generator

A realistic PoS machine receipt generator for fuel pumps — looks like actual thermal/card payment printed receipts.

## Project Structure

```
fuel-receipt-generator/
├── server.js                         # Express server (entry point)
├── package.json
├── public/
│   ├── index.html                    # Main page
│   ├── css/
│   │   ├── common.css                # Global layout & control panel styles
│   │   ├── template-1.css            # Template 1 receipt styles
│   │   └── template-3.css            # Template 3 receipt styles
│   ├── js/
│   │   ├── abstract-template.js      # Base class
│   │   ├── template1.js              # Template 1 logic & config
│   │   ├── template3.js              # Template 3 logic & config
│   │   └── common.js                 # App init, form rendering, generate
│   ├── templates/
│   │   ├── template-1/content.html   # Template 1 HTML
│   │   └── template-3/content.html   # Template 3 HTML
│   └── assets/
│       ├── images/
│       │   ├── textures/             # texture-1.jpeg, texture-6.jpeg
│       │   └── logos/                # pump logos + fiserv
│       └── fonts/                    # thermal-receipt.ttf, arial.ttf
```

## Running Locally

```bash
npm install
npm start
# Open http://localhost:3000
```

## Deploying on Render

1. Push to GitHub
2. On [render.com](https://render.com), create a **New Web Service**
3. Connect your GitHub repo
4. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: Node
5. Deploy!

## Features

- **2 Templates**: Thermal strip (Template 1) and Card payment receipt (Template 3)
- **2 Paper Textures**: Crumpled paper texture 1 and 6
- **3 Pump Logos**: Indian Oil, HP, Bharat Petroleum (all grayscale printed look)
- **Realistic effects**: Zig-zag receipt edges, paper grain, slight rotation, monospace font
- **Fully editable fields**: All receipt data is editable via the left panel
- **Optional fields**: GST, CST, LST, VAT toggleable
- **Print support**: Click Print to print just the receipt
- **Zoom control**: Scale the receipt preview

## Extending

To add a new template:
1. Create `public/templates/template-N/content.html`
2. Create `public/css/template-N.css`
3. Create `public/js/templateN.js` extending `AbstractTemplate`
4. Add it to `templates[]` array in `common.js`
5. Add radio option in `index.html`
