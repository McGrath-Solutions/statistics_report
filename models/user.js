/*
 * User model. Fetches information on users from the drupal database.
 * @author Mike Zhang
 */
var dbconfig = require('./databaseconfig');
var knex = require('knex')(dbconfig);
var Bookshelf = require('bookshelf')(knex);

module.exports = (function() {

  var relatedProperties = ['roles', 'dateOfBirth', 'gender', 'isVeteran', 
    'firstName', 'lastName', 'phone', 'sportsClub', 'ageGrouping'];

  /* The underlying user bookshelf model */
  var User = Bookshelf.Model.extend({
    tableName: 'users',
    idAttribute: 'uid',
    roles: function() {
      return this.hasMany(Role, 'uid').through(UserRole, "rid");
    },
    dateOfBirth: function() {
      return this.hasOne(UserDateOfBirth, 'entity_id');
    },
    gender: function() {
      return this.hasOne(UserGender, 'entity_id');
    },
    isVeteran: function() {
      return this.hasOne(UserIsVeteran, 'entity_id');
    },
    firstName: function() {
      return this.hasOne(UserFirstName, 'entity_id');
    },
    lastName: function() {
      return this.hasOne(UserLastName, 'entity_id');
    }, 
    phone: function() {
      return this.hasOne(UserPhone, 'entity_id');
    },
    sportsClub: function() {
      return this.hasOne(UserSportsClub, 'entity_id');
    },
    ageGrouping: function() {
      return this.hasOne(UserAgeGroup, 'entity_id');
    }
    /*
    membershipType: function() {
      return this.hasOne(UserType, 'entity_id');
    }
    */
  });

  /*
   * Initialize and return a user object from a bookshelf model
   * @param {object} model = the bookshelf model
   * @returns {object} an simplified object with user information
   */
  User.initFromDatabaseObject = function(model) {
    if (!model) {
      return {};
    }

    var obj = {};
    obj.id = model.attributes.uid;
    obj.email = model.attributes.mail;
    obj.username = model.attributes.name;

    // Test if the user is suspended
    obj.blocked = (!model.attributes.status) ? true : false;

    // Test if the user is active
    // Deprecated version: Checked whether the user logged in
    /*
    obj.active = (function isActive(lastAccessSeconds) {
      var today = new Date();
      var thisYear = today.getFullYear();
      var thisMonth = today.getMonth();
      var thisDay = today.getDate();

      var lastMonth = new Date(thisYear, thisMonth - 1, thisDay);
      // console.log(lastMonth);
      var lastMonthAccessSeconds = lastMonth.getTime() / 1000;

      if (lastAccessSeconds >= lastMonthAccessSeconds) {
        return true;
      }

      return false;
    })(model.attributes.access);
    */

    obj.created = new Date(model.attributes.created * 1000);
    obj.firstName = model.related('firstName').attributes.field_first_name_value;
    obj.lastName = model.related('lastName').attributes.field_last_name_value;
    obj.phone = model.related('phone').attributes.field_phone_value;
    // obj.membershipType = model.related('membershipType').attributes.field_membership_type_value;

    // console.log(model.related('roles').models);
    var roleArray = [];
    obj.pending = false;
    var roleModels = model.related('roles').models;
    for (var i = 0; i < roleModels.length; i++) {
      var roleName = roleModels[i].attributes.name;
      roleArray[roleArray.length] = roleName;

      if (roleName.indexOf("pending") > -1) obj.pending = true;
    }

    obj.roles = roleArray;
    obj.dob = model.related('dateOfBirth').attributes.field_date_of_birth_value;
    obj.gender = model.related('gender').attributes.field_gender_value;
    obj.ageGroup = model.related('ageGrouping').attributes.field_age_grouping_value;
    obj.sportsClub = model.related('sportsClub').attributes.field_sports_club_value;

    // Current active is defined as not pending
    obj.active = !obj.pending;
    obj.isGuest = obj.roles.indexOf("guest") > -1;
    obj.isAdmin = obj.roles.indexOf("administrator") > -1;

    // Check if the user is a veteran
    var veteranStatus = model.related('isVeteran').attributes.field_veteran_status_value
    obj.isVeteran = false;
    if (veteranStatus !== 'Does Not Apply') {
      obj.isVeteran = true;
    }
    obj.veteranStatus = veteranStatus;

    return obj;
  };

  /*
   * Fetch a user object by the provided id. Calls callback
   * with the object and any errors when completed.
   * @param {number} userId - the userId to fetch
   * @param {function} callback - a callback with arguments (err, object)
   */
  User.getUserObjectById = function(userId, callback) {
    new User({uid: userId}).fetch({
      withRelated: relatedProperties
    }).then(function(model) {
      // console.log(model)
      var object = User.initFromDatabaseObject(model);

      callback(null, object);
    }).catch(function(err) {
      callback(err);
    });
  };

  /*
   * Fetch user objects created before the given date. Calls callback
   * with an array of objects and any errors when completed.
   * @param date {date} - the date to compare objects with
   * @param callback {function} - a callback with arguments (err, objects);
   */
  User.loadUsersCreatedBefore = function(date, callback) {
    var dateDrupalTime = date.getTime() / 1000;
    new User().query(function(qb) {
      return qb.where('created', '<=', dateDrupalTime).andWhere('uid', '!=', 0);
    }).fetchAll({
      withRelated: relatedProperties
    }).then(function(Collection) {
      var models = Collection.models;
      var objects = [];

      for (var i = 0; i < models.length; i++) {
        // console.log(models[i].attributes.created);
        objects[objects.length] = User.initFromDatabaseObject(models[i]);
      }

      callback(null, objects);
    }).catch(function(err) {
      callback(err);
    });
  };

  /*
   * Fetch user objects created in the same month as date. Calls calback
   * with an array of objects and any errors when completed.
   * @param date {date} - the date to compare objects with
   * @param callback {function} - a callback with arguments (err, objects)
   */
  User.loadUsersByCreatedMonth = function(date, callback) {
    var month = date.getMonth();
    var year = date.getFullYear();

    var dateStart = new Date(year, month, 1);
    var dateEnd = new Date(year, month + 1, 1);
    var relevantObjs = [];

    var dateStartDrupalTime = dateStart.getTime() / 1000;
    var dateEndDrupalTime = dateEnd.getTime() / 1000;

   // console.log("Start: " + dateStartDrupalTime);
    //console.log("End  : " + dateEndDrupalTime);

    new User().query(function(qb) {
      return qb.whereBetween('created', [dateStartDrupalTime, dateEndDrupalTime]);
    }).fetchAll({
      withRelated: relatedProperties
    }).then(function(Collection) {
      var models = Collection.models;
      var objects = [];

      for (var i = 0; i < models.length; i++) {
        // console.log(models[i].attributes.created);
        objects[objects.length] = User.initFromDatabaseObject(models[i]);
      }

      callback(null, objects);
    }).catch(function(err) {
      callback(err);
    })
  };

  User.loadObjects = function(callback) {
    new User().query('where', 'uid', '!=', '0').fetchAll({
      withRelated: relatedProperties
    }).then(function(Collection) {
      var models = Collection.models;
      var objects = [];

      for (var i = 0; i < models.length; i++) {
        objects[objects.length] = User.initFromDatabaseObject(models[i]);
      }

      callback(null, objects);
    }).catch(function(err) {
      callback(err);
    });
  }

  var UserRole = Bookshelf.Model.extend({
    tableName: 'users_roles',
    idAttribute: 'rid'
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

  var UserFirstName = Bookshelf.Model.extend({
    tableName: 'field_data_field_first_name'
  });

  var UserLastName = Bookshelf.Model.extend({
    tableName: 'field_data_field_last_name'
  });

  var UserPhone = Bookshelf.Model.extend({
    tableName: 'field_data_field_phone',
    constructor: function() {
      Bookshelf.Model.apply(this, arguments);
      this.query('where', 'entity_type', '=', 'user');
    }
  });

  var UserSportsClub = Bookshelf.Model.extend({
    tableName: 'field_data_field_sports_club'
  });

  var UserAgeGroup = Bookshelf.Model.extend({
    tableName: 'field_data_field_age_grouping'
  });

  /*
  var UserType = Bookshelf.Model.extend({
    tableName: 'field_data_field_membership_type'
  });
  */
 
  var Role = Bookshelf.Model.extend({
    tableName: 'role'
  });

  return User;
})();