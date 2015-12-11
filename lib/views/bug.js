'use strict';

var tpl = require('../template.js');
var utils = require('../utils.js');

module.exports = function(ctx) {
  return tpl.read('/views/bug.tpl').then(function(template) {
    ctx.app.header(ctx.bug.id);
    var bug = utils.render(template, {
      '.title': ctx.bug.summary,
      '.commentsLink-href': '/bug/' + ctx.params.id,
      '.detailsLink-href': '/bug/' + ctx.params.id + '/details/'
    });

    if (ctx.path.endsWith('/details/')) {
      bug.querySelector('#bugNav').dataset.section = 'details';
    } else {
      bug.querySelector('#bugNav').dataset.section = 'comments';
    }
    return bug;
  });
};
