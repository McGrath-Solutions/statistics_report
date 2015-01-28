var format = require('./propertyformatconstants');

module.exports = function(Bookshelf) {
  var exports = {};
  exports.humanName = "Stats Achilles";
  //exports.databaseName = "sports_statistic";
  exports.databasename = "stats_achilles";
  exports.typeProperties = {
    contains: [],
    containsRelated: [],
    related: ["participant", "event", "minutes", "hours", 
                       "seconds", "distanceInMiles"],
    amount: {
      "participant": "one",
      "minutes": "one",
      "hours": "one",
      "seconds": "one",
      "distanceInMiles": "one",
      "event": "one"
    }
  };

  exports.typePropertyFormat = {
    "participant": format.USER_ID,
    "minutes": format.STANDARD,
    "hours": format.STANDARD,
    "seconds": format.STANDARD,
    "distanceInMiles": format.STANDARD,
    "seconds": format.STANDARD,
    "event": format.EVENT_ID
  };

  // for format.CONTAINS relationships only
  exports.fetchMethods = {};

  exports.propertyBookshelfModels = {
    "participant": Bookshelf.Model.extend({
      tableName: "field_data_field_participant"
    }),
    "minutes": Bookshelf.Model.extend({
      tableName: "field_data_field_minutes"
    }),
    "hours": Bookshelf.Model.extend({
      tableName: "field_data_field_hours"
    }),
    "seconds": Bookshelf.Model.extend({
      tableName: "field_data_field_seconds"
    }),
    "distanceInMiles": Bookshelf.Model.extend({
      tableName: "field_data_field_distance_in_miles"
    }),
    "event": Bookshelf.Model.extend({
      tableName: "field_data_field_event"
    })
  };

  return exports;
};