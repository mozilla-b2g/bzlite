'use strict';

var timeago = require('timeago');

var tpl = require('../template.js');
var utils = require('../utils.js');

module.exports = function(ctx) {

  return Promise.all([
    tpl.read('/views/bug-comment.tpl'),
    ctx.app.bugzilla.getBugComments(ctx.params.id),
    tpl.read('/views/bug-comments.tpl')
  ]).then(function(results) {

    var row = results[0];
    var comments = results[1].bugs[ctx.params.id];
    var page = results[2];

    var list = page.querySelector('ul#comments');

    list.classList.add('comments');
    comments.comments.forEach(function (comment) {
      if (!comment.text) return;
      list.appendChild(utils.render(row, {
        '.author': comment.author,
        '.created': timeago(comment.creation_time),
        '.comment': comment.text
      }));
    });

    var status = page.querySelector('#status');
    var statusValue = (ctx.bug.status === 'RESOLVED') ?
      ctx.bug.status + ' - ' + ctx.bug.resolution : ctx.bug.status;
    status.value = statusValue;

    var form = page.querySelector('form');
    var comment = page.querySelector('#commentInput');
    var needinfo = page.querySelector('#needinfo');

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

    var submit = page.querySelector('input[type=submit]');

    var remove = function() {
      if (comment.value) {
        submit.removeAttribute('disabled');
      } else {
        submit.setAttribute('disabled', 'disabled');
      }
    };

    form.addEventListener('input', remove);

    var select = page.querySelector('select');

    select.addEventListener('change', function() {
      submit.removeAttribute('disabled');
      form.removeEventListener('input', remove, false);
    });

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      submit.setAttribute('disabled', 'disabled');

      var ops = [];
      var bugDetails = {};
      var bz = ctx.app.bugzilla;

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
