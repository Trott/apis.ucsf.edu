var https = require('https'),
    config = require('../config');

exports.events = function(req, res) {
    "use strict";

    var r25Options = {
        auth: config.r25.auth,
        host: "webservices.collegenet.com",
        path: "/r25ws/wrd/ucsf/run/reservations.xml?event_query_id=42567%20&start_dt=+0&end_dt=+30&event_state=2&state=1&scope=extended&otransform=json.xsl&cache=120"
    };

    var data = "";

    https.get(r25Options, function(resp) {
        if (resp.statusCode !== 200) {
            var errorMsg = "free_food/events error: code " + resp.statusCode;
            console.log(errorMsg);
            res.send({error: errorMsg});
        }
        resp.on('data', function(chunk){
            data += chunk;
        });
        resp.on('end', function() {
            if (resp.statusCode === 200) {
                // HORRIBLE HACK #1: R25 web service appears to return incorreclty escaped JSON.
                // Let's convert all instances of \\" to \"
                var fixedData = data.replace(/\\\\"/g, '\\"');
                var r25Result;

                try {
                    r25Result = JSON.parse(fixedData);
                } catch (e) {
                    r25Result = {};
                    console.log('error parsing 25Live JSON: ' + e.message);
                }

                // HORRIBLE HACK #2: R25 web service sends ~75Kb of JSON, most of which is not used.
                // Let's pull out just the stuff we need, which is ~3Kb.
                var result = {};
                result.events = [];

                if (r25Result.reservations && r25Result.reservations.reservation && Array.isArray(r25Result.reservations.reservation)) {
                    var reservationArray = r25Result.reservations.reservation,
                        slimmedEvent,
                        thisEvent;
                    for (var i=0, l=reservationArray.length; i<l; i++) {
                        slimmedEvent = {};
                        thisEvent = reservationArray[i];

                        slimmedEvent.name = thisEvent.event && thisEvent.event.event_name && thisEvent.event.event_name._text || "";
                        slimmedEvent.location = thisEvent.event && thisEvent.event.custom_attribute && thisEvent.event.custom_attribute.attribute_value && thisEvent.event.custom_attribute.attribute_value._text ||
                                                thisEvent.space_reservation && thisEvent.space_reservation.space && thisEvent.space_reservation.space.formal_name && thisEvent.space_reservation.space.formal_name._text || "";
                        slimmedEvent.description =  thisEvent.event && thisEvent.event.event_text && thisEvent.event.event_text.text && thisEvent.event.event_text.text._text ||
                                                    thisEvent.event && thisEvent.event.event_text && thisEvent.event.event_text[0] && thisEvent.event.event_text[0].text && thisEvent.event.event_text[0].text._text || "";

                        slimmedEvent.datetime = thisEvent.event_start_dt && thisEvent.event_start_dt._text || "";
                        result.events[i] = slimmedEvent;
                    }
                }

                res.send(result);
            }
        });
    }).on("error", function(e){
        console.log("shuttle/times error: " + e.message);
        res.send({error: e.message});
    });
};