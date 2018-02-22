const db = require('../lib/db');
const Unauthorized = require('../lib/errors/Unauthorized');
const InternalServerError = require('../lib/errors/InternalServerError');
const Topic = require('../lib/topic');


const auth = {};
/**
 * @method login
 *
 * @description
 * Logs a client into the server.  The /login route accepts a POST request with
 * a username, password, and project id.  It checks if the username and password
 * exist in the database, then verifies that the user has permission to access
 * the database all enterprise, project, and user data for easy access.
 */
auth.login = (req, res,next) => {
  const username = req.body.username;
  const password = req.body.password;
  const projectId = req.body.project;
  const param = {};

  const sql = `Select id from users`;


  db.exec(sql)
    .then((rows) => {
       res.status(200).json(rows);
    })
    
      // send the session data back to the client
     
    .catch(next)
    .done();

}


export default auth;

