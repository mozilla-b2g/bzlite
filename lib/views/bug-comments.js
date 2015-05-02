'use strict';

var timeago = require('timeago');

var tpl = require('../template.js');
var utils = require('../utils.js');

module.exports = function(ctx) {
  document.querySelector('h5.commentsLink').classList.add('active');
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

    var form = page.querySelector('form');
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      ctx.app.bugzilla.createComment({
        id: ctx.params.id,
        comment: page.querySelector('textarea').value
      }).then(function() {
        ctx.app.page('/bug/' + ctx.params.id);
      });
    });

    return page;
  });
};
