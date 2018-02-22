'use strict';

/**
 * @overview
 * The application's middleware configuration.
 *
 * @todo - this could probably be separated by functionality.
 */

var express = require('express');
var compress = require('compression');
var bodyParser = require('body-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var Redis = require('ioredis');
var morgan = require('morgan');
var winston = require('winston');
var _ = require('lodash');
var helmet = require('helmet');

var debug = require('debug')('app');
var debugHTTP = require('debug')('http');

var interceptors = require('./interceptors');

var _require = require('../lib/errors'),
    Unauthorized = _require.Unauthorized;

var uploads = require('../lib/uploader');

var days = 1000 * 60 * 60 * 24;
var publicRoutes = ['/auth/login', '/languages', '/projects/', '/auth/logout', '/install', '/currencies'];

// accept generic express instances (initialised in app.js)
exports.configure = function configure(app) {
  // TODO - things don't work well yet.
  // const isProduction = (process.env.NODE_ENV === 'production');
  var isProduction = false;

  debug('configuring middleware.');

  // helmet guards
  app.use(helmet());
  app.use(compress());

  app.use(bodyParser.json({ limit: '8mb' }));
  app.use(bodyParser.urlencoded({ extended: false }));

  // this will disable the session from expiring on the server (redis-session)
  // during development
  var disableTTL = !isProduction;

  // // stores session in a file store so that server restarts do not interrupt
  // // client sessions.
  var sess = {
    store: new RedisStore({
      disableTTL: disableTTL,
      client: new Redis()
    }),
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: false,
    unset: 'destroy',
    cookie: { httpOnly: true },
    retries: 20
  };

  // indicate that we are running behind a trust proxy and should use a secure cookie
  if (isProduction) {
    app.set('trust proxy', true);
    sess.cookie.secure = true;
  }

  // bind the session to the middleware
  // app.use(session(sess));

  // provide a stream for morgan to write to
  var stream = {
    write: function write(message) {
      return debugHTTP(message.trim());
    }
  };
  debug(stream);

  // http logger setup
  // options: combined | common | dev | short | tiny
  app.use(morgan('short', { stream: stream }));

  // public static directories include the entire client and the uploads
  // directory.
  var params = {
    maxAge: isProduction ? 7 * days : 0
  };

  app.use(express.static('client/', params));
  app.use('/' + uploads.directory, express.static(uploads.directory));

  // quick way to find out if a value is in an array
  function within(value, array) {
    return array.indexOf(value.trim()) !== -1;
  }

  // Only allow routes to use /login, /projects, /logout, and /languages if a
  // user session does not exists

  app.use(function (req, res, next) {
    next();
    // if (_.isUndefined(req.session.user) && !within(req.path, publicRoutes)) {
    //   debug(`Rejecting unauthorized access to ${req.path} from ${req.ip}`);
    //   next(new Unauthorized('You are not logged into the system.'));
    // } else {
    //   next();
    // }
  });
};

// configures error handlers
exports.errorHandling = function errorHandling(app) {
  app.use(interceptors.handler);
};