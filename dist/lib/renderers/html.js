'use strict';

/**
 * @overview lib/renderers/html
 *
 * @description
 * This service is responsible for compiling valid HTML documents given a path
 * to a handlebars template.
 *
 * @requires express-handlebars
 * @requires server/lib/template
 * @requires server/lib/util
 * @requires moment
 * @requires debug
 */
var util = require('../util');
var hbs = require('../template');
var moment = require('moment');
var translateHelperFactory = require('../helpers/translate');
var debug = require('debug')('renderers:html');

var headers = {
  'Content-Type': 'text/html'
};

exports.render = renderHTML;
exports.extension = '.html';
exports.headers = headers;
/**
 *
 * @param {Object} data     Object of keys and values that will be made available to the template
 * @param {String} template Path to a handlebars template
 * @param {Object} options  The default options, including language setting
 * @returns {Promise}       Promise resolving in a rendered template (HTML)
 */
function renderHTML(data, template) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  debug('initializing ' + options.lang + ' date locale');
  // load local language for momentjs if possible
  var languageDependency = 'moment/locale/' + options.lang;
  util.loadModuleIfExists(languageDependency);

  moment.locale(options.lang);

  debug('initializing ' + options.lang + ' translation locale');
  // make sure that we have the appropriate language set.  If options.lang is
  // not specified, will default to English.  To change this behavior, see the
  // factory code.
  var translate = translateHelperFactory(options.lang);
  hbs.helpers.translate = translate;

  debug('rendering HTML file');
  return hbs.render(template, data);
}