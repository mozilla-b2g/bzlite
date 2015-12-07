'use strict';

var timeago = require('timeago');
var tpl = require('../template.js');
var utils = require('../utils.js');

var bugs = require('../bugs');

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
              '.lastChanged': timeago(flag.modification_date),
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

function fillSection(ctx, ul, tpl, section, result) {
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
}


module.exports = function(ctx) {

  var tpls = [
    tpl.read('/views/dashboard.tpl'),
    tpl.read('/views/dashboard-row.tpl'),
    bugs.loadDashboard(ctx.app.bugzilla, ctx.app.user.name)
  ];

  return Promise.all(tpls).then(function(result) {

    var form = result[0];
    var tpl = result[1];
    var bugs = result[2];
    var $ = form.querySelector.bind(form);

    fillSection(ctx, $('#assignedBugs'), tpl, 'assigned', bugs[0]);
    fillSection(ctx, $('#flaggedBugs'), tpl, 'flagged', bugs[1]);
    fillSection(ctx, $('#flagBugs'), tpl, 'flags', bugs[2]);

    document.body.dataset.region = 'dashboard';

    return form;
  });
};
