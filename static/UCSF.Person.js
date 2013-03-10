var UCSF = {

    serialize: function(obj, prefix) {
        "use strict";
        var str = [];
        for(var p in obj) {
            var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
            str.push(typeof v === "object" ?
                this.serialize(v, k) :
                encodeURIComponent(k) + "=" + encodeURIComponent(v));
        }
        return str.join("&");
    },

    createCORSRequest: function (method, url) {
        "use strict";
        var xhr = new XMLHttpRequest();
        if ("withCredentials" in xhr) {
            // XHR for Chrome/Firefox/Opera/Safari.
            xhr.open(method, url, true);
        } else if (typeof XDomainRequest !== "undefined") {
            // XDomainRequest for IE.
            xhr = new XDomainRequest();
            xhr.open(method, url);
        } else {
            // CORS not supported.
            xhr = null;
        }
        return xhr;
    },

    makeCORSRequest: function (url, options, success, failure) {
        "use strict";
        var separator = url.indexOf('?')===-1 ? '?' : '&';
        var urlWithOptions =  url + separator + this.serialize(options);

        var xhr = UCSF.createCORSRequest('GET', urlWithOptions);
        if (!xhr) {
            //TODO: CORS not supported. Probably IE7 (or maybe Opera Mini). Look at flXHR polyfill?
            return;
        }

        // Response handlers.
        xhr.onload = function () {
            success(JSON.parse(xhr.responseText));
        };
        xhr.onerror = failure;
        xhr.send();
    },

    Person: {
        search: function (options, success, failure ) {
            "use strict";
            failure = failure || function () {};
            UCSF.makeCORSRequest(
                'http://apis.ucsf.edu.trott.jit.su/person/search',
                options,
                success,
                failure
            );
        }
    }
};

//TODO: use grunt to run through jshint and minify with uglify