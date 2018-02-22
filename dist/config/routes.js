'use strict';

var _auth = require('../controllers/auth');

var _auth2 = _interopRequireDefault(_auth);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @overview routes
 * Application Routing
 *
 * This file initializes the links between route controllers and the express
 * HTTP server.
 *
 * @todo Pass authenticate and authorize middleware down through controllers,
 * allowing for modules to subscribe to different levels of authority
 *
 * @requires uploader
 */

var debug = require('debug')('app');
var upload = require('../lib/uploader');

// expose routes to the server.
exports.configure = function configure(app) {

  app.post('/auth/login', _auth2.default.login);
};