// TODO: Requires similar de-derpification as all the other models

// Imports
var dbinfo = require('./databaseconfig');
var knex = require('knex')(dbinfo);

var bookshelf = require('bookshelf')(knex);

function makeRegistration() {

  // Event Node base (to avoid circular references in the most minimalistic way posssible)
  var EventNode = bookshelf.Model.extend({
    tableName: "node",
    idAttribute: "nid"
  });
  
  var RegistrationNode = bookshelf.Model.extend({
    tableName: "registration",
    idAttribute: "registration_id",
    event: function() {
      return this.belongsTo(EventNode, "entity_id");
    },
    type: function() {
      return this.hasOne(RegistrationType, "entity_id");
    },
    notes: function() {
      return this.hasOne(RegistrationNotes, "entity_id");
    }
  });

  var RegistrationType = bookshelf.Model.extend({
    tableName: "field_data_field_registration_type"
  });

  var RegistrationNotes = bookshelf.Model.extend({
    tableName: "field_data_field_notes_and_accommodations"
  })


  // Registration Table in the database
  var Registration = function(initializationObject) {
    this.id = initializationObject.id;
    this.uid = initializationObject.uid;
    this.eventName = initializationObject.eventName;
    this.eventId = initializationObject.eventId;
    if (this.uid) this.isAnon = false;
    else this.isAnon = true;
    this.anonEmail = initializationObject.anonEmail;
    this.type = initializationObject.type;
    this.notes = initializationObject.notes;
  }

  // Registration database objects
  Registration.RegistrationNode = RegistrationNode;
  Registration.RegistrationType = RegistrationType;
  Registration.RegistrationNotes = RegistrationNotes;

  Registration.initFromDatabaseObject = function(model) {
    //console.log(model);

    var init = {};
    init.id = model.attributes.registration_id;
    init.uid = model.attributes.user_uid;
    init.eventName = model.related('event').attributes.title;
    init.eventId = model.related('event').attributes.nid;
    init.anonEmail = model.attributes.anon_mail;
    init.type = model.related('type').attributes.field_registration_type_value;
    init.notes = model.related('notes').attributes.field_notes_and_accommodations_value;

    return new Registration(init);
  }

  Registration.loadObjects = function(callback) {
    // Potential bug: Loads all registrations. Potentially need a filter.
    new RegistrationNode().fetchAll({
      withRelated: ['event', 'type', 'notes']
    }).then(function(Collection) {
      var models = Collection.models;
      var objects = [];
      for (var i = 0; i < models.length; i++) {
        objects.push(Registration.initFromDatabaseObject(models[i]));
      }

      callback(objects);
    })
  }

  return Registration;
}


module.exports = makeRegistration();











