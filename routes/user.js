var passport = require('passport');
/*
 * GET the login page
 */
exports.login = function(req, res) {
  res.render('login', {user: req.user});
};

/*
 * Respond to POST requests to the login route. Check if the user's login
 * credentials are good and grant permission if the right credentials are given.
 */
exports.checkLogin = function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err || !user) {
      req.flash('username', req.body.username);
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

