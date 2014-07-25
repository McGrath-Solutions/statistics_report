
// Middleware to check whether the user has adequate permissions
module.exports = function() {
    // Does the user have the permission to edit?
    var hasEditPermissions = function(user) {
        // For now, only admin can edit. Will modifify with permissions later
        if (!user) return false;
        return user.attributes.name === "admin";
    }

    return function(req, res, next) {
        res.locals.isAuthenticated = req.isAuthenticated();

        // Check if the user has the right to edit the page
        req.hasEditPermissions = hasEditPermissions(req.user);
        res.locals.hasEditPermissions = hasEditPermissions(req.user);
        next();
    }

}