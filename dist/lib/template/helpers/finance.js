'use strict';

var accountingjs = require('accounting-js');
var NumberToText = require('../../../lib/NumberToText');

var USD_FMT = { precision: 2 };

var FC_FMT = {
  symbol: 'FC',
  precision: 2,
  thousand: '.',
  decimal: ',',
  format: '%v %s' // value before symbol
};

/** @todo use the currency filter fork written for the client to perform the same behaviour here */
function currency() {
  var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  var currencyId = arguments[1];

  // if currencyId is not defined, defaults to USD.
  // @TODO - super-hardcoded values for the moment.  Can we do better?
  var fmt = Number(currencyId) === 1 ? FC_FMT : USD_FMT;
  return accountingjs.formatMoney(value, fmt);
}

/**
 * @function numberToText
 * @value is the ammount to convert
 * @lang is the selected language
 * @currencyName is the Name of currency
 */
function numberToText(value, lang, currencyName) {
  var numberText = NumberToText.convert(value, lang, currencyName);
  var fmt = numberText;
  return fmt;
}

var INDENTATION_STEP = 40;

/**
 * @function indentAccount
 * @description indent with 40px accounts based on the account depth for the chart of accounts
 * @param {number} depth the account number
 * @return {number} number the processed indent
 */
function indentAccount(depth) {
  // indentation step is fixed arbitrary to 40 (40px)
  var number = Number(depth);
  return number ? number * INDENTATION_STEP : 0;
}

exports.currency = currency;
exports.indentAccount = indentAccount;
exports.numberToText = numberToText;