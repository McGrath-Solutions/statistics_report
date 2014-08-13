/*
 * authmiddleware.js
 * Adds authentication information middleware (whether the user is authenticated and has
 * permissions to edit, or, in this context, view reports.
 */
module.exports = function() {

  // Does the user have the permission to edit?
  var hasEditPermissions = function(user, cb) {
    // For now, only admin can edit. Will modifify with permissions later
    var editableRoles = ["administrator", "board_member", "officer", 
    "executive director", "coordinator"];
    if (!user) return false;

    var roles = user.roles;
    for (var i = 0; i < editableRoles.length; i++) {
      var role = editableRoles[i];
      if (roles.indexOf(role) != -1) return true;
    }

    return false;
  }

  /*
   * Return the middleware
   */
  return function(req, res, next) {
    res.locals.isAuthenticated = req.isAuthenticated();
    req.hasEditPermissions = hasEditPermissions(req.user);
    res.locals.hasEditPermissions = hasEditPermissions(req.user);
    next();
  }

}