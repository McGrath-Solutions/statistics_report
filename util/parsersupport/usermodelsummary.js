module.exports = function() {
  var calculateAge = function(user) {
    var dateOfBirth = user.dateOfBirth;

    var today = new Date();
    var age = today.getFullYear() - dateOfBirth.getFullYear();
    var m = today.getMonth() - dateOfBirth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
        age--;
    }

    /* Define Juniors as 1-10, Youth as 11-19, Adults as 20 and up */
    if (age >= 20) {
      return "adults";
    } else if (age >= 11) {
      return "youth";
    } else {
      return "juniors";
    }
  };
  calculateAge.returnValues = ["adults", "youth", "junior"];

  var propertyValues = {
    'roles': ['administrator', 'adult member', 'anonymous user', 'authenticated user', 
              'board_member', 'coordinator', 'executive director', 'guest', 'junior member',
              'officer', 'organizer', 'pending member (awaiting confirmation)', 
              'pending member (post-payment)', 'volunteer', 'youth member'],
    'dateOfBirth': Date,
    'gender': ['male', 'female'],
    'isVeteran': Boolean,
    'firstName': String,
    'lastName': String,
    'phone': String,
    'sportsClub': ['At-large', 'statewide', 'Nashville', 'Memphis'],
    'age': calculateAge
  };

  return propertyValues;
};