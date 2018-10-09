let config = {};
let username = "***";
let password = "***";
let hostPort = "***";
let dbName =  "***";
config.mongodb_url = "mongodb://" + username + ":" + encodeURIComponent(password) + "@" + hostPort + "/" + dbName;
config.tweetsCollection = "***";
config.twitterStatsCollection = "***";
config.sessionSecret = "session secret";
let initNow = Date.now();
let fakeInitNow = Date.now();//1528410402484;
config.fakeNow = (() => (Date.now() - (initNow - fakeInitNow)));
let frequencies = {};
frequencies["" + 60 * 1000] = "1 minute";
frequencies["" + 10 * 60 * 1000] = "10 minutes";
frequencies["" + 60 * 60 * 1000] = "1 hour";
frequencies["" + 6 * 60 * 60 * 1000] = "6 hours";
config.twitterFrequencies = frequencies;

module.exports = config;