'use strict';

var tpl = require('../template.js');
var utils = require('../utils.js');

var app, form;

function value(selector) {
  return form.querySelector(selector).value.trim();
}

function formSubmitted(e) {
  e.preventDefault();
  var dialog = utils.dialog('Logging In…');

  var email = value('input[type=email]');
  var password = value('input[type=password]');
  app.login(email, password).then(function () {
    dialog.close();
    return true;
  }).catch(function(err) {
    dialog.close();
    var msg = err.message || 'There was an unknown error logging in';
    if (!navigator.onLine) {
      msg = "Your device is currently offline, " +
        "try again when the device is connected."
    }
    alert(msg);
  });
}

module.exports = function(ctx) {
  app = ctx.app;
  return tpl.read('/views/login.tpl').then((function(_form) {
    form = _form;
    form.addEventListener('submit', formSubmitted);
    var close = form.querySelector('.close');
    close.addEventListener('click', history.back.bind(history));
    if (!ctx.app.cancelLogin) {
      close.style.visibility = "hidden";
    }

    var description = 'Bugzilla Lite, mobile bugzilla client';
    var callback = document.location.origin + '/bz_auth/';
    var url = app.bugzilla.apiUrl.slice(0, -5) + '/auth.cgi?callback=' +
      callback + '&description=' + description;
    form.querySelector('#bugzillaLink').href = url;

    return form;
  }));
};
