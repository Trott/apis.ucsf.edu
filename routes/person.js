var http = require('http'),
    xml2js = require('xml2js');

exports.search = function(req, res) {

    var directoryOptions = {
      host: "directory.ucsf.edu",
      port: 80,
      path: "/mobile_people_result_set.jsp" + req.originalUrl.substr(req.path.length)
    };

    http.get(directoryOptions, function(resp){
        var xml = "";
        resp.on('data', function(chunk){
            xml += chunk;
        });
        resp.on('end', function() {
            var parser = new xml2js.Parser();
            parser.on('end', function(result) {
                res.send(result.results);
            });
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
