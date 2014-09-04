var api = require('../../util/DataApiCall.js');
var util = require('util');


api("membershipRoster", new Date(), function(err, data) {
  if (err) {
    console.error(err);
  } else {
    console.log(data);

    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
      var dataEntry = data[keys[i]].data;
      // console.log(data[keys[i]].data);

      console.log(keys[i]);

      for (var j = 0; j < dataEntry.length; j++) {
        console.log(dataEntry[j].rows);
      }
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

