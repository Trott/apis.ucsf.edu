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

                res.send(myResult);
            }
        });
    }).on("error", function(e){
        console.log("profile/get error: " + e.message);
        res.send({error: e.message});
    });
};