/*
 * Generate xml reports
 * Note: DEPRECATED. Use the client side Reports-Generator library
 * instead
 * @author Mike Zhang
 */
var xls = require('msexcel-builder');
var _ = require('lodash');
var mkdirp = require('mkdirp');

function makeUtil() {
  /* Helper methods */
  var getLongestWidth = function(tables) {
    var largestSize = 0;
    for (var i = 0; i < tables.length; i++) {
      var nextSize = tables[i].getNumColumns();
      if (nextSize > largestSize) {
        largestSize = nextSize;
      }
    }

    return largestSize;
  }

  /* 
   * Calculate set width of excel sheet
   */
  var getSheetWidth = function(tables) {
    var PADDING = 10;
    var largestSize = getLongestWidth(tables);

    return largestSize + PADDING;
  }

  /*
   * calculate sheet height of excel sheet
   */
  var getSheetHeight = function(tables, information) {
    // Distance between each
    var PADDING = 5;

    // Height of the title and its padding
    var TITLE_HEIGHT = 5;

    var sheetHeight = 0;
    var infoLength = (information) ? Object.keys(information).length * 3 + 5 : 0;
    for (var i = 0; i < tables.length; i++) {
      var nextHeight = tables[i].getNumEntries() + 1;
      sheetHeight += nextHeight;
      sheetHeight += PADDING;
    }

    return sheetHeight + TITLE_HEIGHT + infoLength;
  }

  /* Table Class Definition */
  /*
   * A table is defined by a schema and a set of labels for that schema (both arrays)
   * @param title = The title of the table
   * @param schema = the schema of the table, defined as an array of typenames
   * @param labels = the labels for each column in the table, should be equal in size with the schema
   */
  var Table = function(title, schema, labels) {
    // Entries in the table
    if (schema.length != labels.length) {
      throw new Error("Table: schema and label array must be the same length");
    }

    // Check if the schema is valid
    var validSchemaEntries = ["number", "string", "date", "boolean"];
    _.forEach(schema, function(schemaEntry) {
      var index = _.indexOf(validSchemaEntries, schemaEntry);
      if (index > -1) return true;
      throw new Error("Table: unrecognized schema type " + schemaEntry + " in schema declaration");
    });
    
    // Schema can consist of "number", "string", "date", "boolean"
    this.title = title;
    this.schema = schema;
    this.labels = labels;
    this.length = schema.length;
    this.entries = 0;
    this.rows = [];
  }


  /*
   * Add a row of elements to a table. 
   */
  Table.prototype.pushRow = function(row) {
    if (row.length != this.length) throw new Error("Table: Length mismatch");
    
    for (var i = 0; i < row.length; i++) {
      var type = this.schema[i];

      // Check if each row matches the schema type declared
      if (type === "number") {
        if (!_.isNumber(row[i])) {
          throw new Error("Table: incorrect entry type at index " + i);
        }
      } else if (type === "string") {
        if (!_.isString(row[i])) {
          throw new Error("Table: incorrect entry type at index " + i);
        }
      } else if (type === "date") {
        if (!_.isDate(row[i])) {
          throw new Error("Table: incorrect entry type at index " + i);
        }
      } else if (type === "boolean") {
        if (!_.isBoolean(row[i])) {
          throw new Error("Table: incorrect entry type at index " + i);
        }
      }
    }

    this.rows.push(row);
    this.entries++;
  }

  /*
   * Add a row of elements to the table where the row is an object
   */
  Table.prototype.pushObjectRow = function(rowValues) {
    var keys = Object.keys(rowValues);
    var arr = [];
    for (var i = 0; i < keys.length; i++) {
      // Push the next value into the array
      arr[i] = rowValues[keys[i]];
    }

    // Debug code
    /*
    console.log("Attempting to push this array: ");
    console.log(arr);
    console.log("Has length: " + arr.length);
    */

    this.pushRow(arr);
  }

  /*
   * Get the number of entries in the table
   */
  Table.prototype.getNumEntries = function() {
    return this.entries;
  }

  /*
   * Get the number of columns in the schema
   */
  Table.prototype.getNumColumns = function() {
    return this.length;
  }


  var ExcelWrite = function(dataObject, callback, options) {
    var util = require('util');

    // Is the layout columnwise or row-wise?
    /* 
     * Ie should the column titles be aligned row major or column major?
     * Feature to be implemented later
    var COLUMN_WISE = 0;
    var ROW_WISE = 1;
    */ 

    var opts = {
      fileName: "./report.xlsx" 
      // Layout: to be implemented later. 
      // For now, all output will be row_wise. ie the data entries are shown
      // row by row with table columns in the columns of the spreadsheet
      /* layout: ROW_WISE */
    };

    if (arguments.length === 3) {
      opts.fileName = options.fileName || opts.fileName;
      opts.layout = options.layout || opts.layout;
    }

    var slashIndex = opts.fileName.lastIndexOf('\/');
    var filePath = (slashIndex != -1) ? opts.fileName.substring(0, slashIndex + 1) : ".\/";
    var fileName = (slashIndex != -1) ? opts.fileName.substring(slashIndex + 1) : opts.fileName;

    console.log("filepath: " + filePath);
    console.log("filename: " + fileName);

    var workbook = xls.createWorkbook(filePath, fileName);

    // Write the excel stuff
    _(dataObject).forEach(function(sheetData, sheetName) {
      // Marign between the edge of the sheet and the table
      var TABLE_MARGIN = 2;

      if (!sheetData || !sheetName) throw new Error("Excel Write: Malformed excel object");

      // Sheet width and height, used for sheed creation
      var sheetWidth = getSheetWidth(sheetData.data);
      var sheetHeight = getSheetHeight(sheetData.data, sheetData.information);

      // Debug code
      console.log("Width: " + sheetWidth);
      console.log("Height: " + sheetHeight);

      var sheet = workbook.createSheet(sheetName, sheetWidth, sheetHeight);
      var center = Math.floor(sheetWidth / 2);
      var y = 1;

      // Set the width of columns in use
      var longestTableWidth = getLongestWidth(sheetData.data);
      //console.log("Longest: " + longestTableWidth);
      var startIndex = Math.floor((sheetWidth - 2 * TABLE_MARGIN) / 2 - longestTableWidth / 2);
      for (var i = 1; i <= longestTableWidth; i++) {
        //console.log("Set column length for " + (i + TABLE_MARGIN + startIndex));
        sheet.width(i + TABLE_MARGIN + startIndex, 20);
      }

      // Debug code
      console.log("center: " + center);
      console.log("y: " + y);

      // Set the title of the sheet
      sheet.set(center, y, sheetData.name);
      sheet.border(center, y, {bottom: "thick"});
      sheet.font(center, y, {bold: "true"});
      y += 2;

      // Set information, if applicable
      var info = sheetData.information; 
      if (info) {
        _(info).forEach(function(infoEntry, infoTitle) {

          // Set information title
          sheet.set(center - 1, y, infoTitle);
          sheet.border(center - 1, y, {bottom: "thin", left: "thin", top: "thin", right: "thin"});

          // Set sheet information
          sheet.set(center, y, infoEntry);
          sheet.border(center, y, {bottom: "thin", right: "thin", top: "thin"});
          y++;
        })
      }

      // Padding before first table
      y += 3;
      
      // Draw each table
      var tables = sheetData.data;  
      var numTables = tables.length;
      for (var tableIndex = 0; tableIndex < numTables; tableIndex++) {
        
        var table = tables[tableIndex];
        var startIndex = Math.floor((sheetWidth - 2 * TABLE_MARGIN) / 2 - table.length / 2);

        // Write the title of the table
        sheet.set(startIndex + TABLE_MARGIN, y, table.title);
        sheet.border(startIndex + TABLE_MARGIN, y, {bottom: "medium"})
        y++;

        // Write column labels
        for (var i = 1; i <= table.length; i++) {
          sheet.set(i + TABLE_MARGIN + startIndex, y, table.labels[i - 1]);

          // Set the edge border around the labels
          if (i === 1) {
            sheet.border(i + TABLE_MARGIN + startIndex, y, {left: "thin", top: "thin", bottom: "thin"});
          } else if (i === table.length) {
            sheet.border(i + TABLE_MARGIN + startIndex, y, {right: "thin", top: "thin", bottom: "thin"});
          } else {
            sheet.border(i + TABLE_MARGIN + startIndex, y, {top: "thin", bottom: "thin"});
          }
        }
        y++;

        // Write contents
        for (var i = 0; i < table.entries; i++) {
          var row = table.rows[i];

          // Inner loop: iterate through each data row
          for (var j = 1; j <= row.length; j++) {
            sheet.set(j + TABLE_MARGIN + startIndex, y, row[j - 1]);

            var borderObject = {};
            // If at the edges, set the border for the edge of the sheet
            if (j === 1) {
              borderObject.left = "thin";
            } else if (j === row.length) {
              borderObject.right = "thin";
            }

            // If at the bottom at the table, set the border for the bottom
            if (i === table.entries - 1) {
              borderObject.bottom = "thin";
            }

            sheet.border(j + TABLE_MARGIN + startIndex, y, borderObject);
          }
          y++;
        }

        y += 3;
      }
    });
    
    mkdirp(filePath, function() {
      workbook.save(function(err){
        if (err) 
          callback(err, opts.fileName);
        else
          callback(null, opts.fileName);
      });
    });
  }

  ExcelWrite.Table = Table;

  return ExcelWrite;
}


module.exports = makeUtil();
