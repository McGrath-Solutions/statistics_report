var Attendance = require('../../models/attendance');
var util = require('util');

Attendance.loadObjectsByMonth(new Date(2014, 7, 1), function(err, result) {
  if (err) {
    console.log(err);
  }
  console.log("Results");
  console.log(util.inspect(result));
})
