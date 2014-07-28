var dbconfig = require('./databaseconfig');
var knex = require('knex')(dbconfig);
var Bookshelf = require('bookshelf')(knex);

module.exports = (function() {
  var Session = Bookshelf.Model.extend({
    tableName: "sessions"
  });

  Session.initFromDatabaseObject = function(model) {
    var obj = {};
    obj.uid = model.attributes.uid;
    obj.sid = model.attributes.sid;
    obj.hostName = model.attributes.hostname;

    return obj;
  }

  /*
   * Fetch session information from the database
   */
  Session.fetchById = function(id, callback) {
    new Session({sid: id}).fetch().then(function(model) {
      var object = Session.initFromDatabaseObject(model);
      callback(null, object);
    }).catch(function(err) {
      callback(err);
    });
  }

  /* 
   * Destory a session from the database
   */
  Session.deleteById = function(id, callback) {
    new Session({sid: id}).fetch().then(function(model) {
      model.where({sid: id}).destroy().then(function() {
        callback(null);
      }).catch(function(err) {
        callback(err);
      });
    }).catch(function(err) {
      callback(err);
    })
  };


  return Session;
})();