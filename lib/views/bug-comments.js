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
    status.value = ctx.bug.status;

    var form = page.querySelector('form');
    var comment = page.querySelector('#commentInput');
    var needinfo = page.querySelector('#needinfo');

    var assigned = page.querySelector('#assigned');
    assigned.value = ctx.bug.assigned_to;

    page.querySelector('#take').addEventListener('click', function() {
      var msg = 'Are you sure you want to assign yourself to this bug?';
      if (confirm(msg)) {
        assigned.value = ctx.app.user.name;
      }
    });

    var submit = page.querySelector('input[type=submit]');
    var remove = submit.removeAttribute.bind(submit, 'disabled');
    form.addEventListener('change', remove);
    form.addEventListener('input', remove);

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      submit.setAttribute('disabled', 'disabled');

      var ops = [];
      var bugDetails = {};

      if (comment.value) {
        ops.push(ctx.app.bugzilla.createComment({
          id: ctx.params.id,
          comment: comment.value
        }));
      }

      if (status.value !== ctx.bug.status) {
        bugDetails.status = status.value;
      }

      if (assigned.value !== ctx.bug.assigned_to) {
        bugDetails.assigned_to = assigned.value;
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
        ops.push(ctx.app.bugzilla.updateBug(ctx.params.id, bugDetails));
      }

      Promise.all(ops).then(function() {
        ctx.app.page('/bug/' + ctx.params.id);
      });

    });

    return page;
  });
};
