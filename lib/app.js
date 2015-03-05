'use strict';

var inherits = require('inherits');
var page = require('page');

var EE = require('events').EventEmitter;

var conf = require('./config.js');
var bz = require('./bz.js');
var tpl = require('./template.js');

document.body.dataset.version = conf.version;

inherits(App, EE);
function App() {
  EE.call(this);
  this.bugzilla = bz.createClient();
}

App.prototype.init = function() {
  if (localStorage.user) {
    var details = JSON.parse(localStorage.user);
    this.bugzilla.validLogin(details).then(function() {
      this.user = {name: details.login};
      this.emit('login', details.login);
      this.emit('init');
    }.bind(this)).catch(function() {
      localStorage.user = '';
      this.emit('logout');
      this.emit('init');
    }.bind(this));
  } else {
    this.emit('logout');
    this.emit('init');
  }
};

App.prototype.login = function(email, password) {
  var opts = {login: email, password: password};
  return this.bugzilla.login(opts).then(function(result) {
    this.user = {name: email};
    localStorage.user = JSON.stringify({login: email, token: result.token});
    this.emit('login', email);
    return result;
  }.bind(this));
};

App.prototype.logout = function() {
  localStorage.user = '';
  this.bugzilla.logout().then(function() {
    this.emit('logout');
    page('/');
  }.bind(this)).catch(function() {
    this.emit('logout');
    page('/');
  }.bind(this));
};

var app = new App();
var path;
var state;

app.on('login', function(name) {
  var el = document.getElementById('user');
  el.textContent = name;
  el.href = '/dashboard/';
  if (returnPage) {
    page(returnPage);
  }
});

app.on('logout', function(name) {
  var el = document.getElementById('user');
  el.textContent = 'login';
  el.href = '/login/';
});

var views = {
  'home': require('./views/home.js')(app),
  'search': require('./views/search.js')(app),
  'create_bug': require('./views/create-bug.js')(app),
  'view_bug': require('./views/bug.js')(app),
  'login': require('./views/login.js')(app),
  'dashboard': require('./views/dashboard.js')(app)
};

function render(to, view) {
  return function(ctx) {
    var render = (typeof view === 'string')
      ? tpl.read(view) : view.render(ctx);
    render.then(function(dom) {
      if (ctx.path !== path) {
        return;
      }
      document.getElementById(to).innerHTML = '';
      document.getElementById(to).appendChild(dom);
    });
  };
}

page(function(ctx, next) {
  path = ctx.path;
  ctx.state = state;
  next();
});

function v1ModalLogin(ctx, next) {
  if (conf.version === 1 && !app.user) {
    return page('/login/');
  }
  next();
}

page('/', render('content', views.home));

page('/login/', render('content', views.login));
page('/logout/', app.logout.bind(app));

page('/dashboard', render('content', views.dashboard));

page('/bug/:id', render('content', views.view_bug));
page('/create/', v1ModalLogin, render('content', views.create_bug));
page('/search/', render('content', views.search));
page('/search/:search', render('content', views.search));

var returnPage;
page.exit(function(ctx, next) {
  returnPage = ctx.path;
  next();
});

if (navigator.mozSetMessageHandler) {
  navigator.mozSetMessageHandler('activity', function(activityRequest) {
    var option = activityRequest.source;
    if (option.name === 'share') {
      app.activity = option;
      page('/create/');
    }
  });
}

app.on('init', function() {
  page();
});

app.init();
