'use strict';

var path = require('path');
var fs = require('fs');

var express = require('express');

//var WEB_ROOT = path.resolve(__dirname, '/../public');
var WEB_ROOT = __dirname + '/../public';

var app = express();

app.use(express.static(WEB_ROOT));

app.get('*', function(req, res) {
  res.header('Content-Type', 'text/html');
  res.send(fs.readFileSync(WEB_ROOT + '/index.html'));
});

app.listen(3000);
