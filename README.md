SSR to JSON
===========

Small utility lib for querying the placename-search from the Norwegian
Mapping authority using a sensible object and get JSON (and GeoJSON) back.

In principle it's a wrapper around the webservice-xml-search at
https://ws.geonorge.no/SKWS3Index/ssr/sok

Installation
------------
Install by downloading the dist/ssrtojson.min.js file directly, or use bower:
`bower install ssrtojson`

Usage
-----

First initialize a new searcher object:
`var ssrSearch = new SSRSearch();`
Then use it to search
`ssrSearch.search(params, successCallback, errorCallback);`

Where `params` is a POJO on the form:
`
{
query: 'the query string',
bbox: 'southwest_lng,southwest_lat,northeast_lng,northeast_lat'
}
`
the bbox is optional.

Build and release
-----------------
Build with the default grunt task.
Release using https://www.npmjs.org/package/grunt-bump-build-git
(remember to push tag after)

