
exports.stats = function(req, res) {
  res.render('stats', {user: req.user});
}
