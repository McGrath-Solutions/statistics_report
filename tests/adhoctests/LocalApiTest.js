var api = require('../../util/DataApiCall.js');
var util = require('util');


api("event", new Date(), function(err, data) {
  if (err) {
    console.error(err);
  } else {
    console.log(data);

 
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

