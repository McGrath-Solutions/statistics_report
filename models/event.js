// TODO:
// Learn more about bookshelfjs to make de-derpify

// Imports
var dbinfo = require('./databaseconfig');
var knex = require('knex')(dbinfo);

var bookshelf = require('bookshelf')(knex);

// Other model imports
var Registration = require('./registration');

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
    },
    registrations: function() {
      return this.hasMany(Registration.RegistrationNode, "entity_id");
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

  // Event constructor declarations
  function Event(initializationObject) {
    this.id = initializationObject.id;
    this.name = initializationObject.name;
    this.description = initializationObject.description;
    this.start = new Date(initializationObject.startDate);
    this.end = new Date(initializationObject.endDate);

    // Location is expect to be a Javascript object with fields
    // company,
    this.location = initializationObject.location;
    this.coordinator = initializationObject.coordinator;
    this.sport = initializationObject.sport;
    this.type = initializationObject.type;

    // Registration is expected to be a Javascript object with fields of
    // Registration
    this.registrations = initializationObject.registrations;
  }

  // Event Export objects
  Event.EventNode = EventNode;
  Event.EventDescription = EventDescription;
  Event.EventDate = EventDate;
  Event.EventLocation = EventLocation;
  Event.EventCoordinator = EventCoordinator;
  Event.EventSport = EventSport;
  Event.EventType = EventType;

  // Event export functions
  Event.initFromDatabaseObject = function(model) {
    var initObject = {};
    initObject.id = model.attributes.nid;
    initObject.name = model.attributes.title;
    initObject.description = model.related("description").attributes.field_event_description_value;
    initObject.startDate = model.related('date').attributes.field_event_date_value
    initObject.endDate = model.related('date').attributes.field_event_date_value2;
    initObject.location = {
      company: model.related('location').attributes.field_event_location_organisation_name,
      state: model.related('location').attributes.field_event_location_administrative_area,
      city: model.related('location').attributes.field_event_location_dependent_locality,
      address1: model.related('location').attributes.field_event_location_thoroughfare,
      address2: model.related('location').attributes.field_event_location_premise
    };
    initObject.coordinator = model.related('coordinator').attributes.field_event_coordinater_target_id;
    initObject.sport = model.related('sport').attributes.field_event_sport_value;
    initObject.type = model.related('type').attributes.field_event_type_value;
    
    // Registrations
    var regModels = model.related('registrations').models;
    var util = require('util');
    var registrations = [];
    for (var i = 0; i < regModels.length; i++) {
      registrations.push(Registration.initFromDatabaseObject(regModels[i]));
    }

    // Is a sub-registration object (some references undefined due to lack of necessity);
    initObject.registrations = registrations;


    return new Event(initObject);
  }

  // Load an array of every single Event object in database and call callback with that array. 
  // Currently takes a callback function.
  // TODO: write as a promise
  Event.loadObjects = function(callback) {
    new EventNode().query('where', 'type','=', 'event').fetchAll({
      withRelated: ['description', 'date', 'location', 'coordinator', 'sport', 'type', 'registrations']
    }).then(function(Collection) {
      var models = Collection.models;
      var objects = [];
      for (var i = 0; i < models.length; i++) {
        objects.push(Event.initFromDatabaseObject(models[i]));
      }

      callback(objects);
    });
  }

  return Event;
}

module.exports = makeEvent();