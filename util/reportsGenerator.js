var User = require('../models/user');
var Event = require('../models/event');
var Registration = require('../models/registration');
var util = require('util');
var xls = require('./xlsutil');
var _ = require('lodash');

var makeMonthlyProgramming = function(relevantDate, path, callbackInfo, callbackReport) {
  console.log(callbackInfo);
  console.log(callbackReport);
  /* Helper Functions */
  /* Generate a counts Object conforming to the schema */
  var genCountsObject = function(title) {
    var obj = {name: title, activities: 0, hours: 0, juniors: 0, youth: 0, adults: 0, veterans: 0, volunteers: 0,
               volunteerHours: 0};

    return obj;
  };

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

  /* Get the duration of the event 
   * Currently the number of hours is simply start date - end date */
  var getDuration = function(startDate, endDate) {
    var milliseconds = endDate - startDate;
    return (((milliseconds) / 1000) / 60) / 60; // the number of hours between start and end
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

  /* Process Event object */
  var processEventObjectData = function(object, callback) {
    /*
    console.log("Now processing another event!");
    console.log("This event is: ");
    console.log(util.inspect(object));
    */

    var sport = getSportNameInContext(object.sport);
    var club = getClubNameInContext(object.club);
    var numHours = getDuration(object.start, object.end);

    // Testing code
    /*
     * console.log("Event object: ");
     * console.log(util.inspect(object));

     * console.log("DB sportname: " + object.sport);
     * console.log("Context name: " + sport);

     * console.log("DB clubname: " + object.club);
     * console.log("Context name: " + club);
    */

    /* If I don't know what this sport is, I won't log it */
    if (sport == undefined) {
      console.log("Sport is undefined. Calling callback.");
      //callback();
      //return;
      console.log("Sport is undefined. This should_not happen. Stupid test code here.");
      sport = "Run\/Walk";
    }

    /* Increment the total number of activities for the specified sport */
    counts.totals[club].activities++;
    counts.totals[club].hours += numHours;
    counts[club][sport].activities++;
    counts[club][sport].hours += numHours;

    var numReg = object.registrations.length; 
    var registrations = object.registrations;

    if (numReg === 0) {
      console.log("No registrations to process; calling callback");
      callback();
    }

    var processedRegistrations = 0;
    for (var regNum = 0; regNum < numReg; regNum++) {
      var reg = registrations[regNum];

      // Debugging code
      /*
      console.log("Now processing Registration: ");
      console.log(util.inspect(reg));
      */
     
      regId = reg.id;
      Registration.loadRegistrationById(regId, function(registration) {

        // Debugging code
        /*
        console.log("Fetched registration: ");
        console.log(util.inspect(registration));
        */

        if (registration.type === "Volunteer") {
          // Incrment the number of volunteers, if applicable
          counts.totals[club].volunteers++;
          counts[club][sport].volunteers++; 

          // This is probably not the right way to calculate volunteer hours
          counts.totals[club].volunteerHours += numHours;
          counts[club][sport].volunteerHours += numHours;
        }

        // If the registration is anonymous, do nothing more. Just call the callback.
        if (!registration.uid) {
          processedRegistrations++;
          console.log("Registrations Processed: " + processedRegistrations + " out of " + numReg);

          if (processedRegistrations === numReg) {
            callback();
          }
        } else {
          // Load the user object and check the age of the user
          Registration.loadUserObject(registration, function(user) {

            // Debugging code
            /*
            console.log("Fetched User: ");
            console.log(util.inspect(user));
            */

            // Check if the user is a veteran
            if (user.isVeteran) {
              console.log("This user is a veteran!");
              counts.totals[club].veterans++;
              counts[club][sport].veterans++;
            }

            var userAgeGroup = getAgeGroup(user.dob);
            console.log("THis user's age group: " + userAgeGroup);

            counts.totals[club][userAgeGroup]++;
            counts[club][sport][userAgeGroup]++;

            processedRegistrations++;
            console.log("Registrations Processed: " + processedRegistrations + " out of " + numReg);

            if (processedRegistrations === numReg) {
              callback(path);
            }
          });
        }

      }, callbackReport);
    }
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
    _(counts.atLarge).forEach(function(sportsTotals, sport) {
      /*
      console.log("This counts: ");
      console.log(util.inspect(sportsTotals));
      */

      AtLargeTable.pushObjectRow(sportsTotals);
    });

    // Build Memphis table
    _(counts.memphis).forEach(function(sportsTotals, sport) {
      /*
      console.log("This counts: ");
      console.log(util.inspect(sportsTotals));
      */

      MemphisTable.pushObjectRow(sportsTotals);
    });
  }

  // Debugging code
  console.log("Received request for reports during the month of " + relevantDate);

  // Labels for the report on totals
  var labelsTotal = ["Clubs", "# of activities", "# of hours", "Juniors", "Youth", "Adult", "Veterans", "# of Volunteer Staff",
                      "Volunteer Hours"];

  // The schema
  var schema = ["string", "number", "number", 
                "number", "number", "number", "number",
                "number", "number"];
  
  // Labels for the monthly report per region
  var labelsMonthly = ["Program", "# of activities", "# of hours", "Juniors", "Youth", "Adult", 
                      "Veterans", "# of Volunteer Staff",
                      "Volunteer Hours"];

  // Tables
  var TotalsTable = new xls.Table("Monthly Totals", schema, labelsTotal);
  var NashvilleTable = new xls.Table("Nashville Breakdown", schema, labelsMonthly);
  var MemphisTable = new xls.Table("Memphis Breakdown", schema, labelsMonthly);
  var AtLargeTable = new xls.Table("At-Large Breakdown", schema, labelsMonthly);

  // Populate Tables
  // ---------------
  var counts = {};
  counts.totals = {};
  counts.nashville = {};
  counts.memphis = {};
  counts.atLarge = {};

  // Populate totals
  counts.totals.atLarge = genCountsObject("At-Large");
  counts.totals.nashville = genCountsObject("Nashville");
  counts.totals.memphis = genCountsObject("Memphis");

  // Generate Counts For Individual Sports
  var sports = ['Bowling', 'Cycling', 'Game Night', 'Goalball', 'Run\/Walk', 'BR dancing', 'Golf', 'Kickball'];
  for (var i = 0; i < sports.length; i++) {
    counts.nashville[sports[i]] = genCountsObject(sports[i]);
    counts.memphis[sports[i]] = genCountsObject(sports[i]);
    counts.atLarge[sports[i]] = genCountsObject(sports[i]);
  }

  // Populate counts for individual sports
  // "Welcome to Callback Hell"
  Event.loadObjectsByMonth(relevantDate, function(objects) {
    var length = objects.length;
    var processedEvents = 0;

    for (var i = 0; i < length; i++) {
      processEventObjectData(objects[i], function() {
        processedEvents++;
        console.log("Events processed: " + processedEvents + " out of " + length);

        if (processedEvents === length) {
          /* console.log("Final result to be written: ");
          console.log(util.inspect(counts)); */

          if (callbackInfo) {
            callbackInfo(counts);
          }

          // Generate the report and call the callback
          // Extract the data
          buildTables();
          /*
          console.log("Tables: ");
          console.log(util.inspect(TotalsTable));
          console.log(util.inspect(NashvilleTable));
          console.log(util.inspect(AtLargeTable));
          console.log(util.inspect(MemphisTable));
          */
          var monthString = relevantDate.getMonth() + "/" + relevantDate.getFullYear();
          var xlsObject = {
            sheet1: {
              name: "TNABA Monthly Programming Report",
              information: {
                Generated: new Date(),
                Month: monthString
              },
              data: [TotalsTable, NashvilleTable, AtLargeTable, MemphisTable]
            }
          }

          //console.log("Report: " + callbackReport.toString());
          //console.log("Info: " + callbackInfo.toString());

          xls(xlsObject, function(err) {
            callbackReport(err, path);
          }, {fileName: path});
        }
      });
    }
  }, callbackReport);
}

/*
 * Generate a report, sending table information back to callbackInfo (if defined).
 * Calls callbackReport upon report generation completion. 
 * @param reportType = the type of report to be generated;
 * @param relevantDate = the date where the report is relevant;
 * @param callbackInfo = the information callback (to be called as soon as information is ready);
 * @param callbackReport = the callback to be called when the report is generated;
 */
module.exports = function(reportType, path, relevantDate, callbackInfo,  callbackReport) {
  if (arguments.length === 4) {
    callbackReport = callbackInfo;
    callbackInfo = undefined;
  }

  if (reportType == "Monthly Programming Report") {
    makeMonthlyProgramming(relevantDate, path, callbackInfo, callbackReport);
  } else if (reportType === "Monthly Membership Report") {
    console.log("Too be implemented!");
  } else {
    callbackReport(new Error("Unkown Report"));
  }
}