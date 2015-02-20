'use strict';

var timeago = require('timeago');

var tpl = require('../template.js');

function ViewBug(app) {
  this.app = app;
};

ViewBug.prototype.render = function(ctx) {
  return Promise.all([
    tpl.read('/views/bug.tpl'),
    this.app.bugzilla.getBug(ctx.params.id),
    this.app.bugzilla.getBugComments(ctx.params.id)
  ]).then(function(results) {
    var tpl = results[0];
    var bug = results[1];
    var comments = results[2];

    tpl.querySelector('.title').textContent = bug.id + ' - ' + bug.summary;
    tpl.querySelector('.status').textContent = bug.status;
    tpl.querySelector('.assigned').textContent = bug.assigned_to.real_name;

    var list = tpl.querySelector('.comments')

    comments.comments.forEach(function (comment) {
      var li = document.createElement('li');
      var header = document.createElement('div');
      var created = document.createElement('span');
      var author = document.createElement('span');
      var commentText = document.createElement('p');
      author.textContent = comment.creator.name;
      created.textContent = timeago(comment.creation_time);
      commentText.textContent = comment.text;
      header.appendChild(author);
      header.appendChild(created);
      li.appendChild(header);
      li.appendChild(commentText);
      list.appendChild(li);
    });

    return tpl;
  });
};

module.exports = function (app) {
  return new ViewBug(app);
};
