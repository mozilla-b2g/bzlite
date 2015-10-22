'use strict';

var wd = require('wd');
var assert = require("assert");
var selenium = require('selenium-standalone');
var Promise = require('lie');

var server = require('../lib/server.js');
var instance;

var selenium = require('selenium-standalone');

var USER = 'dale+bzlite@arandomurl.com';
var PASS = 'eU3uBeZzamm4';

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

function $(selector) {
  return browser.waitForElementByCss(selector, 5000);
}

function pause() {
  return new Promise(function (resolve) {
    setTimeout(resolve, 5000);
  });
}

function login() {
  return $('[type="email"]').then(function (el) {
    el.type(USER);
    return $('[type="password"]');
  }).then(function (el) {
    el.type(PASS);
    return $('[type="submit"]');
  }).then(function (el) {
    el.click();
    return $('.profile');
  }).then(function (el) {
    assert(el.isDisplayed());
  });
}

describe('Basic Tests', function() {

  before(function() {
    this.timeout(0);
    return server.init(3035).then(function(_instance) {
      instance = _instance;
      return startSelenium();
    }).then(function() {
      browser = wd.promiseChainRemote();
      return browser.init({browserName: 'firefox'});
    });
  });

  after(function(done) {
    browser.quit().then(function () {
      if (instance) {
        instance.close(done);
      }
    });
  });

  beforeEach(function() {
    return browser.get('http://127.0.0.1:3035');
  });

  it('Test basic create a bug flow', function() {

    this.timeout(0);

    return browser.title().then(function(title) {
      assert.equal(title, 'Bugzilla Lite');
      return login();

      // Create a new bug
    }).then(function() {
      return $('[href="/create/"]');
    }).then(function(createLink) {
      createLink.click();
      return $('#summary');
    }).then(function(summary) {
      summary.type('Bug Title');
      return $('#description');
    }).then(function(description) {
      description.type('Bug Description');
      return $('#submit');
    }).then(function(submit) {
      submit.click();
      return $('.title');
    }).then(function(title) {
      return title.text();
    }).then(function(titleText) {
      // We successfully posted a bug!
      assert(/Bug Title/.test(titleText));

      // Check that we cannot change the status without permission
      return $('#status option:nth-child(2)');
    }).then(function(statusOption) {
      statusOption.click();
      return $('input[type=submit]');
    }).then(function(submitBtn) {
      submitBtn.click();
      return pause();
    }).then(function() {
      return browser.acceptAlert();
    });

  });

})
