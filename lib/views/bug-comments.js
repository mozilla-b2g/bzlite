'use strict';

var timeago = require('timeago');

var tpl = require('../template.js');
var utils = require('../utils.js');

function BugComments(app) {
  this.app = app;
};

BugComments.prototype.render = function(ctx) {
  return Promise.all([
    tpl.read('/views/bug-comment.tpl'),
    this.app.bugzilla.getBugComments(ctx.params.id)
  ]).then(function(results) {
    var row = results[0];
    var comments = results[1].bugs[ctx.params.id];
    var list = document.createElement('ul');

    list.classList.add('comments');
    comments.comments.forEach(function (comment) {
      if (!comment.text) return;
      list.appendChild(utils.render(row, {
        '.author': comment.author,
        '.created': timeago(comment.creation_time),
        '.comment': comment.text
      }));
    });

    return list;
  });
};

module.exports = function (app) {
  return new BugComments(app);
};

