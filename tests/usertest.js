var User = require('../models/user');

new User({uid: 1}).fetch({
  withRelated: ['roles', 'dateOfBirth', 'gender', 'isVeteran']
}).then(function(model) {
  console.log(model);
  console.log(model.related('roles').attributes.rid);
  console.log(model.related('dateOfBirth').attributes.field_date_of_birth_value);
  console.log(model.related('gender').attributes.field_gender_value);
  console.log(model.related('isVeteran').attributes.field_veteran_status_value);
});

User.getUserObjectById(19, function(object) {
  console.log(object);
});
