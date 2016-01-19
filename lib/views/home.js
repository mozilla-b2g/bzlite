'use strict';

var tpl = require('../template.js');

module.exports = function () {
  return tpl.readDom('#home-tpl');
};
