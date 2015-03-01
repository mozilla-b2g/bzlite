'use strict';

var inherits = require('inherits');
var EE = require('events').EventEmitter;

var page = require('page');

var bz = require('./bz.js');
var tpl = require('./template.js');

inherits(App, EE);
function App() {
  EE.call(this);
  this.rendered = true;
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
      this.emit('init');
    }.bind(this));
  } else {
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

  if (!app.rendered) {
    document.location.reload();
  }
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
      document.getElementById(to).innerHTML = '';
      document.getElementById(to).appendChild(dom);
    });
  };
}

page(function(ctx, next) {
  if (!app.user) {
    app.rendered = false;
    return render('content', views.login)();
  }
  next();
});

page('/', render('content', views.home));

page('/login/', render('content', views.login));
page('/logout/', app.logout.bind(app));

page('/dashboard', render('content', views.dashboard));

page('/bug/:id', render('content', views.view_bug));
page('/create/', render('content', views.create_bug));
page('/search/', render('content', views.search));
page('/search/:search', render('content', views.search));

app.on('init', function() {
  page();
});

app.init();
