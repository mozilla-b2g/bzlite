'use strict';

module.exports.render = function render(tpl, data) {
  tpl = tpl.cloneNode(true);
  Object.keys(data).forEach(function(k) {
    var selector = k.split('-');
    var el = tpl.querySelector(selector[0]);
    if (el && selector.length > 1) {
      el[selector[1]] = data[k];
    } else if (el) {
      el.textContent = data[k];
    } else {
      console.error(selector, 'not found');
    }
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

module.exports.dialog = function(str) {
  var wrapper = document.createElement('div');
  var inner = document.createElement('div');
  var text = document.createElement('span');
  var progress = document.createElement('div');
  wrapper.classList.add('dialog');
  wrapper.classList.add('notice');
  progress.classList.add('progress');
  text.textContent = str;
  inner.appendChild(text);
  inner.appendChild(progress);
  wrapper.appendChild(inner);
  document.body.appendChild(wrapper);
  return {
    close: function() {
      document.body.removeChild(wrapper);
    }
  };
};

module.exports.alert = function(str, callback) {
  var wrapper = document.createElement('div');
  var inner = document.createElement('div');
  var text = document.createElement('span');
  var confirm = document.createElement('button');
  wrapper.classList.add('dialog');
  confirm.textContent = 'OK';
  text.textContent = str;
  inner.appendChild(text);
  inner.appendChild(confirm);
  wrapper.appendChild(inner);
  confirm.addEventListener('click', function() {
    document.body.removeChild(wrapper);
    if (callback) {
      callback();
    }
  });
  document.body.appendChild(wrapper);
};
