var Registration = require('../models/registration');

var printstuff = function(models) {
  for (var i = 0; i < models.length; i++) {
    //console.log(typeof model);
    console.log(models);
  }
}

Registration.loadObjects(printstuff);

// Update node
new Registration.RegistrationNode(
{registration_id: 2,
entity_id: 18,
entity_type: "node",
anon_mail: "Joe@bob.com",
type: 'achilles_walk_run',
count: 1,
user_uid: null,
author_uid: 1,
state: "complete",
order_id: 0,
//notes: "Yipdadeedoo"
}
).save().then(function(model){
  console.log("SUCCESS");
}, function(err) {
  console.log(err);
  console.log("Failure");
});