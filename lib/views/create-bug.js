'use strict';

var tpl = require('../template.js');

var form;
var attachments = [];

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
    var li = document.createElement('li');
    var span = document.createElement('span');
    var btn = document.createElement('a');
    btn.classList.add('deleteAttachment');
    btn.dataset.name = file.name;
    btn.addEventListener('click', deleteAttachment);
    span.textContent = file.name;
    li.appendChild(span);
    li.appendChild(btn);
    frag.appendChild(li);
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
    Promise.all(attachments.map(function(file) {
      return this.app.bugzilla.createAttachment(id, {
        ids: [id],
        data: file.data,
        file_name: file.name,
        summary: file.name,
        content_type: file.type
      });
    }.bind(this))).then(function() {
      document.location.href = '/bug/' + result.id;
    });
  }.bind(this)).catch(function() {
    form.querySelector('.createBugError').hidden = false;
  });
}

function CreateBug(app) {
  this.app = app;
};

CreateBug.prototype.render = function(args) {
  return tpl.read('/views/create_bug.tpl').then((function(_form) {
    form = _form;
    form.querySelector('input[type=file]')
      .addEventListener('change', inputChanged.bind(this));
    form.addEventListener('submit', formSubmitted.bind(this));
    return form;
  }).bind(this));
};

module.exports = function (app) {
  return new CreateBug(app);
};