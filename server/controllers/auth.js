const db = require('../lib/db');
const Unauthorized = require('../lib/errors/Unauthorized');
const InternalServerError = require('../lib/errors/InternalServerError');
const Topic = require('../lib/topic');
import passport from 'passport';

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
auth.login = (req, res, next) => {
  //  db.exec("SELECT * FROM users WHERE username = ?",[username], function(err, rows){
  //                console.log(rows);
  //               //debug(err);
  //               // if (err)
  //               //     return done(err);
  //               // if (!rows.length) {
  //               //     return done(null, false, req.flash('loginMessage', 'No user found.'));
  //               // }

  //               // // if the user is found but the password is wrong
  //               // if (!bcrypt.compareSync(password, rows[0].password))
  //               //     return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

  //               // // all is well, return successful user
  //               // return done(null, rows[0]);
  //           });
  console.log(req.body);
  passport
    .authenticate('local-login', function (err, user, info) {
      console.log(err);
      if (err) {
        return next(err);
      }
      // stop if it fails
      if (!user) {
        return res.json({message: 'Invalid Username of Password'});
      }

      // req.logIn(user, function (err) {
      //     // return if does not match
      //     if (err) {
      //       return next(err);
      //     }

      //     // generate token if it succeeds
      //     const db = {
      //       updateOrCreate: function (user, cb) {
      //         cb(null, user);
      //       }
      //     };
      //     db.updateOrCreate(req.user, function (err, user) {
      //       if (err) {
      //         return next(err);
      //       }
      //       // store the updated information in req.user again
      //       req.user = {
      //         id: user.username
      //       };
      //     });

      //     // create token
      //     const jwt = require('jsonwebtoken');
      //     req.token = jwt.sign({
      //       id: req.user.id
      //     }, SERVER_SECRET, {expiresIn: 120});

      //     // lastly respond with json
      //     return res
      //       .status(200)
      //       .json({user: req.user, token: req.token});
      //   });
    })(req, res, next);

}

export default auth;
