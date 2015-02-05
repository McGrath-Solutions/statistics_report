/*
 * Statistics type model. 
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
var async = require('async');
var assert = require('assert');
var achillesGenerator = require('./statisticsupport/achillesdescription');

// Models
var Event = require('./event');

module.exports = (function() {
  // ****************************** Helper Methods *********************************************
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

  /* Translation from User Interface type (Displayed on the Drupal homepage) to Node Type
   * Stored within the Node table of the Drupal database                                  */
  var TypeTable = {
    "Stats Cycling": "stats_cycling",
    "Stats Bowling": "stats_bowling",
    "Stats Health Check": "stats_health_check",
    "Stats Goalball Tournament": "goalball_score_board",
    "Stats Goalball": "stats_goalball"
  }

  // ****************************** Statistic Type information ***********************************
  /* List of properties for each statistic type. In general 'related' properties are Drupal field
   * field properties stored in a field_data_field_(propertyName) table,  'contains' properties
   * are those properties that have their own Node type stored in Database (for instance, Goalball 
   * Tournament statistics have an associated Goalball Team Node type, and 'containsRelated' 
   * properties are related properties that reference the node ID of a contains property*/
  var TypeProperties = {
    'goalball_score_board': {
      contains: ["goalballTeam"],
      containsRelated: ["goalballTeamReference"],
      related: ["round", "event"],
      amount: {
        "round": "one",
        "goalballTeam": "many",
        "goalballTeamReference": "many",
        "event": "one"
      }
    },
    'stats_bowling': {
      contains: [],
      containsRelated: [],
      related: [],
      amount: {}
    },
    'stats_goalball': {
      contains: [],
      containsRelated: [],
      related: [],
      amount: {}
    },
    'stats_health_check': {
      contains: [],
      containsRelated: [],
      related: [],
      amount: {}
    },
    'stats_cycling': {
      contains: [],
      containsRelated: [],
      related: [],
      amount: {}
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
    "round": STANDARD,
    "goalballTeam": CONTAINS,
    "event": EVENT_ID
  };

  /* Table of property Bookshelf models */
  var PropertyTable = {
    "goalballTeam": Bookshelf.Model.extend({
      tableName: "node",
      constructor: function() {
        Bookshelf.Model.apply(this, arguments);
        this.query('where', 'type', '=', 'goalball_team')
      }
    }),
    "goalballTeamReference": Bookshelf.Model.extend({
      tableName: "field_data_field_team_statistics"
    }),
    "event": Bookshelf.Model.extend({
      tableName: "field_data_field_event"
    }),
    "round": Bookshelf.Model.extend({
      tableName: "field_data_field_round"
    })
  };

  /* Data fetch methods */
  // Fetch a standard related property
  var standardFetch = function(propertyName) {
    return function(model) {
      var propType = PropertyType[propertyName];
      var drupalAttr = getDrupalColumnField(propertyName, propType);
      console.log(drupalAttr);
      return model.related(propertyName).attributes[drupalAttr];
    }
  };

  var eventFetch = function() {
    return function(model, cb) {
      var drupalAttr = getDrupalColumnField("event", EVENT_ID);
      var id = model.related('event').attributes[drupalAttr];
      Event.loadEventObjectById(id, cb);
    }
  };

  var goalballTeamFetch = function() {
    return function(model, cb) {
      var TeamName = Bookshelf.Model.extend({
        tableName: "field_data_field_team_name"
      });

      var Scores = Bookshelf.Model.extend({
        tableName: "field_data_field_scores"
      });

      var Throws = Bookshelf.Model.extend({
        tableName: "field_data_field_throws"
      });

      var GoalballTeam = PropertyTable["goalballTeam"];
      
      var models = model.related('goalballTeamReference').models;
      var funcList = [];
      var result = [];

      for (var i = 0; i < models.length; i++) {
        result[i] = {};
      }

      for (var i = 0; i < models.length; i++) {
        var cur = models[i];
        var id = cur.attributes.field_team_statistics_value;

        // Fetch teamName data
        funcList[funcList.length] = (function(modelNum, id) {
          return function(callback) {
            new TeamName({entity_id: id}).fetch().then(function(model) {
              var teamId = model.attributes.field_team_name_target_id;
              new GoalballTeam({nid: teamId}).fetch().then(function(model) {
                result[modelNum].teamName = model.attributes.title;

                console.log("Team name callback");
                return callback(null);
              }).catch(function(err) {

                console.log("Team name inner error");
                console.error(err);
                return callback(err);
              });
            }).catch(function(err) {
              console.log("Team name outer error");
              return callback(err);
            });
          };
        })(i, id);

        // Fetch Scores data
        funcList[funcList.length] = (function(modelNum, id) {
          return function(callback) {
            new Scores({entity_id: id}).fetch().then(function(model) {
              result[modelNum].scores = model.attributes.field_scores_value;
              return callback(null);
            }).catch(function(err) {
              return callback(err);
            });
          }
        })(i, id);

        // Fetch throws data
        funcList[funcList.length] = (function(modelNum, id) {
          return function(callback) {
            new Throws({entity_id: id}).fetch().then(function(model) {
              result[modelNum].throws = model.attributes.field_throws_value;
              return callback(null);
            }).catch(function(err) {
              return callback(err);
            });
          }
        })(i, id);
      }

      async.parallel(funcList, function(err) {
        if (err) {
          return cb(err);
        }

        cb(null, result);
      })
    }
  };

  // Table of methods containing a procedure describing how to fetch
  // a given property from a statistic type
  var PropertyFetchTable = {
    "round": standardFetch("round"),
    "goalballTeam": goalballTeamFetch()
  };

  var installStatistic = function(eventType, statistic) {
    console.log("BEFORE");
    for (var key in Object.keys(TypeTable)) {
      console.log("%s -- %s", key, TypeTable[key]);
    }

    TypeTable[statistic.humanName] = statistic.databaseName;
    TypeProperties[statistic.databaseName] = statistic.typeProperties;

    var allProperties = Object.keys(statistic.typePropertyFormat);
    for (var i = 0; i < allProperties.length; i++) {
      var prop = allProperties[i];

      if (prop in PropertyType) {
        continue;
      }

      PropertyType[prop] = statistic.typePropertyFormat[prop];
    }

    for (var i = 0; i < allProperties.length; i++) {
      var prop = allProperties[i];
      var format = statistic.typePropertyFormat[prop];
      console.log("FORMAT: " + format);

      switch (format) {
        case STANDARD:
        case USER_ID:
        case EVENT_ID:
        console.log("INSTALL STANDARD");
        PropertyFetchTable[prop] = standardFetch(prop);
        break;

        case CONTAINS:
        console.log("INSTALL CONTAINS");
        if (!statistic.fetchMethods[prop]) {
          throw new Error("Unspecified fetch methods for CONTAINS property " + prop);
        }
        PropertyFetchTable[prop] = statistic.fetchMethods[prop]();
        break;
      }
    }

    var allModels = Object.keys(statistic.propertyBookshelfModels);
    for (var i = 0; i < allModels.length; i++) {
      var name = allModels[i];

      if (name in PropertyTable) {
        // Assume are the same
        continue;
      }

      PropertyTable[name] = statistic.propertyBookshelfModels[name]; 
    }
  }

  var achilles = achillesGenerator(Bookshelf);
  installStatistic("achilles", achilles);

  /********************************************************************************************
   * Fetch the Bookshelf object associated with the given statistic type
   * @param {String} statistic_name - The name of the statistic type
   * @return {Object} The Bookshelf object associated with the given statistic
   ********************************************************************************************/
  var getStatisticNode = function(statistic_name) {

    var related = TypeProperties[statistic_name].related;
    var containsRelated = TypeProperties[statistic_name].containsRelated;
    var properties = related.concat(containsRelated);
    var amount = TypeProperties[statistic_name].amount;
    var ext = {};

    for (var i = 0; i < properties.length; i++) {
      var property = properties[i];
      var PropertyObject = PropertyTable[property];
      var funcName = 
      ext[property] = (function(PropertyObject, property) {
        if (amount[property] === "one")
          return function() {
            return this.hasOne(PropertyObject, "entity_id");
          }
        else if (amount[property] === "many") {
          return function() {
            return this.hasMany(PropertyObject, "entity_id");
          }
        }
      })(PropertyObject, property);
    }

    var model = Bookshelf.Model.extend({
      tableName: "node",
      constructor: function() {
        Bookshelf.Model.apply(this, arguments);
        this.query('where', 'type', '=', statistic_name);
      },
      idAttribute: "nid"
    });

    model = model.extend(ext);
    return model;
  };


  // **************************** Statistic Object Methods ************************************
  /********************************************************************************************
   * Statistic type constructor
   * @param {String} type - The name of the type of the statistic
   * @param {String} initObject - An object containing the initial values of the Statistic's
   * properties
   ********************************************************************************************/
  function Statistic(type, initObject) {
    var entityType = TypeTable[type] || type; // User can input interface-type or regular type
    var related = TypeProperties[entityType].related;
    var contains = TypeProperties[entityType].contains;

    var properties = related.concat(contains);
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
  Statistic.initFromDatabaseObject = function(type, model, callback) {
    // console.log(model.relations.participant);
    console.log("Type: " + type);
    console.log("Model: ");
    console.log(model);

    var entityType = TypeTable[type] || type;
    var related = TypeProperties[entityType].related;
    var contains = TypeProperties[entityType].contains;

    var properties = related.concat(contains);
    var funcList = [];
    var init = {};
    
    console.log("PROPERTIES"); 
    console.log(properties);

    console.log("PROPERTY FETCH TABLE FUNCS");
    var prop_keys = Object.keys(PropertyFetchTable);
    for (var i = 0; i < prop_keys.length; i++) {
      var key = prop_keys[i];
      console.log("%s -- %s", key, PropertyFetchTable[key]);
    }

    for (var i = 0; i < properties.length; i++) {
      var prop = properties[i];
      var func = PropertyFetchTable[prop];
     
      console.log("FETCH FUNCTION FOR %s: ", prop); 
      console.log(func);

      if (func.length === 2) { // Function is asynchronous and expects callback
        funcList[funcList.length] = (function(prop, func) {
          return function(callback) {
            func(model, function(err, result) {
              init[prop] = result;
              callback(err);
            });
          }
        })(prop, func);
      } else {
        init[prop] = PropertyFetchTable[prop](model);
      }
    }

    // Done already if no asynchronous items
    if (funcList.length === 0) return callback(null, new Statistic(type, init));

    // Not done if adding asynchronous terms is necessary
    async.parallel(funcList,
      function(err) {
        if (err) {
          return callback(err);
        }

        return callback(null, new Statistic(type, init));
      })
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
    var containsRelated = TypeProperties[entityType].containsRelated;

    // Concatenate all related properties
    related = related.concat(containsRelated);
    new StatisticNode().fetchAll({
      withRelated: related
    }).then(function(Collection) {
      var models = Collection.models;
      var objects = [];
      var funcList = [];

      for (var i = 0; i < models.length; i++) {

        funcList[funcList.length] = (function(type, model) {
          return function(callback) {
            Statistic.initFromDatabaseObject(type, model, function(err, object) {
              if (err) {
                return callback(err);
              }

              objects.push(object);
              return callback(null);
            });
          }
        })(type, models[i]);
      }

      async.parallel(funcList, 
        function(err) {
          if (err) {
            return callback(err);
          }

          return callback(null, objects);
        })
    }).catch(function(err) {
      console.log("ERROR RECEIVED");
      callback(err);
    });
  };

  return Statistic;
})();



