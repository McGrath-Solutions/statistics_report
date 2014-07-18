Reports-generator
=================
This project is currently in active development.

A utility for generating well-formatted reports in pdf, excel and html formats.

Usage
=====
Reports-generator is an [AMD module](http://requirejs.org/docs/whyamd.html)
``` javascript
require(["reports-generator.js"], function(Report) {
   // Declare some tables
   var tableSchema = [String, Number, Number];
   var tableLabels = ["Name", "Wins", "Losses"];
   var MyLittleReportTable1 = new Report.Table("My Table Name", tableSchema, tableLabels);
   var MyLittleReportTable2 = ...

   // Send in a report object
   var reportObject = {
     firstSheet: {
       name: "Title of sheet to display",
       information: {
         infoField: "Some info here"
         "Another Info Field": "More info here"
       },
       data: [MyLittleReportTable1, MyLittleReportTale2, ...]
     },
     secondSheet: {
       ...
     },
     ...
   };

   // Generate a pdf file
   Report.PDFReport(reportObject, function callback(err, ReportObject) {
     if (err) console.error("Big trubble: " + err);
     else {
       console.log("Success!");
       ReportObject.save("MyPDFReport");
     }
   });

   // Similarly for xlsx reports
   Report.ExcelReport(reportObject, function callback(err, ReportObject) {
     if (err) console.error("Very bad: " + err);
     else {
       console.log("Success!");
       ReportObject.save("MyExcelReport");
     }
   });
});
```

Browser Compatibility
=====================
This module uses jsPDF and js-xlsx. 
jsPDF requires IE6+ (with shim for IE9 and below), Firefox 3+, Chrome, Safari 3+, Opera and
js-xlsx requires IE6+, FF18+, Chrome 24+
