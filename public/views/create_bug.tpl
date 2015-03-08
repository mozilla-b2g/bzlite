<form id="createBug">

  <header data-version="1">
    <a class="headerBtn close hidden"></a>
    <h2>File a Bug</h2>
    <span class="btn-file headerBtn attach">
      <input type="file" multiple />
    </span>
  </header>

  <div class="createBugError warning" hidden>Error Filing Bug</div>
  <input type="text" placeholder="Title" id="summary" />
  <input list="components" id="component" value="Gaia::Feedback" disabled hidden />
  <textarea placeholder="Description" id="description" ></textarea>
  <ul class="attachments"></ul>
  <input type="submit" value="Submit Bug" />

</form>
