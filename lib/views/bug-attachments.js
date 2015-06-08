'use strict';

var timeago = require('timeago');

var tpl = require('../template.js');
var utils = require('../utils.js');

module.exports = function(ctx) {
  var template = document.createElement('ul');
  template.classList.add('attachmentView');
  return ctx.app.bugzilla.getAttachments(ctx.params.id).then(function(res) {
    var attachments = res.bugs[ctx.params.id];
    if (!attachments.length) {
      var notice = document.createElement('div');
      notice.classList.add('emptyNotice');
      notice.textContent = 'No Attachments';
      return notice;
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
