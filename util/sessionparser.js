/*
 * Utility to read session information from a MyTNABA home
 * Drupal project and log the user in based on shared sessions.
 * This assumes that the MyTNABA homepage and the reports 
 * generator are hosted on the same domain.
 * @author Mike Zhang
 * @seealso util/authentication.js for some authentication goodness
 * @seealso routes/user.js for even more authentication goodness
 * @seealso models/session.js for info on what the session model provides
 */
var Session = require('../models/session');
var User = require('../models/user');
var async = require('async');

/*
 * Fetch drupal session information the user's cookies
 *
 * @param {object} cookies - The session cookies from the user's request
 * @returns null if the user does not have a drupal session
 *          {string} The string value of the user's drupal session cookie
 */
var getCookieInformation = function(cookies) {
  var header = 'SESS';
  var keys = Object.keys(cookies);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].indexOf(header) === 0) {
      return cookies[keys[i]];
    }
  }

  return null;
};

/*
 * Ensure that the drupal session with cookieId in request, req,
 * is still active. That is, whether the currently logged in 
 * user's cookieId is still active in the drupal session.
 * If the session is no longer active (cookieID does not match
 * value stored in session), log the user out.
 * @param {object} req - the express request object
 * @param {string} cookieId - the string value of the current drupal 
 *    cookie or undefined if the cookieId does not exist
 * @param {function} callback - the callback function to be called
 *    once this procedure is completed
 */
var ensureSessionActive = function(req, cookieId, callback) {
  var drupalSession = req.session.drupal;

  // No drupal session information, hence this user was most
  // likely not authenticated with a drupal session and can
  // thus stay logged in
  if (!drupalSession) {
    return callback();
  }

  var drupalSessionId = drupalSession.sid;
  // If the stored session does not match the cookieId, log the 
  // user out.
  if (drupalSessionId !== cookieId) {
    req.logOut();
    req.session.drupal = {};
  }

  callback();
};

/*
 * Given a drupal session cookieId, log in the cooresponding user.
 * @param {object} req - the express request object
 * @param {string} cookieId - the string value of the current drupal cookie
 * @param {function} callback - the callbcak function to be called once
 *     once the procedure is completed
 */
var logUserInUsingCookieId = function(req, cookieId, callback) {
  // First fetch session information based on the string id provided by
  // the cookie
  Session.fetchById(cookieId, function(err, object) {
    // console.log(object);
    if (!object) {
      // console.log(object);
      return callback();
    }
    var id = object.uid;


    User.getUserObjectById(id, function(err, user) {
      if (err) {
        console.error(err);
        return callback();
      }

      // Login the user
      req.logIn(user, function(err) {
        if (err) {
          console.error(err);
          return callback();
        }

        req.session.drupal = {};
        req.session.drupal.sid = cookieId;

        callback();
      });
    });
  });
};

/*
 * Drupal authentication middleware generator.
 */
module.exports = function() {
  return function(req, res, next) {
    // Fetch cookie information
    var cookieId = getCookieInformation(req.cookies);

    if (req.isAuthenticated()) {
      // Check if the session is active, if it is not active,
      // log the user out
      ensureSessionActive(req, cookieId, function() {
        next();
      });
      return;
    }

    if (cookieId) {
      // If the cookie is defined, log the suer in using the cookie
      logUserInUsingCookieId(req, cookieId, function() {
        next();
      });
      return;
    }

    next();
  }
}