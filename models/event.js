// TODO:
// Learn more about bookshelfjs to make de-derpify

// Imports
var dbinfo = require('./databaseconfig');
var knex = require('knex')(dbinfo);
var async = require('async');

var bookshelf = require('bookshelf')(knex);

// Other model imports
var Registration = require('./registration');
var User = require('./user');

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
    },
    sportsClub: function() {
      return this.hasOne(EventSportsClub, "entity_id");
    }, 
    users: function() {
      return this.hasMany(User, "entity_id").through(Registration.RegistrationNode, "uid");
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

  // Database table for Event Sports Club
  var EventSportsClub = bookshelf.Model.extend({
    tableName: "field_data_field_sports_club_event"
  })

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
    this.club = initializationObject.club;

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
    // console.log("Model");
    // console.log(model);

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
    initObject.club = model.related('sportsClub').attributes.field_sports_club_event_value;

    //console.log("Club info: ");
    //console.log(model.related('sportsClub').attributes);
    
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

  /*
   * Takes an Event Model model with associated registration and calls callback
   * with an array of associated users and their relevant information
   * @param model = the Event model;
   * @param callback = the callback to be called;
   */
  Event.loadRegisteredUserInformation = function(model, callback) {
    var registrations = model.registrations;
    var users = [];
    async.each(registrations, Registration.loadUserObject, function(err, object) {
      if (err) {
        console.error("An object failed to process: " + err);
      } else {
        users[users.length] = object;
      }
    });

    return users;
  }

  /* 
   * Loads events registered within the month specified in date. Calls callback with the 
   * loaded events
   * @param date = a date object with the desired month of the desired year;
   * @param callback = the callback to be called;
   */
  Event.loadObjectsByMonth = function(date, callback) {
    var month = date.getMonth();
    var year = date.getFullYear();

    //console.log("Month: " + month);
    //console.log("Year: " + year);

    var dateStart = new Date(year, month, 1);
    var dateEnd = new Date(year, month + 1, 1)
    var relevantObjs = [];

    //console.log("Start: " + dateStart);
    //console.log("End: " + dateEnd);
    // Hack-y 
    Event.loadObjects(function(err, objects) {
      if (err) {
        console.error("Error: " + err);
        return;
      }

      var length = objects.length;

      for (var i = 0; i < length; i++) {
        var object = objects[i];
        // If the object date fields fulfill the boundary conditions
        //console.log("Start: " + (object.start >= dateStart && object.start < dateEnd) );
        //console.log("End: " + (object.end >= dateStart && object.end < dateEnd));
        if ( (object.start >= dateStart && object.start < dateEnd) ||
             (object.end >= dateStart && object.end < dateEnd) ) {
          relevantObjs.push(object);
        }
      }
      callback(null, relevantObjs);
    });
  }

  // Load an array of every single Event object in database and call callback with that array. 
  // Currently takes a callback function.
  // TODO: write as a promise
  Event.loadObjects = function(callback) {
    new EventNode().query('where', 'type','=', 'event').fetchAll({
      withRelated: ['description', 'date', 'location', 'coordinator', 'sport', 'type', 'registrations', 
      'sportsClub', 'users']
    }).then(function(Collection) {
      var models = Collection.models;
      var objects = [];
      for (var i = 0; i < models.length; i++) {
        objects.push(Event.initFromDatabaseObject(models[i]));
      }

      callback(null, objects);
    }).catch(function(err) {
      callback(err);
    });
  }

  return Event;
}

module.exports = makeEvent();