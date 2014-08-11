
/**
 * Module dependencies.
 */

var express = require('express');
var flash = require('connect-flash');
var Bookshelf = require('bookshelf');
var passport = require('passport');
var messages = require('./util/messages');
var auth = require('./util/authmiddleware');
var sessionParser = require('./util/sessionparser');

// routes
var routes = require('./routes');
var user = require('./routes/user');
var statistics = require('./routes/statistics');

var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.cookieParser());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.session({secret: "mysecret"}));
app.use(passport.initialize());
app.use(passport.session());
app.use(sessionParser());
app.use(flash());
app.use(messages());
app.use(auth());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// Tell me about my env
console.log(process.env.NODE_ENV);
app.locals.pretty = true;

if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

// Disable console logging in production
if ('production' === app.get('env')) {
  console.log = function() {};
}


// Passport local authentication strategy
require('./util/auth')(passport)

// Routes: 
// TODO move into a seperate file
app.get('/', routes.index);
app.get('/login', user.login);
app.post('/login', user.checkLogin);
app.get('/logout', user.logout)

// The user stats page does not require authentication
app.get('/stats/users/:uid', statistics.userpage);

// IMPORTANT: for development, removing authentication insurance.
// This line should be readded during production
// PRODUCTION LINE
app.get('/stats', user.ensureAuthenticated, statistics.stats)
// DEVELOPMENT LINE
// app.get('/stats', statistics.stats)

// The following lines require authentication
app.get('/stats/export', user.ensureAuthenticated, user.ensurePrivileged, statistics.reports);
app.get('/stats/import', user.ensureAuthenticated, user.ensurePrivileged, statistics.upload);
app.get('/api/:type/:date', statistics.api);

// Routes Deprecated
/*
app.post('/generate', statistics.genReport);
app.get('/download/:reportName', user.ensureAuthenticated, user.ensurePrivileged, statistics.getReport);
*/

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
