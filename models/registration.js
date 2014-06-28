// TODO: Requires similar de-derpification as all the other models

// Imports
var dbinfo = require('./databaseconfig');
var knex = require('knex')(dbinfo);

var bookshelf = require('bookshelf')(knex);

var User = require('./user');
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
    },
    user: function() {
      return this.belongsTo(User, "user_uid");
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
    this.user = initializationObject.user;
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

  /* Initialize a registration from a Bookshelf model */
  Registration.initFromDatabaseObject = function(model) {
    if (!model) {
      throw new Error("Model: Model is not defined");
    }

    var init = {};
    init.id = model.attributes.registration_id;
    init.uid = model.attributes.user_uid;
    init.eventName = model.related('event').attributes.title;
    init.eventId = model.related('event').attributes.nid;
    init.anonEmail = model.attributes.anon_mail;
    init.type = model.related('type').attributes.field_registration_type_value;
    init.notes = model.related('notes').attributes.field_notes_and_accommodations_value;

    init.user = model.related('user');

    return new Registration(init);
  }

  /* Load the user object associated with this registration */
  Registration.loadUserObject = function(registration, callback, errorCallback) {
    if (!registration.uid) {
      throw new Error("Registration: Cannot fetch User from anonymous Registration");
    }

    var id = registration.uid;
    var object = User.getUserObjectById(id, callback, errorCallback);

    /*
    new User({uid: id}).fetch().then(function onSuccess(model) {
      var obj = User.makeUserObject(model);
      callback(obj);
    }).catch(function(err) {
      if (errorCallback) {
        errorCallback(err);
      } else {
        console.error(err);
      }
    });
    */
  }

  /* Load registration by number. This is useful if you need more information about an 
   * an event registration object such as type of registration etc.  */
  Registration.loadRegistrationById = function(id, callback, errorCallback) {
    new RegistrationNode({registration_id: id}).fetch({
      withRelated: ['event', 'type', 'notes', 'user']
    })
    .then(function onSuccess(registration) {
      var object = Registration.initFromDatabaseObject(registration);

      callback(object);
    }).catch(function onFailure(err) {
      if (errorCallback) {
        errorCallback(err);
      } else {
        console.error(err);
      }
    })
  }


  /* Load objects from the database */
  Registration.loadObjects = function(callback, errorCallback) {
    // Potential bug: Loads all registrations. Potentially need a filter.
    new RegistrationNode().fetchAll({
      withRelated: ['event', 'type', 'notes', 'user']
    }).then(function(Collection) {
      var models = Collection.models;
      var objects = [];
      for (var i = 0; i < models.length; i++) {
        objects.push(Registration.initFromDatabaseObject(models[i]));
      }

      callback(objects);
    }).catch(function(err) {
      if (errorCallback) {
        errorCallback(err);
      } else {
        console.error(err);
      }
    });
  }

  return Registration;
}


module.exports = makeRegistration();