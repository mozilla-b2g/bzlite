<div>

  <header>
    <a href="/" class="headerBtn close" data-ctx-capture="true"></a>
    <h2>File a bug</h2>
    <span class="headerBtn"></span>
  </header>

  <form id="createBug">
    <input type="text" placeholder="Title" id="summary" />
    <input list="components" id="component" value="Gaia::Feedback" disabled hidden />
    <textarea placeholder="Description" id="description" ></textarea>

    <span class="btn-file attachBtn attach">
      <input type="file" multiple />
      <span>Add an Attachment</span>
    </span>
    <ul class="attachments"></ul>

    <input type="submit" value="Submit Bug" />
  </form>

  <div id="pickAttachments" class="hidden">

    <header>
      <h2>Select Files</h2>
    </header>

    <form id="pickAttachmentsForm">
      <p>Select the files you want to attach to the bug</p>
      <div id="attachments"></div>
      <input type="submit" value="Attach" />
    </form>

  </div>

</div>
