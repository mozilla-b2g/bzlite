'use strict';

var request = require('request');

module.exports.read = function(path) {
  return new Promise(function(resolve, reject) {
    request({
      method: 'GET',
      url: path
    }, function(err, args, data) {

      if (err) {
        return reject(err);
      }

      var el = document.createElement('div');
      el.innerHTML = data;
      resolve(el.firstChild);
    });
  });
};
