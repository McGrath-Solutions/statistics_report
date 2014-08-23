module.exports = (function() {
  var exports = {};
  exports.STANDARD = 0;  // Standard data property. postfixed by value and
                         // stored in field_PROPERTYNAME_value in database table
  exports.USER_ID  = 1;  // User id reference: stored in field_PROPERTY_target_id
                         // in database table
  exports.EVENT_ID = 2;  // Event reference: stored in field_PROPERT_target id
                         // in database table
  exports.CONTAINS = 3;  // The statistics contains a reference to another entity
                         // contains relationships are not defined automatically:
                         // the client must supply a fetch function for tha
                         // new entity

  return exports;
})();