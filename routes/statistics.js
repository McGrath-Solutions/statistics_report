var genReport = require('../util/reportsGenerator');

/* Default statistics page */
exports.stats = function(req, res) {
  res.render('stats', {user: req.user});
}

// Accept user uploads of xls, csv based reports files
exports.upload = function(req, res) {
  res.render('import', {user: req.user});
}

// Page to export reports as csv files
exports.reports = function(req, res) {
  res.render('export', {user: req.user});
}

// Respond to post requests asking for a reports file with a reports file
exports.genReport = function(req, res) {
  
}
  

/* Access the statistics page for a given user */
/* TOBE IMPLEMENTED                            */
exports.userpage = function(req, res) {
  // expected to be called from a route of the form stats/:user
  var uid = req.params.uid;

  // get user statistics from database. Check if the specified user exists.
  // If the specified user exists, send relevant data to the page for prerendering.
  // If the specified user does not exist, return error. 
  var user = require('../models/user');

  // Do this task asynchronously through promises
  new user({uid: uid}).fetch().then(function(user) {
      console.log("User id: " + uid);
      console.log(user); 
      if (user) {
        console.log("User name: " + user.attributes.name);
        res.render('statsUserView', {userName: user.attributes.name,
                                     user: req.user});
      } else {
        res.render('error');
      }
  }, function(error) {
      res.render('error');
  });

  // Get user statististics from a hypothetical statistics object
  // And render them as a page
}

