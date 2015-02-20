'use strict';

var tpl = require('./template.js');

var User = function(app) {
  this.app = app;
};

User.prototype.isLoggedIn = function() {
  return false;
};

User.prototype.loginSubmitted = function(e) {
  e.preventDefault();

  // TODO: actually check login
  this.app.emit('login', this);
};

User.prototype.render = function() {
  tpl.read('/views/login.phtml').then(function(form) {
    form.addEventListener('submit', this.loginSubmitted.bind(this));
    document.getElementById('content').appendChild(form);
  }.bind(this));
};

module.exports = User;
