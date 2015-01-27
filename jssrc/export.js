require({
  /* Base url in directory above */
  baseUrl: "../reports",
  paths: {
    jquery: "bower_components/jquery/dist/jquery.min",
    main: "bower_components/reports-generator/dist/compiled-generator.min"
  }
},
['jquery', 'main'], 
function($, ReportsGenerator) {
  console.log($);

  $(document).ready(function() {
    console.log("ready");
    /* helper functions */
    /* For testing */
    var printThing = function() {
      console.log("Entered");
      console.log("Membership focus: " + $('#membership').is(':focus'));
      console.log("Event focus: " + $('#event').is(':focus'));
    };

    var elements = $('#options').children();

    var deselected = function() {
      /*
      var mem = $('#membership').is(':focus');
      var eve = $('#event').is(':focus');
      */
     
      if (!elements.is(':focus')) {
        $('#selected').text("No report type selected.");
        $('#downloadLabel').addClass("notReady");
        $('#download').addClass("notReady");
        $('#downloadPDF').addClass("notReady");
        $('#downloadXLS').addClass("notReady");
      }
    };

    var selected = function(el) {
      var elId = el.attr('id');
      $('#selected').text("Selected " + elId + " report.");
      $('#downloadLabel').removeClass("notReady");
      $('#download').removeClass("notReady");
      $('#downloadPDF').removeClass("notReady");
      $('#downloadXLS').removeClass("notReady");
      ready = true;

      el.focus();
      focusedName = elId;
    };

    var translateSchemaInstance = function(instance) {
      if (instance === "number") {
        return Number;
      } else if (instance === "date") {
        return Date;
      } else if (instance === "boolean") {
        return Boolean;
      } else if (instance === "string") {
        return String;
      }
    }

    var translateSchema = function(schema) {
      var newSchema = [];
      for (var count = 0; count < schema.length; count++) {
        newSchema[count] = translateSchemaInstance(schema[count]);
      }

      return newSchema;
    }

    var loadFromAPIObject = function(res) {
      var keys = Object.keys(res);
      var reportObject = {};

      var firstSheetKey = keys[0];
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        reportObject[key] = {};
        reportObject[key].name = res[key].name;
      }

      reportObject[firstSheetKey].information = {};
      reportObject[firstSheetKey].information.Generated = new Date();
      reportObject[firstSheetKey].information.Month = Number(monthSelected + 1) + "/" + yearSelected;

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        reportObject[key].data = [];

        var resData = res[key].data;
        for (var j = 0; j < resData.length; j++) {
          var translatedSchema = translateSchema(resData[j].schema);

          resData[j].schema = translatedSchema;
          console.log("Res Data: ");
          console.log(resData[i]);
          reportObject[key].data[j] = ReportsGenerator.Table.initializeFromTable(resData[j]);
        }
      }


      return reportObject;
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
      var month = Number($(this).val());
      monthSelected = month;
      if (thisMonth >= month) {
        yearDisplay.text(thisYear);
        yearSelected = thisYear;
      } else {
        yearDisplay.text(thisYear - 1);
        yearSelected = thisYear - 1;
      }
    });
    

    elements.on('click', function() {
      if (!ready) {
        return this.blur();
      }

      selected($(this));
    })

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

    var universalClickListener = function() {
      var id = $(this).attr('id');
      console.log("Clicked");

      ready = false;
      var dateString = Number(monthSelected + 1) + "-1-" + yearSelected;
      var url = "/reports/api/" + focusedName + "/" + dateString;
      console.log(dateString);

      $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        success: function(response) {
          console.log(id);
          console.log(response);

          if (response.needLogin) {
            window.location.href = "/login";
          }

          var reportObject = loadFromAPIObject(response);

          
          var fileName = focusedName + "-" + Number(monthSelected + 1) + "-" + yearSelected;

          if (id === "downloadPDF") {
            ReportsGenerator.PDFReport(reportObject, function(err, obj) {
              obj.save(fileName);
            })
          } else if (id == "downloadXLS") {
            ReportsGenerator.ExcelReport(reportObject, function(err, obj) {
              obj.save(fileName);
            });
          }
        },
        error: function(jq, status, err) {
          console.error("Error: " + err);
        },
        complete: function() {
          ready = true;
        }
      })
    };

    /* 
     * Client-side based click callback 
     */
    $('#downloadXLS').on('click', universalClickListener);
    $('#downloadPDF').on('click', universalClickListener);

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