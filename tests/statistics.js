var Statistic = require('../models/statistic');
var util = require('util');

Statistic.loadObjects("Stats Achilles", function(err, objects) {
  if (err) {
    console.error(util.inspect(err));
  } else {
    console.log("Success");
    console.log(objects);
  }
});
