<div>
  <ul id="comments"></ul>
  <form>
    <div class="row">
      <input type="text" id="assigned" />
      <input type="button" value="Take Bug" id="take" />
    </div>
    <select id="status">
      <option>UNCONFIRMED</option>
      <option>NEW</option>
      <option>ASSIGNED</option>
      <option>RESOLVED - FIXED</option>
      <option>RESOLVED - INVALID</option>
      <option>RESOLVED - WONTFIX</option>
      <option>RESOLVED - INCOMPLETE</option>
    </select>
    <textarea placeholder="Reply..." id="commentInput"></textarea>
    <input type="submit" value="Save Changes" />
  </form>
</div>
