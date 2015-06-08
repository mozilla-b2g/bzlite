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
      </select>
    </div>
    <textarea placeholder="Reply..." id="commentInput"></textarea>
    <input type="text" placeholder="Need More Information" id="needinfo" />
    <input type="submit" value="Save Changes" />
  </form>
</div>
