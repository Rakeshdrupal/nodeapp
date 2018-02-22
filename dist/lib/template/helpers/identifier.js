'use strict';

var barcode = require('../../barcode');

function barcodeString(receiptIdentifier, uuid) {
  return barcode.generate(receiptIdentifier, uuid);
}

exports.barcodeString = barcodeString;