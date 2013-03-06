var UCSF = UCSF || {};

UCSF.createCORSRequest = function (method, url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
        // XHR for Chrome/Firefox/Opera/Safari.
        xhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined") {
        // XDomainRequest for IE.
        xhr = new XDomainRequest();
        xhr.open(method, url);
    } else {
        // CORS not supported.
        xhr = null;
    }
    return xhr;
};

UCSF.makeCORSRequest = function (url, options, success, failure ) {

    //TODO: add options to url

    var xhr = UCSF.createCORSRequest('GET', url);
    if (!xhr) {
        window.console.log('Error: CORS not supported');
        return;
    }

    // Response handlers.
    xhr.onload = function(e) {
        success(JSON.parse(e.target.response));
    };
    xhr.onerror = function(e) {
        failure(JSON.parse(e.target.response));
    };
    xhr.send();
};

//TODO: Use code that works in IE too.

UCSF.Person = {
    search: function (options, callback) {
        UCSF.makeCORSRequest('http://apis.ucsf.edu.trott.jit.su/person/search', options, callback);
    }
};

//TODO: minify with uglify