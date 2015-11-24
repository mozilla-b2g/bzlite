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
    order: 'changeddate desc',
    resolution: '---',
    query_format: 'advanced',
    include_fields: 'summary,id,assigned_to,flags,last_change_time'
  });
}

fetch.filed = function(bz, to) {
  return bz.searchBugs({
    creator: to,
    order: 'changeddate desc',
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
    order: 'changeddate desc',
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
    order: 'changeddate desc',
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
    return flags;
  }
}

var process = {
  'flags': filterFlags(),
  'flagged': filterFlags(true)
};

function hasText(str) {
  return str !== '';
}

function fillSection(ctx, ul, tpl, section, data) {

  data.then(function(result) {

    var rows;
    if (section in process) {
      rows = process[section](result.bugs, ctx);
    } else {
      rows = result.bugs.map(function(obj) {
        return {
          id: obj.id,
          '.id': obj.id,
          '.lastChanged': timeago(obj.last_change_time),
          '.summary': obj.summary
        }
      });
    }

    ul.innerHTML = '';

    if (!rows.length) {
      var notice = document.createElement('div');
      notice.classList.add('emptyNotice');
      notice.textContent = 'No Bugs';
      ul.appendChild(notice);
    }

    rows.forEach(function(obj) {
      var id = obj.id;
      delete obj.id;
      var row = utils.render(tpl, obj);
      row.href = '/bug/' + id;
      ul.appendChild(row);
    });
  });
}


module.exports = function(ctx) {

  var tpls = [
    tpl.read('/views/dashboard.tpl'),
    tpl.read('/views/dashboard-row.tpl')
  ];

  return Promise.all(tpls).then(function(result) {

    var form = result[0];
    var tpl = result[1];

    fillSection(ctx, form.querySelector('#assignedBugs'), tpl, 'assigned',
                fetch.assigned(ctx.app.bugzilla, ctx.app.user.name));
    fillSection(ctx, form.querySelector('#flaggedBugs'), tpl, 'flagged',
                fetch.flagged(ctx.app.bugzilla, ctx.app.user.name));
    fillSection(ctx, form.querySelector('#filedBugs'), tpl, 'filed',
                fetch.filed(ctx.app.bugzilla, ctx.app.user.name));

    document.body.dataset.region = 'dashboard';

    return form;
  });
};
