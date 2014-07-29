var passport = require('passport');
var Session = require('../models/session');

/*
 * GET the login page
 */
exports.login = function(req, res) {
  if (process.env.NODE_ENV === 'production') {
    var path = require('routeconfig').productionLoginURL;
    return res.redirect(path);
  }

  // In production environment, redirect to login page
  res.render('login', {user: req.user});
};

/*
 * Respond to POST requests to the login route. Check if the user's login
 * credentials are good and grant permission if the right credentials are given.
 */
exports.checkLogin = function(req, res, next) {
  passport.authenticate('loginpage', function(err, user, info) {
    if (err || !user) {
      // req.flash('username', req.body.username);
      req.flash('error', info.message);
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      if (err) {
        req.flash('error', info.message);
        return res.redirect('/login');
      }

      req.flash('success', 'Welcome!');
      return res.redirect('/stats');
    });
  })(req, res, next); 
};

/*
 * Logout controller
 */
exports.logout = function(req, res) {
  req.logout();
  if (req.session.drupal) {
    var sid = req.session.drupal.sid;
    Session.deleteById(sid, function(err) {
      if (err) {
        console.error(err);
      }

      req.session.drupal = {};
      req.flash('info', "You are now logged out");
      res.redirect('/');
    });

    return;
  }

  req.flash('info', 'You are now logged out');
  res.redirect('/');
};

/*
 * Middleware to ensure that the user is authenticated before he can p
 * proceed
 */ 
exports.ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/login');
};

/*
 * Middleware to ensure that the user is both authenticated and has the appropriate
 * edit permissions
 */
exports.ensurePrivileged = function(req, res, next) {
  if (req.hasEditPermissions) {
    return next();
  }

  res.flash('error', 'You do not have permssion to access this page');
  res.redirect('/');
}
