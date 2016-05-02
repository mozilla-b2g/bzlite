'use strict';

var PouchDB = require('pouchdb');
var toSource = require('tosource');
var crypto = require('crypto');

var db = new PouchDB('remember', {auto_compaction: true});

var WEEK = 7 * 24 * 60 * 60 * 1000;

module.exports = function (fun, opts) {

  opts = opts || {};

  var maxAge = ('maxAge' in opts) ? opts.maxAge : WEEK;
  var preventStale = ('preventStale' in opts) ? opts.preventStale : false;

  return function() {

    var data;
    var self = this;
    var args = [].slice.call(arguments);

    // Disabling cache for now until bugs are sorted out
    return fun.apply(self, args);

    // var hash = crypto.createHash('sha256')
    //   .update(fun.toString() + toSource(args)).digest('base64');

    // return new Promise(function(resolve, reject) {

      // We have the data cached
      // db.get(hash).then(function(res) {

      //   // Cache is out of date, resolve with cached data and update
      //   if (preventStale || (Date.now() - maxAge) < res.saved) {
      //     fun.apply(self, args).then(function(data) {
      //       res.data = data;
      //       res.updated = Date.now();
      //       if (preventStale) {
      //         resolve(data);
      //       }
      //       db.put(res);
      //     });
      //   }

      //   if (!preventStale) {
      //     resolve(res.data);
      //   }

      // // No data cached, call original function and save results
      // }).catch(function() {
      //   fun.apply(self, args).then(function(data) {
      //     db.put({
      //       _id: hash,
      //       saved: Date.now(),
      //       updated: Date.now(),
      //       data: data
      //     });
      //     resolve(data);
      //   });
      // });
    // });
  }
}
