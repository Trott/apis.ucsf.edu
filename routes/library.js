var https = require('https');
var schedule = require('../utils/librarySchedule.js');

var logger = console.log;

// One hour expressed in milliseconds
var oneHour = 1000 * 60 * 60;

var guides = {};

var updateGuidesAsync = function () {
    'use strict';

    var options = {
        host: 'lgapi.libapps.com',
        path: '/1.0/guides/100998,100994,101031,101035,101017,101014,101016,100993,100989,100980,100981,100974,100978,100984,100965?site_id=407'
    };

    var data = '';

    // last update set regardless of success or fail so we don't hammer the endpoint
    guides.lastUpdated = Date.now();

    https.get(options, function (resp) {
        if (resp.statusCode !== 200) {
            var errorMsg = 'updateGuidesAsync error: code ' + resp.statusCode;
            logger(errorMsg);
        }
        resp.on('data', function (chunk) {
            data += chunk;
        });
        resp.on('end', function () {
            if (resp.statusCode === 200) {
                var result = {};
                try {
                    var featured = JSON.parse(data);
                    result.guides = featured.map(function (val) {
                        var title = val.name;
                        var href = 'http://guides.ucsf.edu/c.php?g=' + parseInt(val.id,10);
                        var desc = val.description;
                        return {title: title, href: href, desc: desc};
                    });
                } catch (e) {
                    result = {};
                    logger('error parsing LibGuides JSON: ' + e.message);
                }
                guides = result;
                guides.lastUpdated = Date.now();
            }
        });
    }).on('error', function (e) {
        logger('updateGuidesAsync error: ' + e.message);
    });
};

schedule.update({logger: logger});
exports.hours = function (req, res) {
    'use strict';

    var mySchedule = schedule.get();

    if (mySchedule.lastUpdated && (Date.now() - mySchedule.lastUpdated > oneHour)) {
        schedule.update({logger: logger});
    }

    res.json(mySchedule);
};

updateGuidesAsync();
exports.guides = function (req, res) {
    'use strict';
    
    if (guides.lastUpdated && (Date.now() - guides.lastUpdated > oneHour)) {
        updateGuidesAsync();
    }

    res.json(guides);
};
