
/**
 * Module dependencies.
 */

var express = require('express');
var flash = require('connect-flash');
var Bookshelf = require('bookshelf');
var passport = require('passport');
var messages = require('./util/messages');

// routes
var routes = require('./routes');
var user = require('./routes/user');

// Possible statistics
var goalball = require('./routes/goalball');
var bowling = require('./routes/bowling');
var cycling = require('./routes/cycling');

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
app.use(flash());
app.use(messages());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

require('./util/auth')(passport)

// Routes: 
// TODO move into a seperate file
app.get('/', routes.index);
app.get('/login', user.login);
app.post('/login', user.checkLogin);
app.get('/logout', user.logout)
app.post('/bowling', bowling.bowlingPost);
app.post('/cycling', cycling.cyclingPost);
app.post('/goalball', goalball.goalballPost);

// Authentication middleware: for authenticated users only
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
