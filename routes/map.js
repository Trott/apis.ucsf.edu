exports.tile = function(req, res) {
    "use strict";

    var path = __dirname + '../static/map_tiles/' + req.params.x +
               '/' + req.params.y +
               '/' + req.params.zoom + '.png';

    res.sendfile(path, function(err) {
        console.dir(err);
    });
};