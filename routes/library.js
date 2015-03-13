var http = require('http');
var schedule = require('../utils/librarySchedule.js');

var amalgamatic = require('amalgamatic'),
    sfx = require('amalgamatic-sfx'),
    millennium = require('amalgamatic-millennium'),
    libguides = require('amalgamatic-libguides'),
    pubmed = require('amalgamatic-pubmed'),
    drupal6 = require('amalgamatic-drupal6'),
    dbs = require('amalgamatic-ucsflibdbs');

libguides.setOptions({urlParameters: {
    guide_type: ['subject','general', 'course', 'topic']
}});

amalgamatic.add('sfx', sfx);
amalgamatic.add('millennium', millennium);
amalgamatic.add('libguides', libguides);
amalgamatic.add('pubmed', pubmed);
amalgamatic.add('drupal6', drupal6);
amalgamatic.add('dbs', dbs);

var logger = console.log;

// One hour expressed in milliseconds
// var oneHour = 1000 * 60 * 60;

var guides = {};

var updateGuidesAsync = function () {
    'use strict';

    var options = {
        host: 'lgapi.libapps.com',
        path: '/1.0/guides/100978,100985,100999,100992,100980,100974,100998,100991,100979,100984,100994,13690,100988,101010,100986,101021,100983,100966,100975,100967,101006,100971,101002,100996?site_id=407'
    };

    var data = '';

    http.get(options, function (resp) {
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

    // var mySchedule = schedule.get();

    // if (! mySchedule.lastUpdated || (Date.now() - mySchedule.lastUpdated > oneHour)) {
    //     schedule.update({logger: logger});
    // }

    // res.json(mySchedule);
    res.json(JSON.parse('{"locations":{"parnassus":[{"day":"Fri","date":"Mar 13","text":"7:45am - 8pm"},{"day":"Sat","date":"Mar 14","text":"10am - 6pm"},{"day":"Sun","date":"Mar 15","text":"7:45am - 11pm"},{"day":"Mon","date":"Mar 16","text":"7:45am - 11pm"},{"day":"Tue","date":"Mar 17","text":"7:45am - 11pm"},{"day":"Wed","date":"Mar 18","text":"7:45am - 11pm"},{"day":"Thu","date":"Mar 19","text":"7:45am - 11pm"}],"missionBay":[{"day":"Fri","date":"Mar 13","text":"9am - 5:30pm"},{"day":"Sat","date":"Mar 14","text":"10am - 6pm"},{"day":"Sun","date":"Mar 15","text":"closed"},{"day":"Mon","date":"Mar 16","text":"9am - 9pm"},{"day":"Tue","date":"Mar 17","text":"9am - 9pm"},{"day":"Wed","date":"Mar 18","text":"9am - 9pm"},{"day":"Thu","date":"Mar 19","text":"9am - 9pm"}],"missionBayHub":[{"day":"Fri","date":"Mar 13","text":"24 hours"},{"day":"Sat","date":"Mar 14","text":"24 hours"},{"day":"Sun","date":"Mar 15","text":"24 hours"},{"day":"Mon","date":"Mar 16","text":"24 hours"},{"day":"Tue","date":"Mar 17","text":"24 hours"},{"day":"Wed","date":"Mar 18","text":"24 hours"},{"day":"Thu","date":"Mar 19","text":"24 hours"}]},"lastUpdated":1426281847463}'));
};

updateGuidesAsync();
exports.guides = function (req, res) {
    'use strict';
    
    // if (! guides.guides || (Date.now() - guides.lastUpdated > oneHour)) {
    //     updateGuidesAsync();
    // }

    // res.json(guides);
    res.json(JSON.parse('{"guides":[{"title":"Tobacco Control","href":"http://guides.ucsf.edu/c.php?g=100978","desc":"A collection of resources for anyone interested in the global tobacco epidemic, tobacco control policy-making, anti-tobacco advocacy and tobacco litigation."},{"title":"Anthropology, History, and Social Medicine","href":"http://guides.ucsf.edu/c.php?g=100985","desc":"This guide will assist students in the Anthropology, History, and Social Medicine programs at UCSF."},{"title":"Biochemistry","href":"http://guides.ucsf.edu/c.php?g=100999","desc":"The resources listed in this guide are highly recommended for finding biochemistry information."},{"title":"Chemistry","href":"http://guides.ucsf.edu/c.php?g=100992","desc":"The resources listed in this guide are highly recommended for the study of chemistry."},{"title":"Consumer Health","href":"http://guides.ucsf.edu/c.php?g=100980","desc":"This guide offers health information resources for patients, family members and the public."},{"title":"Copyright at UCSF","href":"http://guides.ucsf.edu/c.php?g=100974","desc":"Information on copyright, publishing, and intellectual property."},{"title":"Electronic Books at UCSF","href":"http://guides.ucsf.edu/c.php?g=100998","desc":"Directions for help with access, printing, and downloading ebooks available at UCSF."},{"title":"Faculty Services","href":"http://guides.ucsf.edu/c.php?g=100991","desc":"A guide to library accounts and services for faculty at UCSF."},{"title":"Finding and Using Images","href":"http://guides.ucsf.edu/c.php?g=100979","desc":"A guide to finding, citing, and editing images -- both general and medical."},{"title":"Getting Started for Residents and Clinical Fellows","href":"http://guides.ucsf.edu/c.php?g=100984","desc":"A guide to library accounts, resources, and services for residents and clinical fellows new to UCSF."},{"title":"Grants","href":"http://guides.ucsf.edu/c.php?g=100994","desc":"A guide to grants and other funding resources for health sciences research."},{"title":"Getting Started for Students (erin)","href":"http://guides.ucsf.edu/c.php?g=13690","desc":"A guide to library accounts, resources, and services for new and returning UCSF students."},{"title":"Historic Homeopathy Materials in the UCSF Archives & Special Collections","href":"http://guides.ucsf.edu/c.php?g=100988","desc":"Resources on the history of Homeopathy from the UCSF Library Archives & Special Collections"},{"title":"Laboratory Animal Science and Welfare","href":"http://guides.ucsf.edu/c.php?g=101010","desc":"A guide to regulations, care, and alternatives to using animals in the lab."},{"title":"Medical Education","href":"http://guides.ucsf.edu/c.php?g=100986","desc":"The resources listed in this guide are tailored to medical education research and academic scholarship."},{"title":"Medical Microbiology","href":"http://guides.ucsf.edu/c.php?g=101021","desc":"The resources listed in this guide are tailored to medical microbiology education and research."},{"title":"Medicine","href":"http://guides.ucsf.edu/c.php?g=100983","desc":"The resources listed in this guide are highly recommended for finding clinical medical information."},{"title":"Nursing","href":"http://guides.ucsf.edu/c.php?g=100966","desc":"A guide to finding and managing nursing information for teaching, research and evidence-based nursing practice."},{"title":"Oral Pathology","href":"http://guides.ucsf.edu/c.php?g=100975","desc":"Selected resources in oral pathology."},{"title":"Pharmacy & Pharmacology","href":"http://guides.ucsf.edu/c.php?g=100967","desc":"The resources listed in this guide are tailored to pharmacy education and research."},{"title":"Physical Therapy & Rehabilitation","href":"http://guides.ucsf.edu/c.php?g=101006","desc":"A guide to finding and managing physical therapy information for teaching, research and evidence-based practice."},{"title":"Qualitative Research Guide","href":"http://guides.ucsf.edu/c.php?g=100971","desc":"Online and collection-based resources to aid in conducting, finding, using, synthesizing, and teaching qualitative research in the health sciences."},{"title":"Social and Behavioral Sciences","href":"http://guides.ucsf.edu/c.php?g=101002","desc":"This guide will assist users with Social and Behavioral science research."},{"title":"Super Searching","href":"http://guides.ucsf.edu/c.php?g=100996","desc":"Become an expert literature searcher"}],"lastUpdated":1426281941832}'));
};

// RegExp for URLs that don't need a proxy prefix
var proxyifyRegExp = /^https?:\/\/([a-z\.]*ucsf.edu|ucsf.idm.oclc.org|ucelinks.cdlib.org)[:\/]/i;
var proxify = function (url) {
    if ((typeof url === 'string') && (! proxyifyRegExp.test(url))) {
        url = 'https://ucsf.idm.oclc.org/login?qurl=' + encodeURIComponent(url);
    }
    return url;
};
var proxifyCollection = function (values) {
    values.url = proxify(values.url);
    values.data.forEach(function(datum) {
        datum.url = proxify(datum.url);
    });
};

exports.search = function (req, res) {
    var callback;

    var options = {
        searchTerm: req.query.q,
        maxResults: 5
    };

    if (req.query.c && req.query.c instanceof Array) {
        options.collections = req.query.c;
    }

    // async = Server-Sent Events/EventSource
    if (req.query.hasOwnProperty('async')) {

        res.writeHead(200, {
            'Content-Type': 'text/event-stream'
        });

        options.pluginCallback = function (err, data) {
            if (err) {
                var msg = err.message || 'unknown error';
                logger('library/search error: ' + msg);
                return;
            }
            proxifyCollection(data);
            res.write('data: ' + JSON.stringify(data) + '\n\n');
            res.flush();
        };

        callback = function () {
            res.write('event: end\n');
            res.write('data\n\n');
            res.flush();
            res.end();
        };

    } else {
        callback = function (err, values) {
            if (err) {
                var msg = err.message || 'unknown error';
                logger('library/search error: ' + msg);
            } else {
                values.forEach(function (value) {
                    proxifyCollection(value);
                });
                res.json(values);
            }
        };
    }

    amalgamatic.search(options, callback);
};
