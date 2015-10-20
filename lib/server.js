'use strict';

var crypto = require('crypto');
var path = require('path');
var fs = require('fs');
var Promise = require('lie');
var jsonParser = require('body-parser').json({limit: '1mb'});

var conf = require('./config.js');
var express = require('express');

var WEB_ROOT = __dirname + '/../public';

var app = express();
var secrets = {};

app.get('/manifest.webapp', function(req, res) {
  res.header('Content-Type', 'application/x-web-app-manifest+json');
  var json = JSON.parse(fs.readFileSync(__dirname + '/../manifest.webapp'))
  if (conf.version === 1) {
    json.launch_path = '/create/';
  }
  res.end(JSON.stringify(json));
});

app.use(function (req, res, next) {
  res.header('Expires', new Date().toUTCString());
  res.header('Cache-Control', 'no-cache');
  next();
});

app.post('/bz_auth/', jsonParser, function(req, res) {
  var secretKey = crypto.randomBytes(20).toString('hex');
  secrets[secretKey] = {
    key: req.body.client_api_key,
    login: req.body.client_api_login
  };
  res.header('Content-Type', 'application/json');
  res.end(JSON.stringify({result: secretKey}));
});

app.get('/fetch_login/', function(req, res) {
  res.header('Content-Type', 'application/json');
  var secret = req.params.secret;
  if (secret in secrets) {
    res.end(JSON.stringify(secrets[secret]));
    delete secrets[secret];
  } else {
    res.end(JSON.stringify({error: true}));
  }
});

app.use(express.static(WEB_ROOT, {
  etag: false
}));

app.get('*', function(req, res) {
  res.header('Content-Type', 'text/html');
  res.send(fs.readFileSync(WEB_ROOT + '/index.html'));
});

exports.init = function(port) {
  return new Promise(function(resolve) {
    var server = app.listen(port, function() {
      resolve(server);
    });
  });
};

if (require.main === module) {
  exports.init(process.env.PORT || 3000);
}
