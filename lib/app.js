'use strict';

var inherits = require('inherits');
var EE = require('events').EventEmitter;

var page = require('page');

var bz = require('./bz.js');
var tpl = require('./template.js');

inherits(App, EE);
function App() {
  EE.call(this);
  this.bugzilla = bz.createClient({
    apiKey: '3FQgqFTso7ca3JdONgInAaD3dsH4oXggucpJg7xM',
    test: true
  });
}

App.prototype.init = function() {
  if (localStorage.user) {
    var details = JSON.parse(localStorage.user);
    this.bugzilla.validLogin(details).then(function() {
      this.emit('login', details.login);
    }.bind(this));
  } else {
    this.emit('logout');
  }
};

App.prototype.login = function(email, password) {
  return this.bugzilla.login({login: email, password: password})
      .then(function(result) {
    localStorage.user = JSON.stringify({login: email, token: result.token});
    this.emit('login', email);
    return result;
  }.bind(this));
};

App.prototype.logout = function() {
  localStorage.user = '';
  this.bugzilla.logout().then(function() {
    document.location.href = '/';
  }, function() {
    document.location.href = '/';
  });
};

var app = new App();

app.on('login', function(name) {
  var el = document.getElementById('user');
  el.textContent = name;
  el.href = '/dashboard/';
});

app.on('logout', function(name) {
  var el = document.getElementById('user');
  el.textContent = 'Login';
  el.href = '/login/';
});

if (navigator.mozSetMessageHandler) {
  navigator.mozSetMessageHandler('activity', function(activityRequest) {
    console.log('HANDLING ACTIVITY');
    var option = activityRequest.source;
    console.log(option);

    if (option.name === 'share') {
      document.location.href = '/create/';
    }
  });
}

app.init();

var views = {
  'home': require('./views/home.js')(app),
  'search': require('./views/search.js')(app),
  'create_bug': require('./views/create-bug.js')(app),
  'view_bug': require('./views/bug.js')(app),
  'login': require('./views/login.js')(app)
};

function render(to, view) {
  return function(ctx) {
    var render = (typeof view === 'string')
      ? tpl.read(view) : view.render(ctx);
    render.then(function(dom) {
      document.getElementById(to).innerHTML = '';
      document.getElementById(to).appendChild(dom);
    });
  };
}

page('/', render('content', views.home));

page('/login/', render('content', views.login));
page('/logout/', app.logout.bind(app));

page('/dashboard', render('content', '/views/dashboard.tpl'));

page('/bug/:id', render('content', views.view_bug));
page('/create/', render('content', views.create_bug));
page('/search/', render('content', views.search));
page('/search/:search', render('content', views.search));

page();
