'use strict';

var filesize = require('filesize');
var localforage = require('localforage');

var tpl = require('../template.js');
var utils = require('../utils.js');
var conf = require('../config.js');

var form, bug;

var KEY = 'bugData';

function newBug() {
  bug = {
    summary: null,
    description: null,
    attachments: []
  };
}

function isImage(file) {
  var IMAGE_TYPES = ['image/png', 'image/jpg', 'image/jpeg'];
  return IMAGE_TYPES.indexOf(file.type) !== -1
}

function value(selector) {
  return document.querySelector(selector).value.trim();
}

function deleteAttachment(e) {
  bug.attachments = bug.attachments.filter(function(file) {
    return file.name !== e.target.dataset.name;
  });
  bugChanged();
};

function previewAttachment(file) {
  var preview = document.createElement('div');

  preview.classList.add('preview');
  preview.style.backgroundImage =
    'url(data:' + file.type + ';base64,' + file.data + ')';

  preview.addEventListener('click', function() {
    document.body.removeChild(preview);
  });

  document.body.appendChild(preview);
};

function drawAttachments() {
  tpl.read('/views/attachment-row.tpl').then(function(row) {
    var frag = document.createDocumentFragment();

    bug.attachments.sort(function (a, b) {
      if (isImage(a) && isImage(b)) { return a.name > b.name; }
      if (isImage(a)) { return -1; }
      if (isImage(b)) { return 1; }
      return 0;
    });

    bug.attachments.map(function(file) {
      var dom = row.cloneNode(true);
      var a = dom.querySelector('a');
      var bytes = Math.round((file.data.length - 814) / 1.37);
      // Tiny files will be negative due to approximiating base64
      // compression size
      if (bytes < 0) {
        bytes = 0;
      }
      dom.querySelector('.name').textContent = file.name;
      dom.querySelector('.size').textContent = filesize(bytes);
      a.dataset.name = file.name;
      a.addEventListener('click', deleteAttachment);
      if (isImage(file)) {
        var span = dom.querySelector('span');
        span.classList.add('previewLink');
        span.addEventListener('click', function() {
          previewAttachment(file);
        });
      }
      frag.appendChild(dom);
    });
    form.querySelector('.attachments').innerHTML = '';
    form.querySelector('.attachments').appendChild(frag);
  });
}

// We currently base64 all incoming files as that is what the bmo
// API needs anyway, may want to avoid encoding until they are sent
function inputChanged(e) {
  var files = e.target.files;
  var attachments = [];
  for (var i = 0; i < files.length; i++) {
    attachments.push(pushAttachment(files.item(i)));
  }
  Promise.all(attachments).then(bugChanged);
}

// Add the blobs coming from the capture logs activity
// to the current bug.
function addActivityAttachments(blobs, names) {
  Promise.all(blobs.map(function(blob, i) {
    return pushAttachment(blob, names[i]);
  })).then(bugChanged);
}


function pushAttachment(file, name) {
  return new Promise(function(resolve) {
    var reader = new FileReader();
    reader.onload = function(e) {
      bug.attachments.push({
        name: name || file.name,
        type: file.type,
        data: e.target.result.split(',')[1]
      });
      resolve();
    };
    reader.onerror = reader.onabort = function(error) {
      console.error('Error reading file attachment', error);
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}


// Debounce calls to save bug data, its called on every single
// change so avoid thrashing indexedDB
var debouncer;
function bugChanged() {
  if (debouncer) {
    clearTimeout(debouncer);
  }
  debouncer = setTimeout(updateBugData, 1000);
  drawAttachments();
}


function updateBugData() {
  bug.summary = value('#summary');
  bug.description = value('#description');
  localforage.setItem(KEY, bug);
}


function updateFromBugData(el) {
  el.querySelector('#summary').value = bug.summary;
  el.querySelector('#description').value = bug.description;
  drawAttachments();
}


function formSubmitted(e) {
  e.preventDefault();
  submitBug.call(this);
}

function submitBug() {
  if (!this.app.user) {
    localforage.setItem('bugPending', true).then(function() {
      updateBugData();
      this.app.page('/login/');
    }.bind(this));
    return;
  }

  var dialog = utils.dialog('Submitting Bug…');

  this.app.bugzilla.createBug({
    product: 'Firefox OS',
    component: (process.env.TEST ? 'Gaia' : value('#component')),
    op_sys: 'All',
    platform: 'All',
    summary: bug.summary,
    description: bug.description,
    version: 'unspecified'
  }).then(function(result) {
    var id = result.id;
    var self = this;
    function createAttachments() {
      if (!bug.attachments.length) {
        localforage.setItem(KEY, null).then(function() {
          dialog.close();
          utils.toaster('Bug Submitted');
          if (conf.version === 1) {
            self.app.page('/create/');
          } else {
            self.app.page('/bug/' + result.id);
          }
        });
        return;
      }
      var file = bug.attachments.pop();
      self.app.bugzilla.createAttachment(id, {
        ids: [id],
        data: file.data,
        file_name: file.name,
        summary: file.name,
        content_type: file.type || 'application/octet-stream'
      }).then(function() {
        createAttachments();
      }).catch(function() {
        console.error('Error writing', file.name);
        createAttachments();
      });
    };
    createAttachments();
  }.bind(this)).catch(function(e) {
    var msg = e.message || 'There was an unknown error';
    if (!navigator.onLine) {
      msg = "Your device is currently offline, " +
        "try again when the device is connected."
    }
    utils.alert(msg);
    dialog.close();
  });
}

function CreateBug(app) {
  this.app = app;
};

CreateBug.prototype.render = function(ctx) {
  var self = this;
  return tpl.read('/views/create_bug.tpl').then(function(_form) {
    form = _form;
    return localforage.getItem(KEY);
  }).then(function(data) {

    newBug();

    var sel = self.app.user ? '.logout' : '.login';
    form.querySelector(sel).hidden = false;

    // Activity data overrides locally stored data for now
    var activity = self.app.activity;
    if (activity) {
      addActivityAttachments(activity.data.blobs, activity.data.filenames);
      self.app.activity = null;
    } else if (data) {
      bug = data;
      updateFromBugData(form);
    }

    [].forEach.call(form.querySelectorAll('input[type=file]'), function(file) {
      file.addEventListener('change', inputChanged.bind(self));
    });

    form.addEventListener('input', bugChanged);
    form.addEventListener('submit', formSubmitted.bind(self));

    localforage.getItem('bugPending').then(function(value) {
      if (value) {
        localforage.removeItem('bugPending').then(function() {
          // Yield to render since we pull the bug values
          // from the dom, kinda nasty
          if (self.app.user) {
            submitBug.call(self, true);
          }
        });
      }
    });

    return form;
  });
};

module.exports = function (app) {
  return new CreateBug(app);
};
