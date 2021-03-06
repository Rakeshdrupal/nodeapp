'use strict';

/* eslint global-require:off, import/no-dynamic-require:off */

/**
 * @overview util
 *
 * @description
 * This module contains useful utility functions used throughout the server.
 *
 * @requires lodash
 * @requires q
 * @requires moment
 * @requires debug
 * @requires child_process
 * @requires util
 */

var _ = require('lodash');
var q = require('q');
var moment = require('moment');
var debug = require('debug')('util');

var _require = require('child_process'),
    exec = _require.exec;

var fs = require('fs');

exports.take = take;
exports.loadModuleIfExists = requireModuleIfExists;
exports.dateFormatter = dateFormatter;
exports.resolveObject = resolveObject;
exports.execp = execp;
exports.unlinkp = unlinkp;
exports.statp = statp;
exports.format = require('util').format;

exports.roundDecimal = roundDecimal;

/**
 * @function take
 *
 * @description
 * Creates a filter to be passed to a Array.map() function.  This filter will
 * flatten an array of JSONs in to an array of arrays with values matching the
 * keys specified as arguments, in the order that they are specified.
 *
 * @returns {Function} filter - a filtering function to that will convert an
 *   object to an array with the given keys.
 *
 * @example
 * var _ = require('lodash');
 *
 * var array = [{
 *   id: 1,
 *   season: 'summer',
 * }, {
 *   id : 2,
 *   season : 'winter'
 * }, {
 *   id : 3,
 *   season : 'fall'
 * }];
 *
 * // take the ids from the JSON array
 * var filter = take('id');
 * var ids = _.flatMap(array, filter); // returns [1, 2, 3];
 * var ids = _.map(array, filter); // returns [ [1], [2], [3]];
 *
 * // take both the id and the season properties from the array
 * var filter = take('id', 'season');
 * var arrs = _.map(array, filter); // returns [[1, 'summer], [2, 'winter'], [3, 'fall']]
 */
function take() {
  for (var _len = arguments.length, keys = Array(_len), _key = 0; _key < _len; _key++) {
    keys[_key] = arguments[_key];
  }

  // get the arguments as an array
  // return the filter function
  return function (object) {
    return keys.map(function (key) {
      return object[key];
    });
  };
}

/**
 * @method requireModuleIfExists
 * @description load a module if it exists
 */
function requireModuleIfExists(moduleName) {
  try {
    require(moduleName);
    debug('Dynamically loaded ' + moduleName + '.');
  } catch (err) {
    return false;
  }
  return true;
}

/**
 * @function resolveObject
 *
 * @description
 * This utility takes in an object of promise queries and returns the object
 * with all values resolved when all promises have settled.  If any one is
 * rejected, the promise is rejected.
 *
 * @param {Object} object - this is the object of keys mapped to promise
 *   values.
 * @returns {Promise} - one all promises resolve, the same object mapped to
 */
function resolveObject(object) {
  var settled = {};

  return q.all(_.values(object)).then(function (results) {
    _.keys(object).forEach(function (key, index) {
      settled[key] = results[index];
    });
    return settled;
  });
}

/**
 * @method dateFormatter
 *
 * @description
 * Accepts an object of key/value pairs. Returns the same object with all values
 * that are dates converted to a standard format.
 */
function dateFormatter(rows, dateFormat) {
  var DATE_FORMAT = dateFormat || 'YYYY-MM-DD HH:mm:ss';

  _.forEach(rows, function (element) {
    _.forEach(element, function (value, key) {
      if (_.isDate(element[key])) {
        element[key] = moment(element[key]).format(DATE_FORMAT);
      }
    });
  });

  return rows;
}

/**
 * @method execp
 *
 * @description
 * This method promisifies the child process exec() function.  It is used in
 * lib/backup.js, but will likely be handy in other places as well.
 */
function execp(cmd) {
  debug('#execp(): ' + cmd);
  var deferred = q.defer();
  var child = exec(cmd);
  child.addListener('error', deferred.reject);
  child.addListener('exit', deferred.resolve);
  return deferred.promise;
}

/**
 * @method statp
 *
 * @description
 * This method promisifies the stats method.
 */
function statp(file) {
  debug('#statp(): ' + file);
  var deferred = q.defer();

  fs.stat(file, function (err, stats) {
    if (err) {
      return deferred.reject(err);
    }
    return deferred.resolve(stats);
  });

  return deferred.promise;
}

/**
 * @method statp
 *
 * @description
 * This method promisifies the unlink method.
 */
function unlinkp(file) {
  debug('#unlinkp(): ' + file);
  var deferred = q.defer();

  fs.unlink(file, function (err) {
    if (err) {
      return deferred.reject(err);
    }
    return deferred.resolve();
  });

  return deferred.promise;
}

/**
 * arround a decimal
 * @param {*} number 
 * @param {*} precision 
 */
function roundDecimal(number) {
  var precision = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 4;

  var base = Math.pow(10, precision);
  return Math.round(number * base) / base;
}