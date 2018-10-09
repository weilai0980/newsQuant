const config = require("./config");
const express = require("express");
const session = require("express-session")({
	secret: config.sessionSecret,
	cookie: {},
	resave: false,
	saveUninitialized: true
});
const sharedsession = require("express-socket.io-session");
const path = require("path");
const historicalRouter = require("./historical_router.js");
const realtimeRouter = require("./realtime_router.js");
const app = express();
const http = require('http').Server(app);
const io = require("socket.io")(http);
io.of("/twitter_data").use(sharedsession(session, {
	autoSave: true
}));
const twitterData = require("./twitter_data.js")(io.of("/twitter_data"));
app.use(session);
//const twitterKeywords = require("./twitter_keywords")(io.of("/twitter_keywords"));

/****** Session configuration ******/


/*io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});*/

app.set('view engine', 'ejs');
app.set('views','./views');
app.use(express.static("public"));

app.use("/historical", historicalRouter);
app.use("/realtime", realtimeRouter);
app.get("/twitter", (req, res) => {
	return res.render("twitter_plot");
});
app.get("/twitter_keywords", (req, res) => {
	return res.render("twitter_keywords", {
		frequencies: config.twitterFrequencies,
	});
});

http.listen(3000, "0.0.0.0");
