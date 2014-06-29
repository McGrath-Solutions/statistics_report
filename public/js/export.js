(function() {
  $(document).ready(function() {
    console.log("ready");
    /* helper functions */
    var printThing = function() {
      console.log("Entered");
      console.log("Membership focus: " + $('#membership').is(':focus'));
      console.log("Event focus: " + $('#event').is(':focus'));
    };

    $('#membership').on('click', function() {
      printThing();
    });

    $('#event').on('click', function() {
      printThing();
    });
  });
})();