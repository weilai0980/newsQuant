let MongoClient = require('mongodb').MongoClient;
let config = require("./config.js");

function connect(onDisconnect) {
	return new Promise((resolve, reject) => {	
		return MongoClient.connect(config.mongodb_url)
		.then((client) => {
			db = client.db("CDteam1DB");
			resolve(db);
		})
		.catch((err) => {
			console.error("db connection failed: " + err);
			reject(err);
		});
	});
}

let exps = {
	db: null,
};
connect()
.then((db) => {
	exps.db = db
	console.log("connected to db");
});

module.exports = exps;