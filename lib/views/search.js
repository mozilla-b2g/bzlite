'use strict';

var tpl = require('../template.js');

var currentSearch = null;
var template;
var app;

function search(str) {

  var wrapper = document.body.querySelector('div.bugs');
  wrapper.classList.remove('loading');
  wrapper.innerHTML = '';

  var id = Date.now();
  currentSearch = id;

  if (!str) {
    return;
  }

  var searchStr = [];
  var terms = str.split(',');
  var search = {
    short_desc_type: 'allwordssubstr',
    include_fields: 'summary,id',
    limit: 50
  };

  terms.forEach(function(term) {
    var parts = term.split(':');
    if (parts.length === 1) {
      return searchStr.push(parts[0]);
    }
    var key = parts.shift();
    var val = parts.join(':');
    if (key === 'component') {
      search.component = val;
    }
  });

  if (searchStr.length) {
    search.quicksearch = searchStr.join(' ');
  }

  // If we are search for a bug number specifically (only numbers)
  // then include closed bugs, otherwise we only want open ones
  if (isNaN(str)) {
    search.resolution = '---';
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
  app.header('Search');

  return tpl.readDom('#search-tpl').then((function(_template) {
    template = _template;

    var input = template.querySelector('input[type=search]');
    input.addEventListener('input', function() {
      search(input.value);
    });

    if (ctx.params.search) {
      input.value = ctx.params.search;
      search(input.value);
    }
    template.querySelector('#cleanSearch')
      .addEventListener('click', function() {
      input.value = '';
    });

    return template;
  }).bind(ctx));
};
