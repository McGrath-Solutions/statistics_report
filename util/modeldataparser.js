/*
 * A utility to facilitate less complicated local data api fetches
 * @author Mike Zhang
 */
var User = require('../models/user');

module.exports = (function() {
  /*
   * > All models are sent in as TopLevelModel.property.value
   * Top level models indicate 'iterate through every instance of this model'.
   * Model properties indicate 'iterate through every instance, segregating them by this property'
   * Model property properties value 'iterate ghrough every instance of model where model property 
   * is equal to value'
   * Model Properties value have 'count' which indicates number of the 
   */
  
  /****************** Helper methods *************************************/
  var calculateAge = function(user) {
    var dateOfBirth = user.dateOfBirth;

    var today = new Date();
    var age = today.getFullYear() - dateOfBirth.getFullYear();
    var m = today.getMonth() - dateOfBirth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
        age--;
    }

    /* Define Juniors as 1-10, Youth as 11-19, Adults as 20 and up */
    if (age >= 20) {
      return "adults";
    } else if (age >= 11) {
      return "youth";
    } else {
      return "juniors";
    }
  };

  var getInformationFunction = function(type, modelName, property, value) {
    return function() {
      var obj = {
        type: type,
        name: modelName.toLowerCase(),
        property: property,
        value: value
      };

      return obj;
    }
  };

  var getPropertyType = function(property) {
    if (property instanceof Array) {
      return "array";
    } else if (property == Date) {
      return "date";
    } else if (property == Boolean) {
      return "boolean";
    } else if (property == String) {
      return "string";
    } else if (property instanceof Function) {
      return "function";
    }
  };

  calculateAge.returnValues = ["adults", "youth", "junior"];

  var properties = {
    user: ['roles', 'dateOfBirth', 'gender', 'isVeteran', 'firstName',
      'lastName', 'phone', 'sportsClub', 'age']
  };

  var propertyValues = {
    'roles': ['administrator', 'adult member', 'anonymous user', 'authenticated user', 
              'board_member', 'coordinator', 'executive director', 'guest', 'junior member',
              'officer', 'organizer', 'pending member (awaiting confirmation)', 
              'pending member (post-payment)', 'volunteer', 'youth member'],
    'dateOfBirth': Date,
    'gender': ['male', 'female'],
    'isVeteran': Boolean,
    'firstName': String,
    'lastName': String,
    'phone': String,
    'sportsClub': ['At-large', 'statewide', 'Nashville', 'Memphis'],
    'age': calculateAge
  };



  /************************* Public methods **************************************/
  var parser = {};
  parser.loadModel = function(modelName) {

    var obj = (function(modelName) {
      return function() { 
        return {
          type: "model",
          name: modelName.toLowerCase()
        }
      }
    })(modelName)

    var props = properties[modelName.toLowerCase()];
    for (var i = 0; i < props.length; i++) {
      var property = props[i];
      var valueType = getPropertyType(propertyValues[property]);
      obj[property] = (function(modelName, property, valueType) {
        return function() {
          return {
            type: "property",
            model: modelName.toLowerCase(),
            name: property,
            valueType: valueType
          }
        }
      })(modelName, property, valueType);

      var value = propertyValues[property];
      if (value instanceof Array) {
        for (var j = 0; j < value.length; j++) {
          var instance = value[j];
          obj[property][instance] = (function(property, modelName, instance) {
            return function() {
              return {
                type: "value",
                property: property,
                model: modelName.toLowerCase(),
                name: instance
              };
            }
          })(property, modelName, instance);
        }
      } else if (value instanceof Function && value != Boolean && value != String && value != Date) {
        var possibleValues = value.returnValues;
        if (possibleValues) {
          for (var j = 0; j < possibleValues.length; j++) {
            obj[property][possibleValues[j]] = (function(property, modelName, value) {
              return function() {
                return {
                  type: "value",
                  property: property,
                  model: modelName.toLowerCase(),
                  name: value
                }
              }
            })(property, modelName, possibleValues[j]);
          }
        }
      } else if (value == Date) {
        obj[property].between = function(date1, date2) {
          return function() {
            var newObj = obj[property]();
            newObj.after = date1;
            newObj.before = date2;
            return newObj;
          }
        };
      } 
    }

    return obj;
  };

  parser.defineTables = function(tableName, depends, as, rows) {

  };

  parser.defineSheets = function(sheetName, depends, as, rows) {

  };

  parser.fetchData = function() {

  };

  return parser;
})();