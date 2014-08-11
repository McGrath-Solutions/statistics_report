var Statistic = require('../../models/statistic');
var util = require('util');

Statistic.loadObjects("Stats Goalball Tournament", function(err, objects) {
  if (err) {
    console.error(util.inspect(err));
  } else {
    console.log("Success");
    console.log(objects);
    console.log(objects[0].goalballTeam);
    console.log(objects[1].goalballTeam);
  }
});
