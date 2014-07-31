var dbconfig = require('./databaseconfig');
var knex = require('knex')(dbconfig);
var Bookshelf = require('bookshelf')(knex);

module.exports = (function() {
  /* Translation from User Interface type to Entity type */
  var TypeTable = {
    "Stats Achilles": "sports_statistic",
    "Stats Cycling": "stats_cycling",
    "Stats Bowling": "bowling_scores",
    "Stats Health Check": "stats_health_check",
    "Stats Goalball Tournament": "stats_goalball_tournament",
    "Stats Goalball": "stats_goalball"
  }

  /* List of properties for each statistic  type*/
  var TypeProperties = {
    'stats_goalball_tournament': {
      contains: ["goalballTeam"],
      related: []
    },
    'sports_statistic': {
      contains: [],
      related: ["participant", "minutes", "hours", 
                         "seconds", "distanceInMiles"]
    },
    'bowling_scores': {
      contains: [],
      related: []
    },
    'stats_goalball': {
      contains: [],
      related: []
    },
    'stats_health_check': {
      contains: [],
      related: []
    },
    'stats_cycling': {
      contains: [],
      related: []
    }
  };

  // Property type information
  var STANDARD = 0; // Standard data property (postfixed by value)
  var USER_ID = 1;  // User id suffix
  var PropertyType = {
    "participant": USER_ID,
    "minutes": STANDARD,
    "hours": STANDARD,
    "seconds": STANDARD,
    "distanceInMiles": STANDARD
  };

  /* Table of property nodes */
  var PropertyTable = {
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
    })
  };

  /* Date fetch methods */
  // Fetch a standard related property
  var standardFetch = function(propertyName) {
    return function(model) {
      var propType = PropertyType[propertyName];
      var drupalAttr = getDrupalColumnField(propertyName, propType);
      return model.related(propertyName).attributes[drupalAttr];
    }
  };

  // Table of methods containing a procedure describing how to fetch
  // a given property from a statistic type
  var PropertyFetchTable = {
    "participant": standardFetch("participant"),
    "minutes": standardFetch("minutes"),
    "hours": standardFetch("hours"),
    "seconds": standardFetch("seconds"),
    "distanceInMiles": standardFetch("distanceInMiles")
  };

  /* Generate a node for the given statistic */
  var getStatisticNode = function(statistic_name) {
    var properties = TypeProperties[statistic_name].related;
    var ext = {};

    for (var i = 0; i < properties.length; i++) {
      var property = properties[i];
      var PropertyObject = PropertyTable[property];
      ext[property] = (function(PropertyObject) {
        return function() {
          return this.hasOne(PropertyObject, "entity_id");
        }
      })(PropertyObject);
    }

    var model = Bookshelf.Model.extend({
      tableName: "node",
      constructor: function() {
        Bookshelf.Model.apply(this, arguments);
        this.query('where', 'type', '=', statistic_name);
      },
      idAttribute: "nid"
    });

    // A wee bit of a hack
    model = model.extend(ext);
    return model;
  };

  var camelToUnderscore = function(camelInstance) {
    return camelInstance.replace(/[A-Z]/g, function($1) { return "_" + $1.toLowerCase(); });
  };

  var getDrupalColumnField = function(property, propType) {
    if (propType == STANDARD) {
      return 'field_' + camelToUnderscore(property) + "_value";
    } else {
      return 'field_' + camelToUnderscore(property) + "_target_id";
    }
  };

  // Statistic object declaration
  function Statistic(type, initObject) {
    var entityType = TypeTable[type] || type; // User can input interface-type or regular type
    var properties = TypeProperties[entityType].related;

    for (var i = 0; i < properties.length; i++) {
      var property = properties[i];
      this[property] = initObject[property];
    }
  };

  Statistic.initFromDatabaseObject = function(type, model) {
    // console.log(model.relations.participant);
    var entityType = TypeTable[type] || type;
    var related = TypeProperties[entityType].related;

    var init = {};
    for (var i = 0; i < related.length; i++) {
      var prop = related[i];
      init[prop] = PropertyFetchTable[prop](model);
    }

    return new Statistic(type, init);
  };

  Statistic.loadObjects = function(type, callback) {
    var entityType = TypeTable[type] || type;
    var StatisticNode = getStatisticNode(entityType);
    var related = TypeProperties[entityType].related;

    //console.log(StatisticNode);
    //console.log("Right before fetch");
    new StatisticNode().fetchAll({
      withRelated: related
    }).then(function(Collection) {
      var models = Collection.models;
      var objects = [];
      for (var i = 0; i < models.length; i++) {
        objects.push(Statistic.initFromDatabaseObject(type, models[i]));
      }

      callback(null, objects);
    }).catch(function(err) {
      callback(err);
    });
  };

  return Statistic;
})();



