// Imports
var dbinfo = require('./dbconfig');
var knex = require('knex')(dbinfo);

var bookshelf = require('bookshelf')(knex);

function makeRegistration() {
  // Registration Table in the database
  var Registration = 
}