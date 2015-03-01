'use strict';

module.exports.render = function render(tpl, data) {
  Object.keys(data).forEach(function(k) {
    tpl.querySelector(k).textContent = data[k];
  });
  return tpl;
};
