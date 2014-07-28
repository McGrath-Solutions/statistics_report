var Session = require('../models/session');
var async = require('async');


var getCookieInformation = function(cookies) {
  
}


module.exports = function() {
return function(req, res, next) {
    // Log the cookies to exp
    console.log("Cookies: ");
    console.log(req.cookies);

    console.log("Session: ");
    console.log(req.session);
    
    var cookieId = getCookieInformation(req.cookies);

    next();
  }
}