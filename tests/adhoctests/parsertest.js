var parser = require('../../util/modeldataparser');

var user = parser.loadModel('user');

console.log("Whole Model:");
console.log("------------------------------------------------------------");
console.log(user);
console.log();

console.log("Model roles:");
console.log("------------------------------------------------------------");
console.log(user.roles());
console.log();

console.log("Model roles value");
console.log("------------------------------------------------------------");
console.log(user.roles.board_member());
console.log();

console.log("Model date of birth value");
console.log("------------------------------------------------------------");
console.log(user.dateOfBirth());
console.log(user.dateOfBirth.between(new Date(1, 1, 1), new Date(2, 2, 2))())
console.log(user.dateOfBirth());
console.log();

console.log("Model age");
console.log("------------------------------------------------------------");
console.log(user.age());
console.log(user.age.adults())