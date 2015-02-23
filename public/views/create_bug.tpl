<form id="createBug">
  <div class="createBugError warning" hidden>Error Filing Bug</div>
  <input type="text" placeholder="Bug Summary" id="summary" />
  <input list="components" id="component" value="Gaia" disabled hidden />
  <textarea placeholder="Bug Description" id="description" ></textarea>
  <input type="file" multiple />
  <ul class="attachments"></ul>
  <input type="submit" value="Submit Bug" />
</form>