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
      resolve(el.firstElementChild);
    });
  });
};

module.exports.readDom = function(id) {
  return new Promise(function(resolve, reject) {
    var t = document.querySelector(id);
    var clone = document.importNode(t.content, true);
    resolve(clone);
  });
}
