var User = require('../models/user');
// Middleware to check whether the user has adequate permissions
module.exports = function() {
    // Does the user have the permission to edit?
    var getEditPermissions = function(user, cb) {
        // For now, only admin can edit. Will modifify with permissions later
        var editableRoles = ["administrator", "board_member", "officer", "organizer", "coordinator", 
                             "executive director"];
        if (!user) return cb(null, false);
        var uid = user.attributes.uid;

        User.getUserObjectById(uid, function(err, userObject) {
            if (err) {
                return cb(err);
            }

            var roles = userObject.roles;
            for (var i = 0; i < editableRoles.length; i++) {
                var role = editableRoles[i];

                // Check if the user has a role in editableRoles
                if (roles.indexOf(role) != -1) return cb(null, true);
            }

            return cb(null, false);
        });
    }

    return function(req, res, next) {
        res.locals.isAuthenticated = req.isAuthenticated();

        // Check if the user has the right to edit TNABA data
        getEditPermissions(req.user, function(err, permission) {
            if (err) {
                req.hasEditPermissions = false;
                res.locals.hasEditPermissions = false;
                console.error(err);
                return next();
            }

            req.hasEditPermissions = permission;
            res.locals.hasEditPermissions = permission;

            return next();
        });
    }

}