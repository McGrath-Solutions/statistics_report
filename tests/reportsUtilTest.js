var genReport = require('../util/reportsGenerator');


genReport("Monthly Programming Report", "./reports/monthly.xlsx", new Date(2014, 2, 1), function(err, path) {
  console.log("In callback");
  if (err) {
    console.error("Error: ");
    console.error(err);
  }
  console.log("Done deal");
  console.log(path);
});


genReport("Monthly Membership Report", "./reports/membership.xlsx", new Date(2014, 4, 1), function(err, path) {
  console.log("In callback");
  if (err) {
    console.error("Error: ");
    console.error(err);
  }
  console.log("Done deal");
  console.log(path);
})