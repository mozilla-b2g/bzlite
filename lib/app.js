'use strict';

var inherits = require('inherits');
var page = require('page');

var EE = require('events').EventEmitter;

var conf = require('./config.js');
var bz = require('./bz.js');
var tpl = require('./template.js');
var utils = require('./utils.js');

inherits(App, EE);
function App() {
  EE.call(this);

  var opts = {};
  if (process.env.TEST) {
    opts.test = true;
  }

  this.page = page;
  this.bugzilla = bz.createClient(opts);
}

App.prototype.init = function() {
  if (localStorage.user) {
    var details = JSON.parse(localStorage.user);
    this.bugzilla.validLogin(details).then(function() {
      this.user = {name: details.login};
      this.emit('login', details.login);
      this.emit('init');
    }.bind(this)).catch(function() {
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
    page('/');
    return result;
  }.bind(this));
};

function loggedOut() {
  this.emit('logout');
  page('/');
}

App.prototype.logout = function() {
  localStorage.user = '';
  this.user = null;
  this.bugzilla.logout()
    .then(loggedOut.bind(this))
    .catch(loggedOut.bind(this));
};

var app = new App();
var state;

var lastRender = Promise.resolve();
function render(to, view) {
  return function(ctx, next) {
    // Do each template sequentially
    lastRender = lastRender.then(function() {
      return (typeof view === 'string') ? tpl.read(view) : view(ctx);
    }).then(function(dom) {
      var target = (typeof to === 'string') ? document.querySelector(to) : to;
      target.innerHTML = '';
      target.appendChild(dom);
      if (next) {
        next();
      }
    }).catch(function(err) {
      console.error(err);
    });
  };
}

function loadBug(ctx, next) {
  app.bugzilla.getBug(ctx.params.id).then(function(bug) {
    ctx.bug = bug.bugs[0];
    next();
  });
};

render(document.body, require('./views/home.js'))({app: app});

function modalLogin(ctx, next) {
  if (!app.user) {
    page('/login/');
  } else {
    next();
  }
}

function highlight(region) {
  return function(ctx, next) {
    document.getElementById('footerNav').dataset.region = region;
    next();
  }
}

var dashboard = require('./views/dashboard.js');
var bug = require('./views/bug.js');

page(function(ctx, next) {

  ctx.app = app;
  ctx.state = state;

  var region = path.split('/')[1] || "dashboard";
  document.getElementById('footerNav').dataset.region = region;

  next();
});

page('/login/', function(ctx, next) {
  if (app.user) {
    page('/');
  } else {
    render('#content', require('./views/login.js'))(ctx, next);
  }
});

page('/logout/', app.logout.bind(app));

page('/', modalLogin, render('#content', dashboard));
page('/dashboard/', modalLogin, render('#content', dashboard));
page('/dashboard/flags/', modalLogin, render('#content', dashboard));
page('/dashboard/flagged/', modalLogin, render('#content', dashboard));
page('/dashboard/filed/', modalLogin, render('#content', dashboard));

page('/bug/:id', loadBug, render('#content', bug),
     render('#bugContent', require('./views/bug-comments.js')));
page('/bug/:id/details/', loadBug, render('#content', bug),
     render('#bugContent', require('./views/bug-details.js')));
page('/bug/:id/attachments/', loadBug, render('#content', bug),
     render('#bugContent', require('./views/bug-attachments.js')));

page('/create/', render('#content', require('./views/create-bug.js')));

page('/search/', render('#content', require('./views/search.js')));
page('/search/:search', render('#content', require('./views/search.js')));

page('/profile/', render('#content', '/views/profile.tpl'));

app.on('init', function() {

  page();

  if (!navigator.mozSetMessageHandler) {
    return;
  }

  navigator.mozSetMessageHandler('activity', function(activity) {
    if (activity.source.name === 'share') {
      lastRender.then(function() {
        app.activity = activity.source;
        page('/create/');
      });
    }
  });
});

app.init();
