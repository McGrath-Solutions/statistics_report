
// Middleware to check whether the user has adequate permissions
module.exports = function() {
    // Does the user have the permission to edit?
    var hasEditPermissions = function(user, cb) {
        // For now, only admin can edit. Will modifify with permissions later
        var editableRoles = ["administrator", "board_member", "officer", "organizer", "coordinator", 
                             "executive director"];
        if (!user) return false;

        // Check if the user has a role in editableRoles
        console.log(user);
        var roles = user.roles;
        for (var i = 0; i < editableRoles.length; i++) {
            var role = editableRoles[i];
            if (roles.indexOf(role) != -1) return true;
        }

        return false;
    }

    return function(req, res, next) {
        res.locals.isAuthenticated = req.isAuthenticated();

        // Check if the user has the right to edit the page
        req.hasEditPermissions = hasEditPermissions(req.user);
        res.locals.hasEditPermissions = hasEditPermissions(req.user);
        next();
    }

}