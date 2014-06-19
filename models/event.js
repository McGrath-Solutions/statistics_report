// Imports
var dbinfo = require('./databaseconfig');
var knex = require('knex')(dbinfo);

var bookshelf = require('bookshelf')(knex);

// Event object. 
function makeEvent() {

  // bookshelf database model declarations
  // EventNode is the primary database
  var EventNode = bookshelf.Model.extend({
    tableName: "node",
    idAttribute: "nid",
    description: function() {
      return this.hasOne(EventDescription, "entity_id");
    },
    date: function() {
      return this.hasOne(EventDate, "entity_id");
    },
    location: function() {
      return this.hasOne(EventLocation, "entity_id");
    },
    coordinator: function() {
      return this.hasOne(EventCoordinator, "entity_id");
    },
    sport: function() {
      return this.hasOne(EventSport, "entity_id");
    },
    type: function() {
      return this.hasOne(EventType, "entity_id");
    }
  });

  // Database table for Event Description
  var EventDescription = bookshelf.Model.extend({
    tableName: "field_data_field_event_description"
  });

  // Database table for Event Date
  var EventDate = bookshelf.Model.extend({
    tableName: "field_data_field_event_date"
  });

  // Database table for event location
  var EventLocation = bookshelf.Model.extend({
    tableName: "field_data_field_event_location"
  });

  // Database table for Event coordinator
  var EventCoordinator = bookshelf.Model.extend({
    tableName: "field_data_field_event_coordinater"
  });

  // Database table for Event Sport
  var EventSport = bookshelf.Model.extend({
    tableName: "field_data_field_event_sport"
  });

  // Database table for Event Type
  var EventType = bookshelf.Model.extend({
    tableName: "field_data_field_event_type"
  });

  // Registration database table for event type
  var Registration = bookshelf.Model.extend({
    tableName: "registration"
  })

  // Event constructor declarations
  function Event(initializationObject) {
    this.name = initializationObject.name;
    this.description = initializationObject.description;
    this.start = initializationObject.startDate;
    this.end = initializationObject.endDate;

    // Location is expect to be a JSON object with fields
    // company,
    this.location = initializationObject.location;
    this.coordinator = initializationObject.coordinator;
    this.sport = initializationObject.sport;
    this.type = initializationObject.type;
  }

  // Event prototype objects
  /*
  Event.prototype.EventNode = EventNode;
  Event.prototype.EventDescription = EventDescription;
  Event.prototype.EventDate = EventDate;
  Event.prototype.EventLocation = EventLocation;
  Event.prototype.EventCoordinator = EventCoordinator;
  Event.prototype.EventSport = EventSport;
  Event.prototype.EventType = EventType;
  */

  // Initialize from Event database model
  Event.prototype.initFromDatabaseObject = function(model) {
    var initObject = {};
    initObject.name = model.attributes.title;
    initObject.description = model.related("description").attributes.field_event_description_value;
    initObject.start = model.related('date').attributes.field_event_date_value
    initObject.end = model.related('date').attributes.field_event_date_value2;
    initObject.location = {
      company: model.related('location').attributes.field_event_location_organisation_name,
      state: model.related('location').attributes.field_event_location_administrative_area,
      city: model.related('location').attributes.field_event_location_dependent_locality,
      address1: model.related('location').attributes.field_event_location_thoroughfare,
      address2: model.related('location').attributes.field_event_location_premise
    };

    initObject.sport = model.related('sport').attributes.field_event_sport_value;
    initObject.type = model.related('type').attributes.field_event_type_value;

    return new Event(initObject);
  }

  // Load an array of every single Event object in database and call callback with that array. 
  // Currently takes a callback function.
  // TODO: write as a promise
  Event.prototype.loadObjects = function(callback) {
    new EventNode().query('where', 'type','=', 'event').fetchAll({
      withRelated: ['description', 'date', 'location', 'coordinator', 'sport', 'type']
    }).then(function(Collection) {
      var models = Collection.models;
      var objects = [];
      for (var i = 0; i < models.length; i++) {
        objects.push(Event.prototype.initFromDatabaseObject(models[i]));
      }

      callback(objects);
    })
  }

  return Event;
}

module.exports = makeEvent();