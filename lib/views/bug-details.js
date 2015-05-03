'use strict';

var timeago = require('timeago');

var tpl = require('../template.js');
var utils = require('../utils.js');

function bugLinkArray(arr) {
  var frag = document.createDocumentFragment();
  if (arr) {
    arr.forEach(function(bug) {
      var link = document.createElement('a');
      link.href = '/bug/' + bug;
      link.textContent = bug;
      frag.appendChild(link);
    });
  }
  return frag;
};

module.exports = function(ctx) {
  return tpl.read('/views/bug-details.tpl').then(function(template) {

    template.querySelector('.dependson span')
      .appendChild(bugLinkArray(ctx.bug.depends_on));

    template.querySelector('.blocks span')
      .appendChild(bugLinkArray(ctx.bug.blocks));

    return utils.render(template, {
      '.filedon span': timeago(ctx.bug.creation_time),
      '.filedby span': ctx.bug.creator,
      '.lastmodified span': timeago(ctx.bug.last_change_time),
      '.status span': ctx.bug.status,
      '.resolution span': ctx.bug.resolution
    });
  });
};
