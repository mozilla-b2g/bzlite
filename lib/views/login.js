'use strict';

var tpl = require('../template.js');
var utils = require('../utils.js');

var app, form;

function value(selector) {
  return form.querySelector(selector).value.trim();
}

function formSubmitted(e) {
  e.preventDefault();
  var dialog = utils.dialog('Logging In ...');

  form.querySelector('.loginError').hidden = true;
  var email = value('input[type=email]');
  var password = value('input[type=password]');
  this.app.login(email, password).then(function () {
    dialog.close();
    form.querySelector('.waiting').hidden = true;
    return true;
  }).catch(function(err) {
    dialog.close();
    form.querySelector('.waiting').hidden = true;
    form.querySelector('.loginError').hidden = false;
  });
}

function Login(app) {
  this.app = app;
};

Login.prototype.render = function(args) {
  return tpl.read('/views/login.tpl').then((function(_form) {
    form = _form;
    form.addEventListener('submit', formSubmitted.bind(this));
    return form;
  }).bind(this));
};

module.exports = function (app) {
  return new Login(app);
};

