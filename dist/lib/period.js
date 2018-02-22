'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// @TODO This is an exact copy of the client 'PeriodService', this code should
//       to determine if it's angular or node and inject accordingly - removing
//       the duplication.
var Moment = require('moment');

var PeriodService = function () {
  function PeriodService(clientTimestamp) {
    _classCallCheck(this, PeriodService);

    var self = this;
    this.timestamp = new Moment(clientTimestamp);

    this.periods = {
      today: {
        key: 'today',
        translateKey: 'PERIODS.TODAY',
        limit: calculatePeriodLimit('date')
      },
      week: {
        key: 'week',
        translateKey: 'PERIODS.THIS_WEEK',
        limit: calculatePeriodLimit('week')
      },
      month: {
        key: 'month',
        translateKey: 'PERIODS.THIS_MONTH',
        limit: calculatePeriodLimit('month')
      },
      year: {
        key: 'year',
        translateKey: 'PERIODS.THIS_YEAR',
        limit: calculatePeriodLimit('year')
      },
      yesterday: {
        key: 'yesterday',
        translateKey: 'PERIODS.YESTERDAY',
        limit: calculatePeriodLimit('date', -1)
      },
      lastWeek: {
        key: 'lastWeek',
        translateKey: 'PERIODS.LAST_WEEK',
        limit: calculatePeriodLimit('week', -1)
      },
      lastMonth: {
        key: 'lastMonth',
        translateKey: 'PERIODS.LAST_MONTH',
        limit: calculatePeriodLimit('month', -1)
      },
      lastYear: {
        key: 'lastYear',
        translateKey: 'PERIODS.LAST_YEAR',
        limit: calculatePeriodLimit('year', -1)
      },

      // components will make an exception for all time - no period has to be selected
      // on the server this simple removes the WHERE condition
      allTime: {
        key: 'allTime',
        translateKey: 'PERIODS.ALL_TIME'
      },

      custom: {
        key: 'custom',
        translateKey: 'PERIODS.CUSTOM'
      }
    };

    function calculatePeriodLimit(periodKey, modifier) {
      var dateModifier = modifier || 0;
      var currentPeriod = Moment().get(periodKey);

      return {
        start: function start() {
          return new Moment(self.timestamp).set(periodKey, currentPeriod + dateModifier).startOf(periodKey).toDate();
        },
        end: function end() {
          return new Moment(self.timestamp).set(periodKey, currentPeriod + dateModifier).endOf(periodKey).toDate();
        }
      };
    }
  }

  _createClass(PeriodService, [{
    key: 'lookupPeriod',
    value: function lookupPeriod(key) {
      return this.periods[key];
    }
  }]);

  return PeriodService;
}();

module.exports = PeriodService;