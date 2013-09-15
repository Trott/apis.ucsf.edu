var http = require('http');

exports.get = function(req, res) {
    "use strict";

    var nodeId = req.query.nodeId || '';
    // nodeId should be digits only
    nodeId = nodeId.replace(/\D/g,'');

    var options = {
        host: "base.ctsi.ucsf.edu",
        path: "/profiles/json_api_v2_beta/?publications=full&mobile=on&ProfilesNodeID=" + nodeId
    };

    var data = "";

    http.get(options, function(resp) {
        if (resp.statusCode !== 200) {
            var errorMsg = "profile/get error: code " + resp.statusCode;
            console.log(errorMsg);
            res.send({error: errorMsg});
        }
        resp.on('data', function(chunk){
            data += chunk;
        });
        resp.on('end', function() {
            if (resp.statusCode === 200) {
                var myResult;

                try {
                    myResult = JSON.parse(data);
                } catch (e) {
                    myResult = {};
                    console.log('error parsing Profile JSON: ' + e.message);
                }

                // HORRIBLE HACK WE HOPE TO REMOVE ONE MILLENNIUM....
                // Profiles API returns properties LikeThis. Convert to more conventional likeThis.
                var recursiveLowercasePropertyName = function (obj) {
                    for (var property in obj) {
                        if (obj.hasOwnProperty(property)) {
                            if (typeof obj[property] == "object") {
                                obj[property] = recursiveLowercasePropertyName(obj[property]);
                            }
                            var newName = property.charAt(0).toLowerCase() + property.slice(1);
                            if (newName !== property) {
                                obj[newName] = obj[property];
                                delete obj[property];
                            }
                        }
                    }
                    return obj;
                };
                var lowerCaseResult = recursiveLowercasePropertyName(myResult);

                res.send(lowerCaseResult);
            }
        });
    }).on("error", function(e){
        console.log("profile/get error: " + e.message);
        res.send({error: e.message});
    });
};