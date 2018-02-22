'use strict';

var BadRequest = require('./BadRequest');
var NotFound = require('./NotFound');
var Unauthorized = require('./Unauthorized');
var Forbidden = require('./Forbidden');
var InternalServerError = require('./InternalServerError');

module.exports = {
  BadRequest: BadRequest,
  NotFound: NotFound,
  Unauthorized: Unauthorized,
  Forbidden: Forbidden,
  InternalServerError: InternalServerError
};