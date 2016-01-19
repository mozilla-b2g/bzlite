'use strict';

var should = require('should');

describe('Unit tests for comments', function() {

  var processComment = require('../../lib/process-comment.js');

  it('Auto link bug numbers', function() {
    processComment('bug 1').should.equal('<a href="/bug/1">bug 1</a>');
  });

})
