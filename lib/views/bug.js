'use strict';

var tpl = require('../template.js');
var utils = require('../utils.js');

function qs(el, selector) {
  return el.querySelector(selector);
}

module.exports = function(ctx) {
  return tpl.read('/views/bug.tpl').then(function(template) {
    var bug = utils.render(template, {
      '.title': ctx.bug.id + ' - ' + ctx.bug.summary,
      '.status': ctx.bug.status,
      '.assigned': ctx.bug.assigned_to.real_name
    });
    qs(bug, '.commentsUrl').href = '/bug/' + ctx.params.id;
    qs(bug, '.detailsUrl').href = '/bug/' + ctx.params.id + '/details/';
    qs(bug, '.attachUrl').href = '/bug/' + ctx.params.id + '/attachments/';
    return bug;
  });
};
