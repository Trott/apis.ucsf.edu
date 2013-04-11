//TODO: put UCSF boilerplate into its own file and insert into various specific files
// via grunt

//TODO: Way to not have to download the boilerplate twice when using Shuttle and Person. 
// Perhaps some kind of AMD/CommonJS/RequireJS thing or emulating Google's jsapi, or 
// a custom build a la Modernizr.

var UCSF = UCSF || (function () {
    "use strict";

    var me = {
    // work queue for IE7 polyfill
        _ie7q: [],

        serialize: function (obj, prefix) {
            var str = [];
            for (var p in obj) {
                var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
                str.push(typeof v === "object" ?
                    this.serialize(v, k) :
                    encodeURIComponent(k) + "=" + encodeURIComponent(v));
            }
            return str.join("&");
        },

        createCORSRequest: function (method, url, success, failure) {
            var xhr = new XMLHttpRequest();
            if ("withCredentials" in xhr) {
                // XHR for Chrome/Firefox/Opera/Safari.
                xhr.open(method, url, true);
            } else if (typeof XDomainRequest !== "undefined") {
                // XDomainRequest for IE8+.
                xhr = new XDomainRequest();
                xhr.open(method, url);
            } else if ((typeof flensed !== "undefined") && "flXHR" in flensed) {
                // flensed.flXHR polyfill for IE7
                xhr = new flensed.flXHR({
                    xmlResponseText:false,
                    onreadystatechange:
                        function (XHRobj) {
                            if (XHRobj.readyState === 4) {
                                if (XHRobj.status === 200 && success) {
                                    success(JSON.parse(XHRobj.responseText));
                                } else {
                                    failure(XHRobj);
                                }
                            }
                        },
                    ontimeout: failure,
                    onerror: failure
                });
                xhr.open(method, url, true);
            } else {
                xhr = null;
            }
            return xhr;
        },

        createRequestString: function(url, options) {
            var separator = url.indexOf('?')===-1 ? '?' : '&';
            return url + separator + this.serialize(options);
        }
    };

    // Determine if CORS is supported. If not, load flXHR polyfill.
    // Needed for IE7 support. :-(
    if (! me.createCORSRequest('GET', 'http://www.example.com/')) {
        window.flensed={base_path:"http://apis.ucsf.edu/static/flensed/"};
        var polyfill = document.createElement('script');
        polyfill.src = 'http://apis.ucsf.edu/static/ie7_polyfill.js';
        polyfill.onreadystatechange = function () {
            if ((polyfill.readyState !== "complete") && (polyfill.readyState !== "loaded")) {
                return;
            }
            var length = me._ie7q.length;
            for (var i=0; i<length; i++) {
                me._ie7q[i].callee(me._ie7q[i].options, me._ie7q[i].success, me._ie7q[i].failure);
            }
        };
        document.getElementsByTagName('head')[0].appendChild(polyfill);
    }

    // End code specifically for IE7 support.
    return me;
}());

UCSF.Shuttle = {
    stops: function (options, success, failure ) {
        failure = failure || function (obj) {window.alert(obj.statusText||'An error occurred. Please try again.');};
        var reqString = 'http://apis.ucsf.edu/shuttle/stops';
        var xhr = UCSF.createCORSRequest('GET', reqString, success, failure);
        if (! xhr) {
            _ie7q.push({callee:UCSF.Shuttle.stops, options:options, success:success, failure:failure});
        } else {
            xhr.onload = function () {
                success(JSON.parse(xhr.responseText));
            };
            xhr.onerror = failure;
            xhr.send();
        }
    }
};