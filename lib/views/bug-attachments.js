'use strict';

var timeago = require('timeago');

var tpl = require('../template.js');
var utils = require('../utils.js');

function BugAttachments(app) {
  this.app = app;
};

BugAttachments.prototype.render = function(ctx) {
  var template = document.createElement('ul');
  return this.app.bugzilla.getAttachments(ctx.params.id).then(function(res) {
    var attachments = res.bugs[ctx.params.id];
    if (!attachments.length) {
      template.innerHTML = '<h2>No Attachments</h2>';
      return template;
    }
    tpl.read('/views/view-attachment-row.tpl').then(function(row) {
      var frag = document.createDocumentFragment();
      attachments.forEach(function(attachment) {
        frag.appendChild(utils.render(row, {
          '.name': attachment.description
        }));
      });
      template.innerHTML = '';
      template.appendChild(frag);
    });
    return template;
  });
};

module.exports = function (app) {
  return new BugAttachments(app);
};
