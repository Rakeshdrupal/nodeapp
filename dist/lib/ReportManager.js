'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @overview ReportManager
 *
 * @description
 * The report manager is a wrapper for bhima's reporting capabilities, providing
 * easy ways to create JSON/HTML/PDF reports from templates and data.
 *
 * @todo
 *  1. Create a generic Report API for reading reports from the database and
 *    sending them back to the client.
 *  2. Complete the methods for saving reports
 *
 * @requires lodash
 * @requires path
 * @requires fs
 * @requires q
 * @requires uuid/v4
 * @requires lib/helpers/translate
 * @requires lib/errors/BadRequest
 * @requires lib/errors/InternalServerError
 * @requires lib/db
 */

var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var q = require('q');
var uuid = require('uuid/v4');
var translateHelper = require('./helpers/translate');

var BadRequest = require('./errors/BadRequest');
var InternalServerError = require('./errors/InternalServerError');
var db = require('./db');

// renderers
var renderers = {
  json: require('./renderers/json'),
  html: require('./renderers/html'),
  pdf: require('./renderers/pdf'),
  csv: require('./renderers/csv'),
  xlsx: require('./renderers/xlsx')
};

// default report configuration
var defaults = {
  pageSize: 'A4',
  orientation: 'portrait',
  lang: 'en',
  renderer: 'pdf'
};

// Constants
var SAVE_DIR = path.resolve(path.join(__dirname, '../reports/'));

var SAVE_SQL = '\n  INSERT INTO saved_report SET ?;\n';

// Class Declaration

var ReportManager = function () {
  /**
   * @constructor
   *
   * @description
   * The ReportManager takes in a template path information and rendering
   * options.  It returns an instance of the report manager, ready to be
   * prepared with session data and rendered with data.
   *
   * @param {String} templatePath - the path to the template file
   * @param {Object} metadata - any metadata that needs to appear in the report
   * @param {Object} options - rendering + default options for the report
   */
  function ReportManager(templatePath, metadata, options) {
    _classCallCheck(this, ReportManager);

    this.options = _.clone(options || {});

    // merge options into default options
    _.defaults(this.options, defaults);

    // default to the session user
    if (metadata && metadata.user) {
      this.options.user = metadata.user;
    }

    // normalize the path for different operating systems
    this.template = path.normalize(templatePath);

    // set the renderer based on the provided options
    this.renderer = renderers[this.options.renderer || this.defaults.renderer];

    if (!this.renderer) {
      throw new BadRequest('The application does not support rendering ' + options.renderer + '.', 'ERRORS.INVALID_RENDERER');
    }

    // @TODO user information could be determined by report manager, removing the need for this check
    if (this.options.saveReport && !this.options.user) {
      var invalidSaveDescription = 'Report cannot be saved without providing a `user` entity to ReportManager';
      throw new InternalServerError(invalidSaveDescription);
    }

    // remove render-specific options
    delete options.renderer;
    delete options.csvKey;
    delete options.filename;
    delete options.lang;

    // set the metadata
    this.metadata = metadata;
    delete this.metadata.path;
  }

  /**
   * @method render
   *
   * @description
   * This method renders the final report as needed.
   *
   * @param {Object} data - the report data to be passed to the renderer's
   *    render() function.
   */


  _createClass(ReportManager, [{
    key: 'render',
    value: function render(data) {
      var _this = this;

      var metadata = this.metadata;
      var renderer = this.renderer;

      // set the render timestamp
      metadata.timestamp = new Date();

      // @TODO fit this better into the code flow
      // sanitise save report option
      this.options.saveReport = Boolean(Number(this.options.saveReport));

      // merge the data object before templating
      _.merge(data, { metadata: metadata });

      // render the report using the stored renderer
      var promise = renderer.render(data, this.template, this.options);

      // send back the headers and report
      return promise.then(function (reportStream) {
        _this.stream = reportStream;

        var renderHeaders = renderer.headers;
        var report = reportStream;

        if (_this.options.filename) {
          var translate = translateHelper(_this.options.lang);
          var translatedName = translate(_this.options.filename);
          var fileDate = new Date().toLocaleDateString();
          var formattedName = translatedName + ' ' + fileDate;
          renderHeaders['Content-Disposition'] = 'filename=' + formattedName + renderer.extension;
          renderHeaders.filename = '' + formattedName + renderer.extension;
        }

        // FIXME this branching logic should be promised based
        if (_this.options.saveReport) {
          // FIXME This is not correctly deferred
          // FIXME PDF report is sent back to the client even though this is a save operation
          // FIXME Errors are not propagated
          return _this.save().then(function () {
            return { headers: renderHeaders, report: report };
          });
        }
        return { headers: renderHeaders, report: report };
      });
    }

    /**
     * @method save
     *
     * @description
     * This method saves the report in the report directory to be looked up later.
     */

  }, {
    key: 'save',
    value: function save() {
      var dfd = q.defer();

      if (!this.stream) {
        return q.reject('\n        ReportManger.render() must be called and complete before saving the\n        report.\n      ');
      }

      // generate a unique id for the report name
      var reportId = uuid();
      var options = this.options;

      // make the report name using the
      var fname = reportId + this.renderer.extension;
      var link = path.join(SAVE_DIR, fname);

      var data = {
        uuid: db.bid(reportId),
        label: options.label,
        link: link,
        timestamp: new Date(),
        user_id: options.user.id,
        report_id: options.reportId
      };

      fs.writeFile(link, this.stream, function (err) {
        if (err) {
          return dfd.reject(err);
        }

        return db.exec(SAVE_SQL, data).then(function () {
          return dfd.resolve({ uuid: reportId });
        }).catch(dfd.reject).done();
      });

      return dfd.promise;
    }
  }]);

  return ReportManager;
}();

module.exports = ReportManager;