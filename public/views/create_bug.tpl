<div>

  <header data-version="1">
    <a class="headerBtn close"></a>
    <h2>File a Bug</h2>
    <a href="/logout/" class="headerBtn logout" hidden>Logout</a>
    <a href="/login/" class="headerBtn login" hidden>Login</a>
  </header>

  <form id="createBug">
    <input type="text" placeholder="Title" id="summary" />
    <input list="components" id="component" value="Gaia::Feedback" disabled hidden />
    <textarea placeholder="Description" id="description" ></textarea>

    <span class="btn-file attachBtn attach">
      <input type="file" multiple />
      Add an Attachment
    </span>
    <ul class="attachments"></ul>

    <input type="submit" value="Submit Bug" />
  </form>

</div>
