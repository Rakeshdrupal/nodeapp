'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/* eslint import/no-unresolved:off */
/**
 * @module NumberToText
 *
 *
 */

var _ = require('lodash');

var en = require('../../client/i18n/en.json');
var fr = require('../../client/i18n/fr.json');

exports.convert = convert;

var dictionary = void 0;
var languageKey = void 0;

/**
*
* Source: http://stackoverflow.com/questions/14766951/convert-digits-into-words-with-javascript
* >> Comment number 15
* "Deceptively simple task." – Potatoswatter
* Indeed. There's many little devils hanging out in the details of this problem. It was very fun to solve tho.
* EDIT: This update takes a much more compositional approach.
*  Previously there was one big function which wrapped a couple other proprietary functions.
*  Instead, this time we define generic reusable functions which could be used for many varieties of tasks.
*  More about those after we take a look at numToWords itself …
*/

function convert(input, lang, currencyName) {
  // Round to at most 2 decimal places
  var number = _.round(input, 2);

  languageKey = lang;
  dictionary = String(lang).toLowerCase() === 'fr' ? fr : en;

  var a = ['', _.get(dictionary, 'NUMBERS.ONE'), _.get(dictionary, 'NUMBERS.TWO'), _.get(dictionary, 'NUMBERS.THREE'), _.get(dictionary, 'NUMBERS.FOUR'), _.get(dictionary, 'NUMBERS.FIVE'), _.get(dictionary, 'NUMBERS.SIX'), _.get(dictionary, 'NUMBERS.SEVEN'), _.get(dictionary, 'NUMBERS.EIGHT'), _.get(dictionary, 'NUMBERS.NINE'), _.get(dictionary, 'NUMBERS.TEN'), _.get(dictionary, 'NUMBERS.ELEVEN'), _.get(dictionary, 'NUMBERS.TWELVE'), _.get(dictionary, 'NUMBERS.THIRTEEN'), _.get(dictionary, 'NUMBERS.FOURTEEN'), _.get(dictionary, 'NUMBERS.FIFTEEN'), _.get(dictionary, 'NUMBERS.SIXTEEN'), _.get(dictionary, 'NUMBERS.SEVENTEEN'), _.get(dictionary, 'NUMBERS.EIGHTEEN'), _.get(dictionary, 'NUMBERS.NINETEEN')];

  var b = ['', '', _.get(dictionary, 'NUMBERS.TWENTY'), _.get(dictionary, 'NUMBERS.THIRTY'), _.get(dictionary, 'NUMBERS.FORTY'), _.get(dictionary, 'NUMBERS.FIFTY'), _.get(dictionary, 'NUMBERS.SIXTY'), _.get(dictionary, 'NUMBERS.SEVENTY'), _.get(dictionary, 'NUMBERS.EIGHTY'), _.get(dictionary, 'NUMBERS.NINETY')];

  var g = ['', _.get(dictionary, 'NUMBERS.THOUSAND'), _.get(dictionary, 'NUMBERS.MILLION'), _.get(dictionary, 'NUMBERS.BILLION'), _.get(dictionary, 'NUMBERS.TRILLION'), _.get(dictionary, 'NUMBERS.QUADRILLION'), _.get(dictionary, 'NUMBERS.QUINTILLION'), _.get(dictionary, 'NUMBERS.SEXTILLION'), _.get(dictionary, 'NUMBERS.SEPTILLION'), _.get(dictionary, 'NUMBERS.OCTILLION'), _.get(dictionary, 'NUMBERS.NONILLION')];

  var arr = function arr(x) {
    return Array.from(x);
  };
  var num = function num(x) {
    return Number(x) || 0;
  };
  var isEmpty = function isEmpty(xs) {
    return xs.length === 0;
  };
  var take = function take(n) {
    return function (xs) {
      return _.slice(xs, 0, n);
    };
  };
  var drop = function drop(n) {
    return function (xs) {
      return _.slice(xs, n);
    };
  };
  var reverse = function reverse(xs) {
    return _.slice(xs, 0).reverse();
  };
  var comp = function comp(f) {
    return function (y) {
      return function (x) {
        return f(y(x));
      };
    };
  };
  var not = function not(x) {
    return !x;
  };

  var chunk = function chunk(n) {
    return function (xs) {
      if (isEmpty(xs)) {
        return [];
      }
      return [take(n)(xs)].concat(_toConsumableArray(chunk(n)(drop(n)(xs))));
    };
  };

  var formatHundreds = function formatHundreds(huns) {
    var isZero = num(huns) === 0;
    var isOne = huns === 1;
    var isFrench = languageKey === 'fr';

    if (isZero) {
      return '';
    } else if (isFrench && isOne) {
      return ' ' + _.get(dictionary, 'NUMBERS.HUNDRED') + ' ';
    }

    return a[huns] + ' ' + _.get(dictionary, 'NUMBERS.HUNDRED') + ' ';
  };

  var formatOnes = function formatOnes(ones, tens) {
    var isZero = num(ones) === 0;
    if (isZero) {
      return b[tens];
    } else if (b[tens]) {
      return b[tens] + '-';
    }

    return '';
  };

  var numToWords = function numToWords(numbr) {
    var makeGroup = function makeGroup(_ref) {
      var _ref2 = _slicedToArray(_ref, 3),
          onesx = _ref2[0],
          tens = _ref2[1],
          hunsx = _ref2[2];

      var huns = _.parseInt(hunsx);
      var ones = _.parseInt(onesx);

      return [formatHundreds(huns), formatOnes(ones, tens), a[tens + ones] || a[ones]].join('');
    };

    var thousand = function thousand(group, i) {
      if (group === '') {
        return group;
      } else if (group === a[1] && languageKey === 'fr' && g[i] === g[1]) {
        return ' ' + g[i];
      }

      return group + ' ' + g[i];
    };

    if (typeof numbr === 'number') {
      return numToWords(String(number));
    } else if (numbr === '0') {
      return _.get(dictionary, 'NUMBERS.ZERO');
    }

    return comp(chunk(3))(reverse)(arr(numbr)).map(makeGroup).map(thousand).filter(comp(not)(isEmpty)).reverse().join(' ');
  };

  var numberString = String(number);
  var numberPart = _.split(numberString, '.');
  var numberText = numToWords(numberPart[0]);

  numberText = numberPart[1] ? numberText + ' ' + _.get(dictionary, 'NUMBERS.POINT') + '  ' + numToWords(numberPart[1]) : numberText;

  return numberText + ' ' + currencyName;
}