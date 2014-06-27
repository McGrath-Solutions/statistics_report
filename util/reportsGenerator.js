var User = require('../models/user');
var Event = require('../models/event');
var Registration = require('../models/registration');
var xls = require('./xlsutil');
var _ = require('lodash');

var makeMontlyProgramming(relevantDate, callbackInfo, callbackReport) {

  // Labels for the report on totals
  var labelsTotal = ["Clubs", "# of activities", "# of hours", "Juniors", "Youth", "Adult", "Veterans", "# of Volunteer Staff",
                      "Volunteer Hours"];

  // The schema
  var schema = ["string", "number", "number", 
                "number", "number", "number", "number"
                "number", "number"];
  
  // Labels for the monthly report per region
  var labelsMonthly = ["Program", "# of activities", "# of hours", "Juniors", "Youth", "Adult", 
                      "Veterans", "# of Volunteer Staff",
                      "Volunteer Hours"];

  // Tables
  var TotalsTable = new xls.Table("Monthly Totals", schema, labelsTotal);
  var NashvilleTable = new xls.Table("Nashville Breakdown", schema, labelsMonthly);
  var MemphisTable = new xls.Table("Memphis Breakdown", schema, labelsMonthly);

  // Populate Tables
  // ---------------
  var counts = {};
  counts.totals = {};
  counts.nashville = {};
  counts.memphis = {};

  // Populate totals
  counts.totals.atLarge = getCountsObject("At-Large");
  counts.totals.nashville = genCountsObject("Nashville");
  counts.totals.memphis = genCountsObject("Memphis");

  // Generate Counts For Individual Sports
  var sports = ['Bowling', 'Cycling', 'Game Night', 'Goalball', 'Run/Walk', 'BR dancing', 'Golf', 'Kickball'];
  for (var i = 0; i < sports.length; i++) {
    counts.nashville[sports[i]] = genCountsObject(sports[i]);
    counts.memphis[sports[i]] = genCountsObject(sports[i]);
  }

  // Populate counts for individual sports
  // "Callback Hell"
  Event.loadObjectsByMonth(relevantDate, function(objects) {
    var length = objects.length;
    for (var i = 0; i < length; i++) {
      processEventObjectData(objects[i], function() {

      });
    }
  });

  /* Helper Functions */
  /* Generate a counts Object conforming to the schema */
  var genCountsObject = function(title) {
    var obj = {name: title, activities: 0, hours: 0, juniors: 0, youth: 0, adults: 0, veterans: 0, volunteers: 0,
               volunteerHours: 0};

    return obj;
  }

  /* Get the sport in the context of this report associated with the event sport stored in database */
  var getSportNameInContext = function(dbName) {
    if (dbName === "Goalball Tournament") {
      return 'Goalball';
    } else if (dbName === 'Cycling') {
      return 'Cycling';
    } else if (dbName === 'Bowling') {
      return 'Bowling';
    } else if (dbName === 'Achilles') {
      return 'Run/Walk';
    } else if (dbName === 'Goalball') {
      return 'Goalball';
    } else {
      return null;
    }
  }

  /* Get the club name of the sport in context of this report */
  var getClubNameInContext = function(dbClubName) {
    if (dbClubName === "At-Large") {
      return "atLarge";
    } else if (dbClubName === "Memphis") {
      return "memphis";
    } else if (dbClubName === "Nashville") {
      return "nashville";
    }
  }

  /* Get the duration of the event 
   * Currently the number of hours is simply start date - end date */
  var getDuration = function(startDate, endDate) {
    var milliseconds = endDate - startDate;
    return (((milliseconds) / 1000) / 60) / 60; // the number of hours between start and end
  }

  /* Process Event object */
  var processEventObjectData = function(object, callback) {
    var sport = getSportNameInContext(object.sport);
    var club = getClubNameInContext(object.club);
    var numHours = getDuration(object.start, object.end);

    console.log("DB sportname: " + object.sport);
    console.log("Context name: " + sport);

    console.log("DB clubname: " + object.club);
    console.log("Context name: " + club);

    /* If I don't know what this sport is, I won't log it */
    if (sport == undefined) {
      return;
    }

    /* Increment the total number of activities for the specified sport */
    counts.totals[club].activities++;
    counts.totals[club].hours += numHours;
    counts[club][sport].activities++;
    counts[club][sport].hours += numHours;

    var numReg = object.registrations.length; 
    var registrations = object.registrations;

    var processedCount = 0;
    for (var regNum = 0; regNum < numReg; regNum++) {
       var reg = registrations[regNum];
       regId = reg.id;
       Registration.loadRegistrationById(regId, function(registration) {
        
       });
    }
  }
}

/*
 * Generate a report, sending table information back to callbackInfo (if defined).
 * Calls callbackReport upon report generation completion. 
 * @param reportType = the type of report to be generated;
 * @param relevantDate = the date where the report is relevant;
 * @param callbackInfo = the information callback (to be called as soon as information is ready);
 * @param callbackReport = the callback to be called when the report is generated;
 */
module.exports = function(reportType, relevantDate, callbackInfo, callbackReport) {
  if (arguments.length === 3) {
    callbackReport = callbackInfo;
    callbackInfo == undefined;
  }

  if (reportType == "Monthly Programming Report") {
    makeMonthlyProgramming(relevantDate, callbackInfo, callbackReport);
  } else {
    callback(new Error("Unkown Report"));
  }
}