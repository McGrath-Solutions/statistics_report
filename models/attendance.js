/*
 * Attendance model: fetches information about attendance
 */

var dbconfig = require('./databaseconfig');
var knex = require('knex')(dbconfig);
var Bookshelf = require('bookshelf')(knex);
var EventModel = require('./event');
var User = require('./user');
var async = require('async');

module.exports = (function() {

  /* Attendance information nodes */
  var relatedProperties = ['eventId', 'participants'];
  var GenericAttendance = Bookshelf.Model.extend({
    tableName: 'node',
    constructor: function() {
      Bookshelf.Model.apply(this, arguments);
      this.query(function(qb) {
        qb.where('type', 'bowling_scores')
          .orWhere('type', 'sports_statistic')
          .orWhere('type', 'stats_attendance')
      });
    },
    idAttribute: 'nid',
    eventId: function() {
      return this.hasOne(Event, 'entity_id');
    },
    participants: function() {
      return this.hasMany(Participant, 'entity_id');
    }
  });

  var GoalballAttendance = Bookshelf.Model.extend({
    tableName: 'node',
    constructor: function() {
      Bookshelf.Model.apply(this, arguments);
      this.query(function(qb) {
        qb.where('type', 'goalball_team');
      });
    }, 
    idAttribute: 'nid',
    eventId: function() {
      return this.hasOne(Event, 'entity_id');
    },
    participants: function() {
      return this.hasMany(Player, 'entity_id');
    }
  })

  /* Property Nodes */
  var Event = Bookshelf.Model.extend({
    tableName: 'field_data_field_event'
  });

  var Participant = Bookshelf.Model.extend({
    tableName: 'field_data_field_participant'
  });

  var Player = Bookshelf.Model.extend({
    tableName: 'field_data_field_players'
  });

  /* Helper methods */

  function processCollectionAndPassToCallback(callback) {
    return function(Collection) {
      var models = Collection.models;
      var funcList = [];

      for (var i = 0; i < models.length; i++) {
        var model = models[i];
        funcList[i] = (function(model) {
          return function(cb) {
            Attendance.initFromDatabaseObject(model, cb);
          };
        })(model);
      }

      async.parallel(funcList,
        function(err, results) {
          if (err) {
            return callback(err);
          }

          return callback(null, results);
        })
    };
  }

  function fetchGenericAttendance(callback) {
    new GenericAttendance().fetchAll({
      withRelated: relatedProperties
    }).then(processCollectionAndPassToCallback(callback));
  }

  function preprocessAttendance(objects) {
    function EventObject(id) {
      this.id = id;
      this.pids = [];
    }

    var results = [];
    objects.sort(function(att1, att2) {
      return att1.eventId - att2.eventId;
    });

    var prevEventId = objects[0].eventId;
    var curEvent = new EventObject(prevEventId);
    for (var i = 0; i < objects.length; i++) {
      if (curEvent.id != objects[i].eventId) {
        results.push(curEvent);
        curEvent = new EventObject(objects[i].eventId);
      }

      var partIds = objects[i].participantIds;
      curEvent.pids = curEvent.pids.concat(partIds);
    }

    results.push(curEvent);

    // Remove duplicates
    for (var i = 0; i < results.length; i++) {
      var killList = [];
      results[i].pids.sort(function(pid1, pid2) {
        return pid1 - pid2;
      });

      for (var j = 1; j < results[i].pids.length; j++) {
        if (results[i].pids[j] == results[i].pids[j - 1]) {
          killList.push(j);
        }
      }

      for (var j = killList.length - 1; j >= 0; j--) {
        results[i].pids.splice(killList[j], 1);
      }
    }

    return results;
  }


  function fetchAttendanceData(objects, type, callback) {
    var results = [];
    var objects = preprocessAttendance(objects);
    var funcList = [];

    for (var i = 0; i < objects.length; i++) {
      results[i] = {participants: []};
    }

    for (var i = 0; i < objects.length; i++) {
      var eventId = objects[i].id;
      var pids = objects[i].pids;

      funcList[funcList.length] = (function(eventId, i) {
        return function(cb) {
          EventModel.loadEventObjectById(eventId, function(err, object) {
            if (err) {
              console.log("Error called on Event: " + eventId);
              return cb(err);
            }

            if (object == null) {
              return cb();
            }


            results[i].eventName = object.name;
            results[i].sport = object.sport;
            results[i].club = object.club;
            results[i].start = object.start;
            results[i].end = object.end;

            cb();
          })
        }
      })(eventId, i);

      for (var j = 0; j < pids.length; j++) {
        funcList[funcList.length] = (function(pid, i) {
          return function(cb) {
            User.getUserObjectById(pid, function(err, object) {
              if (err) {
                console.log("Error called on User: " + pid);
                console.log(err);
                return cb(err);
              }

              results[i].participants.push(object);
              return cb();
            })
          }
        })(pids[j], i);
      }
    }

    async.parallel(funcList, 
      function(err) {
        if (err) {
          return callback(err);
        }

        // Filter out dangling events;
        for (var i = results.length - 1; i >= 0; i--) {
          if (!results[i].eventName) {
            results.splice(i, 1);
          }
        }

        return callback(null, results);
      });
  }

  function fetchGoalballAttendance(callback) {
    new GoalballAttendance().fetchAll({
      withRelated: relatedProperties
    }).then(processCollectionAndPassToCallback(callback));
  }

  /* Export object */
  var Attendance = {};
  Attendance.initFromDatabaseObject = function(model, callback) {
    var obj = {};

    obj.eventId = model.related('eventId').attributes.field_event_target_id;

    obj.participantIds = [];
    var participantModels = model.related("participants").models;
    for (var i = 0; i < participantModels.length; i++) {
      var thisModel = participantModels[i].attributes;
      var participantId = thisModel.field_participant_target_id ||
                          thisModel.field_players_target_id;
      obj.participantIds.push(participantId);
    }

    callback(null, obj);
  };

  Attendance.loadObjects = function(callback) {
    async.parallel({
      generic: fetchGenericAttendance,
      goalball: fetchGoalballAttendance
    }, 
    function(err, results) {
      if (err) {
        return callback(err);
      }

      var keys = Object.keys(results);
      var funcList = [];

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var objects = results[key];
        funcList[i] = (function(key, objects) {
          return function(cb) {
            fetchAttendanceData(objects, key, cb);
          };
        })(key, objects);
      }

      async.parallel(funcList, 
        function(err, results) {
          if (err) {
            return callback(err);
          }

          var res = [];
          for (var i = 0; i < results.length; i++) {
            res = res.concat(results[i]);
          }

          return callback(null, res);
        });
    });
  } 

  Attendance.loadObjectsByMonth = function(date, callback) {
    var month = date.getMonth();
    var year = date.getFullYear();

    var dateStart = new Date(year, month, 1);
    var dateEnd = new Date(year, month + 1, 1);
    Attendance.loadObjects(function(err, objects) {
      var relevantObjs = [];

      var length = objects.length;

      for (var i = 0; i < length; i++) {
        var object = objects[i];
        if ( (object.start >= dateStart && object.start < dateEnd) ||
             (object.end >= dateStart && object.end < dateEnd) ) {
          relevantObjs.push(object);
        }
      }
      callback(null, relevantObjs);
    });
  }

  return Attendance;
})();


