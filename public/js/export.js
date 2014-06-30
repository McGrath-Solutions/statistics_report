(function() {

  $(document).ready(function() {
    console.log("ready");
    /* helper functions */
    var printThing = function() {
      console.log("Entered");
      console.log("Membership focus: " + $('#membership').is(':focus'));
      console.log("Event focus: " + $('#event').is(':focus'));
    };

    var deselected = function() {
      var mem = $('#membership').is(':focus');
      var eve = $('#event').is(':focus');
      if (!mem && !eve) {
        $('#selected').text("No report type selected.");
        $('#selected').css("color", "blue");
        $('#download').addClass("notReady");
      }
    };

    var selected = function(el) {
      var elId = el.attr('id');
      $('#selected').text("Selected " + elId + " report.");
      $('#selected').css("color", "green");
      $('#download').removeClass("notReady");
      ready = true;

      focusedName = elId;
    };

    // Local variables
    var focusedName;
    var ready = true;

    $('#membership').on('click', function() {
      // Only if ready to click, click
      if (!ready) {
        this.blur();
        return;
      }

      console.log("Clicked membership");
      selected($(this));
    });

    $('#event').on('click', function() {
      // Only activate if ready to click
      if (!ready) {
        this.blur();
        return;
      }

      console.log("Clicked event");
      selected($(this));
    });

    $('#download').on('click', function() {
      console.log("Clicked download");
      ready = false;
      // var curFocused = $('#' + focusedName);
      // keep focus on curFocused
      // curFocused.focus();
      $.ajax({
        url: "/generate",
        type: "POST",
        data: { 
          type: focusedName
        },
        dataType: "json",
        success: function(response) {
          console.log("Great success");
          console.log("Got response: ");
          console.log(JSON.stringify(response));
          if (response.needLogin) {
            window.location.href = "/login";
          } else {
            window.location.href = "/download/" + response.fileName;
          }
        },
        error: function(jq, status, err) {
          console.log("Error: " + err);
        },
        complete: function() {
          ready = true;
        }
      })



    });

    // Clicking the document clears the button (and the selection)
    $(this).on('click', function() {
      deselected();
    });

    // Attach ajax listeners
    // The loading div
    var loading = $('#loading').hide();
    $(this)
      .ajaxStart(function() {
        loading.show();
      })
      .ajaxStop(function() {
        loading.hide();
      });
  });
})();