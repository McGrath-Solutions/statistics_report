var Attendance = require('../../models/attendance');
var util = require('util');

Attendance.loadObjectsByMonth(new Date(2014, 7, 1), function(err, result) {
  if (err) {
    console.log(err);
  }
  console.log("Results");
  console.log(util.inspect(result));

  for (var i = 0; i < result.length; i++) {
    console.log(result[i].participants);
  }
})
