'use strict';

var _ = require('lodash');
var debug = require('debug')('barcode');

var db = require('./db');
var BadRequest = require('./errors/BadRequest');
var identifiers = require('../config/identifiers');

exports.generate = generate;
exports.reverseLookup = reverseLookup;

var _require = require('../controllers/medical/patients'),
    lookupPatient = _require.lookupPatient;

var _require2 = require('../controllers/finance/patientInvoice'),
    lookupInvoice = _require2.lookupInvoice;

var identifiersIndex = {};
indexIdentifiers();

/**
 * @description
 * Standard method for generating the code used to display bar codes, this
 * provides a uniform interface ensuring that all barcodes displayed to users
 * use the same schema.
 *
 * ##Current Schema
 * ${receiptIdentifier}.${uuid(6)}
 *
 */
var UUID_ACCURACY_LENGTH = 8;
function generate(receiptIdentifier, uuid) {
  var entityIdentifier = uuid.substr(0, UUID_ACCURACY_LENGTH);
  return '' + receiptIdentifier + entityIdentifier;
}

// barcode standard:
// XX.YYYYYYYY
// XX - Entity code; This is defined on the server
// YYYYYYYY - First characters of the entity UUID
// - returns the full UUID of the entity
function reverseLookup(barcodeKey) {
  var code = barcodeKey.substr(0, 2);
  var partialUuid = barcodeKey.substr(2, barcodeKey.length);
  var documentDefinition = identifiersIndex[code];

  debug('reverse lookup of uuid using ' + barcodeKey + '.');

  if (!documentDefinition) {
    throw new BadRequest('Invalid barcode document type \'' + code + '\'');
  }

  if (!documentDefinition.lookup) {
    throw new BadRequest('No lookup method has been defined for barcode document type \'' + code + '\'');
  }

  var query = '\n    SELECT BUID(uuid) as uuid FROM ' + documentDefinition.table + '\n    WHERE BUID(uuid) LIKE \'' + partialUuid + '%\' COLLATE utf8_unicode_ci;\n  ';

  // search for full UUID
  return db.one(query).then(function (result) {
    return documentDefinition.lookup(result.uuid);
  }).then(function (entity) {
    debug('lookup found: ' + entity.uuid + '.');

    // @todo review specific logic flow
    if (documentDefinition.redirectPath) {
      entity._redirectPath = documentDefinition.redirectPath.replace('?', entity.uuid);
    }

    return entity;
  });
}

function indexIdentifiers() {
  _.forEach(identifiers, function (entity) {
    identifiersIndex[entity.key] = entity;
  });

  // assign lookup methods to supported entity types
  // @TODO this method of mapping should be reviewed
  identifiers.PATIENT.lookup = lookupPatient;
  identifiers.INVOICE.lookup = lookupInvoice;
}