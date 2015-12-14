[Bugzilla Lite](http://bzlite.com/) - Bugzilla Lite
===================================================

Bugzilla Lite is a bugzilla client designed to work well on mobile devices.


Running Bugzilla Lite
---------------------

From a local checkout of the bzlite repository:

    $ npm install
    $ npm run dev

A local copy of Bugzilla will now be running at http://127.0.0.1:3000 and using
the api @ https://bugzilla.mozilla.org/rest.

 * PORT=1234 - Run on a custom port
 * BZ_URL='http://...' - Run against a custom bugzilla
 * TEST=1 - Shorthand for BZ_URL='https://bugzilla-dev.allizom.org/' PORT=3001 npm run dev. Convenient for a testing.

If you run a test version, you can either ask for an account
in irc://irc.mozilla.org/#bmo or use

    username: dale+bzlite@arandomurl.com
    password: eU3uBeZzamm4

Running Bugzilla Lite Tests
---------------------------

   $ npm test


Contributing to Bugzilla Lite
-----------------------------

You can find bugs in the [`Bugzilla Lite` Component](https://bugzilla.mozilla.org/buglist.cgi?component=Bugzilla%20Lite&product=Firefox%20OS&bug_status=__open__&list_id=12133703).
