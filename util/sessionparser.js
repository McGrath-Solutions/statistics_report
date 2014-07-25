

module.exports = function() {
    return function(req, res, next) {
        // Log the cookies to exp
        console.log(req.cookies);

        next();
    }
}