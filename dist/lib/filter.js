'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint class-methods-use-this:off */

var _ = require('lodash');
var moment = require('moment');

var Periods = require('./period');

var RESERVED_KEYWORDS = ['limit', 'detailed'];
var DEFAULT_LIMIT_KEY = 'limit';
var DEFAULT_UUID_PARTIAL_KEY = 'uuid';

// @FIXME patch code - this could be implemented in another library
//
// IF no client_timestamp is passed with the request, the server's timestamp is used
// IF a client_timestamp is passed the client timestamp is used
// const PERIODS = {
// today : () => { return { start : moment().toDate(), end : moment().toDate() } },
// week : () => { return { start : moment().startOf('week').toDate(), end : moment().endOf('week').toDate() } },
// month : () => {  return { start : moment().startOf('month').toDate(), end : moment().endOf('month').toDate() } }
// };
/**
 * @class FilterParser
 *
 * @description
 * This library provides a uniform interface for processing filter `options`
 * sent from the client to server controllers.
 * It providers helper methods for commonly request filters like date restrictions
 * and standardises the conversion to valid SQL.
 *
 * It implements a number of built in 'Filter Types' that allow column qurries
 * to be formatted for tasks that are frequently required.
 *
 * Supported Filter Types:
 * * equals - a direct comparison
 * * text - search for text contained within a text field
 * * dateFrom - limit the querry to records from a date
 * * dateTo - limit the querry to records up until a date
 *
 * @requires lodash
 * @requires moment
 */

var FilterParser = function () {
  // options that are used by all routes that shouldn't be considered unique filters
  function FilterParser() {
    var filters = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, FilterParser);

    // stores for processing options
    this._statements = [];
    this._parameters = [];

    this._filters = _.clone(filters);

    // configure default options
    this._tableAlias = options.tableAlias || null;
    this._limitKey = options.limitKey || DEFAULT_LIMIT_KEY;
    this._order = '';
    this._parseUuids = _.isUndefined(options.parseUuids) ? true : options.parseUuids;
    this._autoParseStatements = _.isUndefined(options.autoParseStatements) ? false : options.autoParseStatements;
    this._group = '';
  }

  /**
   * @method text
   *
   * @description
   * filter by text value, searches for value anywhere in the database attribute
   * alias for _addFilter method
   *
   * @param {String} filterKey    key attribute on filter object to be used in filter
   * @param {String} columnAlias  column to be used in filter query. This will default to
   *                              the filterKey if not set
   * @param {String} tableAlias   table to be used in filter query. This will default to
   *                              the object table alias if it exists
   */


  _createClass(FilterParser, [{
    key: 'fullText',
    value: function fullText(filterKey) {
      var columnAlias = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : filterKey;
      var tableAlias = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this._tableAlias;

      var tableString = this._formatTableAlias(tableAlias);

      if (this._filters[filterKey]) {
        var searchString = '%' + this._filters[filterKey] + '%';
        var preparedStatement = 'LOWER(' + tableString + columnAlias + ') LIKE ? ';

        this._addFilter(preparedStatement, searchString);
        delete this._filters[filterKey];
      }
    }
  }, {
    key: 'period',
    value: function period(filterKey) {
      var columnAlias = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : filterKey;
      var tableAlias = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this._tableAlias;

      var tableString = this._formatTableAlias(tableAlias);

      if (this._filters[filterKey]) {
        // if a client timestamp has been passed - this will be passed in here
        var period = new Periods(this._filters.client_timestamp);
        var targetPeriod = period.lookupPeriod(this._filters[filterKey]);

        // specific base case - if all time requested to not apply a date filter
        if (targetPeriod === period.periods.allTime || targetPeriod === period.periods.custom) {
          delete this._filters[filterKey];
          return;
        }

        var periodFromStatement = 'DATE(' + tableString + columnAlias + ') >= DATE(?)';
        var periodToStatement = 'DATE(' + tableString + columnAlias + ') <= DATE(?)';

        this._addFilter(periodFromStatement, targetPeriod.limit.start());
        this._addFilter(periodToStatement, targetPeriod.limit.end());
        delete this._filters[filterKey];
      }
    }

    /**
     * @method dateFrom
     *
     * @param {String} filterKey    key attribute on filter object to be used in filter
     * @param {String} columnAlias  column to be used in filter query. This will default to
     *                              the filterKey if not set
     * @param {String} tableAlias   table to be used in filter query. This will default to
     *                              the object table alias if it exists
     */

  }, {
    key: 'dateFrom',
    value: function dateFrom(filterKey) {
      var columnAlias = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : filterKey;
      var tableAlias = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this._tableAlias;

      var tableString = this._formatTableAlias(tableAlias);

      if (this._filters[filterKey]) {
        var preparedStatement = 'DATE(' + tableString + columnAlias + ') >= DATE(?)';
        this._addFilter(preparedStatement, moment(this._filters[filterKey]).format('YYYY-MM-DD').toString());

        delete this._filters[filterKey];
      }
    }

    /**
     * @method dateTo
     *
     * @param {String} filterKey    key attribute on filter object to be used in filter
     * @param {String} columnAlias  column to be used in filter query. This will default to
     *                              the filterKey if not set
     * @param {String} tableAlias   table to be used in filter query. This will default to
     *                              the object table alias if it exists
     */

  }, {
    key: 'dateTo',
    value: function dateTo(filterKey) {
      var columnAlias = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : filterKey;
      var tableAlias = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this._tableAlias;

      var tableString = this._formatTableAlias(tableAlias);

      if (this._filters[filterKey]) {
        var preparedStatement = 'DATE(' + tableString + columnAlias + ') <= DATE(?)';

        this._addFilter(preparedStatement, moment(this._filters[filterKey]).format('YYYY-MM-DD').toString());
        delete this._filters[filterKey];
      }
    }
  }, {
    key: 'equals',
    value: function equals(filterKey) {
      var columnAlias = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : filterKey;
      var tableAlias = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this._tableAlias;
      var isArray = arguments[3];

      var tableString = this._formatTableAlias(tableAlias);

      if (this._filters[filterKey]) {
        var valueString = '?';
        var preparedStatement = '';

        if (isArray) {
          // search in a list of values, example : where id in (1,2,3)
          preparedStatement = '' + tableString + columnAlias + ' in (' + valueString + ')';
        } else {
          // seach equals one value , example : where id = 2
          preparedStatement = '' + tableString + columnAlias + ' = ' + valueString;
        }

        this._addFilter(preparedStatement, this._filters[filterKey]);
        delete this._filters[filterKey];
      }
    }

    /**
     * @method custom
     * @public
     *
     * @description
     * Allows a user to write custom SQL with either single or multiple
     * parameters.  The syntax is reminiscent of db.exec() in dealing with
     * arrays.
     */

  }, {
    key: 'custom',
    value: function custom(filterKey, preparedStatement, preparedValue) {
      if (this._filters[filterKey]) {
        var searchValue = preparedValue || this._filters[filterKey];
        var isParameterArray = _.isArray(searchValue);

        this._statements.push(preparedStatement);

        // gracefully handle array-like parameters by spreading them
        if (isParameterArray) {
          var _parameters;

          (_parameters = this._parameters).push.apply(_parameters, _toConsumableArray(searchValue));
        } else {
          this._parameters.push(searchValue);
        }

        delete this._filters[filterKey];
      }
    }
  }, {
    key: 'customMultiParameters',
    value: function customMultiParameters(filterKey, preparedStatement, preparedValues) {
      if (this._filters[filterKey]) {
        var _parameters2;

        var parameters = preparedValues || this._filters[filterKey];

        // add the filters to the custom query, destructing parameters
        this._statements.push(preparedStatement);
        (_parameters2 = this._parameters).push.apply(_parameters2, _toConsumableArray(parameters));

        delete this._filters[filterKey];
      }
    }

    /**
     * @method setOrder
     *
     * @description
     * Allows setting the SQL ordering on complex queries - this should be
     * exposed through the same interface as all other filters.
     */

  }, {
    key: 'setOrder',
    value: function setOrder(orderString) {
      this._order = orderString;
    }

    /**
     * @method setGroup
     *
     * @description
     * Allows setting the SQL groups in the GROUP BY statement.  A developer is expected to
     * provide a valid SQL string.  This will be appended to the SQL statement after the
     * WHERE clause.
     */

  }, {
    key: 'setGroup',
    value: function setGroup(groupString) {
      this._group = groupString;
    }
  }, {
    key: 'applyQuery',
    value: function applyQuery(sql) {
      // optionally call utility method to parse all remaining options as simple
      // equality filters into `_statements`
      var limitCondition = this._parseLimit();

      if (this._autoParseStatements) {
        this._parseDefaultFilters();
      }

      var conditionStatements = this._parseStatements();
      var order = this._order;
      var group = this._group;

      return sql + ' WHERE ' + conditionStatements + ' ' + group + ' ' + order + ' ' + limitCondition;
    }
  }, {
    key: 'parameters',
    value: function parameters() {
      return this._parameters;
    }

    // this method only applies a table alias if it exists

  }, {
    key: '_formatTableAlias',
    value: function _formatTableAlias(table) {
      return table ? table + '.' : '';
    }

    /**
     * @method _addFilter
     *
     * @description
     * Private method - populates the private statement and parameter variables
     */

  }, {
    key: '_addFilter',
    value: function _addFilter(statement, parameter) {
      this._statements.push(statement);
      this._parameters.push(parameter);
    }

    /**
     * @method _parseDefaultFilters
     *
     * @description
     * Utility method for parsing any filters passed to the search that do not
     * have filter types - these always check for equality
     */

  }, {
    key: '_parseDefaultFilters',
    value: function _parseDefaultFilters() {
      var _this = this;

      // remove options that represent reserved keys
      this._filters = _.omit(this._filters, RESERVED_KEYWORDS);

      _.each(this._filters, function (value, key) {
        var valueString = '?';
        var tableString = _this._formatTableAlias(_this._tableAlias);

        if (_this._parseUuids) {
          // check to see if key contains the text uuid - if it does and parseUuids has
          // not been suppressed, automatically parse the value as binary
          if (key.includes(DEFAULT_UUID_PARTIAL_KEY)) {
            valueString = 'HUID(?)';
          }
        }
        _this._addFilter('' + tableString + key + ' = ' + valueString, value);
      });
    }
  }, {
    key: '_parseStatements',
    value: function _parseStatements() {
      // this will always return true for a condition statement
      var DEFAULT_NO_STATEMENTS = '1';
      return _.isEmpty(this._statements) ? DEFAULT_NO_STATEMENTS : this._statements.join(' AND ');
    }
  }, {
    key: '_parseLimit',
    value: function _parseLimit() {
      var limitString = '';
      var limit = Number(this._filters[this._limitKey]);

      if (limit) {
        limitString = 'LIMIT ' + limit + ' ';
      }

      return limitString;
    }
  }]);

  return FilterParser;
}();

module.exports = FilterParser;