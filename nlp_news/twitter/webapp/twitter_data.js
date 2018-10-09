const PriorityQueue = require("priorityqueuejs");
const SortedArray = require("sorted-array");
const mongodb = require("./mongodb.js");
const config = require("./config");

let seriesSets = [
	require("./series_twitter_keywords"),
];

let DB_CONNECTION_RETRY_DELAY = 3000;

let timeSeries = {};
for(let seriesSet of seriesSets) {
	timeSeries = { ...timeSeries, ...seriesSet.series }
}

function clearData(seriesName) {
	let series = timeSeries[seriesName];
	series.saved.array.length = 0;
}

function saveData(seriesName, records) {
	//console.error("records: " + JSON.stringify(records, null, 2));
	let series = timeSeries[seriesName];
	if(!series.saved) {
		series.saved = new SortedArray([], (a, b) => (a.date > b.date) ? 1 : -1);
	}
	let sa = series.saved;
	records.forEach((record) => {
		sa.insert(record);
	});
	while(sa.array.length > series.persistence) {
		sa.array.shift();
	}
	if(seriesName == "twitter_keyword_bitcoin" && sa.array.length && sa.array[0].freq == 10 * 60 * 1000) {
		console.error("final sa: " + JSON.stringify(sa.array, null, 2));
	}
	//console.error("final sa: " + JSON.stringify(sa.array, null, 2));
}

function emitAllUnicast(socket, seriesName) {
	console.error("emit all unicast " + seriesName);
	let series = timeSeries[seriesName];
	if(!series || !series.saved) {
		return;
	}
	//console.error("actually emitted: " + JSON.stringify(series.saved.array));
	socket.emit(seriesName, series.saved.array);
}

function emitLastBroadcast(io, seriesName) {
	let series = timeSeries[seriesName];
	if(series.saved) {
		console.error("will broadcast " + JSON.stringify(series.saved.array.slice(-1)));
		io.in(seriesName).emit(seriesName, series.saved.array.slice(-1));
	}
}

function initializeData() {
	let now = config.fakeNow();
	let proms = [];
	for(let seriesName in timeSeries) {
		let series = timeSeries[seriesName];
		proms.push(series.queryInSlices(0, series.persistence)
		.then((results) => {
			saveData(seriesName, results);
		}));
	}
	return Promise.all(proms)
	.catch(() => {
		return new Promise((resolve, reject) => setTimeout(() => resolve(), DB_CONNECTION_RETRY_DELAY))
		.then(initializeData);
	});
}

function queryAndEmitData(io, seriesName) {
	let series = timeSeries[seriesName];
	let now = config.fakeNow();
	return series.queryInSlices(0, 1)
	.then((results) => {
		saveData(seriesName, results)
	})
	.then(() => emitLastBroadcast(io, seriesName))
	.catch((e) => { console.error("problem: " + e); })
	.then(() => setTimeout(queryAndEmitData.bind(this, io, seriesName), series.frequency));
}

module.exports = ((io) => {
	io.on("connection", (socket) => {
		console.error("general twitter: new connection");
		for(let seriesSet of seriesSets) {
			seriesSet.newClient(socket);
		}
		for(let seriesName in timeSeries) {
			emitAllUnicast(socket, seriesName);
		}
		socket.on("request_series", (seriesNames) => {
			for(let seriesName in seriesNames) {
				if(Object.keys(timeSeries).indexOf(seriesName) == -1) {
					continue;
				}
				if(seriesNames[seriesName]) {
					emitAllUnicast(socket, seriesName);
					socket.join(seriesName);
				}
				else {
					socket.leave(seriesName);
				}
			}
		})
	});

	initializeData();
	for(let seriesName in timeSeries) {
		queryAndEmitData(io, seriesName);
	}
});
