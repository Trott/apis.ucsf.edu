var UCSF = UCSF || {};

//TODO: Use code that works in IE too.

UCSF.Person = {
    search: function (options, callback) {
        $.getJSON('http://apis.ucsf.edu.trott.jit.su/person/search',options,callback);
    }
};