// This module is intended to be a higher level wrapper over bz.js
// that deals with combining queries against bugzilla and caching.

'use strict';

var localForage = require('localforage');
var cache = require('./pouch-promise-cache');

var DASHBOARD_BUGS = 'dashboard-bugs';

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
  ]).then(function(results) {
    var bugs = {};
    results.forEach(function(result) {
      result.bugs.forEach(function(bug) {
        bugs[bug.id] = true;
      });
    });
    localForage.setItem(DASHBOARD_BUGS, Object.keys(bugs));
    return results;
  });
}

// If we update one of the bugs contained within the dashboard locally
// then refresh the cache
function bugUpdated(bz, user, id) {
  localForage.getItem(DASHBOARD_BUGS).then(function(bugs) {
    if (bugs.indexOf(id.toString()) !== -1) {
      loadDashboard(bz, user);
    }
  });
}

// We cache the dashboard results for 2 minutes just to ensure it loads
// immediately but if there are remote changes they dont take too long
// to propogate
function loadDashboard(bz, user) {
  return cache(fetchAll, {maxAge: 1000 * 60 * 2})(bz, user);
}

module.exports = {};
module.exports.loadDashboard = loadDashboard;
module.exports.bugUpdated = bugUpdated;
