const mongodb = require("./mongodb");

function queryTweetsInIntervals(ivs) {
	if(!mongodb.db) {
		return Promise.reject();
	}
	return (() => {
	let p = Promise.resolve();
	let counts = [];
	for(let iv of ivs) {
	((iv) => {
		p = p.then(() => mongodb.db.collection("tweets2")
		.count({
			"timestamp_ms": {
				"$gte": iv[0],
				"$lt": iv[1],
			}
		})
		.then((count) => {
			counts.push({
				"date": iv[1],
				"count": count,
			});
			//console.log("count: " + count);
		}))
		.catch((err) => {});
	})(iv);
	}
	return p.then(() => {
		return counts;
	})
	.catch((err) => {});
	})();
}

function queryDummyTweetsInIntervals(ivs) {
	return queryTweetsInIntervals(ivs)
	.then((results) => results.map((r) => ({
		date: r.date,
		count: r.count * Math.random(),
	})));
}

module.exports = {
	newClient: (socket) => {
		socket.join("twitter_counts");
		socket.join("dummy_twitter_counts");
	},
	series: {
		"twitter_counts": {
			queryInIntervals: queryTweetsInIntervals,
			persistence: 50,
			frequency: 3000,
		},
		"dummy_twitter_counts": {
			queryInIntervals: queryDummyTweetsInIntervals,
			persistence: 50,
			frequency: 3000,
		}
	}
};