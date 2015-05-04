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


function filterFlags(flagged) {
  var userShown = flagged ? 'setter' : 'requestee';
  var userSet = flagged ? 'requestee' : 'setter';
  return function(bugs, ctx) {
    var flags = [];
    bugs.forEach(function(bug) {
      if (bug.flags) {
        bug.flags.forEach(function(flag) {
          if (flag.status === '?' && flag[userSet] === ctx.app.user.name) {
            flags.push({
              id: bug.id,
              '.id': bug.id,
              '.lastChanged': timeago(bug.last_change_time),
              '.summary': bug.summary,
              '.flaguser': flag[userShown],
              '.flagtype': flag.name
            });
          }
        });
      }
    });
    return [];//flags;
  }
}

var process = {
  'flags': filterFlags(),
  'flagged': filterFlags(true)
};

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
  var section = (path.length > 1 && Object.keys(fetch).indexOf(path[2]) !== -1)
    ? path[2] : 'assigned';

  return tpl.read('/views/dashboard.tpl').then(function(form) {

    Promise.all([
      tpl.read('/views/dashboard-row.tpl'),
      fetch[section](ctx.app.bugzilla, ctx.app.user.name)
    ]).then(function(result) {

      var rowTpl = result[0];
      var bugs = result[1];
      var ul = form.querySelector('#bugs');

      bugs.bugs.sort(function(a, b) {
        return new Date(b.last_change_time) - new Date(a.last_change_time);
      });

      var rows;
      if (section in process) {
        rows = process[section](bugs.bugs, ctx);
      } else {
        rows = bugs.bugs.map(function(obj) {
          return {
            id: obj.id,
            '.id': obj.id,
            '.lastChanged': timeago(obj.last_change_time),
            '.summary': obj.summary
          }
        });
      }

      if (!rows.length) {
        var notice = document.createElement('div');
        notice.classList.add('emptyNotice');
        notice.textContent = 'No Bugs';
        ul.appendChild(notice);
      }

      rows.forEach(function(obj) {
        var id = obj.id;
        delete obj.id;
        var row = utils.render(rowTpl, obj);
        row.href = '/bug/' + id;
        ul.appendChild(row);
      });

      form.querySelector('.loading').classList.remove('loading');
    });

    form.querySelector('#dashboardNav').dataset.section = section;

    return form;
  });
};
