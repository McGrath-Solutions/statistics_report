// Authentication information through knex
// Modify with database information to make
// this app work
var knex = require('knex')({
  client: 'mysql',
  connection: {
    host: "localhost",
    user: "myuser",
    password: "mypassword",
    database: "mydatabse"
  }
})

var Bookshelf = require('bookshelf')(knex);

module.exports = function() {
    var bookshelf = {};

    bookshelf.ApiUser = Bookshelf.Model.extend({
        tableName: 'users'
    });

    return bookshelf.ApiUser;
}
