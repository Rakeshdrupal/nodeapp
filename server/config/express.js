/**
 * @overview
 * The application's middleware configuration.
 *
 * @todo - this could probably be separated by functionality.
 */

const express = require('express');
const compress = require('compression');
const bodyParser = require('body-parser');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const Redis = require('ioredis');
const morgan = require('morgan');
const winston = require('winston');
const _ = require('lodash');
const helmet = require('helmet');

const debug = require('debug')('app');
const debugHTTP = require('debug')('http');

const interceptors = require('./interceptors');
const { Unauthorized } = require('../lib/errors');
const uploads = require('../lib/uploader');

const days = 1000 * 60 * 60 * 24;
const publicRoutes = [
  '/auth/login',
  '/languages',
  '/projects/',
  '/auth/logout',
  '/install',
  '/currencies',
];

// accept generic express instances (initialised in app.js)
export function configure(app) {
  // TODO - things don't work well yet.
  // const isProduction = (process.env.NODE_ENV === 'production');
  const isProduction = false;

  debug('configuring middleware.');

  // helmet guards
  app.use(helmet());
  app.use(compress());

  app.use(bodyParser.json({ limit : '8mb' }));
  app.use(bodyParser.urlencoded({ extended : false }));

  // this will disable the session from expiring on the server (redis-session)
  // during development
  const disableTTL = !isProduction;

  // stores session in a file store so that server restarts do not interrupt
  // client sessions.
  const sess = {
    store : new RedisStore({
      disableTTL,
      client : new Redis(),
    }),
    secret            : process.env.SESS_SECRET,
    resave            : false,
    saveUninitialized : false,
    unset             : 'destroy',
    cookie            : { httpOnly : true },
    retries           : 20,
  };

  // indicate that we are running behind a trust proxy and should use a secure cookie
  if (isProduction) {
    app.set('trust proxy', true);
    sess.cookie.secure = true;
  }

  // bind the session to the middleware
  app.use(session(sess));

  // provide a stream for morgan to write to
  const stream = {
    write : message => debugHTTP(message.trim()),
  };

  // http logger setup
  // options: combined | common | dev | short | tiny
  app.use(morgan('short', { stream }));

  // public static directories include the entire client and the uploads
  // directory.
  const params = {
    maxAge : isProduction ? 7 * days : 0,
  };

  app.use(express.static('client/', params));
  app.use(`/${uploads.directory}`, express.static(uploads.directory));

  // quick way to find out if a value is in an array
  function within(value, array) { return array.indexOf(value.trim()) !== -1; }

  // Only allow routes to use /login, /projects, /logout, and /languages if a
  // user session does not exists

  app.use((req, res, next) => {
    if (_.isUndefined(req.session.user) && !within(req.path, publicRoutes)) {
      debug(`Rejecting unauthorized access to ${req.path} from ${req.ip}`);
      next(new Unauthorized('You are not logged into the system.'));
    } else {
      next();
    }
  });
};

// configures error handlers
export function errorHandling(app) {
  app.use(interceptors.handler);
};