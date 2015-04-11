'use strict';

var inherits = require('inherits');
var page = require('page');

var EE = require('events').EventEmitter;

var conf = require('./config.js');
var bz = require('./bz.js');
var tpl = require('./template.js');
var utils = require('./utils.js');

document.body.dataset.version = conf.version;

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
    if (conf.version === 1) {
      page('/create/');
      return;
    }
    this.emit('login', email);
    return result;
  }.bind(this));
};

function loggedOut() {
  this.emit('logout');
  page('/create/');
}

App.prototype.logout = function() {
  localStorage.user = '';
  this.user = null;
  this.bugzilla.logout()
    .then(loggedOut.bind(this))
    .catch(loggedOut.bind(this));
};

var app = new App();
var path;
var state;

var views = {
  'home': require('./views/home.js')(app),
  'search': require('./views/search.js')(app),
  'create_bug': require('./views/create-bug.js')(app),
  'view_bug': require('./views/bug.js')(app),
  'bug_comments': require('./views/bug-comments.js')(app),
  'bug_details': require('./views/bug-details.js')(app),
  'bug_attachments': require('./views/bug-attachments.js')(app),
  'login': require('./views/login.js')(app),
  'dashboard': require('./views/dashboard.js')(app)
};

var lastRender = Promise.resolve();
function render(to, view) {
  return function(ctx, next) {
    // Do each template sequentially
    lastRender = lastRender.then(function() {
      return (typeof view === 'string') ? tpl.read(view) : view.render(ctx);
    }).then(function(dom) {
      if (typeof to === 'string') {
        to = document.querySelector(to);
      }
      to.innerHTML = '';
      to.appendChild(dom);
      if (next) {
        next();
      }
    });
  };
}

function loadBug(ctx, next) {
  app.bugzilla.getBug(ctx.params.id).then(function(bug) {
    ctx.bug = bug.bugs[0];
    next();
  });
};

render(document.body, views.home)();

page(function(ctx, next) {
  path = ctx.path;
  ctx.state = state;
  next();
});

page('/', function(ctx, next) {
  if (conf.version === 1) {
    page('/create/');
  } else if (app.user) {
    render('#content', views.dashboard)(ctx, next);
  } else {
    render('#content', views.login)(ctx, next);
  }
});

page('/login/', function(ctx, next) {
  if (app.user && conf.version === 1) {
    page('/create/');
  } else if (app.user && conf.version === 2) {
    page('/');
  } else {
    render('#content', views.login)(ctx, next);
  }
});

page('/logout/', app.logout.bind(app));

page('/bug/:id', loadBug,
     render('#content', views.view_bug),
     render('#bugContent', views.bug_comments));

page('/bug/:id/details/', loadBug,
     render('#content', views.view_bug),
     render('#bugContent', views.bug_details));

page('/bug/:id/attachments/', loadBug,
     render('#content', views.view_bug),
     render('#bugContent', views.bug_attachments));

page('/create/', render('#content', views.create_bug));
page('/search/', render('#content', views.search));
page('/search/:search', render('#content', views.search));

var returnPage;
page.exit(function(ctx, next) {
  returnPage = ctx.path;
  next();
});

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
