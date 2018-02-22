'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _dotenv = require('dotenv');

var _dotenv2 = _interopRequireDefault(_dotenv);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
// normalize the environmental variable name
var env = process.env.NODE_ENV.toLowerCase();
// decode the file path for the environmental variables.
var dotfile = ('.env.' + env).trim();
console.log(dotfile);
// load the environmental variables into process using the dotenv module
_dotenv2.default.config({ path: dotfile });

var app = (0, _express2.default)();
var port = process.env.PORT;
var mode = process.env.NODE_ENV;

// Configure application middleware stack, inject authentication session
require('./config/express').configure(app, _passport2.default);

// Link routes
require('./config/routes').configure(app, _passport2.default);

// // link error handling
require('./config/express').errorHandling(app, _passport2.default);
app.server = _http2.default.createServer(app).listen(process.env.PORT, function () {
  console.log('configureServer(): Server started in mode ' + mode + ' on port ' + port + '.');
});

// ensure the process terminates gracefully when an error occurs.
process.on('uncaughtException', function (e) {
  debug('process.onUncaughException: %o', e);
  process.exit(1);
});

process.on('warning', function (warning) {
  debug('process.onWarning: %o', warning);
});

exports.default = app;