(function() {
  $(document).ready(function() {
    console.log("ready");
    /* helper functions */
    var printThing = function() {
      console.log("Entered");
      console.log("Membership focus: " + $('#membership').is(':focus'));
      console.log("Event focus: " + $('#event').is(':focus'));
    };

    var selected = function(el) {

    }

    var deselected = function() {
      var mem = $('#membership').is(':focus');
      var eve = $('#event').is(':focus');
      if (!mem && !eve) {
        $('#selected').text("No report type selected.");
        $('#selected').css("color", "red");
        $('#download').addClass("notReady");
      }
    }

    $('#membership').on('click', function() {
      // printThing();
      $('#selected').text("Selected membership report.");
      $('#selected').css("color", "green");
      $('#download').removeClass("notReady");
    });

    $('#event').on('click', function() {
      // printThing();
      $('#selected').text("Selected event report.");
      $('#selected').css("color", "green");
      $('#download').removeClass("notReady");
    });

    $(document).on('click', function() {
      deselected();
    })

    /*
    $('#membership').on('focusout', function() {
      deselected();
    });

    $('#event').on('focusout', function() {
      deselected();
    })
    */
  });
})();