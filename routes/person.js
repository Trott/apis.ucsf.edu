exports.search = function(req, res) {

//TODO: Uh...fetch real data
	res.send({data: [{
        link:'http://musicroutes.com/',
        name:'Richard Trott',
        picture: {data: {url: 'http://placebeet.com/50/50'}}
    }]});
};