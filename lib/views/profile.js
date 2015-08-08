'use strict';

var tpl = require('../template.js');
var utils = require('../utils.js');

module.exports = function (ctx) {
  return tpl.read('/views/profile.tpl').then(function(template) {
    return utils.render(template, {'.accountName': ctx.app.user.name});
  });
};
