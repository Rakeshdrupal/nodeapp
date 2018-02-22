'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var db = require('../lib/db');
var Unauthorized = require('../lib/errors/Unauthorized');
var InternalServerError = require('../lib/errors/InternalServerError');
var Topic = require('../lib/topic');

var auth = {};
/**
 * @method login
 *
 * @description
 * Logs a client into the server.  The /login route accepts a POST request with
 * a username, password, and project id.  It checks if the username and password
 * exist in the database, then verifies that the user has permission to access
 * the database all enterprise, project, and user data for easy access.
 */
auth.login = function (req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  var projectId = req.body.project;
  var param = {};

  var sql = '\n    SELECT \n      user.id, user.username, user.display_name, user.email, user.deactivated, \n      project.enterprise_id , project.id AS project_id\n    FROM user \n    JOIN \n    project_permission JOIN project ON user.id = project_permission.user_id \n    AND project.id = project_permission.project_id\n    WHERE \n      user.username = ? AND user.password = PASSWORD(?) \n      AND project_permission.project_id = ?;\n  ';

  var sqlUser = '\n    SELECT user.id FROM user\n    WHERE user.username = ? AND user.password = PASSWORD(?)';

  var sqlPermission = 'SELECT permission.id FROM permission\n    JOIN user ON user.id = permission.user_id\n    WHERE user.username = ? AND user.password = PASSWORD(?)';

  db.exec(sql, [username, password, projectId]).then(function (rows) {
    param.connect = rows;

    return db.exec(sqlUser, [username, password]);
  }).then(function (rows) {
    param.user = rows;
    return db.exec(sqlPermission, [username, password]);
  }).then(function (rows) {
    param.permission = rows;
    var connect = param.connect.length;
    var permission = param.permission.length;
    var user = param.user.length;

    if (connect === 1) {
      if (Boolean(param.connect[0].deactivated)) {
        throw new Unauthorized('The user is not activated, contact the administrator', 'FORM.ERRORS.LOCKED_USER');
      }

      if (permission === 0) {
        throw new Unauthorized('No permissions in the database.', 'ERRORS.NO_PERMISSIONS');
      }
    } else if (connect === 0) {
      if (user === 0) {
        throw new Unauthorized('Bad username and password combination.');
      } else {
        throw new Unauthorized('No permissions for that project.', 'ERRORS.NO_PROJECT');
      }
    }

    return loadSessionInformation(param.connect[0]);
  }).then(function (session) {
    // bind the session variables
    req.session.project = session.project;
    req.session.user = session.user;
    req.session.enterprise = session.enterprise;
    req.session.paths = session.paths;

    // broadcast LOGIN event
    Topic.publish(Topic.channels.APP, {
      event: Topic.events.LOGIN,
      entity: Topic.entities.USER,
      user_id: req.session.user.id,
      id: session.user.id
    });

    // send the session data back to the client
    res.status(200).json(session);
  }).catch(next).done();
};

exports.default = auth;