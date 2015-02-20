'use strict';

var tpl = require('../template.js');

var app, form;

function value(selector) {
  return document.querySelector(selector).value.trim();
}

function formSubmitted(e) {
  e.preventDefault();

  this.app.bugzilla.createBug({
    product: 'Firefox OS',
    component: value('#component'),
    op_sys: 'All',
    platform: 'All',
    summary: value('#summary'),
    description: value('#description'),
    version: 'unspecified'
  }).then(function(result) {
    document.location.href = '/bug/' + result.id;
  }).catch(function() {
    form.querySelector('.createBugError').hidden = false;
  });
}

function CreateBug(app) {
  this.app = app;
};

CreateBug.prototype.render = function(args) {
  return tpl.read('/views/create_bug.tpl').then((function(_form) {
    form = _form;
    form.addEventListener('submit', formSubmitted.bind(this));
    return form;
  }).bind(this));
};

module.exports = function (app) {
  return new CreateBug(app);
};
