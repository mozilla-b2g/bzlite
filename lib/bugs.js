// This module is intended to be a higher level wrapper over bz.js
// that deals with combining queries against bugzilla and caching.

'use strict';

var cache = require('./pouch-promise-cache');

function assigned(bz, who) {
  return bz.searchBugs({
    j_top: 'OR',
    f1:'assigned_to',
    v1: who,
    o1: 'equals',
    order: 'changeddate desc',
    resolution: '---',
    query_format: 'advanced',
    include_fields: 'summary,id,assigned_to,flags,last_change_time'
  });
}

function flagged(bz, who) {
  return bz.searchBugs({
    j_top: 'OR',
    f1:'requestees.login_name',
    v1: who,
    o1: 'equals',
    order: 'changeddate desc',
    resolution: '---',
    query_format: 'advanced',
    include_fields: 'summary,id,assigned_to,flags,last_change_time'
  });
}

function flags(bz, who) {
  return bz.searchBugs({
    j_top: 'OR',
    f1:'setters.login_name',
    v1: who,
    o1: 'equals',
    order: 'changeddate desc',
    resolution: '---',
    query_format: 'advanced',
    include_fields: 'summary,id,assigned_to,flags,last_change_time'
  });
}

function fetchAll(bz, user) {
  return Promise.all([
    assigned(bz, user),
    flagged(bz, user),
    flags(bz, user)
  ]);
}

// If a bug updates, refresh this cache
function bugUpdated(bz, user, id) {
  loadDashboard(bz, user, true);
}

// We cache the dashboard results for 2 minutes just to ensure it loads
// immediately but if there are remote changes they dont take too long
// to propogate
function loadDashboard(bz, user, cacheBust) {
  var maxAge = cacheBust ? 0 : 1000 * 60 * 2;
  return cache(fetchAll, {maxAge: maxAge})(bz, user);
}

module.exports = {};
module.exports.loadDashboard = loadDashboard;
module.exports.bugUpdated = bugUpdated;
