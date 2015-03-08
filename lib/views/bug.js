'use strict';

var timeago = require('timeago');

var tpl = require('../template.js');
var utils = require('../utils.js');

function ViewBug(app) {
  this.app = app;
};

ViewBug.prototype.render = function(ctx) {
  return Promise.all([
    tpl.read('/views/bug.tpl'),
    tpl.read('/views/bug-comment.tpl'),
    this.app.bugzilla.getBug(ctx.params.id),
    this.app.bugzilla.getBugComments(ctx.params.id)
  ]).then(function(results) {

    var tpl = results[0];
    var row = results[1];
    var bug = results[2];
    var comments = results[3];

    tpl = utils.render(tpl, {
      '.title': bug.id + ' - ' + bug.summary,
      '.status': bug.status,
      '.assigned': bug.assigned_to.real_name
    });

    var list = tpl.querySelector('.comments')
    comments.comments.forEach(function (comment) {
      list.appendChild(utils.render(row, {
        '.author': comment.creator.name,
        '.created': timeago(comment.creation_time),
        '.comment': comment.text
      }));
    });

    return tpl;
  });
};

module.exports = function (app) {
  return new ViewBug(app);
};
