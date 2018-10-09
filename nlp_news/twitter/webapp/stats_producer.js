const config = require("./config");
const args = require("./minimist")(process.argv);
const keywords = require("./glossary")(args.first, args.last);
const mongodb = require("./mongodb");

function generateStats(freq) {
	let rescheduleTimeout = 2 * freq;
	let p = Promise.resolve();
	if(mongodb.db) {
		let db = mongodb.db;
		p = p.then(() => db.collection(config.twitterStatsCollection)
		.find({
			"freq": freq
		})
		.sort({
			"date": -1,
		})
		.limit(1)
		.toArray()
		.then((results) => {
			if(!results.length) {
				return db.collection(config.tweetsCollection)
				.find({})
				.sort({
					"timestamp_ms": 1,
				})
				.limit(1)
				.toArray()
				.then((results) => {
					if(!results.length) {
						return Promise.reject();
					}
					return results[0].timestamp_ms;
				});
			}
			return results[0].date;
		}))
		//p = p.then(() => Promise.resolve(1528363997359))
		.then((lastTimestamp) => {
			let now = config.fakeNow();
			return mongodb.db.collection(config.tweetsCollection)
			.aggregate([
				{
					"$unwind": "$coins",
				},
				{
					"$match": {
						timestamp_ms: {
							"$gt": now - parseInt((now - lastTimestamp) / freq) * freq,
						}
					}
				},
				{
					"$project": {
						timerange: {
							"$add": [
								now,
								{
									"$multiply": [
										{
											"$trunc": { "$divide": [
												{ "$add": [ "$timestamp_ms", -now ] },
												freq
											] }
										},
										freq
									]
								}
							]
						},
						timestamp_ms: 1,
						coins: 1,
						sentiment_score: 1,
					}
				},
				{
					"$group": {
						_id: {
							date: "$timerange", 
							keyword: "$coins",
						},
						date: { "$first": "$timerange" }, 
						keyword: { "$first": "$coins" },
						count: { "$sum": 1 },
						avg_sentiment_score: { "$avg": "$sentiment_score" }
					}
				},
			])
			.toArray();
		})
		.then((results) => {
			console.log("request done");
			if(!results.length) {
				return Promise.resolve();
			}
			return mongodb.db.collection(config.twitterStatsCollection)
			.insertMany(results.map((obj) => {
				obj._id.freq = freq;
				obj.freq = freq;
				return obj;
			}));
		})
		.catch((err) => {
			console.error("error: " + err);
		});
	}
	else {
		console.error("disconnected db");
		rescheduleTimeout = 1000;
	}
	p.then(() => setTimeout(generateStats.bind(this, freq), rescheduleTimeout));
}

for(let frequency in config.twitterFrequencies) {
	generateStats(parseInt(frequency));
}
