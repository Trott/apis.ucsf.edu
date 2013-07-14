var http = require('http'),
    https = require('https'),
    querystring = require('querystring'),
    xml2js = require('xml2js');

exports.search = function (req, res) {
    'use strict';

    var directoryOptions = {
        host: 'directory.ucsf.edu',
        port: 80
    };

    var dataNeedsCleaning = true;

    var protocol = http;

    //TODO: document id option at developer.ucsf.edu
    if ('id' in req.query) {
        directoryOptions.path = '/mobile_people_detail.jsp?' + querystring.stringify({'FNO': req.query.id});
    } else if (req.query.first_name || req.query.last_name || req.query.dep_name) {
        directoryOptions.path = '/mobile_people_result_set.jsp?' + querystring.stringify(req.query);
    } else if (req.query.q) {
        directoryOptions.host = 'myaccess2.ucsf.edu';
        directoryOptions.port = 443;
        directoryOptions.path = '/directory/?json&' + querystring.stringify({q: req.query.q});
        protocol = https;
        dataNeedsCleaning = false;
    } else {
        res.send({data: []});
        return;
    }

    protocol.get(directoryOptions, function (resp) {
        var rawData = '';

        function callback(result) {
            function deGoober(name, data, stringify) {
                var arrayInstance = [].constructor,
                    value = data.hasOwnProperty(name) ? data[name] : '';
                // Sometimes, the string is inexplicably buried in an array.
                if ((stringify) && (value instanceof arrayInstance)) {
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
                for (var i = 0; i < phones.length; i++) {
                    thisPhone = deGoober(phones[i][0], data, true);
                    // *sigh* Don't send back empty objects and strings inside the array
                    if ((typeof thisPhone === 'object') || (thisPhone === '')) {
                        rv[phones[i][1]] = [];
                    } else {
                        // *sigh* part 2: Arrays should be able to have multiple values.
                        rv[phones[i][1]] = [thisPhone];
                    }
                }
                return rv;
            }

            // <facepalm>
            var results = [];
            if (result.hasOwnProperty('results') && result.results.hasOwnProperty('result')) {
                results = result.results.result;
            }
            // </facepalm>

            // *Sigh*. As much as I'd love to just send everything as is,
            // too much crap XML means too much badly formatted stuff sent back. Let's
            // declare a bunch of variables, loop through, and try to clean up some of it.

            var rv = [];
            var degreeFilterCallback = function (el) { return typeof el === 'string'; };
            for (var i = 0; i < results.length; i++) {
                rv[i] = {};
                rv[i].name = deGoober('displayName', results[i], true);
                if (Array.isArray(results[i].degrees) && results[i].degrees[0] && Array.isArray(results[i].degrees[0].degree)) {
                    rv[i].degrees = results[i].degrees[0].degree.filter(degreeFilterCallback);
                }
                rv[i].department = deGoober('department', results[i], false);
                rv[i].email = deGoober('mail', results[i], false);
                rv[i].title = deGoober('workingTitle', results[i], false);
                rv[i].campusBox = deGoober('campusBox', results[i], false);
                rv[i].address = deGoober('postalAddress', results[i], false);
                for (var j = 0; j < rv[i].address.length; j++) {
                    rv[i].address[j] = rv[i].address[j].replace(/\$/g, '\n');
                }
                rv[i].id = deGoober('key', results[i], true);
                if ((rv[i].id === '') && (req.query.hasOwnProperty('id'))) {
                    rv[i].id = req.query.id;
                }

                rv[i].phones = amassPhones(results[i]);

                // Failing to capitalize the Chancellor's name correctly is embarrassing. Sad hack to fix it.
                rv[i].name.replace('Desmond-hellman', 'Desmond-Hellman');
            }

            res.send({data: rv});
        }

        resp.on('data', function (chunk) {
            rawData += chunk;
        });
        resp.on('end', function () {
            if (dataNeedsCleaning) {
                var parser = new xml2js.Parser();
                parser.on('end', callback);
                parser.on('error', function (err) {
                    console.dir(err);
                });
                parser.parseString(rawData);
            } else {
                // Harumph, still needs some minor cleaning.
                // Hopefully Elliot fixes this soon and I can remove it.
                var cookedData = JSON.parse(rawData);

                var convertToString = function (input) {
                    if (input instanceof Array) {
                        return input[0];
                    }
                    return input;
                };

                if (cookedData.data && cookedData.data instanceof Array) {
                    for (var i = 0, l = cookedData.data.len; i < l; i++) {
                        cookedData.data[i].displayname = convertToString(cookedData.data[i].displayname);
                        cookedData.data[i].ucsfeduprimarydepartmentname = convertToString(cookedData.data[i].ucsfeduprimarydepartmentname);
                    }
                }

                // In an ideal world, this is all we'd need.
                res.send(cookedData);
            }
        });
    }).on('error', function (e) {
        console.log('Directory error: ' + e.message);
        res.send({error: e.message});
    });
};