<div>

  <form id="createBug">
    <div class="input">
      <input type="text" placeholder="Title" id="summary"
             inputmode="latin-prose" x-inputmode="latin-prose" />
    </div>
    <input type="text" id="component" value="Firefox OS - Gaia::Feedback" />
    <div class="input">
      <textarea placeholder="Description" id="description" ></textarea>
    </div>
    <span class="btn-file attachBtn attach">
      <input type="file" multiple />
      <span>Add an Attachment</span>
    </span>
    <ul class="attachments"></ul>

    <datalist id="componentList"></datalist>

    <input type="submit" class="btn" id="create-bug" />

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
