require({
  /* Base url in directory above */
  baseUrl: "../",
  paths: {
    jquery: "jquery/dist/jquery.min.js",
    main: "reports-generator/dist/compiled-generator.min.js"
  }
},
['jquery', 'main'], 
function($, ReportsGenerator) {

  $(document).ready(function() {
    console.log("ready");
    /* helper functions */
    /* For testing */
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
        $('#download').addClass("notReady");
      }
    };

    var selected = function(el) {
      var elId = el.attr('id');
      $('#selected').text("Selected " + elId + " report.");
      $('#download').removeClass("notReady");
      ready = true;

      focusedName = elId;
    };

    // Local variables
    // The ID of the selector being focused on
    var focusedName;

    // Whether the selectors are ready
    var ready = true;

    // Date selector-related variables
    var today = new Date();
    var thisMonth = today.getMonth();
    var thisYear = today.getFullYear();
    var monthSelected = thisMonth;
    var yearSelected = thisYear;

    // Month select initialization
    var monthSelector = $('#month');
    var yearDisplay = $('#year');

    yearDisplay.text(thisYear);
    monthSelector.val(thisMonth);
    monthSelector.on('change', function() {
      var month = $(this).val();
      monthSelected = month;
      if (thisMonth >= month) {
        yearDisplay.text(thisYear);
        yearSelected = thisYear;
      } else {
        yearDisplay.text(thisYear - 1);
        yearSelected = thisYear - 1;
      }
    });

    $('#membership').on('click', function() {
      // Only if ready to click, click
      if (!ready) {
        this.blur();
        return;
      }

      // console.log("Clicked membership");
      selected($(this));
    });

    $('#event').on('click', function() {
      // Only activate if ready to click
      if (!ready) {
        this.blur();
        return;
      }

      // console.log("Clicked event");
      selected($(this));
    });

    /* 
     * Download click callback
     */
    $('#download').on('click', function() {
      // console.log("Clicked download");
      ready = false;
      // var curFocused = $('#' + focusedName);
      // keep focus on curFocused
      // curFocused.focus();
      $.ajax({
        url: "/generate",
        type: "POST",
        data: { 
          type: focusedName,
          dateFor: new Date(yearSelected, monthSelected, 1)
        },
        dataType: "json",
        success: function(response) {
          // console.log("Great success");
          // console.log("Got response: ");
          // console.log(JSON.stringify(response));
          if (response.needLogin) {
            window.location.href = "/login";
          } else {
            window.location.href = "/download/" + response.fileName;
          }
        },
        error: function(jq, status, err) {
          console.error("Error: " + err);
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
});