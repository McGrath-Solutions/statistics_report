var User = require('../models/user');
var xls = require('./xlsutil');

var makeMontlyProgramming(callback) {
  var labelsTotal = ["Clubs", "# of activities", "# of hours", "Juniors", "Youth", "Adult", "Veterans", "# of Volunteer Staff",
                      "Volunteer Hours"];
  var schema = ["string", "number", "number", 
                "number", "number", "number", "number"
                "number", "number"];
  var TotalsTable = new xls.Table("Monthly Totals", schema, labelsTotal);

  var labelsMonthlyNashville = 
}

module.exports = function(reportType, callback) {
  if (reportType == "Monthly Programming Report") {
    makeMonthlyProgramming(callback);
  } else {
    callback(new Error("Unkown Report"));
  }
}