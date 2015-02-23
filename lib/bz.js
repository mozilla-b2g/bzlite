'use strict';

var request = require('request');
var Promise = global.Promise || require('lie');

var API_URL = 'https://bugzilla.mozilla.org/bzapi';
var TEST_API_URL = 'https://bugzilla-dev.allizom.org/bzapi';

function Bz(opts) {

  if (opts.username && opts.password) {
    this.username = opts.username;
    this.password = opts.password;
  }

  if (opts.apiKey) {
    this.apiKey = opts.apiKey;
  }

  this.apiUrl = opts.url || (opts.test ? TEST_API_URL : API_URL);
}

Bz.prototype.request = function(method, url, data, params) {

  var opts = {
    url: this.apiUrl + url,
    qs: params || {},
    method: method || 'GET',
    headers: {},
    json: true,
    processData: true,
    body: data || null
  };

  if (this.token) {
    opts.qs.token = this.token;
  } else if (this.username && this.password) {
    opts.qs.username = this.username;
    opts.qs.password = this.password;
  } else if (this.apiKey) {
    opts.qs.api_key = this.apiKey;
  }

  return new Promise((function(resolve, reject) {
    request(opts, function(err, response, body) {
      if (err) {
        console.error(err);
        return reject(err);
      }
      return resolve(body);
    });
  }).bind(this));
};

// Bugs
Bz.prototype.getBug = function(id) {
  return this.request('GET', '/bug/' + id);
};

Bz.prototype.createBug = function(bug) {
  return this.request('POST', '/bug', bug);
};

Bz.prototype.searchBugs = function(opts) {
  return this.request('GET', '/bug', null, opts);
};

Bz.prototype.getBugComments = function(id) {
  return this.request('GET', '/bug/' + id + '/comment');
};

// User
Bz.prototype.login = function(opts) {
  return this.request('GET', '/login', null, opts).then(function(res) {
    this.token = res.token;
    return res;
  }.bind(this));
};

Bz.prototype.validLogin = function(opts) {
  return this.request('GET', '/valid_login', null, opts).then(function(res) {
    this.token = opts.token;
    return res;
  }.bind(this));
};

Bz.prototype.logout = function() {
  var token = this.token;
  this.token = null;
  this.username = null;
  this.password = null;
  return this.request('GET', '/logout', null, {token: this.token});
};

// Products
Bz.prototype.getProducts = function() {
  return this.request('GET', '/rest/product_accessible');
};

// Attachments
Bz.prototype.createAttachment = function (id, data) {
  return this.request('POST', '/bug/' + id + '/attachment', data);
};

module.exports.createClient = function(opts) {
  return new Bz(opts);
};

