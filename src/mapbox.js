var mapbox = {};

mapbox.HTTP_URLS = [
    'http://a.tiles.mapbox.com/v3/',
    'http://b.tiles.mapbox.com/v3/',
    'http://c.tiles.mapbox.com/v3/',
    'http://d.tiles.mapbox.com/v3/'];

mapbox.HTTPS_URLS = [];

mapbox.idUrl = function(_, t) {
    if (_.indexOf('/') == -1) t.id(_);
    else t.url(_);
};

mapbox.auto = function(element, url, callback) {
    // Support bare IDs as well as fully-formed URLs
    if (url.indexOf('http') !== 0) {
        url = mapbox.base() + url + '.json';
    }

    mapbox.request(url, function(err, json) {
        if (err) {
            if (callback) callback(err);
            return mapbox.log('could not load TileJSON at ' + url);
        }

        var zoom = json.center[2],
            center = L.latLng(json.center[1], json.center[0]);

        var map = new L.Map(element)
            .setView(center, zoom)
            .addLayer(new mapbox.layerGroup(json));

        if (callback) callback(undefined, map);
    });
};

// Return the base url of a specific version of MapBox's API.
//
// `hash`, if provided must be a number and is used to distribute requests
// against multiple `CNAME`s in order to avoid connection limits in browsers
mapbox.base = function(hash) {
    // By default, use public HTTP urls
    var urls = mapbox.HTTP_URLS;

    // Support HTTPS if the user has specified HTTPS urls to use, and this
    // page is under HTTPS
    if (window.location.protocol === 'https:' && mapbox.HTTPS_URLS.length) {
        urls = mapbox.HTTPS_URLS;
    }

    if (hash === undefined || typeof hash !== 'number') {
        return urls[0];
    } else {
        return urls[hash % urls.length];
    }
};

mapbox.browser = (function() {
    var browser = {};
    browser.cors = ("withCredentials" in new XMLHttpRequest());
    return browser;
})();

mapbox.log = function(_) {
    if (console && typeof console.error === 'function') {
        console.error(_);
    }
};

// http://stackoverflow.com/questions/9404793/check-if-same-origin-policy-applies
mapbox.isSameOrigin = function(url) {
    var loc = window.location,
        a = document.createElement('a');

    a.href = url;

    return a.hostname === loc.hostname &&
        a.port === loc.port &&
        a.protocol === loc.protocol;
};

mapbox.request = function(url, callback) {
    reqwest({
        url: url,
        type: (mapbox.browser.cors || mapbox.isSameOrigin(url)) ? 'json' : 'jsonp',
        crossOrigin: mapbox.browser.cors,
        success: function(result) { callback(undefined, result); },
        error: function(error) { callback(error); }
    });
};

// Turn off Leaflet's advertisement.
L.Control.Attribution.prototype.options.prefix = '';
