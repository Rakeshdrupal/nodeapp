import dotEnv from 'dotenv';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
// normalize the environmental variable name
const env = process.env.NODE_ENV.toLowerCase();
// decode the file path for the environmental variables.
const dotfile = `.env.${env}`.trim();
console.log(dotfile)
// load the environmental variables into process using the dotenv module
dotEnv.config({path: dotfile});

import http from 'http';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
const session  = require('express-session');
import passport from 'passport';
const LocalStrategy   = require('passport-local').Strategy;

const SERVER_SECRET = 'ohgodpleasenobug';
const db = require('./lib/db');
//Configure passport middleware
require('./config/passport')(passport,LocalStrategy,db);

const app = express();
const debug = require('debug')('app');
const port = process.env.PORT;
const mode = process.env.NODE_ENV;
// Configure application middleware stack, inject authentication session
require('./config/express').configure(app,passport);

// Link routes
require('./config/routes').configure(app,passport,SERVER_SECRET);

// // link error handling
require('./config/express').errorHandling(app);
app.server = http
    .createServer(app)
    .listen(process.env.PORT, () => {
        console.log(`configureServer(): Server started in mode ${mode} on port ${port}.`);
    });

// ensure the process terminates gracefully when an error occurs.
process.on('uncaughtException', (e) => {
//  debug('process.onUncaughException: %o', e);
  process.exit(1);
});

process.on('warning', (warning) => {
  debug('process.onWarning: %o', warning);
});



export default app;
