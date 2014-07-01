var util = require('util');
var Event = require('../models/event');

var printstuff = function(err, models) {
  console.log("We are here");
  console.log(models);
  for (var i = 0; i < models.length; i++) {
    // console.log("stuff");
    //console.log(typeof model);
    console.log(models[i]);
  }
}


Event.loadObjects(printstuff);
//Event.loadObjectsByMonth(new Date(2014, 5, 1), printstuff);