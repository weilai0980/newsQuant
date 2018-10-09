const WebSocket = require('ws');

const ws = new WebSocket("http://localhost:8080/");

ws.on("open", () => {
	ws.send("first message")
});