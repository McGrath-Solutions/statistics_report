module.exports = function(Bookshelf) {
    
    Bookshelf.mysqlAuth = Bookshelf.initialize({
        client: 'mysql',
        connection: {
            host     : 'localhost',
            user     : 'mike',
            password : 'goeatrice789',
            database : 'tnaba'
        }
        // , debug: true
    });
}