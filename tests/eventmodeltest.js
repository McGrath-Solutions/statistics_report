var util = require('util');
var Event = require('../models/event');

var printstuff = function(models) {
  for (var i = 0; i < models.length; i++) {
    // console.log("stuff");
    //console.log(typeof model);
    console.log(models[i]);
  }
}

Event.loadObjects(printstuff);