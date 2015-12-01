<div>

  <header>
    <a class="headerBtn"></a>
    <h2>File a Bug</h2>
    <a class="headerBtn" id="submit">Submit</a>
  </header>

  <form id="createBug">
    <input type="text" placeholder="Title" id="summary"
           inputmode="latin-prose" x-inputmode="latin-prose" />
    <input type="text" id="component" value="Firefox OS - Gaia::Feedback" />
    <textarea placeholder="Description" id="description" ></textarea>

    <span class="btn-file attachBtn attach">
      <input type="file" multiple />
      <span>Add an Attachment</span>
    </span>
    <ul class="attachments"></ul>

    <datalist id="componentList"></datalist>

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
