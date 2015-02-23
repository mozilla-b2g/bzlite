'use strict';

var tpl = require('../template.js');

var manifestUrl = location.href + 'manifest.webapp';

function install() {
  var installReq = navigator.mozApps.install(manifestUrl);
  installReq.onsuccess = function(data) {
    document.location.href = '/';
  };
}

function Home(app) {};

Home.prototype.render = function(args) {
  return tpl.read('/views/home.tpl').then((function(form) {
    if (!navigator.mozApps) {
      return form;
    }
    return new Promise(function(resolve) {
      var installCheck = navigator.mozApps.checkInstalled(manifestUrl)
      installCheck.onsuccess = function() {
        if (!installCheck.result) {
          var button = form.querySelector('.install');
          button.addEventListener('click', install, false);
          button.removeAttribute('hidden');
        }
        resolve(form);
      };
    });
  }).bind(this));
};

module.exports = function (app) {
  return new Home(app);
};
