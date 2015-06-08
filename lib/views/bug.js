'use strict';

var tpl = require('../template.js');
var utils = require('../utils.js');

module.exports = function(ctx) {
  return tpl.read('/views/bug.tpl').then(function(template) {
    var bug = utils.render(template, {
      '.id': ctx.bug.id,
      '.title': ctx.bug.id + ' - ' + ctx.bug.summary,
      '.commentsLink-href': '/bug/' + ctx.params.id,
      '.detailsLink-href': '/bug/' + ctx.params.id + '/details/',
      '.attachLink-href': '/bug/' + ctx.params.id + '/attachments/'
    });

    if (ctx.path.endsWith('/details/')) {
      bug.querySelector('#bugNav').dataset.section = 'details';
    } else if (ctx.path.endsWith('/attachments/')) {
      bug.querySelector('#bugNav').dataset.section = 'attachments';
    } else {
      bug.querySelector('#bugNav').dataset.section = 'comments';
    }
    return bug;
  });
};
