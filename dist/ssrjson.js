/*global DOMParser: true, XMLHttpRequest: true, window: true */

/*oh hi 100*/


/* ny kommentar* /

var SSRSearch = function () {
    'use strict';

    /* _.bind from underscore.js */
    var nativeBind = Function.prototype.bind;
    var slice = Array.prototype.slice;
    var Ctor = function () {};
    function isObject(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    }
    var bind = function (func, context) {
        var args, bound;
        if (nativeBind && func.bind === nativeBind) { return nativeBind.apply(func, slice.call(arguments, 1)); }
        args = slice.call(arguments, 2);
        bound = function () {
            if (!(this instanceof bound)) { return func.apply(context, args.concat(slice.call(arguments))); }
            Ctor.prototype = func.prototype;
            var self = new Ctor;
            Ctor.prototype = null;
            var result = func.apply(self, args.concat(slice.call(arguments)));
            if (isObject(result)) { return result; }
            return self;
        };
        return bound;
    };

    function createQueryParams(params) {
        var list = [];
        var key;
        for (key in params) {
            if (params.hasOwnProperty(key)) {
                list.push(key + '=' + params[key]);
            }
        }
        return list.join('&');
    }

    var ssrSok2JSON = function (xml) {

        function parseXML(xml, toName) {
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(xml, 'text/xml');
            return xmlDoc.getElementsByTagName(toName)[0];
        }

        function getElements(root, nodeName) {
            var elements = [];
            var children = root.childNodes;
            var i, length = children.length;
            for (i = 0; i < length; i++) {
                if (children[i].nodeName === nodeName) {
                    elements.push(children[i]);
                }
            }
            return elements;
        }

        function getElement(root, path) {
            var base = root;
            var i;
            var length = path.length;
            for (i = 0; i < length; i++) {
                base = base.getElementsByTagName(path[i])[0];
            }
            try {
                return base.childNodes[0].nodeValue;
            } catch (e) {
                return null;
            }
        }

        function parseStedsnavn(element) {
            var dict = {};
            var keys = [
                'ssrId', 'navnetype', 'kommunenavn', 'fylkesnavn',
                'stedsnavn', 'aust', 'nord', 'skrivemaatestatus',
                'spraak', 'skrivemaatenavn', 'epsgKode'
            ];
            var key, i, length = keys.length;
            var position = {};
            for (i = 0; i < length; i++) {
                key = keys[i];
                if (key === 'nord') {
                    position.lat = parseFloat(getElement(element, [key]));
                } else if (key === 'aust') {
                    position.lon = parseFloat(getElement(element, [key]));
                } else {
                    dict[key] = getElement(element, [key]);
                }
            }
            dict.position = position;
            return dict;
        }

        function createFeature(stedsnavn) {
            var pos = stedsnavn.position;
            delete stedsnavn.position;
            return {
                type: 'Feature',
                geometry: {type: 'Point', 'coordinates': [pos.lon, pos.lat]},
                properties: stedsnavn
            };
        }

        function stedsnavnToGeoJSON(stedsnavn) {
            var fc = {
                type: 'FeatureCollection',
                features: []
            };

            var i, length = stedsnavn.length;
            for (i = 0; i < length; i++) {
                fc.features.push(createFeature(stedsnavn[i]));
            }
            return fc;
        }

        function getStedsnavn(root) {
            var elements = getElements(root, 'stedsnavn');
            var stedsnavn = [];
            var i, length = elements.length;
            for (i = 0; i < length; i++) {
                stedsnavn.push(parseStedsnavn(elements[i]));
            }
            return stedsnavn;
        }

        var root = parseXML(xml, 'sokRes');
        var isOk = (getElement(root, ['sokStatus', 'ok']) === 'true');
        var melding = getElement(root, ['sokStatus', 'melding']);
        var count = parseInt(getElement(root, ['totaltAntallTreff']), 10);
        var stedsnavn = getStedsnavn(root);
        return {
            sokStatus: {
                ok: isOk,
                melding: melding
            },
            totaltAntallTreff: count,
            stedsnavn: stedsnavn,
            geoJson: stedsnavnToGeoJSON(stedsnavn)
        };
    };

    var CORSRequest = function () {
        this.isIE8 = window.XDomainRequest ? true : false;
    };

    CORSRequest.prototype.createRequest = function () {
        if (this.isIE8) {
            return new window.XDomainRequest();
        }
        return new XMLHttpRequest();
    };

    CORSRequest.prototype.get = function (url, success, error) {
        this.request = this.createRequest();
        this.error = error;
        this.success = success;
        if (this.isIE8) {
            this.request.onload = bind(this.handler, this);
            this.request.open('GET', url, true);
            this.request.send();
        } else {
            this.request.open('GET', url, true);
            this.request.onreadystatechange = bind(this.handler, this);
            this.request.send();
        }
    };

    CORSRequest.prototype.handler = function () {
        if (this.request.readyState !== 4) {
            return;
        }
        if (this.request.status === 200) {
            this.success(this.request.responseText);
        } else {
            this.error(this.request.responseText);
        }
    };

    function parseBboxString(string) {
        var arr = string.split(',');
        return {
            ostLL: arr[0],
            nordLL: arr[1],
            ostUR: arr[2],
            nordUR: arr[3]
        };
    }

    function mergeDicts(obj1, obj2) {
        var obj3 = {};
        var attrname;
        for (attrname in obj1) {
            if (obj1.hasOwnProperty(attrname)) {
                obj3[attrname] = obj1[attrname];
            }
        }
        for (attrname in obj2) {
            if (obj2.hasOwnProperty(attrname)) {
                obj3[attrname] = obj2[attrname];
            }
        }
        return obj3;
    }

    var Searcher = function () {
        this.corsRequest = new CORSRequest();
        this.baseUrl = 'https://ws.geonorge.no/SKWS3Index/ssr/sok';
    };

    Searcher.prototype.createUrl = function (params) {
        params = mergeDicts({
            page: 0,
            maxRows: 9,
            epsg: 4258
        }, params);

        var queryParams = {
            navn: params.query,
            antPerSide: params.maxRows,
            epsgKode: params.epsg,
            eksakteForst: 'true',
            side: params.page
        };

        if (params.bbox) {
            queryParams = mergeDicts(queryParams, parseBboxString(params.bbox));
        }
        return this.baseUrl + '?' + createQueryParams(queryParams);
    };

    Searcher.prototype.search = function (params, success, error) {
        this.orgSuccess = success;
        this.corsRequest.get(
            this.createUrl(params),
            bind(this.success, this),
            error
        );
    };

    Searcher.prototype.success = function (data) {
        this.orgSuccess(ssrSok2JSON(data));
    };

    var searcher = new Searcher();
    return {
        search: function (params, success, error) {
            searcher.search(params, success, error);
        }
    };
};
