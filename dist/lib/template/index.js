'use strict';

/**
 * @overview template
 *
 * @description
 * This service is a wrapper for the express handlebars library. It sets the
 * required configuration options and imports helpers from subdirectories for
 * use in the templates.
 *
 * @requires path
 * @requires express-handlebars
 *
 * @returns {Function} handlebars render method, accepting a template and a
 *   context.
 */

var path = require('path');
var exphbs = require('express-handlebars');

var math = require('./helpers/math');
var dates = require('./helpers/dates');
var finance = require('./helpers/finance');
var objects = require('./helpers/objects');
var logic = require('./helpers/logic');
var presentation = require('./helpers/presentation');

var hbs = exphbs.create({
  helpers: {
    date: dates.date,
    month: dates.month,
    timestamp: dates.timestamp,
    age: dates.age,
    multiply: math.multiply,
    sum: math.sum,
    add: math.add,
    substract: math.substract,
    currency: finance.currency,
    numberToText: finance.numberToText,
    indentAccount: finance.indentAccount,
    look: objects.look,
    equal: logic.equal,
    gt: logic.gt,
    lt: logic.lt,
    getIncomeExpenseTitle: presentation.getTitle,
    isIncomeViewable: presentation.isIncomeViewable,
    isExpenseViewable: presentation.isExpenseViewable,
    isResultViewable: presentation.isResultViewable
  },

  // load partials from the partials sub-directory
  partialsDir: path.join(__dirname, 'partials/')
});

module.exports = hbs;