/* Template2 = Card Payment receipt (same content as Template3) */
class Template2 extends AbstractTemplate {
  constructor(containerElemId) {
    super(containerElemId);
    this.contentUri = 'templates/template-2/content.html';
    this.cssUri     = 'templates/template-2/style.css';
  }

  renderData(data) {
    if (!this.rendered) throw new Error('Call render() first');

    this.getConfig().fieldList.forEach(f => {
      const val = data[f.id] !== undefined ? data[f.id] : '';
      this.rootElem.find('#' + f.id + ' .data').text(val);
    });

    const logo = data['pumpLogo'];
    if (logo) this.rootElem.find('#pumpLogo').attr('src', logo);

    const tex = data['texture'];
    if (tex) this.rootElem.find('.template-container').css('backgroundImage', "url('" + tex + "')");

    this.getConfig().optionalFieldList.forEach(f => {
      if (data[f.id]) this.rootElem.find('#' + f.refId).show();
      else            this.rootElem.find('#' + f.refId).hide();
    });
  }

  getConfig() {
    return {
      optionalFieldList: [
        { id: 'showGST', name: 'GSTIN No.', refId: 'gstNo', value: 'true', checked: false },
        { id: 'showCST', name: 'CST No',    refId: 'cstNo', value: 'true', checked: false },
        { id: 'showVAT', name: 'VAT No',    refId: 'vatNo', value: 'true', checked: false },
      ],
      pumpLogoList: [
        { id: 'pumpLogo', name: 'Indian Oil',       uri: 'assets/images/logos/pump-logo-indian-oil.png',       default: true },
        { id: 'pumpLogo', name: 'HP Oil',           uri: 'assets/images/logos/pump-logo-hp.png' },
        { id: 'pumpLogo', name: 'Bharat Petroleum', uri: 'assets/images/logos/pump-logo-bharat-petroleum.png' },
      ],
      paperTextureList: [
        { id: 'texture', name: 'Texture 1', uri: 'assets/images/textures/texture-1.jpeg' },
        { id: 'texture', name: 'Texture 2', uri: 'assets/images/textures/texture-2.jpeg' },
        { id: 'texture', name: 'Texture 3', uri: 'assets/images/textures/texture-3.jpeg' },
        { id: 'texture', name: 'Texture 4', uri: 'assets/images/textures/texture-4.jpg'  },
        { id: 'texture', name: 'Texture 6', uri: 'assets/images/textures/texture-6.jpeg', default: true },
      ],
      fieldList: [
        { id: 'name',          name: 'Name',             defaultValue: 'TANEJA SERVICE STATION' },
        { id: 'subAddress',    name: 'Sub Address',      defaultValue: 'Patparganj, Delhi' },
        { id: 'address',       name: 'Address',          defaultValue: 'IOC PETROL PUMP' },
        { id: 'attendantName', name: 'Attendant Name',   defaultValue: '' },
        { id: 'date',          name: 'Date',             defaultValue: '18-11-2025' },
        { id: 'time',          name: 'Time',             defaultValue: '10:48:57' },
        { id: 'mid',           name: 'MID',              defaultValue: '56000002825343' },
        { id: 'tid',           name: 'TID',              defaultValue: '00609783' },
        { id: 'batchNo',       name: 'Batch No',         defaultValue: '000114' },
        { id: 'invoiceNo',     name: 'Invoice No',       defaultValue: '002394' },
        { id: 'gstNo',         name: 'GSTIN',            defaultValue: '' },
        { id: 'cstNo',         name: 'CST',              defaultValue: '' },
        { id: 'vatNo',         name: 'VAT',              defaultValue: '' },
        { id: 'card',          name: 'Card',             defaultValue: '**** **** **** 4112 CLSS' },
        { id: 'cardType',      name: 'Card Type',        defaultValue: 'VISA' },
        { id: 'expDate',       name: 'Exp Date',         defaultValue: '**/**' },
        { id: 'txnType',       name: 'Txn Type',         defaultValue: 'CARD' },
        { id: 'apprCode',      name: 'APPR Code',        defaultValue: '15936' },
        { id: 'rrn',           name: 'RRN',              defaultValue: '090200003919' },
        { id: 'tc',            name: 'TC',               defaultValue: '560E803334B60636' },
        { id: 'tsi',           name: 'TSI',              defaultValue: '0000' },
        { id: 'atc',           name: 'ATC',              defaultValue: '******' },
        { id: 'tvr',           name: 'TVR',              defaultValue: '000000801' },
        { id: 'aid',           name: 'AID',              defaultValue: 'A0000000041010' },
        { id: 'product',       name: 'Product',          defaultValue: 'Petrol' },
        { id: 'txnId',         name: 'TXN ID',           defaultValue: '2409020060860862113540' },
        { id: 'unitPrice',     name: 'Unit Price',       defaultValue: '₹ 95.04' },
        { id: 'quantity',      name: 'Quantity',         defaultValue: '36.30 Ltr' },
        { id: 'pumpNo',        name: 'Pump No',          defaultValue: '8' },
        { id: 'nozzleNo',      name: 'Nozzle No',        defaultValue: '2' },
        { id: 'totalSale',     name: 'Total Sale',       defaultValue: '₹ 3450' },
        { id: 'netAmount',     name: 'Net Amount',       defaultValue: '₹ 3450' },
        { id: 'version',       name: 'Software Version', defaultValue: '1.06.09_20240607' },
      ],
    };
  }
}
