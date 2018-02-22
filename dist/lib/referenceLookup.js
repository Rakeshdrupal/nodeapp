'use strict';

// API /entityLink/:codeRef/:language
var _ = require('lodash');

// module dependencies
var db = require('../lib/db');
var identifiers = require('../config/identifiers');
var stockCommon = require('../controllers/stock/reports/common');
var BadRequest = require('../lib/errors/BadRequest');

exports.getEntity = getEntity;

// loading identifiers keys, used for defining the table name
var identifiersIndex = {};
indexIdentifiers();

// This function render a report in the browser
// It search a saved entity
// It requires a  reference code and language as paramters
// The reference code is a combination of table_key.project_abbr.reference
// The table name is variable, it can be :invoice, cash or voucher
function getEntity(req, res, next) {
  var codeRef = req.params.codeRef.split('.');
  var language = req.params.language;


  var code = codeRef[0];
  var projectName = codeRef[1];
  var reference = codeRef[2];
  var documentDefinition = identifiersIndex[code];

  // handle stock movement reference
  var STOCK_MOVEMENT_PREFIX = 'SM';
  var fluxId = codeRef[1];

  if (code === STOCK_MOVEMENT_PREFIX) {
    var type = getStockMovementType(fluxId);
    var queryDocument = 'SELECT BUID(uuid) as uuid FROM document_map WHERE text = ?';

    return db.one(queryDocument, [req.params.codeRef]).then(function (entity) {
      var uuid = entity.uuid;
      var path = '/receipts/stock/' + type.path + '/';
      var url = '' + path + uuid + '?lang=' + language + '&renderer=pdf';
      res.redirect(url);
    }).catch(next).done();
  }

  // consider corner cases to gaurd against infinite redirects
  if (!documentDefinition) {
    throw new BadRequest('Invalid document type provided - \'' + code + '\'');
  }

  if (!documentDefinition.documentPath) {
    throw new BadRequest('Document type does not support document path - \'' + code + '\'');
  }

  var query = '\n    SELECT BUID(uuid) as uuid\n    FROM ' + documentDefinition.table + ' as documentTable JOIN project ON documentTable.project_id = project.id\n    WHERE project.abbr = ? AND documentTable.reference = ?\n  ';

  // search for full UUID
  db.one(query, [projectName, reference]).then(function (entity) {
    var uuid = entity.uuid;

    var url = '' + documentDefinition.documentPath + uuid + '?lang=' + language + '&renderer=pdf';

    res.redirect(url);
  }).catch(next).done();
}

function indexIdentifiers() {
  _.forEach(identifiers, function (entity) {
    identifiersIndex[entity.key] = entity;
  });
}

// get stock movement type
function getStockMovementType(id) {
  return stockCommon.stockFluxReceipt[id];
}