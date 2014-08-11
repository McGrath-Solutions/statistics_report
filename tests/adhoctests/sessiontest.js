var Session = require('../../models/session');

/*
Session.fetchById('hN_zLA_MeSxF6R9l0GJ1OlyzYD-92AtKswOufn_nTPg', function(err, object) {
  if (err) {
    console.error(err);
    return;
  }

  console.log(object);
});
*/

Session.deleteById('hN_zLA_MeSxF6R9l0GJ1OlyzYD-92AtKswOufn_nTPg', function(err) {
  if (err) {
    console.error(err);
    return;
  }

  console.log("DONE");
})
