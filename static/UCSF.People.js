var UCSF = UCSF || {};

//TODO: Check for jQuery or Zepto. Include Zepto if neither found.

UCSF.People = {
    search: function (options, callback) {
        $.getJSON('http://apis.ucsf.edu/people/search',options,callback);
    }
};