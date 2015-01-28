/* 
 * DataApiCall.js
 * Fetches data about a relevant report type and return them to the client. 
 * @author Mike Zhang
 */
var User = require('../models/user');
var Event = require('../models/event');
var Registration = require('../models/registration');
var Attendance = require('../models/attendance');
var util = require('util');
var xls = require('./xlsutil');
var async = require('async');
var _ = require('lodash');

/************************** Helper methods *****************************/
/* 
 * Get the sport in the context of this report associated 
 * with the event sport stored in database.
 * ie. Converts sports name from database club name to reports plug name
 * @param dbName {string} - the name of the sport in database
 * @returns {string} the sport name in the context of reports
 */
var getSportNameInContext = function(dbName) {
  var contextTable =  {
    "Goalball Tournament": "Goalball",
    "Goalball Practice": "Goalball",
    "Cycling": "Cycling",
    "Bowling": "Bowling",
    "Achilles": "Achilles",
    "Goalball": "Goalball",
    "Game Night": "Game Night",
    "Health Check": "Health Check",
    "Beeper Kickball": "Beeper Kickball",
    "Exercise and Yoga": "Exercise and Yoga",
    "Golf": "Golf",
    "Conference": "Conference"
  }

  var name = contextTable[dbName];
  if (name) {
    return name;
  } else {
    return 'Other';
  }
};

var capitalizeString = function(string) {
  return string[0].toUpperCase() + string.substring(1);
}

/* 
 * Get the club name of the sport in context of the report generator
 * ie. Converts the database club name to reports club name
 * @param {string} dbClubName - The clubname as stored in database
 * @param {string} The clubname as in the reports generator
 */
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

/*
 * Fetch monthly programming report for the month of relevantDate,
 * calling function done when completed.
 * @param relevantDate {date} - The date whose month will be used to fetch api
 * @param done {function} - The callback function of the form (err, data)
 */
function getMonthlyProgramming(relevantDate, region, done) {
  /* Helper functions */
  var genCountsObject = function(title) {
    var obj = {name: title, activities: 0, hours: 0, Junior: 0, Youth: 0, Adult: 0, veterans: 0,
               guests: 0, volunteers: 0,
               staffHours: 0};

    return obj;
  };

  var getDuration = function(startDate, endDate) {
    var milliseconds = endDate - startDate;
    return (((milliseconds) / 1000) / 60) / 60; // the number of hours between start and end
  };

  // Build the tables from the count object
  var buildTables = function() {

    // Build the totals table
    TotalsTable.pushObjectRow(counts.totals);

    // Build Total Table
    _(counts.club).forEach(function(sportsTotals, sport) {
      

      RegionTable.pushObjectRow(sportsTotals);
    });
  };

  /* Main program logic */
  var labelsTotal = ["# of activities", "Hours", "Juniors", "Youth",
                     "Adult", "Veterans", "Guests", "# of Volunteer Staff",
                      "Staff Hours"];
  // The schema
  var schema = ["string", "number", "number", 
                "number", "number", "number", "number",
                "number", "number", "number"];
  
  // Labels for the monthly report per region
  var labelsMonthly = ["Program", "# of activities", "Hours", "Juniors", "Youth", "Adult", 
                      "Veterans", "Guests", "# of Volunteer Staff",
                      "Staff Hours"];

  // Tables
  var TotalsTable = new xls.Table("Monthly Totals", schema.slice(1), labelsTotal);

  var regionName = capitalizeString(region);
  var RegionTable = new xls.Table(regionName + " Breakdown", schema, labelsMonthly);

  var counts = {};
  counts.totals = {};
  counts.club = {};

  // Populate totals
  counts.totals = genCountsObject("Filler");
  delete counts.totals["name"];

  // Generate Counts For Individual Sports
  var sports = ['Bowling', 'Cycling', 'Game Night', 'Goalball Tournament',
		'Goalball Practice', 'Achilles', 'BR dancing', 'Golf', 
                'Beeper Kickball',
                'Health Check', 'Exercise and Yoga', 'Golf', 'Conference', 'Other'];
  for (var i = 0; i < sports.length; i++) {
    counts["club"][sports[i]] = genCountsObject(sports[i]);
  }

  //console.log(counts);

  // Populate the counts array
  async.parallel([
    function processEvents(callback) {
      Event.loadObjectsByMonth(relevantDate, function(err, objects) {
        if (err) {
          // Inform the callback of the error
          return callback(err);
        }

        var registrations = [];
        for (var i = 0; i < objects.length; i++) {
          //console.log("Start of for loop");
          //console.log(objects.length);
          //console.log(i);
          // Registrations (to send to next function in the list)

          // Process the event object data
          var object = objects[i];

          //var sport = getSportNameInContext(object.sport);
	  var sport = object.sport;
          var club = getClubNameInContext(object.club);
          
          // Statewide report includes all clubs. All clubs become statewide;
          
          if (region === "statewide") {
            var club = "statewide";
          } else {
            console.log("Checking if region " + region + " is equal to " + club);
            if (region !== club) {
              console.log("Region and club are not equal, continuing");
              continue;
            }
          }

          var numHours = object.hours;

          if (!sport) {
            // An undefined sport means don't bother with this one, skip it and
            // move on
            continue;
          }
         
          /* Increment the total number of activities for the specified sport */
	
	  console.log("Activities count sport: %s", sport);

          counts.totals.activities++;
          counts.totals.hours += numHours;
          counts["club"][sport].activities++;
          counts["club"][sport].hours += numHours;

          counts.totals.volunteers += object.volunteers;
          counts["club"][sport].volunteers += object.volunteers;

          counts.totals.staffHours += object.staffHours;
          counts["club"][sport].staffHours  += object.staffHours;

        }

        //console.log("Registrations: " + registrations);
        callback(null);
      });
    },
    function processAttendance(callback) {
      var memo = {};

      var isRemembered = function(sport, user) {
        if (!memo[sport]) {
          return false;
        }

        return memo[sport][user] == true;
      };

      var remember = function(sport, user) {
        if (!isRemembered(sport, user)) {
          if (!memo[sport]) {
            memo[sport] = {};
          }

          memo[sport][user] = true;
        } else {
          callback(new Error("Remember called twice on same user"));
        }
      }

      Attendance.loadObjectsByMonth(relevantDate, function(err, objects) {
        if (err) {
          return callback(err);
        }

        for (var regNum = 0; regNum < objects.length; regNum++) {
          var registration = objects[regNum];
          var club = getClubNameInContext(registration.club);

          if (!(region === "statewide" || (region === club))) {
            continue;
          }

          for (var j = 0; j < registration.participants.length; j++) {
            var user = registration.participants[j];

            // Ensure that each user is only processed once per sport
            if (!isRemembered(registration.sport, user.id)) {
              remember(registration.sport, user.id);
            } else {
              continue;
            }

            if (user.isVeteran) {
              counts.totals.veterans++;
              counts["club"][registration.sport].veterans++;
            }

            if (user.isGuest) {
              counts.totals.guests++;
              counts["club"][registration.sport].guests++;
            }

            var roles = user.roles;

            // Derpy volunteer calculation
            /*
            for (var i = 0; i < roles.length; i++) {
              if (roles[i] === "volunteer") {
                // Incrment the number of volunteers, if applicable
                counts.totals.volunteers++;
                counts["club"][registration.sport].volunteers++; 

                // This is probably not the right way to calculate volunteer hours
                counts.totals.volunteerHours += numHours;
                counts["club"][registration.sport].volunteerHours += numHours;
                break;
              }
            }
            */


            var userAgeGroup = user.ageGroup;

            counts.totals[userAgeGroup]++;
            counts["club"][registration.sport][userAgeGroup]++;
          }

        }
	
	console.log("ending attendance callback here");
        callback(null);
      });
    }

  ], function(err) {
    console.log("In building callback here");
    if (err) {
      console.log("ERROR");
      console.log(err);
      return done(err);
    } else {
      console.log("Building tables");

      // Prepare for table completion
      buildTables();

      var data = {
        sheet1: {
          name: "TNABA Monthly Event Report - " + regionName,
          data: [TotalsTable, RegionTable]
        }
      }
      
      done(null, data);
    }
  });
}

function getMembershipRoster(relevantDate, scope, done) {
  var memberLabels = ["ID#", "Last Name", "First Name", "Email Address", "Phone Number", "Active",
                      "Age Group", "Sports Club"];
  var memberSchema = ["number", "string", "string", "string", "string", "boolean", "string", 
                      "string"];
  var overallLabels = ["New Members", "Total Members"];
  var overallSchema = ["number", "number"];

  var overallTable = new xls.Table("Overall Counts", overallSchema, overallLabels);
  var memberTable = new xls.Table("Members", memberSchema, memberLabels);
  var blockedTable = new xls.Table("Blocked Members", memberSchema, memberLabels)

  async.parallel([
    function fetchRelevantMonthInformation(callback) {
      User.loadUsersByCreatedMonth(relevantDate, function(err, users) {
        if (err) {
          return callback(err);
        }

        return callback(null, users.length);
      });
    },
    function fetchAllUserInformation(callback) {
      User.loadObjects(function(err, users) {
        if (err) {
          return callback(err);
        }

        var relUsers = 0;
        for (var i = 0; i < users.length; i++) {
          var user = users[i];
          if (scope === "active") {
            // Ignore pending users, admins and guests
            if (user.pending || user.isGuest || user.isAdmin) {
              continue;
            } 
          }

          relUsers++;
          var newRow = [user.id, user.lastName, user.firstName, user.email, 
                        user.phone, user.active,
                        user.ageGroup, user.sportsClub];
          if (user.blocked) {
            blockedTable.pushRow(newRow);
          } else {
            memberTable.pushRow(newRow);
          }
        }

        callback(null, relUsers);
      });
    }
  ], 
  function uponCompletion(err, counts) {
    if (err) {
      return done(err);
    }

    overallTable.pushRow(counts);

    var response = {
      sheet1: {
        name: "TNABA " + scope + " member roster",
        data: [overallTable, memberTable, blockedTable]
      }
    };

    done(null, response);
  });
}

/*
 * Fetch monthly membership report for the month of relevantDate,
 * calling function done when completed.
 * @param relevantDate {date} - The date whose month will be used to fetch api
 * @param done {function} - The callback function of the form (err, data)
 */
function getMonthlyMembership(relevantDate, region, done) {

  var overallLabels = ["New Members this Month", "Total Members"];
  var overallSchema = ["number", "number"];

  var newMemberLabels = ["ID#", "Last Name", "First Name", "Email Address", "Phone Number", "Status"];
  var newMemberSchema = ["number", "string", "string", "string", "string", "string"]

  var genderBreakdownLabels = ["Male", "Female"];
  var genderBreakdownSchema = ["number", "number"];

  var ageBreakdownLabels = ["Junior", "Youth", "Adult"];
  var ageBreakdownSchema = ["number", "number", "number"];

  var statusBreakdownLabels = ["Pending", "Active", "Blocked"];
  var statusBreakdownSchema = ["number", "number", "number"];

  var veteranBreakdownLabels = ["Total", "Disabled", "Active", "Retired"];
  var veteranBreakdownSchema = ["number", "number", "number", "number"];

  /* Helpers */
  function createMembershipInfoTables() {
    var obj = {};
    // Table definitions
    obj.OverallTable = new xls.Table("Overall Counts", overallSchema, overallLabels);
    obj.NewMemberSummary = new xls.Table("New Member Information", newMemberSchema, newMemberLabels);
    obj.GenderBreakdown = new xls.Table("Gender Breakdown", genderBreakdownSchema, genderBreakdownLabels);
    obj.AgeBreakdown = new xls.Table("Age Breakdown", ageBreakdownSchema, ageBreakdownLabels);
    obj.StatusBreakdown = new xls.Table("Member Status Breakdown", statusBreakdownSchema, statusBreakdownLabels);
    obj.VeteranBreakdown = new xls.Table("Veteran Status", veteranBreakdownSchema, veteranBreakdownLabels);

    return obj;
  }

  function yankDataArrayFromTable(clubName) {
    var desired = tables[clubName];
    return [desired.OverallTable, desired.StatusBreakdown, desired.GenderBreakdown, 
            desired.AgeBreakdown,
            desired.VeteranBreakdown, desired.NewMemberSummary];
  } 

  var tables = {
    "statewide": createMembershipInfoTables(),
    "nashville": createMembershipInfoTables(),
    "memphis": createMembershipInfoTables()
  };

  async.parallel([
    // Load user information
    function fetchInformationAboutUsersAddedThisMonth(callback) {
      // Fetch all users in the specified month and populate information
      
      User.loadUsersByCreatedMonth(relevantDate, function(err, objects) {
        if (err) {
          return callback(err);
        } 

        var numUsers = objects.length;

        for (var i = 0; i < numUsers; i++) {
          var user = objects[i];
          var id = user.id || 0;
          var lastName = user.lastName || "unknown";
          var firstName = user.firstName || "unknown";
          var email = user.email || "unknown";
          var phone = user.phone || "unknown";
          var roles = user.roles.join(", ") || "unknown";
          var sportsClub = getClubNameInContext(user.sportsClub);

          var newRow = [id, lastName, firstName, email, phone, roles];

          tables[sportsClub].NewMemberSummary.pushRow(newRow);
        }

        callback(null, tables[region].NewMemberSummary.entries);
      });
    },
    function fetchInformationAboutEveryUser(callback) {

      function genCounts(len) {
        return {
          nashville: Array.apply(null, new Array(len)).map(Number.prototype.valueOf, 0),
          memphis: Array.apply(null, new Array(len)).map(Number.prototype.valueOf, 0),
          statewide: Array.apply(null, new Array(len)).map(Number.prototype.valueOf, 0)
        }
      }

      // Counts of gender information for GenderBreakdown table
      var genderLen = genderBreakdownSchema.length;
      var genderCountsArrays = genCounts(genderLen);

      // Counts of age information for AgeBreaddown table
      var ageLen = ageBreakdownSchema.length;
      var ageCountsArrays = genCounts(ageLen);

      // Counts of status information for StatusBreakdown table
      var statusLen = statusBreakdownSchema.length;
      var statusCountsArrays = genCounts(statusLen);

      // Counts of veteran information for VeteranBreakdown
      var veteranLen = veteranBreakdownSchema.length;
      var veteranCountsArrays = genCounts(veteranLen);

      User.loadObjects(function(err, objects) {
        if (err) {
          console.error("Error while processing loaded objects");
          console.error(err);
          callback(err);
          return;
        } 

        var numUsers = objects.length;
        var relevantUsers = 0;
        console.log(numUsers);
        for (var i = 0; i < numUsers; i++) {

          

          var user = objects[i];
          console.log(user);

          // Skip admin and guest
          if (user.isAdmin || user.isGuest) {
            continue;
          }

          var sportsClub = getClubNameInContext(user.sportsClub);

          // If we're looking for statewide, might as well set entire code
          // to fetch only statewide
          if (region === "statewide") {
            sportsClub = "statewide";
          }

          // Helper function to test if a given user is considered 
          // active (not members with volunteer or renew)
          var userIsCounted = (!user.pending) && (!user.isVolunteer);

          if (sportsClub === region) {
            if (userIsCounted) {
              relevantUsers++;
            }
          }

          var genderCounts = genderCountsArrays[sportsClub];
          var ageCounts = ageCountsArrays[sportsClub];
          var statusCounts = statusCountsArrays[sportsClub];
          var veteranCounts = veteranCountsArrays[sportsClub];
          var statusCounts = statusCountsArrays[sportsClub];


          // --------------- Update status counts ----------------
          // Index 0 is pending, index 2 is blocked, index 1 is standard
          // active
          if (user.pending) {
            statusCounts[0]++;
          } else if (user.blocked) {
            statusCounts[2]++;
          } else {
            statusCounts[1]++;
          }

          // --------------- Update gender counts ----------------
          // Gender information
          var gender = user.gender || "Unknown";
          if (gender === "Male") {
            genderCounts[0]++;
          } else if (gender === "Female") {
            genderCounts[1]++;
          }

          // --------------- Update age group counts ----------------

          var ageGroup = user.ageGroup;
          console.log("Age group: " + ageGroup);

          // console.log("Got age group: " + ageGroup);
          if (ageGroup === "Junior") {
            //console.log("Inc junior");
            ageCounts[0]++;
          } else if (ageGroup === "Youth") {
            //console.log("Inc Youth");
            ageCounts[1]++;
          } else if (ageGroup === "Adult") {
            //console.log("Inc Adult");
            ageCounts[2]++;
          }

          // --------------- Update veteran counts ----------------
          if (user.isVeteran) {
            veteranCounts[0]++;

            if (user.veteranStatus === "Disabled Veteran") {
              veteranCounts[1]++;
            } else if (user.veteranStatus === "Active Duty") {
              veteranCounts[2]++;
            } else if (user.veteranStatus === "Retired") {
              veteranCounts[3]++;
            }
          }

        }

        var sumAllIterator = function(accumulator, value) {
          return accumulator + value;
        };

        var clubs = ["statewide", "nashville", "memphis"];
        for (var i = 0; i < clubs.length; i++) {
          var club = clubs[i];
          var genderCounts = genderCountsArrays[club];
          var ageCounts = ageCountsArrays[club];
          var statusCounts = statusCountsArrays[club];
          var veteranCounts = veteranCountsArrays[club];

          // ----------------------- Appending Status information --------------------
          console.log("Status counts");
          console.log(statusCounts);
          tables[club].StatusBreakdown.pushRow(statusCounts);
          var statusSum = statusCounts.reduce(sumAllIterator);
          var statusFrac = statusCounts.map(function(el) {
            return (el / statusSum) * 100;
          });
          tables[club].StatusBreakdown.pushRow(statusFrac);

          // ----------------------- Appending Gender information --------------------
          tables[club].GenderBreakdown.pushRow(genderCounts);
          var genderSum = genderCounts.reduce(sumAllIterator); // get the sum of the elements
          var genderFrac = genderCounts.map(function(el) {
            return (el / genderSum) * 100;
          });

          console.log(genderFrac);
          tables[club].GenderBreakdown.pushRow(genderFrac);

          // ------------------------ Appending age information ------------------------
          tables[club].AgeBreakdown.pushRow(ageCounts);
          console.log(ageCounts);

          var ageSum = ageCounts.reduce(sumAllIterator);
          var ageFrac = ageCounts.map(function(el) {
            return (el / ageSum) * 100;
          });

          console.log(ageFrac);
          tables[club].AgeBreakdown.pushRow(ageFrac);

          // ------------------------ Appending veteran information ---------------------
          console.log("Pushing Veteran Counts");
          console.log(veteranCounts);
          tables[club].VeteranBreakdown.pushRow(veteranCounts);
        }

        callback(null, relevantUsers);
      });
    }
    // load counts information
  ], function(err, results) {
    // Counts will contain an array with the first entry being new users, the second entry being total users
    if (err) {
      done(err);
      return;
    } else {

      tables[region].OverallTable.pushRow(results);
      console.log(results);

      console.log("Tables: ");
      console.log(tables[region]);

      var data = {
        sheet1: {
          name: "TNABA Monthly Membership Data - " + capitalizeString(region),
          data: yankDataArrayFromTable(region)
        }
      };

      //console.log("Report: " + callbackReport.toString());
      //console.log("Info: " + callbackInfo.toString());

      return done(null, data);
    }
  });
}


/*
 * Data API call external export. Return api data for report type dataType
 * for the month of relevantDate, calling callback when completed
 * @param dataType {string} - Indicate what type of report data to fetch
 * @param relevantDate {date} - a date with a relevant month to fetch data from
 * @param callback {function} - a callback of the form (err, data)
 */
module.exports = function(dataType, relevantDate, callback) {
  switch (dataType) {
    case "event": 
    getMonthlyProgramming(relevantDate, "statewide", callback);
    break;

    case "eventNashville":
    getMonthlyProgramming(relevantDate, "nashville", callback);
    break;

    case "eventMemphis":
    getMonthlyProgramming(relevantDate, "memphis", callback);
    break;

    case "membership":
    getMonthlyMembership(relevantDate, "statewide", callback);
    break;

    case "membershipNashville":
    getMonthlyMembership(relevantDate, "nashville", callback);
    break;

    case "membershipMemphis":
    getMonthlyMembership(relevantDate, "memphis", callback);
    break;

    case "membershipRoster":
    getMembershipRoster(relevantDate, "full", callback);
    break;

    case "membershipActiveRoster":
    getMembershipRoster(relevantDate, "active", callback);
    break;

    default:
    callback(new Error("Unknown Report"));
    break;
  }
}
