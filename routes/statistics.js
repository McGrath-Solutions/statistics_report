

/* Default statistics page */
exports.stats = function(req, res) {
  res.render('stats', {user: req.user});
}

// Accept user uploads of xls, csv based reports files
exports.upload = function(req, res) {

}

// Page to export reports as csv files (TODO add xls report exports)
exports.reports = function(req, res) {

}

// Respond to post requests asking for a reports file with a reports file
exports.genReport = function(req, res) {
  
}
  

/* Access the statistics page for a given user */
/* TOBE IMPLEMENTED                            */
exports.userpage = function(req, res) {
  // expected to be called from a route of the form stats/:user
  var user = req.params.user;

  // Get user statististics from a hypothetical statistics object
  // And render them as a page
}

