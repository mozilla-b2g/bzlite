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
    row.querySelector('a').href = '/bug/' + id;
    ul.appendChild(row);
  });
}

module.exports = function(ctx) {

  var app = ctx.app;

  document.body.dataset.region = 'dashboard';

  var tpls = [
    tpl.readDom('#dashboard-tpl'),
    tpl.readDom('#dashboard-row-tpl'),
  ];

  return Promise.all(tpls).then(function(result) {

    var form = result[0];
    var tpl = result[1];

    function fillDashboard(bugs) {
      var $ = document.querySelector.bind(document);
      fillSection(ctx, $('#assignedBugs'), tpl, 'assigned', bugs[0]);
      fillSection(ctx, $('#flaggedBugs'), tpl, 'flagged', bugs[1]);
      fillSection(ctx, $('#flagBugs'), tpl, 'flags', bugs[2]);
    }

    bugs.loadDashboard(app.bugzilla, app.user.name).then(function(bugs) {
      fillDashboard(bugs);
    });

    return form;
  });
};
