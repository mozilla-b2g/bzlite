'use strict';

var tpl = require('../template.js');

module.exports = function () {
  return tpl.read('/views/home.tpl');
};
