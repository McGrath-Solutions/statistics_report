/*
 * auth.js
 * Authentication strategy for a Drupal database
 * @author Mike Zhang
 */
var crypto = require('crypto');
var LocalStrategy = require('passport-local').Strategy;
var user = require('../models/user');

/* Direct translation from drupal's password.inc
 * Drupal, being a very funky guy, has it's own unique way of encoding base64
 * this implementation is located in drupal include's password.inc and is a
 * direct translation from the PHP to the JavaScripte.
 * @param input = the input in raw binary
 * @param count = the length of the raw binary                         
 * @return The drupalized base64 encoding of the binary input               */
function base64encode(input, count) {
   var ord = function(c) {
      return c.charCodeAt(0);
   }

   var output = '';
   var i = 0;
   var itoa64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

   do {
      var value = ord(input[i++]);
      output += itoa64[value & 0x3f];
      if (i < count) {
         value |= ord(input[i]) << 8;
      }
      output += itoa64[(value >> 6) & 0x3f];
      if (i++ >= count) {
         break;
      }
      if (i < count) {
         value |= ord(input[i]) << 16;
      }
      output += itoa64[(value >> 12) & 0x3f];
      if (i++ >= count) {
         break;
      }

      output += itoa64[(value >> 18) & 0x3f];
   } while (i < count);

   return output;
}

/*
 * Check that the Drupal password is correct. 
 * @param {string} passwordenc - the encrypted password (stored in databasse)
 * @param {string} password - the user-inputted password
 * @returns {boolean} true if match, false if no match
 */
function checkDrupalPassword(passwordenc, password) {
  // Default size of drupal hash
  var DRUPAL_HASH_SIZE = 55;

  // For Drupal 7, the defalt header is $S$
  var versionIndicator = "$S$";

  // Default for drupal 7 is D = 15 iterations
  var numIterationsChar = "D";

  // The number of iterations, log 2 to perform sha512. In drupal7, this is by
  // default 15
  var numIterationsLog2 = 15;

  // The salt for drupal 7 passwords is the eight characters immediately
  // following the number of iterations
  var salt = passwordenc.substring(4, 12);

  // Perform the encryption
  var count = 1 << numIterationsLog2;
  var hash = crypto.createHash('sha512').update(salt + password).digest('binary');
  for (var i = 0; i < count; i++) {
     hash = crypto.createHash('sha512').update(hash + password).digest('binary');
  }
  var len = hash.length;
  var output = passwordenc.substring(0, 12) + base64encode(hash, len);

  return output.substring(0, DRUPAL_HASH_SIZE) === passwordenc;
}

/*
 * Modified passport strategy, imitates the drupal hashing/authentication scheme
 */
module.exports = function(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user.id || user.attributes.uid);
  });

  passport.deserializeUser(function(user_id, done) {
      user.getUserObjectById(user_id, function(err, user) {
        if (err) {
          return done(err);
        }

        return done(null, user);
      });
  });

  passport.use('loginpage', new LocalStrategy(function(username, password, done) {
    new user({name: username.toLowerCase().trim()}).fetch({require: true}).then(function(user) {
      var encryptedpass = user.get('pass');
      if (checkDrupalPassword(encryptedpass, password)) {
        return done(null, user);
      } 

      return done(null, false, {"message": "Invalid username or password."});
    }, function(error) {
      return done(null, false, {"message": "Invalid username or password."});
    });
  }));
}