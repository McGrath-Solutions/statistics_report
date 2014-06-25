var dbconfig = require('./databaseconfig');
var knex = require('knex')(dbconfig);

var Bookshelf = require('bookshelf')(knex);

module.exports = function() {
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
}