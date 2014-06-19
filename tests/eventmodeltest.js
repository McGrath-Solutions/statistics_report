var Event = require('../models/event');

var printstuff = function(models) {
  for (var i = 0; i < models.length; i++) {
    console.log(models);
  }
}

Event.prototype.loadObjects(printstuff);