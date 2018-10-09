const mongodb = require("./mongodb");
const config = require("./config");
const availableKeywords = require("./glossary")();
const frequencies = [ 60 * 1000,  ]

function queryTweetsByKeywordInSlices(kw, freq) {
	function queryTweetsInSlices(oldestSlice, newestSlice) {
		if(!mongodb.db) {
			return Promise.reject();
		}
		return mongodb.db.collection(config.twitterStatsCollection)
		.aggregate({
			"$project": {
				date: 1,
				freq: 1,
				keyword: 1,
				count: 1,
				avg_sentiment_score: 1,
				backwardsSlice: { "$trunc": { "$divide": [ { "$add": [ Date.now(), { "$multiply": [ -1, "$date" ] } ] }, "$freq" ] } },
			}
		},
		{
			"$match": {
				backwardsSlice: {
					"$gte": oldestSlice,
					"$lte": newestSlice,
				},
				keyword: kw,//{ "$in": availableKeywords[kw].versions },
				freq: freq,
			}
		},
		{
			"$project": {
				date: "$date",
				freq: "$freq",
				keyword: "$keyword",
				count: "$count",
				avg_sentiment_score: "$avg_sentiment_score"
			}
		})
		.toArray()
		.then((results) => {
			return results;
		});
	}
	return queryTweetsInSlices;
}

let series = {};
for(let kw in availableKeywords) {
	for(let frequency in config.twitterFrequencies) {	
		series["twitter_keyword_" + kw + "_" + frequency] = {
			queryInSlices: queryTweetsByKeywordInSlices(kw, parseInt(frequency)),
			persistence: 100,
			frequency: parseInt(frequency),
		};
	}
}

function newClient(socket) {
	socket.emit("available_keywords", Object.keys(availableKeywords));
}

module.exports = {
	newClient: newClient,
	series: series,
};