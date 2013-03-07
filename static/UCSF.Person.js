var UCSF = {

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
        //TODO: add options to url

        var xhr = UCSF.createCORSRequest('GET', url);
        if (!xhr) {
            window.console.log('Error: CORS not supported');
            return;
        }

        // Response handlers.
        xhr.onload = function () {
            success(JSON.parse(xhr.responseText));
        };
        xhr.onerror = function () {
            failure(JSON.parse(xhr.responseText));
        };
        xhr.send();
    },

    Person: {
        search: function (options, callback) {
            "use strict";
            UCSF.makeCORSRequest('http://apis.ucsf.edu.trott.jit.su/person/search', options, callback);
        }
    }
};

//TODO: use grunt to run through jshint and minify with uglify