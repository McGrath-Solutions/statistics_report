var genReport = require('../util/reportsGenerator');

genReport("Monthly Programming Report", new Date(2014, 4, 1), function(err) {
  console.log("In callback");
  if (err) {
    console.error("Error: ");
    console.error(err);
  }
  console.log("Done deal");
});