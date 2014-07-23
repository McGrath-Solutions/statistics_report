var Statistic = require('../models/statistic');

Statistic.loadObjects("sports_statistic", function(err, objects) {
  console.log(objects);
});