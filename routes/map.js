var path = require('path');

exports.tile = function(req, res) {
    "use strict";

    var isInteger = function(string) {
        return isFinite(parseInt(string, 10));
    };

    var x = req.params.x,
        y = req.params.y,
        zoom = req.params.zoom;

    if (isInteger(x) && isInteger(y) && isInteger(zoom)) {

        var pathRoot = path.normalize(__dirname + '/../static/map_tiles/');
        var sendfileOptions = {root: pathRoot};
        var tilePath =  zoom + '/' + x + '/' + y + '.png';


        res.sendfile(tilePath, sendfileOptions, function(err) {
            if (err && err.status === 404) {
                res.sendfile('blank.png', sendfileOptions);
            }
        });
    } else {
        res.send(404);
    }
};