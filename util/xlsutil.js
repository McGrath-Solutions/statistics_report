var xls = require('msexcel-builder');
var _ = require('lodash');


function makeUtil() {
  /* Helper methods */

  /* 
   * Calculate set width of excel sheet
   */
  var getSheetWidth = function(tables) {
    var PADDING = 10;
    var largestSize = 0;
    for (var i = 0; i < tables.length; i++) {
      var nextSize = tables[i].getNumColumns();
      if (nextSize > largestSize) {
        largestSize = nextSize;
      }
    }

    return largestSize + PADDING;
  }

  /*
   * calculate sheet height of excel sheet
   */
  var getSheetHeight = function(tables) {
    // Distance between each
    var PADDING = 5;

    // Height of the title and its padding
    var TITLE_HEIGHT = 5;

    var sheetHeight = 0;
    for (var i = 0; i < tables.length; i++) {
      var nextHeight = tables[i].getNumEntries() + 1;
      sheetHeight += nextHeight;
      sheetHeight += PADDING;
    }

    return sheetHeight + TITLE_HEIGHT;
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
      } else if (type == "date") {
        if (!_.isDate(row[i])) {
          throw new Error("Table: incorrect entry type at index " + i);
        }
      } else if (type == "boolean") {
        if (!_.isBoolean(row[i])) {
          throw new Error("Table: incorrect entry type at index " + i);
        }
      }
    }

    this.rows.push(row);
    this.entries++;
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

    // Testing code
    console.log("FilePath: " + filePath);
    console.log("FileName: " + fileName);

    var workbook = xls.createWorkbook(filePath, fileName);

    // Write the excel stuff
    _(dataObject).forEach(function(sheetData, sheetName) {
      // Testing code
      console.log("Sheet Data: " + sheetData);
      console.log("Sheet Name: " + sheetName);
      if (!sheetData || !sheetName) throw new Error("Excel Write: Malformed excel object");

      var sheetWidth = getSheetWidth(sheetData.data);
      var sheetHeight = getSheetHeight(sheetData.data);

      // Testing code
      console.log("Width: " + sheetWidth);
      console.log("Height: " + sheetHeight);

      var sheet = workbook.createSheet(sheetName, sheetWidth, sheetHeight);
      var center = sheetWidth / 2;
      var y = 1;
      // Set the title of the sheet
      sheet.set(center, y, sheetData.name);

      // Padding before first table
      y += 3;
      
      // Draw each table
      var tables = sheetData.data;
      
      var numTables = tables.length;
      for (var tableIndex = 0; tableIndex < numTables; tableIndex++) {
        var table = tables[tableIndex];
        sheet.set(center, y, table.title);
        y++;

        // Write labels
        for (var i = 1; i <= table.length; i++) {
          sheet.set(i, y, table.labels[i]);
        }
        y++;

        // Write contents
        for (var i = 0; i < table.entries; i++) {
          var row = table.rows[i];
          for (var j = 1; j <= row.length; j++) {
            sheet.set(j, y, row[j - 1]);
          }
          y++;
        }

        y += 3;
      }
    });
    
    workbook.save(function(err){
      if (err) 
        callback(err);
      else
        callback();
    });
  }

  ExcelWrite.Table = Table;

  return ExcelWrite;
}


module.exports = makeUtil();


















