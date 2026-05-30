class Template1 extends AbstractTemplate {
  constructor(containerElemId) {
    super(containerElemId);
    this.contentUri = 'templates/template-1/content.html';
    this.cssUri = 'css/template-1.css';
  }

  renderData(data) {
    if (!this.rendered) throw new Error('Render the Template first');

    // Render field list
    const fieldList = this.getConfig().fieldList || [];
    fieldList.forEach((field) => {
      const value = data[field.id] !== undefined ? data[field.id] : '';
      this.rootElem.find(`#${field.id} .data`).text(value);
    });

    // Pump logo
    const pumpLogoList = this.getConfig().pumpLogoList || [];
    pumpLogoList.forEach((field) => {
      const value = data[field.id] || '';
      if (value) this.rootElem.find(`#pumpLogo`).attr('src', value);
    });

    // Paper texture
    const paperTextureList = this.getConfig().paperTextureList || [];
    paperTextureList.forEach((field) => {
      const value = data[field.id] || '';
      if (value) {
        this.rootElem.find(`.template-container`).css('backgroundImage', `url('${value}')`);
      }
    });

    // Optional fields (show/hide)
    const optionalFieldList = this.getConfig().optionalFieldList || [];
    optionalFieldList.forEach((field) => {
      const value = data[field.id];
      if (value) {
        this.rootElem.find(`#${field.refId}`).show();
      } else {
        this.rootElem.find(`#${field.refId}`).hide();
      }
    });
  }

  getConfig() {
    return {
      optionalFieldList: [
        { id: 'showGST', name: 'GSTIN No.', refId: 'gstNo', value: 'true', checked: false },
        { id: 'showCST', name: 'CST No', refId: 'cstNo', value: 'true', checked: true },
        { id: 'showLST', name: 'LST No', refId: 'lstNo', value: 'true', checked: true },
        { id: 'showVAT', name: 'VAT No', refId: 'vatNo', value: 'true', checked: true },
      ],
      pumpLogoList: [
        { id: 'pumpLogo', name: 'Indian Oil', uri: 'assets/images/logos/pump-logo-indian-oil.png', default: true },
        { id: 'pumpLogo', name: 'HP Oil', uri: 'assets/images/logos/pump-logo-hp.png' },
        { id: 'pumpLogo', name: 'Bharat Petroleum', uri: 'assets/images/logos/pump-logo-bharat-petroleum.png' },
      ],
      paperTextureList: [
        { id: 'texture', name: 'Texture 1', uri: 'assets/images/textures/texture-1.jpeg', default: true },
        { id: 'texture', name: 'Texture 2', uri: 'assets/images/textures/texture-2.jpeg' },
        { id: 'texture', name: 'Texture 3', uri: 'assets/images/textures/texture-3.jpeg' },
        { id: 'texture', name: 'Texture 4', uri: 'assets/images/textures/texture-4.jpg' },
        { id: 'texture', name: 'Texture 6', uri: 'assets/images/textures/texture-6.jpeg' },
      ],
      fieldList: [
        { id: 'address', name: 'Address', defaultValue: 'GOKUL FUEL POINT YELANAHALLI, BEGUR 560068' },
        { id: 'receiptNo', name: 'Receipt No', defaultValue: '0000000000' },
        { id: 'localId', name: 'Local ID', defaultValue: '0000000000' },
        { id: 'fipNo', name: 'FIP No', defaultValue: '1' },
        { id: 'nozzelNo', name: 'Nozzle No', defaultValue: '1' },
        { id: 'product', name: 'Product', defaultValue: 'Petrol' },
        { id: 'presetType', name: 'Preset Type', defaultValue: 'Amount' },
        { id: 'rate', name: 'Rate', defaultValue: '101.94' },
        { id: 'volume', name: 'Volume', defaultValue: '0001.96' },
        { id: 'amount', name: 'Amount', defaultValue: '200.006' },
        { id: 'atot', name: 'Atot', defaultValue: '0000000000.000' },
        { id: 'vtot', name: 'Vtot', defaultValue: '0000000000.000' },
        { id: 'vehicleNo', name: 'Vehicle No', defaultValue: 'Not Entered' },
        { id: 'mobileNo', name: 'Mobile No', defaultValue: 'Not Entered' },
        { id: 'date', name: 'Date', defaultValue: '00/00/00' },
        { id: 'time', name: 'Time', defaultValue: '10:00' },
        { id: 'cstNo', name: 'CST No', defaultValue: '' },
        { id: 'lstNo', name: 'LST No', defaultValue: '' },
        { id: 'vatNo', name: 'VAT No', defaultValue: '' },
        { id: 'gstNo', name: 'GSTIN', defaultValue: '' },
        { id: 'attendantId', name: 'Attendant ID', defaultValue: 'Not Available' },
        { id: 'fccDate', name: 'FCC Date', defaultValue: 'Not Available' },
        { id: 'fccTime', name: 'FCC Time', defaultValue: 'Not Available' },
      ],
    };
  }
}
