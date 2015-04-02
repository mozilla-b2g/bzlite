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

function value(selector) {
  return document.querySelector(selector).value.trim();
}

function deleteAttachment(e) {
  bug.attachments = bug.attachments.filter(function(file) {
    return file.name !== e.target.dataset.name;
  });
  bugChanged();
  drawAttachments();
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
    bug.attachments.map(function(file) {
      var types = ['image/png', 'image/jpg', 'image/jpeg'];
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
      if (types.indexOf(file.type) !== -1) {
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
  for (var i = 0; i < files.length; i++) {
    var file = files.item(i);
    var reader = new FileReader();
    reader.onload = (function(theFile) {
      return function(e) {
        bug.attachments.push({
          name: theFile.name,
          type: theFile.type,
          data: e.target.result.split(',')[1]
        });
        bugChanged();
        drawAttachments();
      }
    })(file);
    reader.readAsDataURL(file);
  }
}


function addAttachments(blobs, names) {
  blobs.forEach(function(blob, i) {
    var reader = new window.FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = function() {
      bug.attachments.push({
        name: names[i],
        type: blob.type,
        data: reader.result
      });
      bugChanged();
      drawAttachments();
    }
  });
}


var timeout;
function bugChanged() {
  if (timeout) {
    clearTimeout(timeout);
  }
  timeout = setTimeout(updateBugData, 1000);
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
    localforage.setItem('bugPending', true);
    updateBugData();
    document.location.href = '/login/';
    return;
  }

  var dialog = utils.dialog('Submitting Bug ...');

  this.app.bugzilla.createBug({
    product: 'Firefox OS',
    component: value('#component'),
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

    if (self.app.user) {
      form.querySelector('.logout').hidden = false;
    }

    // Activity data overrides locally stored data for now
    var activity = self.app.activity;
    if (activity) {
      addAttachments(activity.data.blobs, activity.data.filenames);
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
        localforage.removeItem('bugPending');
        // Yield to render since we pull the bug values
        // from the dom, kinda nasty
        submitBug.call(self);
      }
    });

    return form;
  });
};

module.exports = function (app) {
  return new CreateBug(app);
};
