/*
 * authmiddleware.js
 * Adds authentication information middleware (whether the user is authenticated and has
 * permissions to edit, or, in this context, view reports.
 */
module.exports = function() {

  var getPermissionsLevel = function(user) {
    if (!user) return 0;

    roles = user.roles;
    var level2Roles = ["coordinator"];
    var level1Roles = ["administrator", "board_member", "officer", "executive director"];
    var level = 0;

    for (var i = 0; i < level2Roles.length; i++) {
      var role = level2Roles[i];
      if (roles.indexOf(role) != -1) level = 2;
    }

    for (var i = 0; i < level1Roles.length; i++) {
      var role = level1Roles[i];
      if (roles.indexOf(role) != -1) level = 1;
    }

    return level;
  };

  // Does the user have the permission to edit?
  var hasEditPermissions = function(user) {
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
    req.editLevel = getPermissionsLevel(req.user);
    req.hasEditPermissions = (req.editLevel > 0);
    res.editLevel = req.editLevel;
    res.locals.hasEditPermissions = (req.editLevel > 0);


    console.log(req.hasEditPermissions);
    console.log(req.editLevel);
    console.log(res.editLevel);
    next();
  }

}