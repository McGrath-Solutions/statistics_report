/*
 * A utility to facilitate less complicated local data api fetches
 * @author Mike Zhang
 */
var userSummaryGenerator = require('./parsersupport/usermodelsummary');
var assert = require('assert');

module.exports = (function() {
  /*
   * > All models are sent in as TopLevelModel.property.value
   * Top level models indicate 'iterate through every instance of this model'.
   * Model properties indicate 'iterate through every instance, segregating them by this property'
   * Model property properties value 'iterate through every instance of model where model property 
   * is equal to value'
   * Model Properties value have 'count' which indicates number of the 
   */
  
  /****************** Helper methods *************************************/

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

  var properties = {};
  var propertyValues = {};

  /******************************************************************************* 
   * Install a model summary.
   * A summary is an object with properties and cooresponding values. Values
   * that can only take on a set number of states coorespond to arrays,
   * values that can be arbitray string values will coorespond to the String 
   * global object, values that can take on boolean values coorespond to the
   * Boolean global object, dates are described by Date and values that are
   * described by functions have the describing function as a value
   *******************************************************************************/
  var installSummary = function(modelName, summary) {
    var props = Object.keys(summary);
    properties[modelName] = props;

    for (var i = 0; i < props.length; i++) {
      var prop = props[i];
      if (prop in propertyValues) {
        var oldValue = propertyValues[prop];
        var newValue = summary[prop];

        assert.deepEqual(oldValue, newValue);
      }

      propertyValues[prop] = summary[prop];
    }
  };


  var userSummary = userSummaryGenerator();
  installSummary("user", userSummary);

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