<div>
  <ul id="comments"></ul>
  <form>
    <div class="row">
      <div>Assigned:<br /><input type="text" id="assigned" /></div>
      <input type="button" value="Take Bug" id="take" class="btn sidebtn" />
    </div>
    <div class="row">
      <label>Status:</label>
      <select id="status">
        <option>UNCONFIRMED</option>
        <option>NEW</option>
        <option>ASSIGNED</option>
        <option>RESOLVED - FIXED</option>
        <option>RESOLVED - INVALID</option>
        <option>RESOLVED - WONTFIX</option>
        <option>RESOLVED - INCOMPLETE</option>
        <option>RESOLVED - DUPLICATE</option>
      </select>
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
