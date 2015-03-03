'use strict';

var tpl = require('../template.js');

var form;
var attachments = [];

function render(str, obj) {
  var div = document.createElement('div');
  Object.keys(obj).forEach(function(k) {
    str = str.replace(new RegExp('{' + k + '}', 'g'), obj[k]);
  });
  div.innerHTML = str;
  return div.firstChild;
}

function template() {
  return `<li>
    <img src="{preview}" style="display: {display}" />
    <span>{name}</span>
    <a data-name="{name}" class="deleteAttachment"></a>
  </li>`;
}

function value(selector) {
  return document.querySelector(selector).value.trim();
}

function deleteAttachment(e) {
  attachments = attachments.filter(function(file) {
    return file.name !== e.target.dataset.name;
  });
  drawAttachments();
};

function drawAttachments() {
  var frag = document.createDocumentFragment();
  attachments.map(function(file) {
    var data = {name: file.name, display: 'none'};
    if (file.type === 'image/png') {
      data.display = 'block';
      data.preview = 'data:image/png;base64,' + file.data;
    }
    var dom = render(template(), data);
    dom.querySelector('a').addEventListener('click', deleteAttachment);
    frag.appendChild(dom);
  });
  form.querySelector('.attachments').innerHTML = '';
  form.querySelector('.attachments').appendChild(frag);
}

function inputChanged(e) {
  var files = e.target.files;
  for (var i = 0; i < files.length; i++) {
    var file = files.item(i);
    var reader = new FileReader();
    reader.onload = (function(theFile) {
      return function(e) {
        attachments.push({
          name: theFile.name,
          type: theFile.type,
          data: e.target.result.split(',')[1]
        });
        drawAttachments();
      }
    })(file);
    reader.readAsDataURL(file);
  }
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
    var id = result.id;
    var self = this;
    function createAttachments() {
      if (!attachments.length) {
        document.location.href = '/bug/' + result.id;
        return;
      }
      var file = attachments.pop();
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
  }.bind(this)).catch(function() {
    form.querySelector('.createBugError').hidden = false;
  });
}

function addAttachments(blobs, names) {
  blobs.forEach(function(blob, i) {
    var reader = new window.FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = function() {
      attachments.push({
        name: names[i],
        type: blob.type,
        data: reader.result
      });
      drawAttachments();
    }
  });
}

function CreateBug(app) {
  this.app = app;
};

CreateBug.prototype.render = function(ctx) {
  return tpl.read('/views/create_bug.tpl').then((function(_form) {

    form = _form;

    if (this.app.activity) {
      addAttachments(this.app.activity.data.blobs, this.app.activity.data.filenames);
      this.app.activity = null;
    }

    form.querySelector('input[type=file]')
      .addEventListener('change', inputChanged.bind(this));
    form.addEventListener('submit', formSubmitted.bind(this));

    return form;
  }).bind(this));
};

module.exports = function (app) {
  return new CreateBug(app);
};
