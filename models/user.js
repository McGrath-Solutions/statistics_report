var dbconfig = require('./databaseconfig');
console.log(dbconfig);
var knex = require('knex')(dbconfig);

var Bookshelf = require('bookshelf')(knex);

module.exports = function() {
    var bookshelf = {};

    bookshelf.ApiUser = Bookshelf.Model.extend({
        tableName: 'users'
    });

    return bookshelf.ApiUser;
}