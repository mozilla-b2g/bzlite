<div>
  <div id="bugAttachments"></div>
  <ul id="comments"></ul>
  <form>
    Assigned:
    <div class="row">
      <input type="text" id="assigned" list="usersList" autocomplete="off" />
      <input type="button" value="Take Bug" id="take" class="btn sidebtn" />
    </div>
    <div class="row">
      <label>Status:</label>
      <select id="status"></select>
    </div>
    <input type="number" placeholder="Enter Bug ID" id="duplicateId" hidden />
    <textarea placeholder="Reply..." id="commentInput"></textarea>
    <input type="text" placeholder="Need More Information" id="needinfo"
      list="usersList" autocomplete="off" />
    <div id="needinfos"></div>
    <input type="submit" value="Save Changes" disabled />
  </form>

  <datalist id="usersList"></datalist>

</div>
