var genReport = require('../util/reportsGenerator');
var mkdirp = require('mkdirp');
var util = require('util');
var fs = require('fs');
var api = require('../util/DataApiCall');

/* Helper functions */
var getReportType = function(type) {
  if (type === "event") {
    return "Monthly Programming Report";
  } else if (type === "membership") {
    return "Monthly Membership Report";
  }
}

/* Default statistics page */
exports.stats = function(req, res) {
  res.render('stats', {user: req.user});
}

// Accept user uploads of xls, csv based reports files
exports.upload = function(req, res) {
  res.render('import', {user: req.user});
}

// Send back data relating to a specific report
exports.api = function(req, res) {
  if (!req.user) {
    res.send({needLogin: true});
  } else {
    var type = req.params.type;
    var date = new Date(req.params.date);
    var uid = req.user.attributes.uid;

    console.log(type);
    console.log(date);
    console.log(uid);
    if (!type) {
      res.send("Unknown type");
    } else {
      var reportType = getReportType(type);

      // Check if the date is valid. If it is not, return today.
      if (isNaN(date.getTime())) {
        date = new Date();
      }

      api(reportType, date, function(err, data) {
        if (err) {
          res.send("Error: " + err);
        } else {
          res.send(data);
        }
      });
    }
  }
}

// Page to export reports as csv files
exports.reports = function(req, res) {
  
  res.render('export', {user: req.user});
}

// Respond to post requests asking for a reports file with a reports file
exports.genReport = function(req, res) {
  // If the user is not defined, tell the client ot redirect to login
  if (!req.user) {
    res.send({needLogin: true});
  } else {
    var type = req.body.type;
    var date = new Date(req.body.dateFor);
    var uid = req.user.attributes.uid;
    if (!type) {
      res.send("Unknown type");
    } else {
      var reportType = getReportType(type);
      if (!reportType) {
        res.send("Unknown Type");
      }
      // var today = new Date();
      /*
      var fileName = 'monthly-' + type + "-gen" + today.getFullYear() + (today.getMonth() + 1) + 
        today.getDate() + "-for" + date.getFullYear() + (date.getMonth() + 1) + ".xlsx";
      */
     
      // Alternative filename saves space and does not require a tricky unlink, allowing multiple user
      // downloads at once
      var fileName = 'monthly-' + type + "-for" + date.getFullYear() + (date.getMonth() + 1) + ".xlsx";

      var filePath = './reports/' + uid + '/' + fileName;
      genReport(reportType, filePath, date, function(err, path) {
        if (err) {
          res.send("Error: " + err);
        } else {
          res.send({fileName: fileName, user: uid});
        }
      });
    };
  }
}

// Respond to get request for a file download
// given params = :filename
// path : download/:filename
exports.getReport = function(req, res) {
  var reportName = req.params.reportName;
  var user = req.user;
  if (!user) {
    res.send(403, "Not authorized");
  } else {
    // Send the file, then unlink it
    var uid = user.attributes.uid;
    var fullPathName = "./reports/" + uid + "/" + reportName;
    res.sendfile(fullPathName, function unlink(err) {
      if (err) {
        console.error("Error occured sending: " + err);
      } else {
        console.log("File sent successfully");
        /* Don't unlink for now
        fs.unlink(fullPathName, function() {
          console.log("File successfully unlinked");
        })
        */
      }
    });
  }
}
  

/* Access the statistics page for a given user, given params =  :uid */
/* TOBE IMPLEMENTED                            */
exports.userpage = function(req, res) {
  // expected to be called from a route of the form stats/:user
  var uid = req.params.uid;

  // get user statistics from database. Check if the specified user exists.
  // If the specified user exists, send relevant data to the page for prerendering.
  // If the specified user does not exist, return error. 
  var user = require('../models/user');

  // Do this task asynchronously through promises
  new user({uid: uid}).fetch().then(function(user) {
      console.log("User id: " + uid);
      console.log(user); 
      if (user) {
        console.log("User name: " + user.attributes.name);
        res.render('statsUserView', {userName: user.attributes.name,
                                     user: req.user});
      } else {
        res.render('error');
      }
  }, function(error) {
      res.render('error');
  });

  // Get user statististics from a hypothetical statistics object
  // And render them as a page
}

