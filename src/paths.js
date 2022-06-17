// Endpoints.

const {app} = require("./app.js");

app.get("/", (req, res) => {
	console.log("Request to homepage")
	res.end();
});

require("./levels.js");
require("./auth.js");

app.use(function (req, res) {
	res.status(404).send("Not found lol");
})