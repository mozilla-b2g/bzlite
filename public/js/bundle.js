(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/daleharvey/src/ladybug/index.js":[function(require,module,exports){
'use strict';

require('./lib/app.js');

},{"./lib/app.js":"/Users/daleharvey/src/ladybug/lib/app.js"}],"/Users/daleharvey/src/ladybug/lib/app.js":[function(require,module,exports){
'use strict';

var inherits = require('inherits');
var EE = require('events').EventEmitter;

var page = require('page');

var bz = require('./bz.js');
var tpl = require('./template.js');

inherits(App, EE);
function App() {
  EE.call(this);
  this.bugzilla = bz.createClient({test: true});
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

app.init();

var views = {
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

page('/', render('content', '/views/home.tpl'));

page('/login/', render('content', views.login));
page('/logout/', app.logout.bind(app));

page('/dashboard', render('content', '/views/dashboard.tpl'));

page('/bug/:id', render('content', views.view_bug));
page('/create/', render('content', views.create_bug));
page('/search/', render('content', views.search));
page('/search/:search', render('content', views.search));

page();

},{"./bz.js":"/Users/daleharvey/src/ladybug/lib/bz.js","./template.js":"/Users/daleharvey/src/ladybug/lib/template.js","./views/bug.js":"/Users/daleharvey/src/ladybug/lib/views/bug.js","./views/create-bug.js":"/Users/daleharvey/src/ladybug/lib/views/create-bug.js","./views/login.js":"/Users/daleharvey/src/ladybug/lib/views/login.js","./views/search.js":"/Users/daleharvey/src/ladybug/lib/views/search.js","events":"/Users/daleharvey/src/ladybug/node_modules/browserify/node_modules/events/events.js","inherits":"/Users/daleharvey/src/ladybug/node_modules/inherits/inherits_browser.js","page":"/Users/daleharvey/src/ladybug/node_modules/page/index.js"}],"/Users/daleharvey/src/ladybug/lib/bz.js":[function(require,module,exports){
(function (global){
'use strict';

var request = require('request');
var Promise = global.Promise || require('lie');

var API_URL = 'https://bugzilla.mozilla.org/bzapi';
var TEST_API_URL = 'https://bugzilla-dev.allizom.org/bzapi';

function Bz(opts) {

  if (opts.username && opts.password) {
    this.username = opts.username;
    this.password = opts.password;
  }

  this.apiUrl = opts.url || (opts.test ? TEST_API_URL : API_URL);
}

Bz.prototype.request = function(method, url, data, params) {

  var opts = {
    url: this.apiUrl + url,
    qs: params || {},
    method: method || 'GET',
    headers: {},
    json: true,
    processData: true,
    body: data || null
  };

  if (this.token) {
    opts.qs.token = this.token;
  } else if (this.username && this.password) {
    opts.qs.username = this.username;
    opts.qs.password = this.password;
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
};

// Bugs
Bz.prototype.getBug = function(id) {
  return this.request('GET', '/bug/' + id);
};

Bz.prototype.createBug = function(bug) {
  return this.request('POST', '/bug', bug);
};

Bz.prototype.searchBugs = function(opts) {
  return this.request('GET', '/bug', null, opts);
};

Bz.prototype.getBugComments = function(id) {
  return this.request('GET', '/bug/' + id + '/comment');
};

// User
Bz.prototype.login = function(opts) {
  return this.request('GET', '/login', null, opts).then(function(res) {
    this.token = res.token;
    return res;
  }.bind(this));
};

Bz.prototype.validLogin = function(opts) {
  return this.request('GET', '/valid_login', null, opts).then(function(res) {
    this.token = opts.token;
    return res;
  }.bind(this));
};

Bz.prototype.logout = function() {
  var token = this.token;
  this.token = null;
  this.username = null;
  this.password = null;
  return this.request('GET', '/logout', null, {token: this.token});
};

// Products
Bz.prototype.getProducts = function() {
  return this.request('GET', '/rest/product_accessible');
};


module.exports.createClient = function(opts) {
  return new Bz(opts);
};


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"lie":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/index.js","request":"/Users/daleharvey/src/ladybug/lib/request-browser.js"}],"/Users/daleharvey/src/ladybug/lib/request-browser.js":[function(require,module,exports){
(function (global){
'use strict';

var createBlob = function createBlob(parts, properties) {
  parts = parts || [];
  properties = properties || {};
  try {
    return new Blob(parts, properties);
  } catch (e) {
    if (e.name !== "TypeError") {
      throw e;
    }
    var BlobBuilder = global.BlobBuilder ||
                      global.MSBlobBuilder ||
                      global.MozBlobBuilder ||
                      global.WebKitBlobBuilder;
    var builder = new BlobBuilder();
    for (var i = 0; i < parts.length; i += 1) {
      builder.append(parts[i]);
    }
    return builder.getBlob(properties.type);
  }
}

var utils = {};

utils.fixBinary = function() {
  var length = bin.length;
  var buf = new ArrayBuffer(length);
  var arr = new Uint8Array(buf);
  for (var i = 0; i < length; i++) {
    arr[i] = bin.charCodeAt(i);
  }
  return buf;
};

utils.readAsBinaryString = function (blob, callback) {
  var reader = new FileReader();
  var hasBinaryString = typeof reader.readAsBinaryString === 'function';
  reader.onloadend = function (e) {
    var result = e.target.result || '';
    if (hasBinaryString) {
      return callback(result);
    }
    callback(exports.arrayBufferToBinaryString(result));
  };
  if (hasBinaryString) {
    reader.readAsBinaryString(blob);
  } else {
    reader.readAsArrayBuffer(blob);
  }
};

module.exports = function(options, callback) {

  var xhr, timer, hasUpload;

  var abortReq = function () {
    xhr.abort();
  };

  if (options.xhr) {
    xhr = new options.xhr();
  } else {
    xhr = new XMLHttpRequest();
  }

  // cache-buster, specifically designed to work around IE's aggressive caching
  // see http://www.dashbay.com/2011/05/internet-explorer-caches-ajax/
  if (options.method === 'GET' && !options.cache) {
    options.qs = options.qs || {};
    options.qs['_nonce'] = Date.now();
  }

  if (options.qs) {
    options.url += '?' + Object.keys(options.qs).map(function (key) {
      return encodeURIComponent(key) + '=' +
        encodeURIComponent(options.qs[key]);
    }).join('&');
  }

  xhr.open(options.method, options.url);

  if (options.withCredentials) {
    xhr.withCredentials = true;
  }

  if (options.json) {
    options.headers.Accept = 'application/json';
    options.headers['Content-Type'] = options.headers['Content-Type'] ||
      'application/json';
    if (options.body &&
        options.processData &&
        typeof options.body !== "string") {
      options.body = JSON.stringify(options.body);
    }
  }

  if (options.binary) {
    xhr.responseType = 'arraybuffer';
  }

  if (!('body' in options)) {
    options.body = null;
  }

  for (var key in options.headers) {
    if (options.headers.hasOwnProperty(key)) {
      xhr.setRequestHeader(key, options.headers[key]);
    }
  }

  if (options.timeout > 0) {
    timer = setTimeout(abortReq, options.timeout);
    xhr.onprogress = function () {
      clearTimeout(timer);
      timer = setTimeout(abortReq, options.timeout);
    };
    if (typeof hasUpload === 'undefined') {
      // IE throws an error if you try to access it directly
      hasUpload = Object.keys(xhr).indexOf('upload') !== -1;
    }
    if (hasUpload) { // does not exist in ie9
      xhr.upload.onprogress = xhr.onprogress;
    }
  }

  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) {
      return;
    }

    var response = {
      statusCode: xhr.status
    };

    if (xhr.status >= 200 && xhr.status < 300) {
      var data;
      if (options.binary) {
        data = createBlob([xhr.response || ''], {
          type: xhr.getResponseHeader('Content-Type')
        });
      } else {
        data = xhr.responseText;
        if (options.json) {
          data = JSON.parse(xhr.responseText);
        }
      }
      callback(null, response, data);
    } else {
      var err = {};
      try {
        err = JSON.parse(xhr.response);
      } catch(e) {}
      callback(err, response);
    }
  };

  if (options.body && (options.body instanceof Blob)) {
    utils.readAsBinaryString(options.body, function (binary) {
      xhr.send(utils.fixBinary(binary));
    });
  } else {
    xhr.send(options.body);
  }

  return {abort: abortReq};
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"/Users/daleharvey/src/ladybug/lib/template.js":[function(require,module,exports){
'use strict';

var request = require('request');

module.exports.read = function(path) {
  return new Promise(function(resolve, reject) {
    request({
      method: 'GET',
      url: path
    }, function(err, args, data) {

      if (err) {
        return reject(err);
      }

      var el = document.createElement('div');
      el.innerHTML = data;
      resolve(el.firstChild);
    });
  });
};

},{"request":"/Users/daleharvey/src/ladybug/lib/request-browser.js"}],"/Users/daleharvey/src/ladybug/lib/views/bug.js":[function(require,module,exports){
'use strict';

var timeago = require('timeago');

var tpl = require('../template.js');

function ViewBug(app) {
  this.app = app;
};

ViewBug.prototype.render = function(ctx) {
  return Promise.all([
    tpl.read('/views/bug.tpl'),
    this.app.bugzilla.getBug(ctx.params.id),
    this.app.bugzilla.getBugComments(ctx.params.id)
  ]).then(function(results) {
    var tpl = results[0];
    var bug = results[1];
    var comments = results[2];

    tpl.querySelector('.title').textContent = bug.id + ' - ' + bug.summary;
    tpl.querySelector('.status').textContent = bug.status;
    tpl.querySelector('.assigned').textContent = bug.assigned_to.real_name;

    var list = tpl.querySelector('.comments')

    comments.comments.forEach(function (comment) {
      var li = document.createElement('li');
      var header = document.createElement('div');
      var created = document.createElement('span');
      var author = document.createElement('span');
      var commentText = document.createElement('p');
      author.textContent = comment.creator.name;
      created.textContent = timeago(comment.creation_time);
      commentText.textContent = comment.text;
      header.appendChild(author);
      header.appendChild(created);
      li.appendChild(header);
      li.appendChild(commentText);
      list.appendChild(li);
    });

    return tpl;
  });
};

module.exports = function (app) {
  return new ViewBug(app);
};

},{"../template.js":"/Users/daleharvey/src/ladybug/lib/template.js","timeago":"/Users/daleharvey/src/ladybug/node_modules/timeago/timeago.js"}],"/Users/daleharvey/src/ladybug/lib/views/create-bug.js":[function(require,module,exports){
'use strict';

var tpl = require('../template.js');

var app, form;

function value(selector) {
  return document.querySelector(selector).value.trim();
}

function formSubmitted(e) {
  e.preventDefault();

  this.app.bugzilla.createBug({
    product: 'Firefox OS',
    component: value('#component'),
    op_sys: 'All',
    platform: 'All',
    summary: value('#summary'),
    description: value('#description'),
    version: 'unspecified'
  }).then(function(result) {
    document.location.href = '/bug/' + result.id;
  }).catch(function() {
    form.querySelector('.createBugError').hidden = false;
  });
}

function CreateBug(app) {
  this.app = app;
};

CreateBug.prototype.render = function(args) {
  return tpl.read('/views/create_bug.tpl').then((function(_form) {
    form = _form;
    form.addEventListener('submit', formSubmitted.bind(this));
    return form;
  }).bind(this));
};

module.exports = function (app) {
  return new CreateBug(app);
};

},{"../template.js":"/Users/daleharvey/src/ladybug/lib/template.js"}],"/Users/daleharvey/src/ladybug/lib/views/login.js":[function(require,module,exports){
'use strict';

var tpl = require('../template.js');

var app, form;

function value(selector) {
  return form.querySelector(selector).value.trim();
}

function formSubmitted(e) {
  e.preventDefault();
  form.querySelector('.loginError').hidden = true;
  var email = value('input[type=email]');
  var password = value('input[type=password]');
  this.app.login(email, password).then(function () {
    document.location.href = '/';
  }).catch(function(err) {
    form.querySelector('.loginError').hidden = false;
  });
}

function Login(app) {
  this.app = app;
};

Login.prototype.render = function(args) {
  return tpl.read('/views/login.tpl').then((function(_form) {
    form = _form;
    form.addEventListener('submit', formSubmitted.bind(this));
    return form;
  }).bind(this));
};

module.exports = function (app) {
  return new Login(app);
};


},{"../template.js":"/Users/daleharvey/src/ladybug/lib/template.js"}],"/Users/daleharvey/src/ladybug/lib/views/search.js":[function(require,module,exports){
'use strict';

var tpl = require('../template.js');

function Search(app) {
  this.app = app;
  this.currentSearch = null;
}

Search.prototype.search = function(str) {

  var wrapper = this.template.querySelector('div.bugs');
  wrapper.classList.remove('loading');
  wrapper.innerHTML = '';

  var id = Date.now();
  this.currentSearch = id;

  if (!str) {
    return;
  }

  var search = {
    short_desc: str,
    short_desc_type: 'allwordssubstr',
    resolution: '---',
    include_fields: 'summary,id',
    limit: 20
  }

  wrapper.classList.add('loading');
  this.app.bugzilla.searchBugs(search).then((function(results) {

    // Ugly, we should really cancel previous requests
    if (id !== this.currentSearch) {
      return;
    }
    wrapper.classList.remove('loading');
    if (!results.bugs.length) {
      wrapper.innerHTML = 'No bugs :(';
      return;
    }

    results.bugs.map(function(obj) {
      var link = document.createElement('a');
      link.textContent = obj.id + ' - ' + obj.summary;
      link.href = '/bug/' + obj.id;
      wrapper.appendChild(link);
    });
  }).bind(this)).catch(function(err) {
    wrapper.classList.remove('loading');
    console.log('THERE WAS AN ERROR!');
    console.log(err);
  });
};

Search.prototype.render = function(ctx) {
  return tpl.read('/views/search.tpl').then((function(template) {
    this.template = template;

    var input = template.querySelector('input[type=search]');
    input.addEventListener('input', function() {
      this.search(input.value);
    }.bind(this));

    if (ctx.params.search) {
      input.value = ctx.params.search;
      this.search(input.value);
    }

    return this.template;
  }).bind(this));
};

module.exports = function (app) {
  return new Search(app);
};

},{"../template.js":"/Users/daleharvey/src/ladybug/lib/template.js"}],"/Users/daleharvey/src/ladybug/node_modules/browserify/node_modules/browser-resolve/empty.js":[function(require,module,exports){

},{}],"/Users/daleharvey/src/ladybug/node_modules/browserify/node_modules/events/events.js":[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],"/Users/daleharvey/src/ladybug/node_modules/inherits/inherits_browser.js":[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],"/Users/daleharvey/src/ladybug/node_modules/lie/lib/INTERNAL.js":[function(require,module,exports){
'use strict';

module.exports = INTERNAL;

function INTERNAL() {}
},{}],"/Users/daleharvey/src/ladybug/node_modules/lie/lib/all.js":[function(require,module,exports){
'use strict';
var Promise = require('./promise');
var reject = require('./reject');
var resolve = require('./resolve');
var INTERNAL = require('./INTERNAL');
var handlers = require('./handlers');
module.exports = all;
function all(iterable) {
  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    return reject(new TypeError('must be an array'));
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return resolve([]);
  }

  var values = new Array(len);
  var resolved = 0;
  var i = -1;
  var promise = new Promise(INTERNAL);
  
  while (++i < len) {
    allResolver(iterable[i], i);
  }
  return promise;
  function allResolver(value, i) {
    resolve(value).then(resolveFromAll, function (error) {
      if (!called) {
        called = true;
        handlers.reject(promise, error);
      }
    });
    function resolveFromAll(outValue) {
      values[i] = outValue;
      if (++resolved === len & !called) {
        called = true;
        handlers.resolve(promise, values);
      }
    }
  }
}
},{"./INTERNAL":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/INTERNAL.js","./handlers":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/handlers.js","./promise":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/promise.js","./reject":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/reject.js","./resolve":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/resolve.js"}],"/Users/daleharvey/src/ladybug/node_modules/lie/lib/handlers.js":[function(require,module,exports){
'use strict';
var tryCatch = require('./tryCatch');
var resolveThenable = require('./resolveThenable');
var states = require('./states');

exports.resolve = function (self, value) {
  var result = tryCatch(getThen, value);
  if (result.status === 'error') {
    return exports.reject(self, result.value);
  }
  var thenable = result.value;

  if (thenable) {
    resolveThenable.safely(self, thenable);
  } else {
    self.state = states.FULFILLED;
    self.outcome = value;
    var i = -1;
    var len = self.queue.length;
    while (++i < len) {
      self.queue[i].callFulfilled(value);
    }
  }
  return self;
};
exports.reject = function (self, error) {
  self.state = states.REJECTED;
  self.outcome = error;
  var i = -1;
  var len = self.queue.length;
  while (++i < len) {
    self.queue[i].callRejected(error);
  }
  return self;
};

function getThen(obj) {
  // Make sure we only access the accessor once as required by the spec
  var then = obj && obj.then;
  if (obj && typeof obj === 'object' && typeof then === 'function') {
    return function appyThen() {
      then.apply(obj, arguments);
    };
  }
}
},{"./resolveThenable":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/resolveThenable.js","./states":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/states.js","./tryCatch":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/tryCatch.js"}],"/Users/daleharvey/src/ladybug/node_modules/lie/lib/index.js":[function(require,module,exports){
module.exports = exports = require('./promise');

exports.resolve = require('./resolve');
exports.reject = require('./reject');
exports.all = require('./all');
exports.race = require('./race');
},{"./all":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/all.js","./promise":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/promise.js","./race":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/race.js","./reject":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/reject.js","./resolve":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/resolve.js"}],"/Users/daleharvey/src/ladybug/node_modules/lie/lib/promise.js":[function(require,module,exports){
'use strict';

var unwrap = require('./unwrap');
var INTERNAL = require('./INTERNAL');
var resolveThenable = require('./resolveThenable');
var states = require('./states');
var QueueItem = require('./queueItem');

module.exports = Promise;
function Promise(resolver) {
  if (!(this instanceof Promise)) {
    return new Promise(resolver);
  }
  if (typeof resolver !== 'function') {
    throw new TypeError('resolver must be a function');
  }
  this.state = states.PENDING;
  this.queue = [];
  this.outcome = void 0;
  if (resolver !== INTERNAL) {
    resolveThenable.safely(this, resolver);
  }
}

Promise.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected);
};
Promise.prototype.then = function (onFulfilled, onRejected) {
  if (typeof onFulfilled !== 'function' && this.state === states.FULFILLED ||
    typeof onRejected !== 'function' && this.state === states.REJECTED) {
    return this;
  }
  var promise = new Promise(INTERNAL);

  
  if (this.state !== states.PENDING) {
    var resolver = this.state === states.FULFILLED ? onFulfilled: onRejected;
    unwrap(promise, resolver, this.outcome);
  } else {
    this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
  }

  return promise;
};

},{"./INTERNAL":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/INTERNAL.js","./queueItem":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/queueItem.js","./resolveThenable":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/resolveThenable.js","./states":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/states.js","./unwrap":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/unwrap.js"}],"/Users/daleharvey/src/ladybug/node_modules/lie/lib/queueItem.js":[function(require,module,exports){
'use strict';
var handlers = require('./handlers');
var unwrap = require('./unwrap');

module.exports = QueueItem;
function QueueItem(promise, onFulfilled, onRejected) {
  this.promise = promise;
  if (typeof onFulfilled === 'function') {
    this.onFulfilled = onFulfilled;
    this.callFulfilled = this.otherCallFulfilled;
  }
  if (typeof onRejected === 'function') {
    this.onRejected = onRejected;
    this.callRejected = this.otherCallRejected;
  }
}
QueueItem.prototype.callFulfilled = function (value) {
  handlers.resolve(this.promise, value);
};
QueueItem.prototype.otherCallFulfilled = function (value) {
  unwrap(this.promise, this.onFulfilled, value);
};
QueueItem.prototype.callRejected = function (value) {
  handlers.reject(this.promise, value);
};
QueueItem.prototype.otherCallRejected = function (value) {
  unwrap(this.promise, this.onRejected, value);
};
},{"./handlers":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/handlers.js","./unwrap":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/unwrap.js"}],"/Users/daleharvey/src/ladybug/node_modules/lie/lib/race.js":[function(require,module,exports){
'use strict';
var Promise = require('./promise');
var reject = require('./reject');
var resolve = require('./resolve');
var INTERNAL = require('./INTERNAL');
var handlers = require('./handlers');
module.exports = race;
function race(iterable) {
  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    return reject(new TypeError('must be an array'));
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return resolve([]);
  }

  var resolved = 0;
  var i = -1;
  var promise = new Promise(INTERNAL);
  
  while (++i < len) {
    resolver(iterable[i]);
  }
  return promise;
  function resolver(value) {
    resolve(value).then(function (response) {
      if (!called) {
        called = true;
        handlers.resolve(promise, response);
      }
    }, function (error) {
      if (!called) {
        called = true;
        handlers.reject(promise, error);
      }
    });
  }
}
},{"./INTERNAL":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/INTERNAL.js","./handlers":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/handlers.js","./promise":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/promise.js","./reject":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/reject.js","./resolve":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/resolve.js"}],"/Users/daleharvey/src/ladybug/node_modules/lie/lib/reject.js":[function(require,module,exports){
'use strict';

var Promise = require('./promise');
var INTERNAL = require('./INTERNAL');
var handlers = require('./handlers');
module.exports = reject;

function reject(reason) {
	var promise = new Promise(INTERNAL);
	return handlers.reject(promise, reason);
}
},{"./INTERNAL":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/INTERNAL.js","./handlers":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/handlers.js","./promise":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/promise.js"}],"/Users/daleharvey/src/ladybug/node_modules/lie/lib/resolve.js":[function(require,module,exports){
'use strict';

var Promise = require('./promise');
var INTERNAL = require('./INTERNAL');
var handlers = require('./handlers');
module.exports = resolve;

var FALSE = handlers.resolve(new Promise(INTERNAL), false);
var NULL = handlers.resolve(new Promise(INTERNAL), null);
var UNDEFINED = handlers.resolve(new Promise(INTERNAL), void 0);
var ZERO = handlers.resolve(new Promise(INTERNAL), 0);
var EMPTYSTRING = handlers.resolve(new Promise(INTERNAL), '');

function resolve(value) {
  if (value) {
    if (value instanceof Promise) {
      return value;
    }
    return handlers.resolve(new Promise(INTERNAL), value);
  }
  var valueType = typeof value;
  switch (valueType) {
    case 'boolean':
      return FALSE;
    case 'undefined':
      return UNDEFINED;
    case 'object':
      return NULL;
    case 'number':
      return ZERO;
    case 'string':
      return EMPTYSTRING;
  }
}
},{"./INTERNAL":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/INTERNAL.js","./handlers":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/handlers.js","./promise":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/promise.js"}],"/Users/daleharvey/src/ladybug/node_modules/lie/lib/resolveThenable.js":[function(require,module,exports){
'use strict';
var handlers = require('./handlers');
var tryCatch = require('./tryCatch');
function safelyResolveThenable(self, thenable) {
  // Either fulfill, reject or reject with error
  var called = false;
  function onError(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.reject(self, value);
  }

  function onSuccess(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.resolve(self, value);
  }

  function tryToUnwrap() {
    thenable(onSuccess, onError);
  }
  
  var result = tryCatch(tryToUnwrap);
  if (result.status === 'error') {
    onError(result.value);
  }
}
exports.safely = safelyResolveThenable;
},{"./handlers":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/handlers.js","./tryCatch":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/tryCatch.js"}],"/Users/daleharvey/src/ladybug/node_modules/lie/lib/states.js":[function(require,module,exports){
// Lazy man's symbols for states

exports.REJECTED = ['REJECTED'];
exports.FULFILLED = ['FULFILLED'];
exports.PENDING = ['PENDING'];
},{}],"/Users/daleharvey/src/ladybug/node_modules/lie/lib/tryCatch.js":[function(require,module,exports){
'use strict';

module.exports = tryCatch;

function tryCatch(func, value) {
  var out = {};
  try {
    out.value = func(value);
    out.status = 'success';
  } catch (e) {
    out.status = 'error';
    out.value = e;
  }
  return out;
}
},{}],"/Users/daleharvey/src/ladybug/node_modules/lie/lib/unwrap.js":[function(require,module,exports){
'use strict';

var immediate = require('immediate');
var handlers = require('./handlers');
module.exports = unwrap;

function unwrap(promise, func, value) {
  immediate(function () {
    var returnValue;
    try {
      returnValue = func(value);
    } catch (e) {
      return handlers.reject(promise, e);
    }
    if (returnValue === promise) {
      handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
    } else {
      handlers.resolve(promise, returnValue);
    }
  });
}
},{"./handlers":"/Users/daleharvey/src/ladybug/node_modules/lie/lib/handlers.js","immediate":"/Users/daleharvey/src/ladybug/node_modules/lie/node_modules/immediate/lib/index.js"}],"/Users/daleharvey/src/ladybug/node_modules/lie/node_modules/immediate/lib/index.js":[function(require,module,exports){
'use strict';
var types = [
  require('./nextTick'),
  require('./mutation.js'),
  require('./messageChannel'),
  require('./stateChange'),
  require('./timeout')
];
var draining;
var queue = [];
//named nextTick for less confusing stack traces
function nextTick() {
  draining = true;
  var i, oldQueue;
  var len = queue.length;
  while (len) {
    oldQueue = queue;
    queue = [];
    i = -1;
    while (++i < len) {
      oldQueue[i]();
    }
    len = queue.length;
  }
  draining = false;
}
var scheduleDrain;
var i = -1;
var len = types.length;
while (++ i < len) {
  if (types[i] && types[i].test && types[i].test()) {
    scheduleDrain = types[i].install(nextTick);
    break;
  }
}
module.exports = immediate;
function immediate(task) {
  if (queue.push(task) === 1 && !draining) {
    scheduleDrain();
  }
}
},{"./messageChannel":"/Users/daleharvey/src/ladybug/node_modules/lie/node_modules/immediate/lib/messageChannel.js","./mutation.js":"/Users/daleharvey/src/ladybug/node_modules/lie/node_modules/immediate/lib/mutation.js","./nextTick":"/Users/daleharvey/src/ladybug/node_modules/browserify/node_modules/browser-resolve/empty.js","./stateChange":"/Users/daleharvey/src/ladybug/node_modules/lie/node_modules/immediate/lib/stateChange.js","./timeout":"/Users/daleharvey/src/ladybug/node_modules/lie/node_modules/immediate/lib/timeout.js"}],"/Users/daleharvey/src/ladybug/node_modules/lie/node_modules/immediate/lib/messageChannel.js":[function(require,module,exports){
(function (global){
'use strict';

exports.test = function () {
  if (global.setImmediate) {
    // we can only get here in IE10
    // which doesn't handel postMessage well
    return false;
  }
  return typeof global.MessageChannel !== 'undefined';
};

exports.install = function (func) {
  var channel = new global.MessageChannel();
  channel.port1.onmessage = func;
  return function () {
    channel.port2.postMessage(0);
  };
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"/Users/daleharvey/src/ladybug/node_modules/lie/node_modules/immediate/lib/mutation.js":[function(require,module,exports){
(function (global){
'use strict';
//based off rsvp https://github.com/tildeio/rsvp.js
//license https://github.com/tildeio/rsvp.js/blob/master/LICENSE
//https://github.com/tildeio/rsvp.js/blob/master/lib/rsvp/asap.js

var Mutation = global.MutationObserver || global.WebKitMutationObserver;

exports.test = function () {
  return Mutation;
};

exports.install = function (handle) {
  var called = 0;
  var observer = new Mutation(handle);
  var element = global.document.createTextNode('');
  observer.observe(element, {
    characterData: true
  });
  return function () {
    element.data = (called = ++called % 2);
  };
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"/Users/daleharvey/src/ladybug/node_modules/lie/node_modules/immediate/lib/stateChange.js":[function(require,module,exports){
(function (global){
'use strict';

exports.test = function () {
  return 'document' in global && 'onreadystatechange' in global.document.createElement('script');
};

exports.install = function (handle) {
  return function () {

    // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
    // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
    var scriptEl = global.document.createElement('script');
    scriptEl.onreadystatechange = function () {
      handle();

      scriptEl.onreadystatechange = null;
      scriptEl.parentNode.removeChild(scriptEl);
      scriptEl = null;
    };
    global.document.documentElement.appendChild(scriptEl);

    return handle;
  };
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"/Users/daleharvey/src/ladybug/node_modules/lie/node_modules/immediate/lib/timeout.js":[function(require,module,exports){
'use strict';
exports.test = function () {
  return true;
};

exports.install = function (t) {
  return function () {
    setTimeout(t, 0);
  };
};
},{}],"/Users/daleharvey/src/ladybug/node_modules/page/index.js":[function(require,module,exports){
  /* globals require, module */

  'use strict';

  /**
   * Module dependencies.
   */

  var pathtoRegexp = require('path-to-regexp');

  /**
   * Module exports.
   */

  module.exports = page;

  /**
   * To work properly with the URL
   * history.location generated polyfill in https://github.com/devote/HTML5-History-API
   */

  var location = ('undefined' !== typeof window) && (window.history.location || window.location);

  /**
   * Perform initial dispatch.
   */

  var dispatch = true;

  /**
   * Decode URL components (query string, pathname, hash).
   * Accommodates both regular percent encoding and x-www-form-urlencoded format.
   */
  var decodeURLComponents = true;

  /**
   * Base path.
   */

  var base = '';

  /**
   * Running flag.
   */

  var running;

  /**
   * HashBang option
   */

  var hashbang = false;

  /**
   * Previous context, for capturing
   * page exit events.
   */

  var prevContext;

  /**
   * Register `path` with callback `fn()`,
   * or route `path`, or redirection,
   * or `page.start()`.
   *
   *   page(fn);
   *   page('*', fn);
   *   page('/user/:id', load, user);
   *   page('/user/' + user.id, { some: 'thing' });
   *   page('/user/' + user.id);
   *   page('/from', '/to')
   *   page();
   *
   * @param {String|Function} path
   * @param {Function} fn...
   * @api public
   */

  function page(path, fn) {
    // <callback>
    if ('function' === typeof path) {
      return page('*', path);
    }

    // route <path> to <callback ...>
    if ('function' === typeof fn) {
      var route = new Route(path);
      for (var i = 1; i < arguments.length; ++i) {
        page.callbacks.push(route.middleware(arguments[i]));
      }
      // show <path> with [state]
    } else if ('string' === typeof path) {
      page['string' === typeof fn ? 'redirect' : 'show'](path, fn);
      // start [options]
    } else {
      page.start(path);
    }
  }

  /**
   * Callback functions.
   */

  page.callbacks = [];
  page.exits = [];

  /**
   * Current path being processed
   * @type {String}
   */
  page.current = '';

  /**
   * Number of pages navigated to.
   * @type {number}
   *
   *     page.len == 0;
   *     page('/login');
   *     page.len == 1;
   */

  page.len = 0;

  /**
   * Get or set basepath to `path`.
   *
   * @param {String} path
   * @api public
   */

  page.base = function(path) {
    if (0 === arguments.length) return base;
    base = path;
  };

  /**
   * Bind with the given `options`.
   *
   * Options:
   *
   *    - `click` bind to click events [true]
   *    - `popstate` bind to popstate [true]
   *    - `dispatch` perform initial dispatch [true]
   *
   * @param {Object} options
   * @api public
   */

  page.start = function(options) {
    options = options || {};
    if (running) return;
    running = true;
    if (false === options.dispatch) dispatch = false;
    if (false === options.decodeURLComponents) decodeURLComponents = false;
    if (false !== options.popstate) window.addEventListener('popstate', onpopstate, false);
    if (false !== options.click) window.addEventListener('click', onclick, false);
    if (true === options.hashbang) hashbang = true;
    if (!dispatch) return;
    var url = (hashbang && ~location.hash.indexOf('#!')) ? location.hash.substr(2) + location.search : location.pathname + location.search + location.hash;
    page.replace(url, null, true, dispatch);
  };

  /**
   * Unbind click and popstate event handlers.
   *
   * @api public
   */

  page.stop = function() {
    if (!running) return;
    page.current = '';
    page.len = 0;
    running = false;
    window.removeEventListener('click', onclick, false);
    window.removeEventListener('popstate', onpopstate, false);
  };

  /**
   * Show `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @param {Boolean} dispatch
   * @return {Context}
   * @api public
   */

  page.show = function(path, state, dispatch, push) {
    var ctx = new Context(path, state);
    page.current = ctx.path;
    if (false !== dispatch) page.dispatch(ctx);
    if (false !== ctx.handled && false !== push) ctx.pushState();
    return ctx;
  };

  /**
   * Goes back in the history
   * Back should always let the current route push state and then go back.
   *
   * @param {String} path - fallback path to go back if no more history exists, if undefined defaults to page.base
   * @param {Object} [state]
   * @api public
   */

  page.back = function(path, state) {
    if (page.len > 0) {
      // this may need more testing to see if all browsers
      // wait for the next tick to go back in history
      history.back();
      page.len--;
    } else if (path) {
      setTimeout(function() {
        page.show(path, state);
      });
    }else{
      setTimeout(function() {
        page.show(base, state);
      });
    }
  };


  /**
   * Register route to redirect from one path to other
   * or just redirect to another route
   *
   * @param {String} from - if param 'to' is undefined redirects to 'from'
   * @param {String} [to]
   * @api public
   */
  page.redirect = function(from, to) {
    // Define route from a path to another
    if ('string' === typeof from && 'string' === typeof to) {
      page(from, function(e) {
        setTimeout(function() {
          page.replace(to);
        }, 0);
      });
    }

    // Wait for the push state and replace it with another
    if ('string' === typeof from && 'undefined' === typeof to) {
      setTimeout(function() {
        page.replace(from);
      }, 0);
    }
  };

  /**
   * Replace `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @return {Context}
   * @api public
   */


  page.replace = function(path, state, init, dispatch) {
    var ctx = new Context(path, state);
    page.current = ctx.path;
    ctx.init = init;
    ctx.save(); // save before dispatching, which may redirect
    if (false !== dispatch) page.dispatch(ctx);
    return ctx;
  };

  /**
   * Dispatch the given `ctx`.
   *
   * @param {Object} ctx
   * @api private
   */

  page.dispatch = function(ctx) {
    var prev = prevContext,
      i = 0,
      j = 0;

    prevContext = ctx;

    function nextExit() {
      var fn = page.exits[j++];
      if (!fn) return nextEnter();
      fn(prev, nextExit);
    }

    function nextEnter() {
      var fn = page.callbacks[i++];

      if (ctx.path !== page.current) {
        ctx.handled = false;
        return;
      }
      if (!fn) return unhandled(ctx);
      fn(ctx, nextEnter);
    }

    if (prev) {
      nextExit();
    } else {
      nextEnter();
    }
  };

  /**
   * Unhandled `ctx`. When it's not the initial
   * popstate then redirect. If you wish to handle
   * 404s on your own use `page('*', callback)`.
   *
   * @param {Context} ctx
   * @api private
   */

  function unhandled(ctx) {
    if (ctx.handled) return;
    var current;

    if (hashbang) {
      current = base + location.hash.replace('#!', '');
    } else {
      current = location.pathname + location.search;
    }

    if (current === ctx.canonicalPath) return;
    page.stop();
    ctx.handled = false;
    location.href = ctx.canonicalPath;
  }

  /**
   * Register an exit route on `path` with
   * callback `fn()`, which will be called
   * on the previous context when a new
   * page is visited.
   */
  page.exit = function(path, fn) {
    if (typeof path === 'function') {
      return page.exit('*', path);
    }

    var route = new Route(path);
    for (var i = 1; i < arguments.length; ++i) {
      page.exits.push(route.middleware(arguments[i]));
    }
  };

  /**
   * Remove URL encoding from the given `str`.
   * Accommodates whitespace in both x-www-form-urlencoded
   * and regular percent-encoded form.
   *
   * @param {str} URL component to decode
   */
  function decodeURLEncodedURIComponent(val) {
    if (typeof val !== 'string') { return val; }
    return decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, ' ')) : val;
  }

  /**
   * Initialize a new "request" `Context`
   * with the given `path` and optional initial `state`.
   *
   * @param {String} path
   * @param {Object} state
   * @api public
   */

  function Context(path, state) {
    if ('/' === path[0] && 0 !== path.indexOf(base)) path = base + (hashbang ? '#!' : '') + path;
    var i = path.indexOf('?');

    this.canonicalPath = path;
    this.path = path.replace(base, '') || '/';
    if (hashbang) this.path = this.path.replace('#!', '') || '/';

    this.title = document.title;
    this.state = state || {};
    this.state.path = path;
    this.querystring = ~i ? decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
    this.pathname = decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
    this.params = {};

    // fragment
    this.hash = '';
    if (!hashbang) {
      if (!~this.path.indexOf('#')) return;
      var parts = this.path.split('#');
      this.path = parts[0];
      this.hash = decodeURLEncodedURIComponent(parts[1]) || '';
      this.querystring = this.querystring.split('#')[0];
    }
  }

  /**
   * Expose `Context`.
   */

  page.Context = Context;

  /**
   * Push state.
   *
   * @api private
   */

  Context.prototype.pushState = function() {
    page.len++;
    history.pushState(this.state, this.title, hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
  };

  /**
   * Save the context state.
   *
   * @api public
   */

  Context.prototype.save = function() {
    history.replaceState(this.state, this.title, hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
  };

  /**
   * Initialize `Route` with the given HTTP `path`,
   * and an array of `callbacks` and `options`.
   *
   * Options:
   *
   *   - `sensitive`    enable case-sensitive routes
   *   - `strict`       enable strict matching for trailing slashes
   *
   * @param {String} path
   * @param {Object} options.
   * @api private
   */

  function Route(path, options) {
    options = options || {};
    this.path = (path === '*') ? '(.*)' : path;
    this.method = 'GET';
    this.regexp = pathtoRegexp(this.path,
      this.keys = [],
      options.sensitive,
      options.strict);
  }

  /**
   * Expose `Route`.
   */

  page.Route = Route;

  /**
   * Return route middleware with
   * the given callback `fn()`.
   *
   * @param {Function} fn
   * @return {Function}
   * @api public
   */

  Route.prototype.middleware = function(fn) {
    var self = this;
    return function(ctx, next) {
      if (self.match(ctx.path, ctx.params)) return fn(ctx, next);
      next();
    };
  };

  /**
   * Check if this route matches `path`, if so
   * populate `params`.
   *
   * @param {String} path
   * @param {Object} params
   * @return {Boolean}
   * @api private
   */

  Route.prototype.match = function(path, params) {
    var keys = this.keys,
      qsIndex = path.indexOf('?'),
      pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
      m = this.regexp.exec(decodeURIComponent(pathname));

    if (!m) return false;

    for (var i = 1, len = m.length; i < len; ++i) {
      var key = keys[i - 1];
      var val = decodeURLEncodedURIComponent(m[i]);
      if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
        params[key.name] = val;
      }
    }

    return true;
  };

  /**
   * Handle "populate" events.
   */

  function onpopstate(e) {
    if (e.state) {
      var path = e.state.path;
      page.replace(path, e.state);
    } else {
      page.show(location.pathname + location.hash, undefined, undefined, false);
    }
  }

  /**
   * Handle "click" events.
   */

  function onclick(e) {

    if (1 !== which(e)) return;

    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (e.defaultPrevented) return;



    // ensure link
    var el = e.target;
    while (el && 'A' !== el.nodeName) el = el.parentNode;
    if (!el || 'A' !== el.nodeName) return;



    // Ignore if tag has
    // 1. "download" attribute
    // 2. rel="external" attribute
    if (el.getAttribute('download') || el.getAttribute('rel') === 'external') return;

    // ensure non-hash for the same path
    var link = el.getAttribute('href');
    if (!hashbang && el.pathname === location.pathname && (el.hash || '#' === link)) return;



    // Check for mailto: in the href
    if (link && link.indexOf('mailto:') > -1) return;

    // check target
    if (el.target) return;

    // x-origin
    if (!sameOrigin(el.href)) return;



    // rebuild path
    var path = el.pathname + el.search + (el.hash || '');

    // same page
    var orig = path;

    path = path.replace(base, '');
    if (hashbang) path = path.replace('#!', '');



    if (base && orig === path) return;

    e.preventDefault();
    page.show(orig);
  }

  /**
   * Event button.
   */

  function which(e) {
    e = e || window.event;
    return null === e.which ? e.button : e.which;
  }

  /**
   * Check if `href` is the same origin.
   */

  function sameOrigin(href) {
    var origin = location.protocol + '//' + location.hostname;
    if (location.port) origin += ':' + location.port;
    return (href && (0 === href.indexOf(origin)));
  }

  page.sameOrigin = sameOrigin;

},{"path-to-regexp":"/Users/daleharvey/src/ladybug/node_modules/page/node_modules/path-to-regexp/index.js"}],"/Users/daleharvey/src/ladybug/node_modules/page/node_modules/path-to-regexp/index.js":[function(require,module,exports){
var isArray = require('isarray');

/**
 * Expose `pathToRegexp`.
 */
module.exports = pathToRegexp;

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match escaped characters that would otherwise appear in future matches.
  // This allows the user to escape special characters that won't transform.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
  // "/route(\\d+)" => [undefined, undefined, undefined, "\d+", undefined]
  '([\\/.])?(?:\\:(\\w+)(?:\\(((?:\\\\.|[^)])*)\\))?|\\(((?:\\\\.|[^)])*)\\))([+*?])?',
  // Match regexp special characters that are always escaped.
  '([.+*?=^!:${}()[\\]|\\/])'
].join('|'), 'g');

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {String} group
 * @return {String}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$\/()])/g, '\\$1');
}

/**
 * Attach the keys as a property of the regexp.
 *
 * @param  {RegExp} re
 * @param  {Array}  keys
 * @return {RegExp}
 */
function attachKeys (re, keys) {
  re.keys = keys;
  return re;
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {String}
 */
function flags (options) {
  return options.sensitive ? '' : 'i';
}

/**
 * Pull out keys from a regexp.
 *
 * @param  {RegExp} path
 * @param  {Array}  keys
 * @return {RegExp}
 */
function regexpToRegexp (path, keys) {
  // Use a negative lookahead to match only capturing groups.
  var groups = path.source.match(/\((?!\?)/g);

  if (groups) {
    for (var i = 0; i < groups.length; i++) {
      keys.push({
        name:      i,
        delimiter: null,
        optional:  false,
        repeat:    false
      });
    }
  }

  return attachKeys(path, keys);
}

/**
 * Transform an array into a regexp.
 *
 * @param  {Array}  path
 * @param  {Array}  keys
 * @param  {Object} options
 * @return {RegExp}
 */
function arrayToRegexp (path, keys, options) {
  var parts = [];

  for (var i = 0; i < path.length; i++) {
    parts.push(pathToRegexp(path[i], keys, options).source);
  }

  var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));
  return attachKeys(regexp, keys);
}

/**
 * Replace the specific tags with regexp strings.
 *
 * @param  {String} path
 * @param  {Array}  keys
 * @return {String}
 */
function replacePath (path, keys) {
  var index = 0;

  function replace (_, escaped, prefix, key, capture, group, suffix, escape) {
    if (escaped) {
      return escaped;
    }

    if (escape) {
      return '\\' + escape;
    }

    var repeat   = suffix === '+' || suffix === '*';
    var optional = suffix === '?' || suffix === '*';

    keys.push({
      name:      key || index++,
      delimiter: prefix || '/',
      optional:  optional,
      repeat:    repeat
    });

    prefix = prefix ? ('\\' + prefix) : '';
    capture = escapeGroup(capture || group || '[^' + (prefix || '\\/') + ']+?');

    if (repeat) {
      capture = capture + '(?:' + prefix + capture + ')*';
    }

    if (optional) {
      return '(?:' + prefix + '(' + capture + '))?';
    }

    // Basic parameter support.
    return prefix + '(' + capture + ')';
  }

  return path.replace(PATH_REGEXP, replace);
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(String|RegExp|Array)} path
 * @param  {Array}                 [keys]
 * @param  {Object}                [options]
 * @return {RegExp}
 */
function pathToRegexp (path, keys, options) {
  keys = keys || [];

  if (!isArray(keys)) {
    options = keys;
    keys = [];
  } else if (!options) {
    options = {};
  }

  if (path instanceof RegExp) {
    return regexpToRegexp(path, keys, options);
  }

  if (isArray(path)) {
    return arrayToRegexp(path, keys, options);
  }

  var strict = options.strict;
  var end = options.end !== false;
  var route = replacePath(path, keys);
  var endsWithSlash = path.charAt(path.length - 1) === '/';

  // In non-strict mode we allow a slash at the end of match. If the path to
  // match already ends with a slash, we remove it for consistency. The slash
  // is valid at the end of a path match, not in the middle. This is important
  // in non-ending mode, where "/test/" shouldn't match "/test//route".
  if (!strict) {
    route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?';
  }

  if (end) {
    route += '$';
  } else {
    // In non-ending mode, we need the capturing groups to match as much as
    // possible by using a positive lookahead to the end or next path segment.
    route += strict && endsWithSlash ? '' : '(?=\\/|$)';
  }

  return attachKeys(new RegExp('^' + route, flags(options)), keys);
}

},{"isarray":"/Users/daleharvey/src/ladybug/node_modules/page/node_modules/path-to-regexp/node_modules/isarray/index.js"}],"/Users/daleharvey/src/ladybug/node_modules/page/node_modules/path-to-regexp/node_modules/isarray/index.js":[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],"/Users/daleharvey/src/ladybug/node_modules/timeago/timeago.js":[function(require,module,exports){
/*
 * node-timeago
 * Cam Pedersen
 * <diffference@gmail.com>
 * Oct 6, 2011
 * Timeago is a jQuery plugin that makes it easy to support automatically
 * updating fuzzy timestamps (e.g. "4 minutes ago" or "about 1 day ago").
 *
 * @name timeago
 * @version 0.10.0
 * @requires jQuery v1.2.3+
 * @author Ryan McGeary
 * @license MIT License - http://www.opensource.org/licenses/mit-license.php
 *
 * For usage and examples, visit:
 * http://timeago.yarp.com/
 *
 * Copyright (c) 2008-2011, Ryan McGeary (ryanonjavascript -[at]- mcgeary [*dot*] org)
 */
module.exports = function (timestamp) {
  if (timestamp instanceof Date) {
    return inWords(timestamp);
  } else if (typeof timestamp === "string") {
    return inWords(parse(timestamp));
  } else if (typeof timestamp === "number") {
    return inWords(new Date(timestamp))
  }
};

var settings = {
  allowFuture: false,
  strings: {
    prefixAgo: null,
    prefixFromNow: null,
    suffixAgo: "ago",
    suffixFromNow: "from now",
    seconds: "less than a minute",
    minute: "about a minute",
    minutes: "%d minutes",
    hour: "about an hour",
    hours: "about %d hours",
    day: "a day",
    days: "%d days",
    month: "about a month",
    months: "%d months",
    year: "about a year",
    years: "%d years",
    numbers: []
  }
};

var $l = settings.strings;

module.exports.settings = settings;

$l.inWords = function (distanceMillis) {
  var prefix = $l.prefixAgo;
  var suffix = $l.suffixAgo;
  if (settings.allowFuture) {
    if (distanceMillis < 0) {
      prefix = $l.prefixFromNow;
      suffix = $l.suffixFromNow;
    }
  }

  var seconds = Math.abs(distanceMillis) / 1000;
  var minutes = seconds / 60;
  var hours = minutes / 60;
  var days = hours / 24;
  var years = days / 365;

  function substitute (stringOrFunction, number) {
    var string = typeof stringOrFunction === 'function' ? stringOrFunction(number, distanceMillis) : stringOrFunction;
    var value = ($l.numbers && $l.numbers[number]) || number;
    return string.replace(/%d/i, value);
  }

  var words = seconds < 45 && substitute($l.seconds, Math.round(seconds)) ||
    seconds < 90 && substitute($l.minute, 1) ||
    minutes < 45 && substitute($l.minutes, Math.round(minutes)) ||
    minutes < 90 && substitute($l.hour, 1) ||
    hours < 24 && substitute($l.hours, Math.round(hours)) ||
    hours < 48 && substitute($l.day, 1) ||
    days < 30 && substitute($l.days, Math.floor(days)) ||
    days < 60 && substitute($l.month, 1) ||
    days < 365 && substitute($l.months, Math.floor(days / 30)) ||
    years < 2 && substitute($l.year, 1) ||
    substitute($l.years, Math.floor(years));

  return [prefix, words, suffix].join(" ").toString().trim();
};

function parse (iso8601) {
  if (!iso8601) return;
  var s = iso8601.trim();
  s = s.replace(/\.\d\d\d+/,""); // remove milliseconds
  s = s.replace(/-/,"/").replace(/-/,"/");
  s = s.replace(/T/," ").replace(/Z/," UTC");
  s = s.replace(/([\+\-]\d\d)\:?(\d\d)/," $1$2"); // -04:00 -> -0400
  return new Date(s);
}

$l.parse = parse;

function inWords (date) {
  return $l.inWords(distance(date));
}

function distance (date) {
  return (new Date().getTime() - date.getTime());
}

},{}]},{},["/Users/daleharvey/src/ladybug/index.js"]);
