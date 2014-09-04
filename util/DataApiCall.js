/* 
 * DataApiCall.js
 * Fetches data about a relevant report type and return them to the client. 
 * @author Mike Zhang
 */
var User = require('../models/user');
var Event = require('../models/event');
var Registration = require('../models/registration');
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
    TotalsTable.pushObjectRow(counts.totals);

    // Build Total Table
    _(counts.club).forEach(function(sportsTotals, sport) {
      console.log("This counts: ");
      console.log(util.inspect(sportsTotals));
      

      RegionTable.pushObjectRow(sportsTotals);
    });
  };

  var capitalizeString = function(string) {
    return string[0].toUpperCase() + string.substring(1);
  }

  /* Main program logic */
  var labelsTotal = ["# of activities", "Hours", "Juniors", "Youth",
                     "Adult", "Veterans", "Guests", "# of Volunteer Staff",
                      "Volunteer Hours"];
  // The schema
  var schema = ["string", "number", "number", 
                "number", "number", "number", "number",
                "number", "number", "number"];
  
  // Labels for the monthly report per region
  var labelsMonthly = ["Program", "# of activities", "Hours", "Juniors", "Youth", "Adult", 
                      "Veterans", "Guests", "# of Volunteer Staff",
                      "Volunteer Hours"];

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
  var sports = ['Bowling', 'Cycling', 'Game Night', 'Goalball', 'Achilles', 'BR dancing', 'Golf', 
                'Beeper Kickball',
                'Health Check', 'Exercise and Yoga', 'Golf', 'Conference', 'Other'];
  for (var i = 0; i < sports.length; i++) {
    counts["club"][sports[i]] = genCountsObject(sports[i]);
  }

  //console.log(counts);

  // Populate the counts array
  async.waterfall([
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

          var sport = getSportNameInContext(object.sport);
          var club = getClubNameInContext(object.club);
          
          // Statewide report includes all clubs. All clubs become statewide;
          
          if (region === "statewide") {
            console.log("Is statewide report nbd, allowing all");
            var club = "statewide";
          } else {
            console.log("Checking if region " + region + " is equal to " + club);
            if (region !== club) {
              console.log("Region and club are not equal, continuing");
              continue;
            }
          }

          var numHours = getDuration(object.start, object.end);

          if (!sport) {
            // An undefined sport means don't bother with this one, skip it and
            // move on
            continue;
          }

          // console.log(club);
          // console.log(sport);

          /*
          console.log("Sport: " + sport);
          console.log("Club: " + club);
          console.log("Hours: " + numHours);
          */
         
          /* Increment the total number of activities for the specified sport */

          counts.totals.activities++;
          counts.totals.hours += numHours;
          counts["club"][sport].activities++;
          counts["club"][sport].hours += numHours;


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
              counts.totals.guests++;
              counts["club"][registration.sport].guests++;
              cbinterior(null);
            } else {
              Registration.loadUserObject(registration, function(err, user) {
                if (err) {
                  // console.log("ERROR THAT CAUSE CB TWICE: " + err);
                  return cbinterior(err);
                } else {
                  // Check if the user is veteran
                  //console.log("User checking");
                  //console.log(registration);

                  if (user.isVeteran) {
                    counts.totals.veterans++;
                    counts["club"][registration.sport].veterans++;
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
                      counts.totals.volunteers++;
                      counts["club"][registration.sport].volunteers++; 

                      // This is probably not the right way to calculate volunteer hours
                      counts.totals.volunteerHours += registration.numHours;
                      counts["club"][registration.sport].volunteerHours += registration.numHours;
                      break;
                    }
                  }

                  var userAgeGroup = user.ageGroup;
                  counts.totals[userAgeGroup]++;
                  counts["club"][registration.sport][userAgeGroup]++;

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
      console.log(err);
      return done(err);
    } else {
      console.log("Building tables");

      // Prepare for table completion
      buildTables();

      var data = {
        sheet1: {
          name: "TNABA State Monthly Programming Report",
          data: [TotalsTable, RegionTable]
        }
      }
      
      done(null, data);
    }
  });
}

function getMembershipRoster(relevantDate, done) {
  var memberLabels = ["ID#", "Last Name", "First Name", "Email Address", "Phone Number", "Active",
                      "Age Group", "Blocked"];
  var memberSchema = ["number", "string", "string", "string", "string", "boolean", "string", "boolean"];

  var overallLabels = ["New Members", "Total Members"];
  var overallSchema = ["Number", "Number"];
}

/*
 * Fetch monthly membership report for the month of relevantDate,
 * calling function done when completed.
 * @param relevantDate {date} - The date whose month will be used to fetch api
 * @param done {function} - The callback function of the form (err, data)
 */
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

  var veteranBreakdownLabels = ["Total", "Disabled", "Active", "Retired"];
  var veteranBreakdownSchema = ["number", "number", "number", "number"];

  /* Helpers */
  function createMembershipInfoTables() {
    var obj = {};
    // Table definitions
    obj.NewMemberSummary = new xls.Table("New Member Information", newMemberSchema, newMemberLabels);
    obj.OverallCount = new xls.Table("Overall Members", overallSchema, overallLabels);
    obj.GenderBreakdown = new xls.Table("Gender Breakdown", genderBreakdownSchema, genderBreakdownLabels);
    obj.AgeBreakdown = new xls.Table("Age Breakdown", ageBreakdownSchema, ageBreakdownLabels);
    obj.StatusBreakdown = new xls.Table("Member Status Breakdown", statusBreakdownSchema, statusBreakdownLabels);
    obj.VeteranBreakdown = new xls.Table("Veteran Status", veteranBreakdownSchema, veteranBreakdownLabels);

    return obj;
  }

  function yankDataArrayFromTable(clubName) {
    var desired = tables[clubName];
    return [desired.GenderBreakdown, desired.AgeBreakdown, desired.StatusBreakdown, 
              desired.VeteranBreakdown, desired.NewMemberSummary, desired.OverallCount];
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
        var monthlyTotals = {
          statewide: 0,
          nashville: 0,
          memphis: 0
        };

        for (var i = 0; i < numUsers; i++) {
          var user = objects[i];
          var id = user.id || 0;
          var lastName = user.lastName || "unknown";
          var firstName = user.firstName || "unknown";
          var email = user.email || "unknown";
          var phone = user.phone || "unknown";
          var roles = user.roles.join() || "unknown";
          var sportsClub = getClubNameInContext(user.sportsClub);

          var newRow = [id, lastName, firstName, email, phone, roles];

          tables[sportsClub].NewMemberSummary.pushRow(newRow);
          monthlyTotals[sportsClub]++;
        }

        callback(null, monthlyTotals);
      });
    },
    function fetchInformationAboutEveryUser(callback) {
      /*
      var genderCounts = [0, 0]; // Counts for males and females
      var ageCounts = [0, 0, 0]; // Counts for Junior, Youth and Adult
      var statusCounts = [0, 0, 0, 0]; // Counts of user status
      var veteranCounts = [0, 0, 0, 0]; // Counts of veterans
      */

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
          console.error("Big trubble");
          console.error(err);
          callback(err);
          return;
        } 

        /*
        console.log("Objects: ");
        console.log(objects);
        */

        var numUsers = objects.length;
        var overallTotals = {
          statewide: 0,
          nashville: 0,
          memphis: 0
        };

        for (var i = 0; i < numUsers; i++) {
          var user = objects[i];
          var sportsClub = getClubNameInContext(user.sportsClub);
          overallTotals[sportsClub]++;

          /*
          console.log(user);
          console.log(sportsClub);
          */

          var genderCounts = genderCountsArrays[sportsClub];
          var ageCounts = ageCountsArrays[sportsClub];
          var statusCounts = statusCountsArrays[sportsClub];
          var veteranCounts = veteranCountsArrays[sportsClub];


          // --------------- Update gender counts ----------------
          // Gender information
          var gender = user.gender || "Unknown";
          if (gender === "Male") {
            genderCounts[0]++;
          } else if (gender === "Female") {
            genderCounts[1]++;
          }

          // --------------- Update age group counts ----------------
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


          // --------------- Update status counts ----------------
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
            statusCounts[3]++;
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
        }

        var clubs = ["statewide", "nashville", "memphis"];
        for (var i = 0; i < clubs.length; i++) {
          var club = clubs[i];
          var genderCounts = genderCountsArrays[club];
          var ageCounts = ageCountsArrays[club];
          var statusCounts = statusCountsArrays[club];
          var veteranCounts = veteranCountsArrays[club];

          // ----------------------- Appending Gender information --------------------
          tables[club].GenderBreakdown.pushRow(genderCounts);
          var genderSum = genderCounts.reduce(sumAllIterator); // get the sum of the elements
          var genderFrac = genderCounts.map(function(el) {
            return el / genderSum;
          });

          console.log(genderFrac);
          tables[club].GenderBreakdown.pushRow(genderFrac);

          // ------------------------ Appending age information ------------------------
          tables[club].AgeBreakdown.pushRow(ageCounts);
          console.log(ageCounts);

          var ageSum = ageCounts.reduce(sumAllIterator);
          var ageFrac = ageCounts.map(function(el) {
            return el / ageSum;
          });

          console.log(ageFrac);
          tables[club].AgeBreakdown.pushRow(ageFrac);

          // ------------------------ Appending status information ---------------------
          console.log("Pushing Status Counts");
          console.log(statusCounts);
          console.log(statusCounts.length);
          console.log(tables[club].StatusBreakdown.length);
          tables[club].StatusBreakdown.pushRow(statusCounts);

          // ------------------------ Appending veteran information ---------------------
          console.log("Pushing Veteran Counts");
          console.log(veteranCounts);
          tables[club].VeteranBreakdown.pushRow(veteranCounts);
        }

        callback(null, overallTotals);
      });
    }
    // load counts information
  ], function(err, counts) {
    // Counts will contain an array with the first entry being new users, the second entry being total users
    if (err) {
      done(err);
      return;
    } else {

      var clubs = ["statewide", "nashville", "memphis"];
      var entries = 2;
      for (var i = 0; i < clubs.length; i++) {
        var club = clubs[i];
        tables[club].OverallCount.pushRow([counts[0][club], counts[1][club]]);
      }

      console.log("Tables: ");
      console.log(tables);

      var data = {
        statewide: {
          name: "TNABA Monthly Membership Data - Statewide",
          data: yankDataArrayFromTable("statewide")
        },
        nashville: {
          name: "TNABA Monthly Membership Data - Nashville",
          data: yankDataArrayFromTable("nashville")
        },
        memphis: {
          name: "TNABA Monthly Membership Data - Memphis",
          data: yankDataArrayFromTable("memphis")
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
    getMonthlyMembership(relevantDate, callback);
    break;

    case "membershipNashville":
    getNashvilleMembership(relevantDate, callback);
    break;

    case "membershipMemphis":
    getMemphisMembership(relevantDate, callback);
    break;

    case "membershipRoster":
    getMembershipRoster(relevantDate, callback);
    break;

    default:
    callback(new Error("Unknown Report"));
    break;
  }
}
