'use strict';

var wd = require('wd');
var assert = require("assert");
var selenium = require('selenium-standalone');
var Promise = require('lie');

var server = require('../lib/server.js');
var instance;

var selenium = require('selenium-standalone');
var browser;

function startSelenium(callback) {
  return new Promise(function(resolve, reject) {
    selenium.install({}, function(err) {
      if (err) {
        return reject(err);
      }
      selenium.start({}, function(err, server) {
        resolve();
      });
    });
  });
}

describe('Basic Tests', function() {

  before(function() {
    return server.init(3035).then(function(_instance) {
      instance = _instance;
    });
  });

  after(function(done) {
    if (instance) {
      instance.close(done);
    }
  });

  beforeEach(function() {
    this.timeout(0);
    return startSelenium().then(function() {
      browser = wd.promiseChainRemote();
      return browser.init({browserName: 'firefox'});
    });
  });

  afterEach(function() {
    return browser.quit();
  });

  it('Test the site is up', function(done) {
    browser.get('http://127.0.0.1:3035', function() {
      browser.title(function(err, title) {
        assert.equal(title, 'LadyBug');
        done();
      });
    });
  })

})
