'use strict';

var tpl = require('../template.js');
var utils = require('../utils.js');

module.exports = function () {
  return tpl.read('/views/profile.tpl').then(function(template) {
    return utils.render(template, {
      '.accountName': JSON.parse(localStorage.user).login
    });
  });
};
