'use strict';

var tpl = require('../template.js');
var timeago = require('timeago');

function Dashboard(app) {
  this.app = app;
};

function render(str, obj) {
  var div = document.createElement('div');
  Object.keys(obj).forEach(function(k) {
    str = str.replace('{' + k + '}', obj[k]);
  });
  div.innerHTML = str;
  return div.firstChild;
}

function template() {
  return `<a href="{href}">
    <div>
      <span>{id}</span>
      <span>{lastChanged}</span>
    </div>
    <span>{summary}</span>
  </a>`;
}

function write(wrapper, obj) {
  wrapper.appendChild(render(template(), {
    id: obj.id,
    lastChanged: timeago(obj.last_change_time),
    href: '/bug/' + obj.id,
    summary: obj.summary
  }));
}

Dashboard.prototype.render = function(args) {
  return tpl.read('/views/dashboard.tpl').then((function(form) {
    this.app.bugzilla.searchBugs({
      j_top: 'OR',
      f1:'assigned_to',
      f2:'requestees.login_name',
      f3:'setters.login_name',
      v1: this.app.user.name,
      v2: this.app.user.name,
      v3: this.app.user.name,
      o1: 'equals',
      o2: 'equals',
      o3: 'equals',
      order: 'Last Changed',
      resolution: '---',
      query_format: 'advanced',
      include_fields: 'summary,id,assigned_to,flags,last_change_time'
    }).then(function(result) {

      var assigned = form.querySelector('.assigned');
      var yourFlags = form.querySelector('.yourFlags');
      var theirFlags = form.querySelector('.theirFlags');

      result.bugs.forEach(function(obj) {

        if (obj.assigned_to && obj.assigned_to.name === this.app.user.name) {
          write(assigned, obj);
        }

        if (obj.flags) {
          obj.flags.forEach(function(flag) {
            if (flag.status === '?') {
              if (flag.requestee.name === this.app.user.name) {
                write(yourFlags, obj);
              }
              if (flag.setter.name === this.app.user.name) {
                write(theirFlags, obj);
              }
            }

          }, this);
        }
      }, this);
    }.bind(this));
    return form;

  }).bind(this));
};

module.exports = function (app) {
  return new Dashboard(app);
};
