

module.exports = function() {
    return function(req, res, next) {
        if (req.isAuthenticated());
        console.log(req.cookies);

        next();
    }
}