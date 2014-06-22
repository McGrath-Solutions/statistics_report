var xls = require('msexcel-builder');
var _ = require('lodash');


function makeUtil() {
  /*
   * A table is defined by a schema and a set of labels for that schema (both arrays)
   * @param schema = the schema of the table, defined as an array of typenames
   * @param 
   */
  var Table = function(schema, labels) {
    // Table schema
    this.columnArray = columnArray;

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
    this.schema = schema;
    this.length = length;
    this.rows = [];
  }


  Table.prototype.pushRow = function(row) {
    var entry = [];
    
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
  }


  var ExcelUtil = function(dataObject, options) {
    // Is the layout columnwise or row-wise?
    /* 
     * Ie should the column titles be aligned row major or column major?
     */
    var COLUMN_WISE = 0;
    var ROW_WISE = 1;

    var opts({
      filePath: "./report",
      layout: ROW_WISE
    });

    if (options) {
      opts.fileName = options.fileName || opts.fileName;
      opts.layout = options.layout || opts.layout;
    }

    var workbook = xls.createWorkbook()
  }

  return ExcelUtil;
}


module.exports = makeUtil();