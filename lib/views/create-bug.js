'use strict';

var filesize = require('filesize');
var localforage = require('localforage');

var tpl = require('../template.js');
var utils = require('../utils.js');
var conf = require('../config.js');

var app, form, bug;

var KEY = 'bugData';

// When we pick up activity data we check the files in
// this list to be included by default
var DEFAULT_CHECKED = [
  'dev-log-main.log',
  'properties.log',
  'system-b2g-application.ini',
  'logshake-screenshot.png',
  'screenshot.png'
];

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

function previewAttachment(attachment) {
  if (typeof(MozActivity) !== 'undefined') {
    var activity = new MozActivity({
      name: 'open',
      data: {
        type: attachment.type,
        filename: attachment.name,
        blob: attachment.blob,
        exitWhenHidden: true
      }
    });
    activity.onerror = function() {
      console.warn('Problem with "open" activity', activity.error.name);
    };
  } else {
    var objectURL = URL.createObjectURL(attachment.blob);
    window.open(objectURL);
  }
}

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
      if (!file.blob) {
        return;
      }
      var dom = row.cloneNode(true);
      var a = dom.querySelector('a');
      var bytes = file.blob.size || 0;
      dom.querySelector('.name').textContent = file.name;
      dom.querySelector('.size').textContent = filesize(bytes, {round: 0});
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

// Add the file blobs from the input event to the bug's attachments and render
// the attachment list.
function inputChanged(e) {
  var files = e.target.files;
  var attachments = [];
  for (var i = 0; i < files.length; i++) {
    pushAttachment(files.item(i));
  }
  bugChanged();
}

// Add the blobs coming from the capture logs activity to the current bug's
// attachments and render the attachment list.
function addActivityAttachments(blobs, names, picked) {
  blobs.forEach(function(blob, i) {
    if (picked.indexOf(names[i]) === -1) {
      return;
    }
    return pushAttachment(blob, names[i]);
  });
  bugChanged();
}

// Add a single attachment, keeping track of the file's Blob to base64 encode
// later.
function pushAttachment(file, name) {
  bug.attachments.push({
    name: name || file.name,
    type: file.type,
    blob: file
  });
}

// Read an attachment's file Blob, returning a Promise that will be resolved
// with the base64 encoding of the file's contents.
function encodeAttachment(attachment) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function(e) {
      // Extract the raw base64 data from a base64 data url
      var dataUrl = e.target.result;
      var base64Data = dataUrl.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reader.onabort = function(error) {
      console.error('Error reading file attachment', error);
      reject(error);
    };
    reader.readAsDataURL(attachment.blob);
  });
}


// Debounce calls to save bug data, its called on every single
// change so avoid thrashing indexedDB
var debouncer;
function bugChanged() {
  if (debouncer) {
    clearTimeout(debouncer);
  }

  bug.summary = value('#summary');
  bug.description = value('#description');
  drawAttachments();

  debouncer = setTimeout(storeBugData, 1000, KEY, bug);
}


function storeBugData(KEY, bug) {
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

  if (!app.user) {
    localforage.setItem('bugPending', true).then(function() {
      storeBugData(KEY, bug);
      app.cancelLogin = true;
      app.page('/login/');
    });
    return;
  }

  var dialog = utils.dialog('Submitting Bug…');
  var description = 'User-Agent: ' + navigator.userAgent + '\n\n' +
    bug.description;

  app.bugzilla.createBug({
    product: 'Firefox OS',
    component: (process.env.TEST ? 'Gaia' : value('#component')),
    op_sys: 'All',
    platform: 'All',
    summary: bug.summary,
    description: description,
    version: 'unspecified',
    keywords: 'dogfood',
    status_whiteboard: '[bzlite]'
  }).then(function(result) {
    var id = result.id;
    function createAttachments() {
      if (!bug.attachments.length) {
        localforage.setItem(KEY, null).then(function() {
          dialog.close();
          app.page('/bug/' + result.id);
        });
        return;
      }
      var file = bug.attachments.pop();
      encodeAttachment(file).then(function(data) {
        return app.bugzilla.createAttachment(id, {
          ids: [id],
          data: data,
          file_name: file.name,
          summary: file.name,
          content_type: file.type || 'application/octet-stream'
        });
      }).then(function() {
        createAttachments();
      }).catch(function() {
        console.error('Error writing', file.name);
        createAttachments();
      });
    };
    createAttachments();
  }).catch(function(e) {
    var msg = e.message || 'There was an unknown error';
    if (!navigator.onLine) {
      msg = "Your device is currently offline, " +
        "try again when the device is connected."
    }
    alert(msg);
    dialog.close();
  });
}

function createAttachmentRow(name) {
  var label = document.createElement('label');
  label.classList.add('row');
  var checkbox = document.createElement('input');
  checkbox.setAttribute('type', 'checkbox');
  checkbox.setAttribute('value', name);
  var span = document.createElement('span');
  span.textContent = name;

  label.appendChild(checkbox);
  label.appendChild(span);
  if (DEFAULT_CHECKED.indexOf(name) !== -1) {
    checkbox.checked = true;
  }
  return label;
}

module.exports = function(ctx) {
  app = ctx.app;

  return tpl.read('/views/create_bug.tpl').then(function(_form) {
    form = _form;
    return localforage.getItem(KEY);
  }).then(function(data) {

    newBug();

    if (app.activity) {
      var activity = app.activity;
      var dialog = form.querySelector('#pickAttachments');
      var list = form.querySelector('#attachments');
      var attachForm = form.querySelector('#pickAttachmentsForm');
      activity.data.blobs.forEach(function(blob, i) {
        list.appendChild(createAttachmentRow(activity.data.filenames[i]));
      });
      attachForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var checked = attachForm.querySelectorAll('input:checked');
        var files = [].map.call(checked, function(e) { return e.value; });
        addActivityAttachments(activity.data.blobs, activity.data.filenames, files);
        app.activity = null;
        dialog.classList.add('hidden');
      });
      dialog.classList.remove('hidden');
    } else if (data) {
      bug = data;
      updateFromBugData(form);
    }

    [].forEach.call(form.querySelectorAll('input[type=file]'), function(file) {
      file.addEventListener('change', inputChanged.bind(self));
    });

    form.addEventListener('input', bugChanged);
    form.querySelector('#createBug')
      .addEventListener('submit', formSubmitted.bind(self));

    localforage.getItem('bugPending').then(function(value) {
      if (value) {
        localforage.removeItem('bugPending').then(function() {
          // Yield to render since we pull the bug values
          // from the dom, kinda nasty
          if (app.user) {
            submitBug.call(null, true);
          }
        });
      }
    });

    return form;
  });
};
