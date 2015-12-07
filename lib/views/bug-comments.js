'use strict';

var timeago = require('timeago');

var tpl = require('../template.js');
var utils = require('../utils.js');
var bugs = require('../bugs');
var cache = require('../pouch-promise-cache');
var debounce = require('../debounce');

function describeChange(who, change) {
  if (change.field_name === 'cc' && change.added === who) {
    return 'cc\'d themselves';
  } else if (change.field_name === 'blocks' && change.added) {
    return 'set <a href="/bug/' + change.added + '/">Bug ' + change.added + '</a>' +
      ' as a blocker';
  } else if (change.field_name && change.added) {
    return 'added ' + change.added + ' as ' + change.field_name;
  } else if (change.field_name && change.removed) {
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
          '.comment': comment.text
        }));
      } else if (comment.changes) {
        var desc = comment.changes
          .map(describeChange.bind(this, comment.who)).join(', ');
        var el = document.createElement('div');
        el.classList.add('bugDetail');
        el.innerHTML = comment.who + ' ' + desc + ' '  + timeago(comment.when);
        list.appendChild(el);
      }
    });

    var status = page.querySelector('#status');
    var statusValue = (ctx.bug.status === 'RESOLVED') ?
      ctx.bug.status + ' - ' + ctx.bug.resolution : ctx.bug.status;
    status.value = statusValue;

    var form = page.querySelector('form');
    var comment = page.querySelector('#commentInput');
    var needinfo = page.querySelector('#needinfo');
    var usersList = page.querySelector('#usersList');

    var assigned = page.querySelector('#assigned');
    assigned.value = ctx.bug.assigned_to;

    var take = page.querySelector('#take');
    if (ctx.bug.assigned_to === ctx.app.user.name) {
      take.setAttribute('disabled', 'disabled');
    } else {
      take.addEventListener('click', function() {
        take.setAttribute('disabled', 'disabled');
        var msg = 'Are you sure you want to assign yourself to this bug?';
        if (confirm(msg)) {
          ctx.app.bugzilla.updateBug(ctx.params.id, {
            assigned_to: ctx.app.user.name
          }).then(function() {
            assigned.value = ctx.app.user.name;
          }).catch(function(e) {
            if (e.message) {
              alert(e.message);
            }
            take.removeAttribute('disabled');
          });
        }
      });
    }

    var needInfoChanged = function() {
      matchUsers(needinfo.value).then(function(results) {
        var wrapper = document.createDocumentFragment();
        results.users.forEach(function(user) {
          var option = document.createElement('option');
          var name = user.real_name ?
            user.real_name + ' (' + user.email + ')' : user.email;
          option.innerText = name;
          option.value = user.email;
          wrapper.appendChild(option);
        });
        usersList.innerHTML = '';
        usersList.appendChild(wrapper);
      });
    };

    var matchUsers = cache(ctx.app.bugzilla.matchUsers.bind(ctx.app.bugzilla));
    needinfo.addEventListener('input', debounce(needInfoChanged, 200));

    var submit = page.querySelector('input[type=submit]');
    var remove = submit.removeAttribute.bind(submit, 'disabled');
    form.addEventListener('change', remove);
    form.addEventListener('input', remove);

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      submit.setAttribute('disabled', 'disabled');

      var ops = [];
      var bugDetails = {};
      var bz = ctx.app.bugzilla;

      bugs.bugUpdated(bz, ctx.app.user.name, ctx.params.id);

      if (comment.value) {
        ops.push(bz.createComment.bind(bz, {
          id: ctx.params.id,
          comment: comment.value
        }));
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

      if (Object.keys(bugDetails).length) {
        ops.push(bz.updateBug.bind(bz, ctx.params.id, bugDetails));
      }

      ops.reduce(function(cur, next) {
        return cur.then(next);
      }, Promise.resolve()).then(function() {
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
