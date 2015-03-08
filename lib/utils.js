'use strict';

module.exports.render = function render(tpl, data) {
  tpl = tpl.cloneNode(true);
  Object.keys(data).forEach(function(k) {
    tpl.querySelector(k).textContent = data[k];
  });
  return tpl;
};
