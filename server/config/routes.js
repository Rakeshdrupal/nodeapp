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

const debug = require('debug')('app');
const upload = require('../lib/uploader');

// unclassified routes
const auth = require('../controllers/auth');

// expose routes to the server.
exports.configure = function configure(app) {

  app.post('/auth/login', auth.login);

};
