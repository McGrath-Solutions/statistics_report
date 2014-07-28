var Session = require('../models/session');
var User = require('../models/user');
var async = require('async');

var getCookieInformation = function(cookies) {
  var header = 'SESS';
  var keys = Object.keys(cookies);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].indexOf(header) === 0) {
      return cookies[keys[i]];
    }
  }

  return null;
}

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
}

var logUserInUsingCookieId = function(cookieId, callback) {
  console.log("Attempting user login");
  Session.fetchById(cookieId, function(object) {
    var uid = object.uid;
    console.log("Fetched session uid: " + uid);
    new User({uid: uid}).fetch().then(function(model) {
      console.log("Fetched User: " + model);
      req.logIn(model, function(err) {
        if (err) {
          console.error(err);
          return callback();
        }

        req.session.drupal = {};
        req.session.drupal.sid = cookieId;

        callback();
      });
    }).catch(function(err) {
      console.error(err);
      callback();
    });
  });
}


module.exports = function() {
  return function(req, res, next) {
    // Log the cookies to exp
    console.log("Cookies: ");
    console.log(req.cookies);

    console.log("Session: ");
    console.log(req.session);

    var cookieId = getCookieInformation(req.cookies);
    console.log("Got Id: " + cookieId);
    if (req.isAuthenticated) {
      // Check if the session is active, if it is not active,
      // log the user out
      ensureSessionActive(req, cookieId, function() {
        next();
      });
      return;
    }

    if (cookieId) {
      logUserInUsingCookieId(cookieId, function() {
        next();
      })
    }
  }
}