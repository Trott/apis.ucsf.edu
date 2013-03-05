var UCSF = UCSF || {};

UCSF.People = {
    search: function (options, callback) {
        $.getJSON('http://apis.ucsf.edu:3000/people/search',options,callback);
    }
};