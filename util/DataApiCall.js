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
  var contextTable =  {
    "Goalball Tournament": "Goalball",
    "Goalball Practice": "Goalball",
    "Cycling": "Cycling",
    "Bowling": "Bowling",
    "Achilles": "Run\/Walk",
    "Goalball": "Goalball",
    "Game Night": "Game Night",
    "Health Check": "Health Check"
  }

  var name = contextTable[dbName];
  if (name) {
    return name;
  } else {
    return 'Other';
  }
};

/* Get the club name of the sport in context of this report */
var getClubNameInContext = function(dbClubName) {
  // console.log(dbClubName);
  if (dbClubName === "At-Large") {
    // For legacy events
    return "statewide";
  } else if (dbClubName === "Memphis") {
    return "memphis";
  } else if (dbClubName === "Nashville") {
    return "nashville";
  } else if (dbClubName === "Statewide") {
    return "statewide";
  } else if (!dbClubName) {
    console.error("Club name is not defined, defaulting to statewide");
    return "statewide";
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

function getMonthlyProgramming(relevantDate, done) {
  /* Helper functions */
  var genCountsObject = function(title) {
    var obj = {name: title, activities: 0, hours: 0, juniors: 0, adults: 0, veterans: 0,
               guests: 0, volunteers: 0,
               volunteerHours: 0};

    return obj;
  };

  var getDuration = function(startDate, endDate) {
    var milliseconds = endDate - startDate;
    return (((milliseconds) / 1000) / 60) / 60; // the number of hours between start and end
  };

  // Build the tables from the count object
  var buildTables = function() {

    // Build the totals table
    _(counts.totals).forEach(function(totals, club) {
      /*
      console.log("This counts: ");
      console.log(util.inspect(totals));
      */

      TotalsTable.pushObjectRow(totals);
    });

    // Build Nashville table
    _(counts.nashville).forEach(function(sportsTotals, sport) {
      /*
      console.log("This counts: ");
      console.log(util.inspect(sportsTotals));
      */

      NashvilleTable.pushObjectRow(sportsTotals);
    });

    // Build At-large table
    _(counts.statewide).forEach(function(sportsTotals, sport) {
      /*
      console.log("This counts: ");
      console.log(util.inspect(sportsTotals));
      */

      StatewideTable.pushObjectRow(sportsTotals);
    });

    // Build Memphis table
    _(counts.memphis).forEach(function(sportsTotals, sport) {
      /*
      console.log("This counts: ");
      console.log(util.inspect(sportsTotals));
      */

      MemphisTable.pushObjectRow(sportsTotals);
    });
  };

  /* Main program logic */
  var labelsTotal = ["Clubs", "# of activities", "# of hours", "Juniors",
                     "Adult", "Veterans", "Guests", "# of Volunteer Staff",
                      "Volunteer Hours"];
  // The schema
  var schema = ["string", "number", "number", 
                "number", "number", "number", "number",
                "number", "number"];
  
  // Labels for the monthly report per region
  var labelsMonthly = ["Program", "# of activities", "# of hours", "Juniors", "Adult", 
                      "Veterans", "Guests", "# of Volunteer Staff",
                      "Volunteer Hours"];

  // Tables
  var TotalsTable = new xls.Table("Monthly Totals", schema, labelsTotal);
  var NashvilleTable = new xls.Table("Nashville Breakdown", schema, labelsMonthly);
  var MemphisTable = new xls.Table("Memphis Breakdown", schema, labelsMonthly);
  var StatewideTable = new xls.Table("Statewide Breakdown", schema, labelsMonthly);

  var counts = {};
  counts.totals = {};
  counts.nashville = {};
  counts.memphis = {};
  counts.statewide = {};

  // Populate totals
  counts.totals.statewide = genCountsObject("Statewide");
  counts.totals.nashville = genCountsObject("Nashville");
  counts.totals.memphis = genCountsObject("Memphis");

  // Generate Counts For Individual Sports
  var sports = ['Bowling', 'Cycling', 'Game Night', 'Goalball', 'Run\/Walk', 'BR dancing', 'Golf', 'Kickball',
                'Health Check', 'Other'];
  for (var i = 0; i < sports.length; i++) {
    counts.nashville[sports[i]] = genCountsObject(sports[i]);
    counts.memphis[sports[i]] = genCountsObject(sports[i]);
    counts.statewide[sports[i]] = genCountsObject(sports[i]);
  }

  //console.log(counts);

  // Populate the counts array
  async.waterfall([
    function processEvents(callback) {
      Event.loadObjectsByMonth(relevantDate, function(err, objects) {
        if (err) {
          // Inform the callback of the error
          callback(err);
        } else {
          var registrations = [];
          for (var i = 0; i < objects.length; i++) {
            //console.log("Start of for loop");
            //console.log(objects.length);
            //console.log(i);
            // Registrations (to send to next function in the list)

            // Process the event object data
            var object = objects[i];

            var sport = getSportNameInContext(object.sport);
            var club = getClubNameInContext(object.club);
            var numHours = getDuration(object.start, object.end);

            if (!sport) {
              // An undefined sport means don't bother with this one, skip it and
              // move on
              continue;
              // sport = "Run\/Walk";
            }

            // console.log(club);
            // console.log(sport);

            /*
            console.log("Sport: " + sport);
            console.log("Club: " + club);
            console.log("Hours: " + numHours);
            */
           
            /* Increment the total number of activities for the specified sport */
            counts.totals[club].activities++;
            counts.totals[club].hours += numHours;
            counts[club][sport].activities++;
            counts[club][sport].hours += numHours;


            // Prepare to pass the object to the next function in the waterfall
            var nextObject = {};
            nextObject.sport = sport;
            nextObject.club = club;
            nextObject.numHours = numHours;

            for (var j = 0; j < object.registrations.length; j++) {
              //console.log("In registrations " + j);
              registrations[registrations.length] = {
                sport: sport,
                club: club,
                numHours: numHours,
                id: object.registrations[j].id
              }

              //console.log(registrations.length);
            }
          }

          //console.log("Registrations: " + registrations);
          callback(null, registrations);
        }
      });
    },

    /* Process registrations and update coutns, then give the advanced 
     * Registration information to 
     * Process users */
    function processRegistrations(regList, callback) {
      //console.log("Reg list: " + util.inspect(regList));
      //console.log("At registrations");
      //console.log(regList.length);

      var funcList = [];
      for (var i = 0; i < regList.length; i++) {
        var reg = regList[i];
        // Get an array of functions related to each registration
        funcList[i] = (function(reg) {
          return function(cbinterior) {
            Registration.loadRegistrationById(reg.id, function(err, registration) {
              if (err) {
                // Error is sent to callback
                cbinterior(err);
              } else {
                // Process the given registration
                //console.log("Registration checking");
                //console.log(reg);
                
                /* Legacy volunteer check. New volunteer check moved down ot 
                 * processRegistrationUsers below                              */
                /*
                if (registration.type === "Volunteer") {
                  // Incrment the number of volunteers, if applicable
                  counts.totals[reg.club].volunteers++;
                  counts[reg.club][reg.sport].volunteers++; 

                  // This is probably not the right way to calculate volunteer hours
                  counts.totals[reg.club].volunteerHours += reg.numHours;
                  counts[reg.club][reg.sport].volunteerHours += reg.numHours;
                }
                */

                // Slyly insert more data for registration user data
                registration.club = reg.club;
                registration.sport = reg.sport;
                registration.numHours = reg.numHours;

                cbinterior(null, registration);
              }
            });
          }
        })(reg);
      }

      //console.log(funcList);

      async.parallel(funcList, function(err, registrations) {
        if (err) {
          callback(err);
        } else {
          callback(null, registrations)
        }
      });
    },

    /* Process the users associated with each registration */
    function processRegistrationUsers(registrations, callback) {
      //console.log("At users");
      //console.log("Registrations: " + registrations);
      var funcList = [];
      for (var i = 0; i < registrations.length; i++) {
        var registration = registrations[i];
        funcList[i] = (function(registration) {
          return function(cbinterior) {
            if (!registration.uid) {
              // The registration is anonymous. We will consider this user a guest.
              counts.totals[registration.club].guests++;
              counts[registration.club][registration.sport].guests++;
              cbinterior(null);
            } else {
              Registration.loadUserObject(registration, function(err, user) {
                if (err) {
                  //console.log("ERROR THAT CAUSE CB TWICE: " + err);
                  cbinterior(err);
                } else {
                  // Check if the user is veteran
                  //console.log("User checking");
                  //console.log(registration);

                  if (user.isVeteran) {
                    counts.totals[registration.club].veterans++;
                    counts[registration.club][registration.sport].veterans++;
                  }

                  /*
                  var type = user.membershipType;
                  if (type === "Volunteer") {
                    // volunteer code
                    // Incrment the number of volunteers, if applicable
                    counts.totals[registration.club].volunteers++;
                    counts[registration.club][registration.sport].volunteers++; 

                    // This is probably not the right way to calculate volunteer hours
                    counts.totals[registration.club].volunteerHours += registration.numHours;
                    counts[registration.club][registration.sport].volunteerHours += registration.numHours;
                  } else if (type === "Guest" || !type) {
                    // By default, undefined users will be guests
                    counts.totals[registration.club].guests++;
                    counts[registration.club][registration.sport].guests++;
                  } else {
                    var ageGroup = type.toLowerCase() + "s";
                    counts.totals[registration.club][ageGroup]++;
                    counts[registration.club][registration.sport][ageGroup]++;
                  }
                  */
                   
                  var roles = user.roles;
                  for (var i = 0; i < roles.length; i++) {
                    if (roles[i] === "volunteer") {
                      // Incrment the number of volunteers, if applicable
                      counts.totals[registration.club].volunteers++;
                      counts[registration.club][registration.sport].volunteers++; 

                      // This is probably not the right way to calculate volunteer hours
                      counts.totals[registration.club].volunteerHours += registration.numHours;
                      counts[registration.club][registration.sport].volunteerHours += registration.numHours;
                      break;
                    }
                  }

                  var userAgeGroup = getAgeGroup(user.dob);
                  counts.totals[registration.club][userAgeGroup]++;
                  counts[registration.club][registration.sport][userAgeGroup]++;

                  cbinterior(null);
                }
              });
            }
          }
        })(registration);
      }

      async.parallel(funcList, function(err) {
        if (err) {
          callback(err);
        } else {
          callback(null);
        }
      });
    }

  ], function(err) {
    if (err) {
      console.log("ERROR");
      done(err);
    } else {
      console.log("Building tables");
      // Prepare for table completion
      buildTables();
      var data = {
        sheet1: {
          name: "TNABA Monthly Programming Report",
          data: [TotalsTable, NashvilleTable, StatewideTable, MemphisTable]
        }
      }

      
      console.log("Totals Table");
      console.log(util.inspect(TotalsTable.rows));

      console.log("Nashville Table");
      console.log(util.inspect(NashvilleTable.rows));

      console.log("At Large Table");
      console.log(util.inspect(StatewideTable.rows));

      console.log("Memphis Table");
      console.log(util.inspect(MemphisTable.rows));
      
      done(null, data);
    }
  });
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
          console.error("Big trubble");
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
    } else {
      OverallCount.pushRow(counts);

      var data = {
        sheet1: {
          name: "TNABA Monthly Membership Data",
          data: [OverallCount, NewMemberSummary, GenderBreakdown, AgeBreakdown, StatusBreakdown]
        }
      };

      //console.log("Report: " + callbackReport.toString());
      //console.log("Info: " + callbackInfo.toString());

      done(null, data);
    }
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
    callback(new Error("Unkown Report"));
  }
}
