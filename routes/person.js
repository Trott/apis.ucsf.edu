var http = require('http'),
    xml2js = require('xml2js');

exports.search = function(req, res) {

    "use strict";
    var directoryOptions = {
      host: "directory.ucsf.edu",
      port: 80
    };

    var detail;
    var queryString = req.originalUrl.substr(req.path.length);
    //TODO: Regexp please. /[?&]id=/
    if ((queryString.indexOf('?id=') !== -1) || (queryString.indexOf('&id=') !== -1)) {
        directoryOptions.path = "/mobile_people_detail.jsp?FNO=" + req.query.id;
        detail = true;
    } else {
        directoryOptions.path = "/mobile_people_result_set.jsp" + queryString;
        detail = false;
    }

    http.get(directoryOptions, function(resp){
        var xml = "";

        function callback(result) {
            function deGoober(name, data) {
                var arrayInstance = [].constructor,
                    value = data.hasOwnProperty(name) ? data[name] : "";
                // Sometimes, the string is inexplicably buried in an array.
                if (value instanceof arrayInstance) {
                    return value[0];
                }
                return value;
            }

            function amassPhones(data) {
                var rv = {},
                    thisPhone,
                    phones = [
                        ['telephoneNumber', 'main'],
                        ['telephoneNumber2', 'alternate'],
                        ['privatePracticePhone', 'privatePractice'],
                        ['mobile', 'mobile'],
                        ['pager', 'pager']
                    ];
                for (var i=0; i < phones.length; i++) {
                    thisPhone = deGoober(phones[i][0], data);
                    // *sigh* Replace empty object with empty string.
                    if (typeof thisPhone === "object") {
                        thisPhone = "";
                    }
                    rv[phones[i][1]] = thisPhone;
                }
                return rv;
            }

            // <facepalm>
            var results = result.results.result;
            // </facepalm>

            // *Sigh*. As much as I'd love to just send everything as is,
            // too much crap XML means too much badly formatted stuff sent back. Let's
            // declare a bunch of variables, loop through, and try to clean up some of it.

            var rv = [];
            for (var i = 0; i < results.length; i++) {
                rv[i] = {};
                rv[i].name = deGoober('displayName', results[i]);
                rv[i].department = deGoober('department', results[i]);
                rv[i].email = deGoober('mail', results[i]);
                rv[i].title = deGoober('workingTitle', results[i]);
                rv[i].campusBox = deGoober('campusBox', results[i]);
                rv[i].address = deGoober('postalAddress', results[i]);
                rv[i].id = deGoober('key', results[i]);

                rv[i].phone = amassPhones(results[i]);

                // Failing to capitalize the Chancellor's name correctly is embarrassing. Sad hack to fix it.
                rv[i].name.replace('Desmond-hellman','Desmond-Hellman');
            }

            res.send({data: rv});
        }

        resp.on('data', function(chunk){
            xml += chunk;
        });
        resp.on('end', function() {
            var parser = new xml2js.Parser();
            parser.on('end', callback);
            parser.on('error', function(err) {
                console.dir(err);
            });
            parser.parseString(xml);
        });
    }).on("error", function(e){
        console.log("Directory error: " + e.message);
        res.send({error: e.message});
    });
};

//TODO: Uh, make it robust so it doesn't go down. supervisor and all that.
