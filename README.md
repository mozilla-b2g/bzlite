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

 * PORT=1234 - Run the bzlite site on a custom port
 * BZ_URL='http://...' - Run against a custom bugzilla

Installing a test Bugzilla
--------------------------

You can use docker to install and run a test version of bugzilla

I use https://github.com/dklawren/docker-bugzilla-bmo, to get up and running first [install docker](https://docs.docker.com/engine/installation/) then run

    $ docker run -d -t --name bmo --hostname bmo --publish 8080:80 --publish 2222:22 dklawren/webtools-bmo-bugzilla

You will find Bugzilla running @ http://192.168.99.100:8080/bmo/ (or similiar, run `docker-machine env default` to find the IP). Use

    $ BZ_URL=http://192.168.99.100:8080/bmo/rest/ npm run dev

To test against that url, you can use the following credentials to login:

    username: admin@mozilla.bugs
    password: password

Running Bugzilla Lite Tests
---------------------------

    $ npm test

Contributing to Bugzilla Lite
-----------------------------

You can find bugs in the [`Bugzilla Lite` Component](https://bugzilla.mozilla.org/buglist.cgi?component=Bugzilla%20Lite&product=Firefox%20OS&bug_status=__open__&list_id=12133703).
