'use strict';

var path = require('path');
var fs = require('fs');
var Promise = require('lie');

var express = require('express');

var WEB_ROOT = __dirname + '/../public';

var app = express();

app.use(express.static(WEB_ROOT));

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
