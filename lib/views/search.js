'use strict';

var tpl = require('../template.js');

var currentSearch = null;
var template;
var app;

function search(str) {

  var wrapper = template.querySelector('div.bugs');
  wrapper.classList.remove('loading');
  wrapper.innerHTML = '';

  var id = Date.now();
  currentSearch = id;

  if (!str) {
    return;
  }

  var search = {
    quicksearch: str,
    short_desc_type: 'allwordssubstr',
    include_fields: 'summary,id',
    limit: 20
  }

  wrapper.classList.add('loading');
  app.bugzilla.searchBugs(search).then(function(results) {

    // Ugly, we should really cancel previous requests
    if (id !== currentSearch) {
      return;
    }
    wrapper.classList.remove('loading');
    if (!results.bugs.length) {
      wrapper.innerHTML = 'No bugs :(';
      return;
    }

    results.bugs.map(function(obj) {
      var link = document.createElement('a');
      link.textContent = obj.id + ' - ' + obj.summary;
      link.href = '/bug/' + obj.id;
      wrapper.appendChild(link);
    });
  }).catch(function(err) {
    wrapper.classList.remove('loading');
    console.log('THERE WAS AN ERROR!');
    console.log(err);
  });
};

module.exports = function(ctx) {
  app = ctx.app;
  return tpl.read('/views/search.tpl').then((function(_template) {
    template = _template;

    var input = template.querySelector('input[type=search]');
    input.addEventListener('input', function() {
      search(input.value);
    });

    if (ctx.params.search) {
      input.value = ctx.params.search;
      search(input.value);
    }

    setTimeout(input.focus.bind(input), 0);

    return template;
  }).bind(ctx));
};
