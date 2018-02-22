'use strict';

/**
 * @function look
 * @description look value into an object given
 * @param {object} obj The concerned object
 * @param {string} property The object property
 * @param {string} property2 The object property
 */
function look(obj, property, property2) {
  var hasProperInput = obj && property && property2;
  var hasFirstProperty = hasProperInput && property2.name;
  var hasSecondProperty = hasProperInput && !property2.name;

  var value = void 0;

  // Missing parameter take the function name as name property
  // if property2 is missing, it will be an object with an attribute name: 'function name'
  if (hasFirstProperty) {
    value = obj[property];
  } else if (hasSecondProperty) {
    value = obj[property][property2];
  } else {
    value = '';
  }

  return value;
}

exports.look = look;