/*
 * Statistics type model
 * @author Mike Zhang
 * 
 * Instructions for updating:
 * 1. Adding a new property (or "field" in Drupalese):
 *   - add the property to PropertyType
 *   - add the property node to PropertyTable
 *   - Describe how to fetch the property in property
 *     fetch table
 * 2. Adding a new statistic type (a "node" in the drupal schema)
 *   - add the type to type table
 *   - describe the type's properties in TypeProperties
 */
var dbconfig = require('./databaseconfig');
var knex = require('knex')(dbconfig);
var Bookshelf = require('bookshelf')(knex);

module.exports = (function() {

  /* Translation from User Interface type (Displayed on the Drupal homepage) to Node Type
   * Stored within the Node table of the Drupal database                                  */
  var TypeTable = {
    "Stats Achilles": "sports_statistic",
    "Stats Cycling": "stats_cycling",
    "Stats Bowling": "bowling_scores",
    "Stats Health Check": "stats_health_check",
    "Stats Goalball Tournament": "goalball_score_board",
    "Stats Goalball": "stats_goalball"
  }

  /* List of properties for each statistic type. In general 'related' properties are Drupal field
   * field properties stored in a field_data_field_(propertyName) table, while 'contains'properties
   * are those properties that have their own Node type stored in Database (for instance, Goalball 
   * Tournament statistics have an associated Goalball Team Node type                            */
  var TypeProperties = {
    'goalball_score_board': {
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

  /* The type of the property. As in, how the drupal database references the property 
   * within the property's field table. STANDARD properties are properties that are
   * stored in a database table with entry field_(nameOfProperty)_value. USER_ID
   * are user references, EVENT_ID are event references, and CONTAINS are contains
   * properties                                                                     */                   
  var STANDARD = 0; // Standard data property (postfixed by value)
  var USER_ID = 1;  // User id suffix
  var EVENT_ID = 2; // Event reference
  var CONTAINS = 3;
  var PropertyType = {
    "participant": USER_ID,
    "minutes": STANDARD,
    "hours": STANDARD,
    "seconds": STANDARD,
    "distanceInMiles": STANDARD
  };

  /* Table of property Bookshelf models */
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
    }),

  };

  /* Data fetch methods */
  // Fetch a standard related property
  var standardFetch = function(propertyName) {
    return function(model) {
      var propType = PropertyType[propertyName];
      var drupalAttr = getDrupalColumnField(propertyName, propType);
      return model.related(propertyName).attributes[drupalAttr];
    }
  };

  var goalballTeamFetch = function() {
    return function(model) {

    }
  }

  // Table of methods containing a procedure describing how to fetch
  // a given property from a statistic type
  var PropertyFetchTable = {
    "participant": standardFetch("participant"),
    "minutes": standardFetch("minutes"),
    "hours": standardFetch("hours"),
    "seconds": standardFetch("seconds"),
    "distanceInMiles": standardFetch("distanceInMiles"),
    "goalballTeam": function() {}
  };

  /********************************************************************************************
   * Fetch the Bookshelf object associated with the given statistic type
   * @param {String} statistic_name - The name of the statistic type
   * @return {Object} The Bookshelf object associated with the given statistic
   ********************************************************************************************/
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
    };

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

  /********************************************************************************************
   * Convert the given named instance in camelcase to underscore spacing convention
   * so thisIsAProperty becomses this_is_a_property
   * @param {String} camelInstance - The instance to convert
   * @returns {String} The camelcase instance to underscore case
   ********************************************************************************************/
  var camelToUnderscore = function(camelInstance) {
    return camelInstance.replace(/[A-Z]/g, function($1) { return "_" + $1.toLowerCase(); });
  };

  /********************************************************************************************
   * Convert the given property property to the equivalent name in the drupal database schema 
   * @param {string} property - The property to convert
   * @param {string} propType - The type of the property (as described by the PropertyType
   * table)
   * @returns {String} The drupal column field
   ********************************************************************************************/
  var getDrupalColumnField = function(property, propType) {
    if (propType == STANDARD) {
      return 'field_' + camelToUnderscore(property) + "_value";
    } else {
      return 'field_' + camelToUnderscore(property) + "_target_id";
    }
  };

  /********************************************************************************************
   * Statistic type constructor
   * @param {String} type - The name of the type of the statistic
   * @param {String} initObject - An object containing the initial values of the Statistic's
   * properties
   ********************************************************************************************/
  function Statistic(type, initObject) {
    var entityType = TypeTable[type] || type; // User can input interface-type or regular type
    var properties = TypeProperties[entityType].related;

    for (var i = 0; i < properties.length; i++) {
      var property = properties[i];
      this[property] = initObject[property];
    }
  };

  /********************************************************************************************
   * Initialize a Statistic object from a Bookshelf model
   * @param {String} type - The type of the Statistic
   * @param {Object} model -  A Bookshelf model of the given statistic type
   * @returns {Object} A Statistic object with the attributes and related properties of model
   * (note: related properties as defined in the TypeProperties table)
   ********************************************************************************************/
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

  /********************************************************************************************
   * Load all objects of a given type, then pass the objects to callback. 
   * @param {String} type - The type of even statistics to load
   * @param {Function} callback - The callback function. Takes two arguments: (ERROR, OBJECTS)
   ********************************************************************************************/
  Statistic.loadObjects = function(type, callback) {
    var entityType = TypeTable[type] || type;
    var StatisticNode = getStatisticNode(entityType);
    var related = TypeProperties[entityType].related;

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



