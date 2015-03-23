'use strict';

module.exports.render = function render(tpl, data) {
  tpl = tpl.cloneNode(true);
  Object.keys(data).forEach(function(k) {
    tpl.querySelector(k).textContent = data[k];
  });
  return tpl;
};

module.exports.toaster = function(str) {
  var toaster = document.createElement('div');
  toaster.textContent = str;
  toaster.classList.add('toast');
  document.body.appendChild(toaster);
  toaster.clientTop;
  toaster.classList.add('shown');
  setTimeout(function() {
    toaster.addEventListener('transitionend', function() {
      document.body.removeChild(toaster);
    });
    toaster.classList.add('fade');
  }, 2000);
};
