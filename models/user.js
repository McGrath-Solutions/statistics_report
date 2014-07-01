var dbconfig = require('./databaseconfig');
var knex = require('knex')(dbconfig);

var Bookshelf = require('bookshelf')(knex);

module.exports = (function() {
  var User = Bookshelf.Model.extend({
    tableName: 'users',
    idAttribute: 'uid',
    roles: function() {
      return this.hasOne(UserRole, 'uid');
    },
    dateOfBirth: function() {
      return this.hasOne(UserDateOfBirth, 'entity_id');
    },
    gender: function() {
      return this.hasOne(UserGender, 'entity_id');
    },
    isVeteran: function() {
      return this.hasOne(UserIsVeteran, 'entity_id');
    }
  });

  User.initFromDatabaseObject = function(model) {
    if (!model) {
      return {};
    }

    var obj = {};
    obj.id = model.attributes.uid;
    obj.roles = model.related('roles').attributes.rid;
    obj.dob = model.related('dateOfBirth').attributes.field_date_of_birth_value;
    obj.gender = model.related('gender').attributes.field_gender_value;

    // Check if the user is a veteran
    var veteranStatus = model.related('isVeteran').attributes.field_veteran_status_value
    obj.isVeteran = false;
    if (veteranStatus !== 'Does Not Apply') {
      obj.isVeteran = true;
    }

    return obj;
  }

  User.getUserObjectById = function(userId, callback) {
    new User({uid: userId}).fetch({
      withRelated: ['roles', 'dateOfBirth', 'gender', 'isVeteran']
    }).then(function(model) {
      // console.log(model)
      var object = User.initFromDatabaseObject(model);

      callback(null, object);
    }).catch(function(err) {
      callback(err);
    })
  }

  var UserRole = Bookshelf.Model.extend({
    tableName: 'users_roles'
  });

  var UserDateOfBirth = Bookshelf.Model.extend({
    tableName: 'field_data_field_date_of_birth'
  });

  var UserGender = Bookshelf.Model.extend({
    tableName: 'field_data_field_gender'
  });

  var UserIsVeteran = Bookshelf.Model.extend({
    tableName: 'field_data_field_veteran_status'
  });

  return User;
})();