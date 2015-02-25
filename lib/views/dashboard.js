'use strict';

var tpl = require('../template.js');

function Dashboard(app) {
  this.app = app;
};

Dashboard.prototype.render = function(args) {
  return tpl.read('/views/dashboard.tpl').then((function(form) {
    this.app.bugzilla.searchBugs({
      assigned_to: this.app.user.name,
      status: 'NEW',
      include_fields: 'summary,id'
    }).then(function(result) {
      var wrapper = form.querySelector('.assigned');
      result.bugs.forEach(function(obj) {
        var link = document.createElement('a');
        link.textContent = obj.id + ' - ' + obj.summary;
        link.href = '/bug/' + obj.id;
        wrapper.appendChild(link);
      });
    });
    return form;

  }).bind(this));
};

module.exports = function (app) {
  return new Dashboard(app);
};
