/* DataApiCall.js 
 * Fetch data about statistics and return them to the client */
var User = require('../models/user');
var Event = require('../models/event');
var Registration = require('../models/registration');
var util = require('util');
var xls = require('./xlsutil');
var async = require('async');
var _ = require('lodash');

/* Helper methods */
/* Get the sport in the context of this report associated with the event sport stored in database */
var getSportNameInContext = function(dbName) {
  if (dbName === "Goalball Tournament") {
    return 'Goalball';
  } else if (dbName === 'Cycling') {
    return 'Cycling';
  } else if (dbName === 'Bowling') {
    return 'Bowling';
  } else if (dbName === 'Achilles') {
    return 'Run\/Walk';
  } else if (dbName === 'Goalball') {
    return 'Goalball';
  } else {
    return null;
  }
};

/* Get the club name of the sport in context of this report */
var getClubNameInContext = function(dbClubName) {
  if (dbClubName === "At-Large") {
    return "atLarge";
  } else if (dbClubName === "Memphis") {
    return "memphis";
  } else if (dbClubName === "Nashville") {
    return "nashville";
  } else if (!dbClubName) {
    console.error("Club name is not defined, defaulting to atLarge");
    return "atLarge";
  }
};

/* Get the age group associated with a user with the given dateOfBirth.
 * @param dateOfBirth = the date of birth of the user;                     */
var getAgeGroup = function(dateOfBirth) {
  if (!dateOfBirth) {
    throw new Error("getAgeGroup: Undefined Date of Birth");
  }
  var today = new Date();
  var age = today.getFullYear() - dateOfBirth.getFullYear();
  var m = today.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
  }

  /* Define Juniors as 1-10, Youth as 11-19, Adults as 20 and up */
  if (age >= 20) {
    return "adults";
  } else if (age >= 11) {
    return "youth";
  } else {
    return "juniors";
  }
}

function getMonthlyProgramming(relevantDate, callback) {
  
}

function getMonthlyMembership(relevantDate, done) {
   var newMemberLabels = ["ID#", "Last Name", "First Name", "Email Address", "Phone Number", "Status"];
  var newMemberSchema = ["number", "string", "string", "string", "string", "string"]

  var overallLabels = ["New Members", "Total Members"];
  var overallSchema = ["number", "number"];

  var genderBreakdownLabels = ["Male", "Female"];
  var genderBreakdownSchema = ["number", "number"];

  var ageBreakdownLabels = ["Junior", "Youth", "Adult"];
  var ageBreakdownSchema = ["number", "number", "number"];

  var statusBreakdownLabels = ["Pending", "Active", "InActive", "Suspended"];
  var statusBreakdownSchema = ["number", "number", "number", "number"];

  // Table definitions
  var NewMemberSummary = new xls.Table("New Member Information", newMemberSchema, newMemberLabels);
  var OverallCount = new xls.Table("Overall Members", overallSchema, overallLabels);
  var GenderBreakdown = new xls.Table("Gender Breakdown", genderBreakdownSchema, genderBreakdownLabels);
  var AgeBreakdown = new xls.Table("Age Breakdown", ageBreakdownSchema, ageBreakdownLabels);
  var StatusBreakdown = new xls.Table("Member Status Breakdown", statusBreakdownSchema, statusBreakdownLabels);

  async.parallel([
    // Load user information
    function fetchMonthlyInformation(callback) {
      // Fetch all users in the specified month and populate information
      
      User.loadUsersByCreatedMonth(relevantDate, function(err, objects) {
        if (err) {
          callback(err);
          return;
        } else {
          var numUsers = objects.length;
          for (var i = 0; i < numUsers; i++) {
            var user = objects[i];
            var id = user.id || 0;
            var lastName = user.lastName || "unknown";
            var firstName = user.firstName || "unknown";
            var email = user.email || "unknown";
            var phone = user.phone || "unknown";
            var roles = user.roles.join() || "unknown";

            var newRow = [id, lastName, firstName, email, phone, roles];
            NewMemberSummary.pushRow(newRow);
          }

          callback(null, numUsers);
        }
      });
    },
    function fetchOverallInformation(callback) {
      var genderCounts = [0, 0]; // Counts for males and females
      var ageCounts = [0, 0, 0]; // Counts for Junior, Youth and Adult
      var statusCounts = [0, 0, 0, 0]; // Counts of user status

      User.loadObjects(function(err, objects) {
        if (err) {
          console.error(err);
          callback(err);
          return;
        } else {
          console.log("Objects: ");
          console.log(objects);

          var numUsers = objects.length;
          for (var i = 0; i < numUsers; i++) {
            var user = objects[i];
            console.log(user);

            var gender = user.gender || "Unknown";
            if (gender === "Male") {
              genderCounts[0]++;
            } else if (gender === "Female") {
              genderCounts[1]++;
            }

            var birthDate = user.dob;
            if (birthDate) {
              var ageGroup = getAgeGroup(birthDate);
              // console.log("Got age group: " + ageGroup);
              if (ageGroup === "juniors") {
                //console.log("Inc junior");
                ageCounts[0]++;
              } else if (ageGroup === "youth") {
                //console.log("Inc Youth");
                ageCounts[1]++;
              } else if (ageGroup === "adults") {
                //console.log("Inc Adult");
                ageCounts[2]++;
              }
            }

            // Possible Status: "Pending", "Active", "InActive", "Suspended"
            // Check if the user is pending
            if (user.pending) {
              statusCounts[0]++;
            }

            // Check if the user is active
            if (user.active) {
              statusCounts[1]++;
            } else {
              statusCounts[2]++;
            }

            // Check if the user is suspended
            if (user.suspended) {
              statusCounts[4]++;
            }
          }

          var sumAllIterator = function(accumulator, value) {
            return accumulator + value;
          }

          GenderBreakdown.pushRow(genderCounts);
          var genderSum = genderCounts.reduce(sumAllIterator); // get the sum of the elements
          var genderFrac = genderCounts.map(function(el) {
            return el / genderSum;
          });
          //console.log(genderFrac);
          GenderBreakdown.pushRow(genderFrac);

          AgeBreakdown.pushRow(ageCounts);
          var ageSum = ageCounts.reduce(sumAllIterator);
          var ageFrac = ageCounts.map(function(el) {
            return el / ageSum;
          });
          //console.log(ageFrac);
          AgeBreakdown.pushRow(ageFrac);

          StatusBreakdown.pushRow(statusCounts);

          callback(null, numUsers);
        }
      });
    }
    // load counts information
  ], function(err, counts) {
    // Counts will contain an array with the first entry being new users, the second entry being total users
    if (err) {
      done(err);
      return;
    }
    OverallCount.pushRow(counts);

    var data = {
      name: "TNABA Monthly Membership Data",
      set1: {
        overall: OverallCount,
        summary: NewMemberSummary,
        gender: GenderBreakdown,
        age: AgeBreakdown,
        status: StatusBreakdown
      }
    };

    //console.log("Report: " + callbackReport.toString());
    //console.log("Info: " + callbackInfo.toString());

    done(null, data);
  });
}


// Data Api Call: 
// Basically a rewrite of reportsGenerator so that it is cleaner, simpler and does not end
// with the generation of a report. Instead, returns the data associated with a given report.
module.exports = function(dataType, relevantDate, callback) {
  if (dataType == "Monthly Programming Report") {
    getMonthlyProgramming(relevantDate, callback);
  } else if (dataType === "Monthly Membership Report") {
    getMonthlyMembership(relevantDate, callback);
  } else {
    callbackReport(new Error("Unkown Report"));
  }
}