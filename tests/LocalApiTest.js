var api = require('../util/DataApiCall.js');

api("Monthly Membership Report", new Date(2014, 2, 1), function(err, data) {
  if (err) {
    console.error(err);
  } else {
    console.log(data);
  }
});