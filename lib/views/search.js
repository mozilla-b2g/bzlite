'use strict';

var tpl = require('../template.js');

function Search(app) {
  this.app = app;
  this.currentSearch = null;
}

Search.prototype.search = function(str) {

  var wrapper = this.template.querySelector('div.bugs');
  wrapper.classList.remove('loading');
  wrapper.innerHTML = '';

  var id = Date.now();
  this.currentSearch = id;

  if (!str) {
    return;
  }

  var search = {
    short_desc: str,
    short_desc_type: 'allwordssubstr',
    resolution: '---',
    include_fields: 'summary,id',
    limit: 20
  }

  wrapper.classList.add('loading');
  this.app.bugzilla.searchBugs(search).then((function(results) {

    // Ugly, we should really cancel previous requests
    if (id !== this.currentSearch) {
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
  }).bind(this)).catch(function(err) {
    wrapper.classList.remove('loading');
    console.log('THERE WAS AN ERROR!');
    console.log(err);
  });
};

Search.prototype.render = function(ctx) {
  return tpl.read('/views/search.tpl').then((function(template) {
    this.template = template;

    var input = template.querySelector('input[type=search]');
    input.addEventListener('input', function() {
      this.search(input.value);
    }.bind(this));

    if (ctx.params.search) {
      input.value = ctx.params.search;
      this.search(input.value);
    }

    return this.template;
  }).bind(this));
};

module.exports = function (app) {
  return new Search(app);
};
