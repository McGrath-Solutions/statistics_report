var User = require('../../models/user');
/*
new User({uid: 1}).fetch({
  withRelated: ['roles', 'dateOfBirth', 'gender', 'isVeteran']
}).then(function(model) {
  console.log(model);
  console.log(model.related('roles').attributes.rid);
  console.log(model.related('dateOfBirth').attributes.field_date_of_birth_value);
  console.log(model.related('gender').attributes.field_gender_value);
  console.log(model.related('isVeteran').attributes.field_veteran_status_value);
});
*/

/*
User.getUserObjectById(1, function(err, object) {
  if (err) {
    console.error("Error: " + err);
  }
  console.log(object);
});
*/

User.loadObjects(function(err, objects) {
  console.log("Fetched Users!");
  console.log("DERP DERP DERP");
  if (err) {
    console.error("Error: " + err);
  }
  // console.log(objects);
  
  var count = 0;
  var mem = 0;
  var nash = 0;
  for (var i = 0; i < objects.length; i++) {
    var user = objects[i];
    console.log(user);
    if (user.isAdmin || user.isGuest) {
      count++;
    } else {
      if (user.sportsClub === "Memphis") {
        mem++;
      } else if (user.sportsClub === "Nashville") {
        nash++;
      }
    }
  }

  console.log(count + " special (non-users)");
  console.log(mem + " Memphis club members");
  console.log(nash + " Nashville club members"); 
  console.log(objects.length + " total users");
});

/*
User.loadUsersByCreatedMonth(new Date(2014, 4, 1), function(err, objects) {
  if (err) {
    console.error("Error: " + err);
  }
  console.log("By Date: ");
  console.log(objects);
});

User.loadUsersCreatedBefore(new Date(2014, 4, 8), function(err, objects) {
  if (err) {
    console.error("Error: " + err);
  }

  console.log("Before May 8th: ");
  console.log(objects);
})
*/
