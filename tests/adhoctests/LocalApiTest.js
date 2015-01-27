var api = require('../../util/DataApiCall.js');
var util = require('util');


api("eventNashville", new Date(2015, 0, 1), function(err, data) {
  if (err) {
    console.error(err);
  } else {
    console.log(data);
    console.log(data.sheet1.data);
    for (var i = 0; i < data.sheet1.data.length; i++) {
      var table = data.sheet1.data[i];
      console.log(table.rows);
    }
  }
});


/*
api("Monthly Programming Report", new Date(2014, 6, 1), function(err, data) {
  if (err) {
    console.error("Error occured");
    console.error(err);
  } else {
    console.log("Data returned");
    console.log(util.inspect(data));
  }
})
*/

