'use strict';

var timeago = require('timeago');

var tpl = require('../template.js');
var utils = require('../utils.js');

var fetch = {};

fetch.assigned = function(bz, to) {
  return bz.searchBugs({
    j_top: 'OR',
    f1:'assigned_to',
    v1: to,
    o1: 'equals',
    order: 'Last Changed',
    resolution: '---',
    query_format: 'advanced',
    include_fields: 'summary,id,assigned_to,flags,last_change_time'
  });
}

fetch.filed = function(bz, to) {
  return bz.searchBugs({
    creator: to,
    order: 'Last Changed',
    resolution: '---',
    include_fields: 'summary,id,assigned_to,flags,last_change_time',
    limit: 20,
  });
}

fetch.flagged = function(bz, to) {
  return bz.searchBugs({
    j_top: 'OR',
    f1:'requestees.login_name',
    v1: to,
    o1: 'equals',
    order: 'Last Changed',
    resolution: '---',
    query_format: 'advanced',
    include_fields: 'summary,id,assigned_to,flags,last_change_time'
  });
}

fetch.flags = function(bz, to) {
  return bz.searchBugs({
    j_top: 'OR',
    f1:'setters.login_name',
    v1: to,
    o1: 'equals',
    order: 'Last Changed',
    resolution: '---',
    query_format: 'advanced',
    include_fields: 'summary,id,assigned_to,flags,last_change_time'
  });
}

module.exports = function(ctx) {

  var path = ctx.path.trim('/').split('/');
  var fun = (path.length > 1 &&
             Object.keys(fetch).indexOf(path[2]) !== -1) ? path[2] : 'assigned';

  return tpl.read('/views/dashboard.tpl').then(function(form) {

    Promise.all([
      tpl.read('/views/dashboard-row.tpl'),
      fetch[fun](ctx.app.bugzilla, ctx.app.user.name)
    ]).then(function(result) {

      var rowTpl = result[0];
      var bugs = result[1];
      var ul = form.querySelector('#bugs');

      bugs.bugs.sort(function(a, b) {
        return new Date(b.last_change_time) - new Date(a.last_change_time);
      });

      bugs.bugs.forEach(function(obj) {
        var row = utils.render(rowTpl, {
          '.id': obj.id,
          '.lastChanged': timeago(obj.last_change_time),
          '.summary': obj.summary
        });
        row.href = '/bug/' + obj.id;
        ul.appendChild(row);
      });

      form.querySelector('.loading').classList.remove('loading');
    });

    return form;
  });
};
