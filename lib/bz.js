'use strict';

var request = require('request');
var Promise = global.Promise || require('lie');

var API_URL = 'https://bugzilla.mozilla.org/rest';

function Bz(opts) {

  opts = opts || {};

  if (opts.username && opts.password) {
    this.username = opts.username;
    this.password = opts.password;
  }

  if (opts.apiKey) {
    this.apiKey = opts.apiKey;
  }

  this.apiUrl = opts.url || process.env.BZ_URL || API_URL;
}

Bz.prototype.request = function(method, path, data, params) {
  return this.req(path, {
    qs: params || {},
    method: method || 'GET',
    body: data || null
  });
};

Bz.prototype.req = function(path, opts) {

  opts.url = this.apiUrl + path;
  opts.method = opts.method || 'GET';
  opts.headers = opts.headers || {};

  opts.json = true;
  opts.processData = true;

  if (this.token) {
    opts.headers['X-BUGZILLA-TOKEN'] = this.token;
  } else if (this.username && this.password) {
    opts.headers['X-BUGZILLA-LOGIN'] = this.username;
    opts.headers['X-BUGZILLA-PASSWORD'] = this.password;
  } else if (this.apiKey) {
    opts.headers['X-BUGZILLA-API-KEY'] = this.apiKey;
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
}

// Bugs
Bz.prototype.getBug = function(id) {
  return this.request('GET', '/bug/' + id);
};

Bz.prototype.createBug = function(bug) {
  return this.request('POST', '/bug', bug);
};

Bz.prototype.updateBug = function(id, opts) {
  return this.request('PUT', '/bug/' + id, opts);
};

Bz.prototype.searchBugs = function(opts) {
  return this.request('GET', '/bug', null, opts);
};

Bz.prototype.getBugComments = function(id) {
  return this.request('GET', '/bug/' + id + '/comment');
};

Bz.prototype.getBugHistory = function(id) {
  return this.request('GET', '/bug/' + id + '/history');
};

Bz.prototype.createComment = function(opts) {
  return this.request('POST', '/bug/' + opts.id + '/comment', opts);
};

// User
Bz.prototype.login = function(opts) {
  var headers = {
    'X-BUGZILLA-LOGIN': opts.login,
    'X-BUGZILLA-PASSWORD': opts.password
  };
  return this.req('/login', {headers: headers}).then(function(res) {
    this.token = res.token;
    return res;
  }.bind(this));
};

Bz.prototype.validLogin = function(opts) {
  var reqOpts = {qs: {login: opts.login}, headers: {}};
  var header = opts.token ? 'X-BUGZILLA-TOKEN' : 'X-BUGZILLA-API-KEY';
  reqOpts.headers[header] = opts.token || opts.key;

  return this.req('/valid_login', reqOpts).then(function(res) {
    var field = opts.token ? 'token' : 'apiKey';
    this[field] = opts.token || opts.key;
    return res;
  }.bind(this));
};

Bz.prototype.logout = function() {
  var token = this.token;
  this.token = null;
  this.username = null;
  this.password = null;
  return this.request('GET', '/logout', null, {token: token});
};

Bz.prototype.matchUsers = function(str) {
  return this.request('GET', '/user', null, {match: str});
};

// Products
Bz.prototype.getProducts = function(opts) {
  return this.request('GET', '/product', null, opts);
};

// Attachments
Bz.prototype.getAttachments = function(id) {
  return this.request('GET', '/bug/' + id + '/attachment');
};

Bz.prototype.createAttachment = function (id, data) {
  return this.request('POST', '/bug/' + id + '/attachment', data);
};

module.exports.createClient = function(opts) {
  return new Bz(opts);
};

