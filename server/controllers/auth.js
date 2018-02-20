const db = require('../lib/db');
const Unauthorized = require('../lib/errors/Unauthorized');
const InternalServerError = require('../lib/errors/InternalServerError');
const Topic = require('../lib/topic');


// POST /auth/login
exports.login = login;

// // GET /auth/logout
// exports.logout = logout;

// // POST /auth/reload
// exports.reload = reload;


/**
 * @method login
 *
 * @description
 * Logs a client into the server.  The /login route accepts a POST request with
 * a username, password, and project id.  It checks if the username and password
 * exist in the database, then verifies that the user has permission to access
 * the database all enterprise, project, and user data for easy access.
 */
function login(req, res, next) {
  const username = req.body.username;
  const password = req.body.password;

}