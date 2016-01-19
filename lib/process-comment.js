'use strict';

var linkify = require('html-linkify');

module.exports = function (comment) {
  return linkify(comment)
    .replace(/([bB]ug)\s+(\d+)/g, '<a href="/bug/$2">$1 $2</a>');
}

