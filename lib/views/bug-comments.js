'use strict';

var timeago = require('timeago');

var tpl = require('../template.js');
var utils = require('../utils.js');
var bugs = require('../bugs');
var cache = require('../pouch-promise-cache');
var debounce = require('../debounce');

var processComment = require('../process-comment.js');

function describeChange(who, change) {
  if (change.field_name === 'status') {
    return 'changed status to ' + change.added;
  }
  if (change.field_name === 'assigned_to' && change.added === who) {
    return 'assigned bug to themselves';
  }
  if (change.field_name === 'assigned_to') {
    return 'assigned bug to ' + change.added;
  }
  if (change.field_name === 'cc' && change.added === who) {
    return 'cc\'d themselves';
  }
  if (change.field_name === 'cc' && change.added) {
    return 'cc\'d ' + change.added;
  }
  if (change.field_name === 'blocks' && change.added) {
    return 'set <a href="/bug/' + change.added + '/">Bug ' + change.added + '</a>' +
      ' as a blocker';
  }
  if (change.field_name && change.added) {
    return 'added ' + change.added + ' as ' + change.field_name;
  }
  if (change.field_name && change.removed) {
    return 'removed ' + change.removed + ' as ' + change.field_name;
  }
  console.warning('Change not recognised', change);
  return 'did something';
}

module.exports = function(ctx) {

  return Promise.all([
    tpl.read('/views/bug-comment.tpl'),
    ctx.app.bugzilla.getBugComments(ctx.params.id),
    tpl.read('/views/bug-comments.tpl'),
    ctx.app.bugzilla.getBugHistory(ctx.params.id)
  ]).then(function(results) {

    var row = results[0];
    var comments = results[1].bugs[ctx.params.id].comments;
    var page = results[2];
    var history = results[3].bugs[0].history;

    var both = history.concat(comments).sort(function (a, b) {
      return new Date(a.when || a.creation_time) -
        new Date(b.when || b.creation_time);
    });

    var list = page.querySelector('ul#comments');

    list.classList.add('comments');
    both.forEach(function (comment) {
      if (comment.text) {
        list.appendChild(utils.render(row, {
          '.author': comment.author,
          '.created': timeago(comment.creation_time),
          '.comment-html': processComment(comment.text.trim())
        }));
      } else if (comment.changes) {
        var desc = comment.changes
          .map(describeChange.bind(this, comment.who)).join(', ');
        var el = document.createElement('li');
        el.classList.add('bugDetail');
        el.innerHTML = comment.who + ' ' + desc + ' '  + timeago(comment.when);
        list.appendChild(el);
      }
    });

    var flags = ctx.bug.flags.reduce(function(acc, flag) {
      if (flag.name !== 'needinfo') {
        return acc;
      }
      if (!(flag.requestee in acc)) {
        acc[flag.requestee] = [];
      }
      acc[flag.requestee].push(flag.id);
      return acc;
    }, {});

    var needinfos = page.querySelector('#needinfos');
    Object.keys(flags).forEach(function(flag) {
      var str = '<label><input type="checkbox" name="needinfo" />' +
        '<span></span></label>';
      var values = {'span': 'Clear needinfo for ' + flag, 'input-value': flag};
      if (flag === ctx.app.user.name) {
        values['input-checked'] = 'checked';
      }
      needinfos.appendChild(utils.render(str, values));
    });

    var status = page.querySelector('#status');
    var duplicateId = page.querySelector('#duplicateId');
    var statusValue = (ctx.bug.status === 'RESOLVED') ?
      ctx.bug.status + ' - ' + ctx.bug.resolution : ctx.bug.status;

    var openStatus = ['UNCONFIRMED', 'ASSIGNED', 'NEW'];
    var closeStatus = ['REOPENED', 'VERIFIED'];
    var commonStatus = ['RESOLVED - FIXED', 'RESOLVED - INVALID',
                        'RESOLVED - WONTFIX', 'RESOLVED - INCOMPLETE',
                        'RESOLVED - DUPLICATE'];

    var statusList = (ctx.bug.status === 'RESOLVED') ? closeStatus : openStatus;
    statusList = statusList.concat(commonStatus);
    // Ensure the current status is in the list so we can show it event if it
    // is not valid to change to
    if (statusList.indexOf(statusValue) === -1) {
      statusList.push(statusValue);
    }
    statusList.forEach(function(val) {
      var opt = document.createElement('option');
      opt.innerText = val;
      status.appendChild(opt);
    });
    status.value = statusValue;

    status.addEventListener('change', function() {
      if (status.value === 'RESOLVED - DUPLICATE') {
        duplicateId.removeAttribute('hidden');
      } else {
        duplicateId.setAttribute('hidden', true);
      }
    });

    var currentResults = [];
    var userListChanged = debounce(function(e) {
      var str = e.target.value;
      // Avoid repopulating the results if the user selects a
      // current result
      if (currentResults.indexOf(str) !== -1) {
        return;
      }
      matchUsers(str).then(function(results) {
        var wrapper = document.createDocumentFragment();
        currentResults = [];
        results.users.forEach(function(user) {
          var option = document.createElement('option');
          var name = user.real_name ?
            user.real_name + ' (' + user.email + ')' : user.email;
          option.innerText = name;
          option.value = user.email;
          wrapper.appendChild(option);
          currentResults.push(user.email);
        });
        usersList.innerHTML = '';
        usersList.appendChild(wrapper);
      });
    }, 200);

    var form = page.querySelector('form');
    var comment = page.querySelector('#commentInput');
    var needinfo = page.querySelector('#needinfo');
    var usersList = page.querySelector('#usersList');

    var assigned = page.querySelector('#assigned');
    if (ctx.bug.assigned_to === 'nobody@mozilla.org') {
      ctx.bug.assigned_to = '';
    }
    assigned.value = ctx.bug.assigned_to;
    assigned.addEventListener('input', userListChanged);

    var take = page.querySelector('#take');
    if (ctx.bug.assigned_to) {
      take.value = 'Reset';
    }
    take.addEventListener('click', function() {
      if (ctx.bug.assigned_to) {
        assigned.value = 'nobody';
      } else {
        assigned.value = ctx.app.user.name;
      }
      // Setting value wont trigger input event, do it manually
      var evt = document.createEvent("HTMLEvents");
      evt.initEvent('input', true, true );
      take.dispatchEvent(evt);
    });

    var matchUsers = cache(ctx.app.bugzilla.matchUsers.bind(ctx.app.bugzilla));
    needinfo.addEventListener('input', userListChanged);

    var submit = page.querySelector('input[type=submit]');
    var remove = debounce(function() {
      var ops = getChanges(ctx.app.bugzilla);
      if (ops.length) {
        submit.removeAttribute('disabled');
      } else {
        submit.setAttribute('disabled', 'disabled');
      }
    }, 200);
    form.addEventListener('change', remove);
    form.addEventListener('input', remove);

    function getChanges(bz) {

      var ops = [];
      var flagChanges = [];
      var bugDetails = {};

      if (comment.value) {
        ops.push(bz.createComment.bind(bz, {
          id: ctx.params.id,
          comment: comment.value
        }));
      }

      if (assigned.value !== ctx.bug.assigned_to) {
        if (assigned.value === 'nobody') {
          bugDetails.reset_assigned_to = true;
        } else {
          bugDetails.assigned_to = assigned.value;
        }
      }

      if (status.value !== ctx.bug.status) {
        if (/RESOLVED/.test(status.value)) {
          var parts = status.value.split('-');
          bugDetails.status = parts[0].trim();
          bugDetails.resolution = parts[1].trim();
        } else {
          bugDetails.status = status.value;
        }
      }

      if (needinfo.value) {
        bugDetails.flags = [{
          name: 'needinfo',
          new: true,
          status: '?',
          requestee: needinfo.value
        }];
      }

      if (duplicateId.value) {
        bugDetails.dupe_of = duplicateId.value;
      }

      var els = page.querySelectorAll('input[name=needinfo]:checked');
      Array.prototype.forEach.call(els, function(el) {
        flags[el.value].forEach(function(id) {
          flagChanges.push({id: id, status: 'X'});
        });
      });

      if (flagChanges.length) {
        bugDetails.flags = flagChanges;
      }

      if (Object.keys(bugDetails).length) {
        ops.push(bz.updateBug.bind(bz, ctx.params.id, bugDetails));
      }

      return ops;
    }

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      submit.setAttribute('disabled', 'disabled');

      var ops = getChanges(ctx.app.bugzilla);

      if (!ops.length) {
        submit.removeAttribute('disabled');
        return;
      }

      ops.reduce(function(cur, next) {
        return cur.then(next);
      }, Promise.resolve()).then(function() {
        bugs.bugUpdated(ctx.app.bugzilla, ctx.app.user.name, ctx.params.id);
        ctx.app.page('/bug/' + ctx.params.id);
      }).catch(function (err) {
        if (err.message) {
          alert(err.message);
        }
        ctx.app.page('/bug/' + ctx.params.id);
      });
    });

    return page;
  });
};
